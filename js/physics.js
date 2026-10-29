export const PLAYER_W = 36
export const PLAYER_H = 48
export const GROUND_TOP = 468
export const STAND_Y = GROUND_TOP - PLAYER_H / 2
export const VIEW_W = 960
export const VIEW_H = 540

const GRAVITY = 2200
const JUMP_VY = -720
const MAX_RUN = 260
const ACCEL = 1600
const AIR_ACCEL = 1100
const FRICTION = 280
const MAX_FALL = 980
const MAX_VX = 640
const COYOTE = 0.16
const JUMP_BUFFER = 0.16
const JUMP_LOCK = 0.12
const RING_RADIUS = 34

function approach(value, target, delta) {
  if (value < target) return Math.min(target, value + delta)
  if (value > target) return Math.max(target, value - delta)
  return target
}

function overlapsBody(body, rect) {
  const left = body.x - body.w / 2
  const right = body.x + body.w / 2
  const top = body.y - body.h / 2
  const bottom = body.y + body.h / 2
  return right > rect.x && left < rect.x + rect.w && bottom > rect.y && top < rect.y + rect.h
}

function blobRect(blob) {
  return {
    x: blob.x - blob.w / 2,
    y: blob.y - blob.h / 2,
    w: blob.w,
    h: blob.h,
  }
}

export function createPlayState(level) {
  return {
    phase: "play",
    player: {
      x: level.spawn.x,
      y: level.spawn.y,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      grounded: true,
      facing: 1,
      coyote: COYOTE,
      jumpBuffer: 0,
      jumpLock: 0,
      mode: "free",
      loopAngle: Math.PI / 2,
      loopSpeed: 0,
      loopSpun: 0,
      exitCooldown: 0,
      invuln: 0,
      onBoost: false,
    },
    collected: level.rings.map(() => false),
    ringCount: 0,
    activeCheckpoint: 0,
    blobs: level.blobs.map((blob) => ({ ...blob })),
    notice: "",
    noticeTtl: 0,
    justCollected: false,
    justBoosted: false,
    justCheckpoint: false,
    justRespawned: false,
    justCleared: false,
  }
}

function respawn(state, level, player) {
  const checkpoint = level.checkpoints[state.activeCheckpoint]
  return {
    ...state,
    player: {
      ...player,
      x: checkpoint.x,
      y: checkpoint.y,
      vx: 0,
      vy: 0,
      grounded: true,
      mode: "free",
      loopSpun: 0,
      exitCooldown: 0.3,
      invuln: 1.8,
      jumpLock: 0,
      onBoost: false,
    },
    notice: "Oups !",
    noticeTtl: 0.9,
    justCollected: false,
    justBoosted: false,
    justCheckpoint: false,
    justRespawned: true,
    justCleared: false,
  }
}

function resolveX(body, blocks) {
  let next = body
  for (const block of blocks) {
    if (!overlapsBody(next, block)) continue
    if (next.vx > 0) {
      next = { ...next, x: block.x - next.w / 2, vx: 0 }
    } else if (next.vx < 0) {
      next = { ...next, x: block.x + block.w + next.w / 2, vx: 0 }
    } else {
      const pushLeft = next.x + next.w / 2 - block.x
      const pushRight = block.x + block.w - (next.x - next.w / 2)
      next =
        pushLeft < pushRight
          ? { ...next, x: block.x - next.w / 2 }
          : { ...next, x: block.x + block.w + next.w / 2 }
    }
  }
  return next
}

function resolveY(body, beforeMove, blocks) {
  let next = { ...body, grounded: false }
  const beforeBottom = beforeMove.y + beforeMove.h / 2
  const beforeTop = beforeMove.y - beforeMove.h / 2
  for (const block of blocks) {
    if (!overlapsBody(next, block)) continue
    const landing = next.vy >= 0 && beforeBottom <= block.y + 4
    const bonk = next.vy < 0 && beforeTop >= block.y + block.h - 4
    if (landing) {
      next = { ...next, y: block.y - next.h / 2, vy: 0, grounded: true }
    } else if (bonk) {
      next = { ...next, y: block.y + block.h + next.h / 2, vy: 0 }
    }
  }
  return next
}

function slopeSurface(slope, x) {
  const t = (x - slope.x) / slope.w
  return slope.yLeft + (slope.yRight - slope.yLeft) * t
}

function resolveSlopes(body, beforeMove, slopes) {
  if (body.jumpLock > 0 && body.vy < 0) return body
  let next = body
  const feet = body.y + body.h / 2
  const beforeFeet = beforeMove.y + beforeMove.h / 2
  for (const slope of slopes) {
    if (body.x < slope.x || body.x > slope.x + slope.w) continue
    const surface = slopeSurface(slope, body.x)
    const delta = feet - surface
    const stickWhileRunning = beforeMove.grounded && delta > -14 && delta < 80
    const landFromAir =
      !beforeMove.grounded && body.vy >= 0 && delta >= -4 && delta < 32 && beforeFeet <= surface + 12
    if (stickWhileRunning || landFromAir) {
      next = { ...next, y: surface - next.h / 2, vy: 0, grounded: true }
      break
    }
  }
  return next
}

function clampSpeed(vx) {
  return Math.max(-MAX_VX, Math.min(MAX_VX, vx))
}

function steer(body, input, dt) {
  const accel = body.grounded ? ACCEL : AIR_ACCEL
  let vx = body.vx
  if (input.right && !input.left) {
    if (vx < MAX_RUN) vx = Math.min(MAX_RUN, vx + accel * dt)
  } else if (input.left && !input.right) {
    if (vx > -MAX_RUN) vx = Math.max(-MAX_RUN, vx - accel * dt)
  } else {
    vx = approach(vx, 0, FRICTION * dt)
  }
  return clampSpeed(vx)
}

function stepFree(player, level, input, dt) {
  const canJump = player.grounded || player.coyote > 0
  const wantsJump = input.jumpPressed || player.jumpBuffer > 0
  let jumpBuffer = input.jumpPressed ? JUMP_BUFFER : Math.max(0, player.jumpBuffer - dt)
  let vy = player.vy
  let jumpLock = Math.max(0, player.jumpLock - dt)
  let didJump = false
  if (canJump && wantsJump) {
    vy = JUMP_VY
    jumpBuffer = 0
    jumpLock = JUMP_LOCK
    didJump = true
  } else {
    vy = Math.min(MAX_FALL, vy + GRAVITY * dt)
  }

  const vx = steer(player, input, dt)
  let moved = {
    ...player,
    x: player.x + vx * dt,
    y: player.y,
    vx,
    vy,
    jumpBuffer,
    jumpLock,
    grounded: false,
  }
  moved = resolveX(moved, level.blocks)
  const beforeY = { ...moved, grounded: player.grounded }
  moved = { ...moved, y: moved.y + moved.vy * dt }
  if (moved.jumpLock <= 0 || moved.vy >= 0) {
    moved = resolveY(moved, beforeY, level.blocks)
    moved = resolveSlopes(moved, beforeY, level.slopes)
  }
  if (moved.x < moved.w / 2) moved = { ...moved, x: moved.w / 2, vx: Math.max(0, moved.vx) }
  if (moved.x > level.width - moved.w / 2) {
    moved = { ...moved, x: level.width - moved.w / 2, vx: Math.min(0, moved.vx) }
  }
  const coyote = moved.grounded ? COYOTE : didJump ? 0 : Math.max(0, player.coyote - dt)
  const facing = moved.vx < -10 ? -1 : moved.vx > 10 ? 1 : player.facing
  return { ...moved, coyote, facing, grounded: moved.grounded && !didJump }
}

function canEnterLoop(player, loop) {
  if (!loop || player.exitCooldown > 0 || !player.grounded || player.vx < loop.minSpeed) return false
  const dx = player.x - loop.cx
  const bottom = loop.cy + loop.r
  return dx < -loop.r * 0.2 && dx > -loop.r - 70 && Math.abs(player.y - bottom) < 40
}

function attachLoop(player, loop) {
  const angle = Math.PI / 2
  return {
    ...player,
    mode: "loop",
    loopAngle: angle,
    loopSpeed: player.vx,
    loopSpun: 0,
    x: loop.cx + Math.cos(angle) * loop.r,
    y: loop.cy + Math.sin(angle) * loop.r,
    vx: player.vx,
    vy: 0,
    grounded: false,
  }
}

function stepLoop(player, loop, dt) {
  const spun = player.loopSpun + (player.loopSpeed / loop.r) * dt
  if (spun >= Math.PI * 2) {
    return {
      ...player,
      mode: "free",
      loopSpun: 0,
      x: loop.cx + loop.r * 0.45,
      y: loop.cy + loop.r,
      vx: player.loopSpeed,
      vy: 0,
      grounded: true,
      exitCooldown: 0.45,
      facing: 1,
    }
  }
  const angle = Math.PI / 2 - spun
  return {
    ...player,
    loopAngle: angle,
    loopSpun: spun,
    x: loop.cx + Math.cos(angle) * loop.r,
    y: loop.cy + Math.sin(angle) * loop.r,
    vx: Math.cos(angle - Math.PI / 2) * player.loopSpeed,
    vy: Math.sin(angle - Math.PI / 2) * player.loopSpeed,
    grounded: false,
    facing: Math.cos(angle) > 0 ? 1 : -1,
  }
}

function moveBlobs(blobs, dt) {
  return blobs.map((blob) => {
    let x = blob.x + blob.vx * dt
    let vx = blob.vx
    if (x < blob.minX) {
      x = blob.minX
      vx = Math.abs(vx)
    } else if (x > blob.maxX) {
      x = blob.maxX
      vx = -Math.abs(vx)
    }
    return { ...blob, x, vx }
  })
}

function collectRings(player, level, collected, ringCount) {
  let nextCollected = collected
  let nextCount = ringCount
  let gained = false
  for (let i = 0; i < level.rings.length; i += 1) {
    if (nextCollected[i]) continue
    const ring = level.rings[i]
    const dx = player.x - ring.x
    const dy = player.y - ring.y
    if (dx * dx + dy * dy > RING_RADIUS * RING_RADIUS) continue
    if (!gained) nextCollected = collected.slice()
    nextCollected[i] = true
    nextCount += 1
    gained = true
  }
  return { collected: nextCollected, ringCount: nextCount, justCollected: gained }
}

function passedCheckpoint(player, level, activeCheckpoint) {
  let next = activeCheckpoint
  for (let i = activeCheckpoint + 1; i < level.checkpoints.length; i += 1) {
    if (player.x >= level.checkpoints[i].x) next = i
  }
  return next
}

function applyBoost(player, boosts) {
  let vx = player.vx
  let onBoost = false
  for (const pad of boosts) {
    if (!overlapsBody(player, pad)) continue
    onBoost = true
    if (player.facing >= 0) vx = Math.max(vx, pad.speed)
    else vx = Math.min(vx, -pad.speed)
  }
  return {
    player: { ...player, vx: clampSpeed(vx), onBoost },
    justBoosted: onBoost && !player.onBoost,
  }
}

function hitBlob(player, blobs) {
  if (player.invuln > 0 || player.mode === "loop") return false
  return blobs.some((blob) => overlapsBody(player, blobRect(blob)))
}

function reachedGoal(player, goal) {
  return overlapsBody(player, goal)
}

function tickPlayer(player, dt) {
  return {
    ...player,
    invuln: Math.max(0, player.invuln - dt),
    exitCooldown: Math.max(0, player.exitCooldown - dt),
  }
}

export function stepPlay(state, level, input, dt) {
  if (state.phase !== "play") return { ...state, justCleared: false }
  const safeDt = Math.max(0, Math.min(dt, 0.05))
  const blobs = moveBlobs(state.blobs, safeDt)
  let player = tickPlayer(state.player, safeDt)

  if (player.mode === "loop" && level.loop) {
    player = stepLoop(player, level.loop, safeDt)
  } else {
    player = stepFree(player, level, input, safeDt)
    if (canEnterLoop(player, level.loop)) player = attachLoop(player, level.loop)
  }

  const rings = collectRings(player, level, state.collected, state.ringCount)
  const activeCheckpoint = passedCheckpoint(player, level, state.activeCheckpoint)
  const boosted = applyBoost(player, level.boosts)
  player = boosted.player
  const noticeTtl = Math.max(0, state.noticeTtl - safeDt)

  const shared = {
    ...state,
    player,
    blobs,
    collected: rings.collected,
    ringCount: rings.ringCount,
    activeCheckpoint,
    notice: noticeTtl > 0 ? state.notice : "",
    noticeTtl,
    justCollected: rings.justCollected,
    justBoosted: boosted.justBoosted,
    justCheckpoint: activeCheckpoint > state.activeCheckpoint,
    justRespawned: false,
    justCleared: false,
  }

  if (reachedGoal(player, level.goal)) {
    return { ...shared, phase: "clear", justCleared: true }
  }
  if (player.mode !== "loop" && (player.y > level.deathY || hitBlob(player, blobs))) {
    return respawn(shared, level, player)
  }
  return shared
}
