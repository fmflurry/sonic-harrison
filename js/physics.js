import { characterOf, DEFAULT_CHARACTER } from "./characters.js"

export const PLAYER_W = 36
export const PLAYER_H = 48
export const BALL_H = 34
export const GROUND_TOP = 468
export const STAND_Y = GROUND_TOP - PLAYER_H / 2
export const VIEW_W = 960
export const VIEW_H = 540

export const GRAVITY = 2200
export const JUMP_VY = -720
const FRICTION = 280
// A boost lasts about a second while running, then fades back to the normal top speed.
const OVERSPEED_FADE = 240
const MAX_FALL = 980
const MAX_VX = 640
const COYOTE = 0.16
const JUMP_BUFFER = 0.16
const JUMP_LOCK = 0.12
const RING_RADIUS = 40
const STEP_UP = 14

const ROLL_START = 80
const ROLL_KEEP = 30
const ROLL_FRICTION = 60
const ROLL_PUSH = 320
const ROLL_BRAKE = 900
const SLOPE_ROLL = 1100
const SLOPE_RUN = 400
// Faster than any run: the hero curls up on his own, like the classic 16-bit platformers.
export const AUTO_BALL_SPEED = 400
const AUTO_STAND_MARGIN = 20
const BRAKE_SPEED = 120

export const DASH_SPEED = 600
export const DASH_TIME = 0.24
export const DASH_COOLDOWN = 1.5

export const POP_TIME = 4
const POP_BOUNCE = -520
const POP_SAFE_DISTANCE = 240

const EMPTY = Object.freeze([])
const legacyLoops = new WeakMap()

function loopsOf(level) {
  if (level.loops) return level.loops
  if (!level.loop) return EMPTY
  if (!legacyLoops.has(level)) legacyLoops.set(level, [level.loop])
  return legacyLoops.get(level)
}

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

function overlapsBlob(body, blob) {
  return (
    body.x + body.w / 2 > blob.x - blob.w / 2 &&
    body.x - body.w / 2 < blob.x + blob.w / 2 &&
    body.y + body.h / 2 > blob.y - blob.h / 2 &&
    body.y - body.h / 2 < blob.y + blob.h / 2
  )
}

// Movers ease back and forth between their start and start + (dx, dy).
export function moverPosition(mover, time) {
  const t = 0.5 - 0.5 * Math.cos((2 * Math.PI * time) / mover.period + (mover.phase ?? 0))
  return { x: mover.x + mover.dx * t, y: mover.y + mover.dy * t }
}

export function createPlayState(level, characterId = DEFAULT_CHARACTER) {
  return {
    phase: "play",
    character: characterOf(characterId).id,
    time: 0,
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
      loopIndex: -1,
      loopAngle: Math.PI / 2,
      loopSpeed: 0,
      loopSpun: 0,
      exitCooldown: 0,
      invuln: 0,
      onBoost: false,
      ball: false,
      slope: 0,
      braking: false,
      carrier: -1,
      dashTime: 0,
      dashCooldown: 0,
    },
    collected: level.rings.map(() => false),
    ringCount: 0,
    activeCheckpoint: 0,
    blobs: level.blobs.map((blob) => ({ ...blob, popped: 0 })),
    notice: "",
    noticeTtl: 0,
    springIndex: -1,
    springAt: -10,
    justCollected: false,
    justBoosted: false,
    justCheckpoint: false,
    justRespawned: false,
    justCleared: false,
    justRolled: false,
    justPopped: false,
    justDashed: false,
    justSprung: false,
  }
}

function withShape(player, ball) {
  if (player.ball === ball) return player
  const h = ball ? BALL_H : PLAYER_H
  const feet = player.y + player.h / 2
  return { ...player, ball, h, y: feet - h / 2 }
}

function standingRoom(player, level) {
  const standing = withShape(player, false)
  return !level.blocks.some((block) => overlapsBody(standing, block))
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
      h: PLAYER_H,
      ball: false,
      grounded: true,
      mode: "free",
      loopIndex: -1,
      loopSpun: 0,
      exitCooldown: 0.3,
      invuln: 1.8,
      jumpLock: 0,
      onBoost: false,
      carrier: -1,
      dashTime: 0,
      braking: false,
      slope: 0,
    },
    notice: "Oups !",
    noticeTtl: 0.9,
    justCollected: false,
    justBoosted: false,
    justCheckpoint: false,
    justRespawned: true,
    justCleared: false,
    justRolled: false,
    justPopped: false,
    justDashed: false,
    justSprung: false,
  }
}

function resolveX(body, blocks) {
  let next = body
  for (const block of blocks) {
    if (!overlapsBody(next, block)) continue
    // Feet barely inside a block (a hill crest, a ledge corner): lift instead of pushing out sideways.
    const stepUp = next.y + next.h / 2 - block.y
    if (stepUp <= STEP_UP) {
      next = { ...next, y: block.y - next.h / 2 + 0.01 }
      continue
    }
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
  let next = { ...body, grounded: false, slope: 0, carrier: -1 }
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
      const grade = (slope.yRight - slope.yLeft) / slope.w
      next = { ...next, y: surface - next.h / 2, vy: 0, grounded: true, slope: grade, carrier: -1 }
      break
    }
  }
  return next
}

function landOnLedge(body, beforeFeet, x, y, w, carrier) {
  if (body.vy < 0) return null
  if (body.x + body.w / 2 <= x || body.x - body.w / 2 >= x + w) return null
  const feet = body.y + body.h / 2
  if (beforeFeet > y + 3 || feet < y) return null
  return { ...body, y: y - body.h / 2, vy: 0, grounded: true, slope: 0, carrier }
}

function resolveLedges(body, beforeMove, level, time) {
  if (body.jumpLock > 0 && body.vy < 0) return body
  const beforeFeet = beforeMove.y + beforeMove.h / 2
  for (const platform of level.platforms ?? EMPTY) {
    const landed = landOnLedge(body, beforeFeet, platform.x, platform.y, platform.w, -1)
    if (landed) return landed
  }
  const movers = level.movers ?? EMPTY
  for (let i = 0; i < movers.length; i += 1) {
    const at = moverPosition(movers[i], time)
    const landed = landOnLedge(body, beforeFeet, at.x, at.y, movers[i].w, i)
    if (landed) return landed
  }
  return body
}

function carry(player, level, time, dt) {
  if (player.carrier < 0 || !player.grounded) return player
  const mover = level.movers?.[player.carrier]
  if (!mover) return { ...player, carrier: -1 }
  const before = moverPosition(mover, time)
  const after = moverPosition(mover, time + dt)
  return { ...player, x: player.x + after.x - before.x, y: player.y + after.y - before.y }
}

function clampSpeed(vx) {
  return Math.max(-MAX_VX, Math.min(MAX_VX, vx))
}

function steerRun(body, input, stats, dt) {
  const accel = body.grounded ? stats.accel : stats.airAccel
  // Running downhill builds momentum; uphill keeps its pace so a child never gets stuck.
  const downhill = body.grounded && body.slope * body.vx > 0
  let vx = downhill ? body.vx + SLOPE_RUN * body.slope * dt : body.vx
  if (input.right && !input.left) {
    if (vx < stats.maxRun) vx = Math.min(stats.maxRun, vx + accel * dt)
    else if (!downhill) vx = Math.max(stats.maxRun, vx - OVERSPEED_FADE * dt)
  } else if (input.left && !input.right) {
    if (vx > -stats.maxRun) vx = Math.max(-stats.maxRun, vx - accel * dt)
    else if (!downhill) vx = Math.min(-stats.maxRun, vx + OVERSPEED_FADE * dt)
  } else {
    vx = approach(vx, 0, FRICTION * dt)
  }
  return clampSpeed(vx)
}

function steerRoll(body, input, stats, dt) {
  const direction = input.right && !input.left ? 1 : input.left && !input.right ? -1 : 0
  let vx = body.vx + SLOPE_ROLL * body.slope * dt
  if (direction !== 0 && Math.sign(vx) === -direction) {
    vx = approach(vx, 0, ROLL_BRAKE * dt)
  } else if (direction !== 0 && Math.abs(vx) < stats.maxRun) {
    vx += direction * ROLL_PUSH * dt
  } else if (body.slope * vx <= 0) {
    vx = approach(vx, 0, ROLL_FRICTION * dt)
  }
  return clampSpeed(vx)
}

function isBraking(player, input) {
  if (!player.grounded || player.ball || Math.abs(player.vx) < BRAKE_SPEED) return false
  return (player.vx > 0 && input.left && !input.right) || (player.vx < 0 && input.right && !input.left)
}

function startDash(player, input, stats) {
  if (!stats.dash || !input.dashPressed || player.dashCooldown > 0) return null
  return {
    ...player,
    dashTime: DASH_TIME,
    dashCooldown: DASH_COOLDOWN,
    vx: player.facing * Math.max(Math.abs(player.vx), DASH_SPEED),
  }
}

function stepFree(player, level, input, stats, time, dt) {
  const dashed = startDash(player, input, stats)
  let body = dashed ?? player
  const canJump = body.grounded || body.coyote > 0
  const wantsJump = input.jumpPressed || body.jumpBuffer > 0
  let jumpBuffer = input.jumpPressed ? JUMP_BUFFER : Math.max(0, body.jumpBuffer - dt)
  let vy = body.vy
  let jumpLock = Math.max(0, body.jumpLock - dt)
  let didJump = false
  if (canJump && wantsJump) {
    vy = JUMP_VY
    jumpBuffer = 0
    jumpLock = JUMP_LOCK
    didJump = true
    body = withShape(body, true)
  } else {
    vy = Math.min(MAX_FALL, vy + GRAVITY * dt)
  }

  const dashing = body.dashTime > 0
  let vx
  if (dashing) {
    vx = body.facing * Math.max(Math.abs(body.vx), DASH_SPEED)
    if (!body.grounded && !didJump) vy = 0
  } else if (body.ball && body.grounded) {
    vx = steerRoll(body, input, stats, dt)
  } else {
    vx = steerRun(body, input, stats, dt)
  }

  let moved = {
    ...body,
    x: body.x + vx * dt,
    vx,
    vy,
    jumpBuffer,
    jumpLock,
    grounded: false,
  }
  moved = resolveX(moved, level.blocks)
  const beforeY = { ...moved, grounded: body.grounded && !didJump }
  moved = { ...moved, y: moved.y + moved.vy * dt }
  if (moved.jumpLock <= 0 || moved.vy >= 0) {
    moved = resolveY(moved, beforeY, level.blocks)
    moved = resolveSlopes(moved, beforeY, level.slopes)
    moved = resolveLedges(moved, beforeY, level, time + dt)
  } else {
    moved = { ...moved, slope: 0, carrier: -1 }
  }
  if (moved.x < moved.w / 2) moved = { ...moved, x: moved.w / 2, vx: Math.max(0, moved.vx) }
  if (moved.x > level.width - moved.w / 2) {
    moved = { ...moved, x: level.width - moved.w / 2, vx: Math.min(0, moved.vx) }
  }
  const grounded = moved.grounded && !didJump
  const coyote = grounded ? COYOTE : didJump ? 0 : Math.max(0, body.coyote - dt)
  const facing = moved.vx < -10 ? -1 : moved.vx > 10 ? 1 : body.facing
  moved = { ...moved, coyote, facing, grounded }
  return { player: curlOrUncurl(moved, level, input, stats), dashed: Boolean(dashed) }
}

function curlOrUncurl(player, level, input, stats) {
  if (!player.grounded) return { ...player, braking: false }
  const speed = Math.abs(player.vx)
  const wantsBall = speed >= AUTO_BALL_SPEED || (input.down && speed >= ROLL_START)
  if (!player.ball && wantsBall) return { ...withShape(player, true), braking: false }
  const keepsBall = speed >= stats.maxRun + AUTO_STAND_MARGIN || (input.down && speed >= ROLL_KEEP)
  if (player.ball && !keepsBall && standingRoom(player, level)) {
    return { ...withShape(player, false), braking: isBraking(player, input) }
  }
  return { ...player, braking: isBraking(player, input) }
}

function canEnterLoop(player, loop) {
  if (player.exitCooldown > 0 || !player.grounded || player.vx < loop.minSpeed) return false
  const dx = player.x - loop.cx
  const bottom = loop.cy + loop.r
  return dx < -loop.r * 0.2 && dx > -loop.r - 70 && Math.abs(player.y - bottom) < 40
}

function attachLoop(player, loop, index) {
  const angle = Math.PI / 2
  return {
    ...player,
    mode: "loop",
    loopIndex: index,
    loopAngle: angle,
    loopSpeed: player.vx,
    loopSpun: 0,
    x: loop.cx + Math.cos(angle) * loop.r,
    y: loop.cy + Math.sin(angle) * loop.r,
    vx: player.vx,
    vy: 0,
    grounded: false,
    carrier: -1,
    dashTime: 0,
  }
}

function stepLoop(player, loop, dt) {
  const spun = player.loopSpun + (player.loopSpeed / loop.r) * dt
  if (spun >= Math.PI * 2) {
    return {
      ...player,
      mode: "free",
      loopIndex: -1,
      loopSpun: 0,
      x: loop.cx + loop.r * 0.45,
      y: loop.cy + loop.r + (PLAYER_H - player.h) / 2,
      vx: player.loopSpeed,
      vy: 0,
      grounded: true,
      slope: 0,
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

function moveBlobs(blobs, player, dt) {
  return blobs.map((blob) => {
    let popped = blob.popped ?? 0
    if (popped > 0) {
      popped = Math.max(0, popped - dt)
      if (popped === 0 && Math.abs(player.x - blob.x) < POP_SAFE_DISTANCE) popped = 0.5
      return { ...blob, popped }
    }
    let x = blob.x + blob.vx * dt
    let vx = blob.vx
    if (x < blob.minX) {
      x = blob.minX
      vx = Math.abs(vx)
    } else if (x > blob.maxX) {
      x = blob.maxX
      vx = -Math.abs(vx)
    }
    return { ...blob, x, vx, popped: 0 }
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

function applySprings(player, springs) {
  if (player.mode === "loop" || player.vy < 0) return null
  for (let i = 0; i < springs.length; i += 1) {
    const spring = springs[i]
    if (!overlapsBody(player, spring)) continue
    return {
      index: i,
      player: {
        ...withShape(player, false),
        vy: -spring.power,
        grounded: false,
        coyote: 0,
        jumpLock: JUMP_LOCK,
        jumpBuffer: 0,
        carrier: -1,
        slope: 0,
      },
    }
  }
  return null
}

function touchBlobs(player, blobs) {
  if (player.mode === "loop") return { blobs, popped: false, hurt: false, player }
  const attacking = player.ball || player.dashTime > 0
  let next = blobs
  let popped = false
  let hurt = false
  let body = player
  for (let i = 0; i < blobs.length; i += 1) {
    const blob = blobs[i]
    if (blob.popped > 0 || !overlapsBlob(body, blob)) continue
    if (attacking) {
      if (!popped) next = blobs.slice()
      next[i] = { ...blob, popped: POP_TIME }
      popped = true
      if (!body.grounded) body = { ...body, vy: Math.min(body.vy, POP_BOUNCE) }
    } else if (body.invuln <= 0) {
      hurt = true
    }
  }
  return { blobs: next, popped, hurt, player: body }
}

function reachedGoal(player, goal) {
  return overlapsBody(player, goal)
}

function tickPlayer(player, dt) {
  return {
    ...player,
    invuln: Math.max(0, player.invuln - dt),
    exitCooldown: Math.max(0, player.exitCooldown - dt),
    dashTime: Math.max(0, player.dashTime - dt),
    dashCooldown: Math.max(0, player.dashCooldown - dt),
  }
}

export function stepPlay(state, level, input, dt) {
  if (state.phase !== "play") return { ...state, justCleared: false }
  const safeDt = Math.max(0, Math.min(dt, 0.05))
  const stats = characterOf(state.character)
  const loops = loopsOf(level)
  let player = carry(tickPlayer(state.player, safeDt), level, state.time, safeDt)
  const wasRolling = player.ball && player.grounded
  let dashed = false

  if (player.mode === "loop" && loops[player.loopIndex]) {
    player = stepLoop(player, loops[player.loopIndex], safeDt)
  } else {
    const free = stepFree(player, level, input, stats, state.time, safeDt)
    player = free.player
    dashed = free.dashed
    for (let i = 0; i < loops.length; i += 1) {
      if (canEnterLoop(player, loops[i])) {
        player = attachLoop(player, loops[i], i)
        break
      }
    }
  }

  const sprung = applySprings(player, level.springs ?? EMPTY)
  if (sprung) player = sprung.player
  const blobs = moveBlobs(state.blobs, player, safeDt)
  const touched = touchBlobs(player, blobs)
  player = touched.player
  const rings = collectRings(player, level, state.collected, state.ringCount)
  const activeCheckpoint = passedCheckpoint(player, level, state.activeCheckpoint)
  const boosted = applyBoost(player, level.boosts)
  player = boosted.player
  const noticeTtl = Math.max(0, state.noticeTtl - safeDt)
  const time = state.time + safeDt

  const shared = {
    ...state,
    time,
    player,
    blobs: touched.blobs,
    collected: rings.collected,
    ringCount: rings.ringCount,
    activeCheckpoint,
    notice: noticeTtl > 0 ? state.notice : "",
    noticeTtl,
    springIndex: sprung ? sprung.index : state.springIndex,
    springAt: sprung ? time : state.springAt,
    justCollected: rings.justCollected,
    justBoosted: boosted.justBoosted,
    justCheckpoint: activeCheckpoint > state.activeCheckpoint,
    justRespawned: false,
    justCleared: false,
    justRolled: !wasRolling && player.ball && player.grounded && player.mode === "free",
    justPopped: touched.popped,
    justDashed: dashed,
    justSprung: Boolean(sprung),
  }

  if (reachedGoal(player, level.goal)) {
    return { ...shared, phase: "clear", justCleared: true }
  }
  if (player.mode !== "loop" && (player.y > level.deathY || touched.hurt)) {
    return respawn(shared, level, player)
  }
  return shared
}

// Horizontal distance a running jump covers before the feet come back to take-off height.
export function jumpReach(speed) {
  return speed * ((2 * -JUMP_VY) / GRAVITY)
}

export function jumpApex() {
  return (JUMP_VY * JUMP_VY) / (2 * GRAVITY)
}
