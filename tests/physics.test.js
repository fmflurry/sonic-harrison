import assert from "node:assert/strict"
import { test } from "node:test"
import {
  BALL_H,
  createPlayState,
  DASH_COOLDOWN,
  DASH_SPEED,
  GROUND_TOP,
  moverPosition,
  PLAYER_H,
  STAND_Y,
  stepPlay,
} from "../js/physics.js"
import { levels } from "../js/levels.js"

const dt = 1 / 60
const hold = { left: false, right: false, jumpPressed: false }
const runRight = { left: false, right: true, jumpPressed: false }

function flat(extra = {}) {
  return {
    width: 1600,
    deathY: 700,
    spawn: { x: 180, y: STAND_Y },
    blocks: [{ x: 0, y: GROUND_TOP, w: 1600, h: 80 }],
    slopes: [],
    rings: [],
    blobs: [],
    boosts: [],
    checkpoints: [{ x: 180, y: STAND_Y }],
    goal: { x: 1500, y: GROUND_TOP - 90, w: 40, h: 90 },
    loop: null,
    ...extra,
  }
}

function frames(level, input, count, state = createPlayState(level)) {
  let next = state
  for (let i = 0; i < count; i += 1) {
    const sample = typeof input === "function" ? input(next, level) : input
    next = stepPlay(next, level, sample, dt)
  }
  return next
}

test("running right speeds up without moving the previous state", () => {
  const level = flat()
  const start = createPlayState(level)
  const before = structuredClone(start)
  const next = stepPlay(start, level, runRight, dt)
  assert.deepEqual(start, before)
  assert.ok(next.player.vx > 0)
  assert.ok(next.player.x > start.player.x)
})

test("jump leaves the ground once and gravity pulls the next frame", () => {
  const level = flat()
  const jumped = stepPlay(createPlayState(level), level, { ...hold, jumpPressed: true }, dt)
  assert.ok(jumped.player.vy < -700)
  assert.equal(jumped.player.grounded, false)
  const later = stepPlay(jumped, level, { ...hold, jumpPressed: true }, dt)
  assert.ok(later.player.vy > jumped.player.vy)
  assert.ok(later.player.vy < 0)
})

test("coyote time still allows a jump just after a ledge", () => {
  const level = flat({
    width: 800,
    blocks: [{ x: 0, y: GROUND_TOP, w: 230, h: 80 }],
    goal: { x: 760, y: 0, w: 20, h: 20 },
  })
  let state = createPlayState(level)
  let jumped = false
  let highest = STAND_Y
  for (let i = 0; i < 90; i += 1) {
    const airborne = !state.player.grounded
    state = stepPlay(
      state,
      level,
      { left: false, right: true, jumpPressed: airborne && !jumped },
      dt,
    )
    if (airborne && !jumped) jumped = true
    if (state.player.y < highest) highest = state.player.y
  }
  assert.ok(jumped)
  assert.ok(highest < STAND_Y - 30)
})

test("a ring is collected once and kept after a fall", () => {
  const level = flat({
    blocks: [{ x: 0, y: GROUND_TOP, w: 320, h: 80 }],
    rings: [{ x: 250, y: STAND_Y }],
    width: 800,
  })
  let state = createPlayState(level)
  let sawRespawn = false
  for (let i = 0; i < 360; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.ringCount === 1 && state.justRespawned) sawRespawn = true
  }
  assert.equal(state.ringCount, 1)
  assert.equal(sawRespawn, true)
})

test("a blob sends the player to the checkpoint and does not take rings", () => {
  const level = flat({
    rings: [{ x: 260, y: STAND_Y }],
    blobs: [{ x: 420, y: STAND_Y, w: 42, h: 36, vx: 0, minX: 420, maxX: 420 }],
  })
  let state = createPlayState(level)
  let sawRespawn = false
  for (let i = 0; i < 180; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.justRespawned) sawRespawn = true
  }
  assert.equal(state.ringCount, 1)
  assert.equal(sawRespawn, true)
})

test("the checkpoint used for respawn is the latest one reached", () => {
  const level = flat({
    width: 1200,
    blocks: [{ x: 0, y: GROUND_TOP, w: 800, h: 80 }],
    checkpoints: [
      { x: 180, y: STAND_Y },
      { x: 560, y: STAND_Y },
    ],
    goal: { x: 2000, y: 0, w: 10, h: 10 },
  })
  let state = createPlayState(level)
  let sawLaterCheckpoint = false
  for (let i = 0; i < 400; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.justRespawned && state.player.x === 560) sawLaterCheckpoint = true
  }
  assert.equal(state.ringCount, 0)
  assert.equal(sawLaterCheckpoint, true)
})

test("a boost pad raises speed above the normal run", () => {
  const level = flat({
    boosts: [{ x: 200, y: GROUND_TOP - 18, w: 80, h: 18, speed: 470 }],
  })
  let state = createPlayState(level)
  let sawBoost = false
  let topSpeed = 0
  for (let i = 0; i < 40; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.justBoosted) sawBoost = true
    if (state.player.vx > topSpeed) topSpeed = state.player.vx
  }
  assert.ok(topSpeed >= 470)
  assert.equal(sawBoost, true)
})

test("feet stay on a slope while running uphill", () => {
  const level = flat({
    blocks: [],
    slopes: [{ x: 0, w: 1200, yLeft: GROUND_TOP, yRight: GROUND_TOP - 150 }],
  })
  const state = frames(level, runRight, 90)
  const t = (state.player.x - 0) / 1200
  const surface = GROUND_TOP + (GROUND_TOP - 150 - GROUND_TOP) * t
  const feet = state.player.y + state.player.h / 2
  assert.ok(Math.abs(feet - surface) < 2)
  assert.equal(state.player.grounded, true)
  assert.ok(state.player.y < STAND_Y - 10)
})

test("a fast run enters the loop and comes out ahead of it", () => {
  const loop = { cx: 520, cy: STAND_Y - 100, r: 100, minSpeed: 340 }
  const level = flat({
    width: 1400,
    boosts: [{ x: 160, y: GROUND_TOP - 18, w: 90, h: 18, speed: 500 }],
    loop,
    goal: { x: 1300, y: GROUND_TOP - 90, w: 40, h: 90 },
  })
  let state = createPlayState(level)
  let sawLoop = false
  for (let i = 0; i < 240 && state.player.x < loop.cx + loop.r; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.player.mode === "loop") sawLoop = true
  }
  assert.equal(sawLoop, true)
  assert.equal(state.player.mode, "free")
  assert.ok(state.player.x > loop.cx)
})

test("a slow run stays on the ground through a loop", () => {
  const loop = { cx: 700, cy: STAND_Y - 100, r: 100, minSpeed: 340 }
  const level = flat({ width: 1400, loop, goal: { x: 1300, y: 0, w: 30, h: 30 } })
  const state = frames(level, runRight, 200)
  assert.equal(state.player.mode, "free")
  assert.ok(state.player.x > loop.cx + loop.r)
  assert.ok(Math.abs(state.player.y - STAND_Y) < 4)
})

function hasSupport(level, x, feet) {
  for (const block of level.blocks) {
    if (x >= block.x && x <= block.x + block.w && Math.abs(block.y - feet) < 40) return true
  }
  for (const slope of level.slopes) {
    if (x < slope.x || x > slope.x + slope.w) continue
    const t = (x - slope.x) / slope.w
    const surface = slope.yLeft + (slope.yRight - slope.yLeft) * t
    if (Math.abs(surface - feet) < 56) return true
  }
  return false
}

function bot(level, state) {
  const player = state.player
  const feet = player.y + player.h / 2
  const look = 64
  let jump = false
  if (player.grounded) {
    if (!hasSupport(level, player.x + look, feet)) jump = true
    for (const blob of state.blobs) {
      if (blob.x - player.x > -20 && blob.x - player.x < 140) jump = true
    }
  }
  return { left: false, right: true, jumpPressed: jump }
}

test("each level can be finished by running and jumping", () => {
  for (const level of levels) {
    let state = createPlayState(level)
    for (let i = 0; i < 60 * 200 && state.phase !== "clear"; i += 1) {
      state = stepPlay(state, level, bot(level, state), dt)
    }
    assert.equal(
      state.phase,
      "clear",
      `${level.name} stuck at x=${state.player.x.toFixed(0)} mode=${state.player.mode}`,
    )
    assert.ok(state.ringCount > 0, level.name)
  }
})

const downRight = { left: false, right: true, jumpPressed: false, down: true }
const downOnly = { left: false, right: false, jumpPressed: false, down: true }

function runUp(level, count, state = createPlayState(level)) {
  return frames(level, runRight, count, state)
}

test("a jump curls the player into a shorter ball and landing uncurls him", () => {
  const level = flat()
  const jumped = stepPlay(createPlayState(level), level, { ...hold, jumpPressed: true }, dt)
  assert.equal(jumped.player.ball, true)
  assert.equal(jumped.player.h, BALL_H)
  assert.ok(BALL_H < PLAYER_H)
  const landed = frames(level, hold, 60, jumped)
  assert.equal(landed.player.grounded, true)
  assert.equal(landed.player.ball, false)
  assert.equal(landed.player.h, PLAYER_H)
  assert.ok(Math.abs(landed.player.y - STAND_Y) < 0.5)
})

test("holding down while running rolls with feet kept on the ground", () => {
  const level = flat()
  const running = runUp(level, 30)
  const rolled = stepPlay(running, level, downRight, dt)
  assert.equal(rolled.player.ball, true)
  assert.equal(rolled.player.h, BALL_H)
  assert.equal(rolled.player.grounded, true)
  assert.ok(Math.abs(rolled.player.y + rolled.player.h / 2 - GROUND_TOP) < 0.5)
  assert.equal(rolled.justRolled, true)
})

test("down does not curl a player standing still", () => {
  const level = flat()
  const state = frames(level, downOnly, 10)
  assert.equal(state.player.ball, false)
})

test("releasing down uncurls the roll", () => {
  const level = flat()
  const rolled = frames(level, downRight, 5, runUp(level, 30))
  assert.equal(rolled.player.ball, true)
  const released = stepPlay(rolled, level, runRight, dt)
  assert.equal(released.player.ball, false)
  assert.equal(released.player.h, PLAYER_H)
})

test("a roll keeps its speed longer than a run when the arrows are let go", () => {
  const level = flat({ width: 4000, blocks: [{ x: 0, y: GROUND_TOP, w: 4000, h: 80 }] })
  const fast = runUp(level, 40)
  const coasting = frames(level, hold, 30, fast)
  const rolling = frames(level, downOnly, 30, fast)
  assert.equal(rolling.player.ball, true)
  assert.ok(rolling.player.vx > coasting.player.vx + 60)
})

test("a roll gains speed downhill and a run does not", () => {
  const level = flat({
    width: 4000,
    blocks: [],
    slopes: [{ x: 0, w: 3000, yLeft: GROUND_TOP - 300, yRight: GROUND_TOP }],
    spawn: { x: 180, y: GROUND_TOP - 300 + 180 * 0.1 - PLAYER_H / 2 },
    checkpoints: [{ x: 180, y: STAND_Y }],
  })
  const start = createPlayState(level)
  const ran = frames(level, runRight, 120, start)
  const rolledStart = runUp(level, 12, start)
  const rolled = frames(level, downRight, 108, rolledStart)
  assert.equal(rolled.player.ball, true)
  assert.ok(rolled.player.vx > ran.player.vx + 80, `${rolled.player.vx} vs ${ran.player.vx}`)
  assert.equal(rolled.player.grounded, true)
})

test("a rolling ball pops a blob, keeps the rings and does not respawn", () => {
  const level = flat({
    rings: [{ x: 260, y: STAND_Y }],
    blobs: [{ x: 520, y: STAND_Y, w: 42, h: 36, vx: 0, minX: 520, maxX: 520 }],
  })
  let state = runUp(level, 18)
  let popped = false
  let respawned = false
  for (let i = 0; i < 80; i += 1) {
    state = stepPlay(state, level, downRight, dt)
    if (state.justPopped) popped = true
    if (state.justRespawned) respawned = true
  }
  assert.equal(popped, true)
  assert.equal(respawned, false)
  assert.equal(state.ringCount, 1)
  assert.ok(state.blobs[0].popped > 0)
  assert.ok(state.player.x > 560)
})

test("a jumping ball pops a blob and bounces up", () => {
  const level = flat({ blobs: [{ x: 300, y: STAND_Y, w: 42, h: 36, vx: 0, minX: 300, maxX: 300 }] })
  let state = createPlayState(level)
  state = { ...state, player: { ...state.player, x: 300, y: STAND_Y - 140, grounded: false, coyote: 0 } }
  state = stepPlay(state, level, { ...hold, jumpPressed: false }, dt)
  state = { ...state, player: { ...state.player, ball: true, h: BALL_H } }
  let bounce = null
  for (let i = 0; i < 40 && bounce === null; i += 1) {
    state = stepPlay(state, level, hold, dt)
    if (state.justPopped) bounce = state.player.vy
  }
  assert.ok(bounce !== null)
  assert.ok(bounce < 0)
  assert.equal(state.justRespawned, false)
})

test("a popped blob comes back after a while", () => {
  const level = flat({ blobs: [{ x: 1200, y: STAND_Y, w: 42, h: 36, vx: 0, minX: 1200, maxX: 1200 }] })
  let state = createPlayState(level)
  state = { ...state, blobs: [{ ...state.blobs[0], popped: 0.2 }] }
  state = frames(level, hold, 20, state)
  assert.equal(state.blobs[0].popped, 0)
})

test("the ball fits under a low ceiling and stays curled until there is room", () => {
  const level = flat({
    width: 2000,
    blocks: [
      { x: 0, y: GROUND_TOP, w: 2000, h: 80 },
      { x: 500, y: GROUND_TOP - 60, w: 200, h: 20 },
    ],
  })
  let state = runUp(level, 20)
  for (let i = 0; i < 300 && state.player.x < 540; i += 1) state = stepPlay(state, level, downRight, dt)
  assert.equal(state.player.ball, true)
  let underneath = false
  for (let i = 0; i < 120; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.player.x > 520 && state.player.x < 680) {
      underneath = true
      assert.equal(state.player.ball, true)
    }
  }
  assert.equal(underneath, true)
  assert.ok(state.player.x > 720)
  assert.equal(state.player.ball, false)
})

test("a ball goes round the loop and comes out with feet on the ground", () => {
  const loop = { cx: 620, cy: STAND_Y - 100, r: 100, minSpeed: 340 }
  const level = flat({
    width: 1600,
    boosts: [{ x: 160, y: GROUND_TOP - 18, w: 90, h: 18, speed: 500 }],
    loops: [loop],
  })
  let state = createPlayState(level)
  let sawLoop = false
  for (let i = 0; i < 260; i += 1) {
    state = stepPlay(state, level, i > 12 ? downRight : runRight, dt)
    if (state.player.mode === "loop") sawLoop = true
  }
  assert.equal(sawLoop, true)
  assert.equal(state.player.mode, "free")
  assert.ok(state.player.x > loop.cx + loop.r)
  assert.ok(Math.abs(state.player.y + state.player.h / 2 - GROUND_TOP) < 1)
})

test("a spring throws the player high without a key press", () => {
  const level = flat({ springs: [{ x: 300, y: GROUND_TOP - 24, w: 40, h: 24, power: 1100 }] })
  let state = createPlayState(level)
  let sprung = false
  let highest = STAND_Y
  for (let i = 0; i < 90; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.justSprung) sprung = true
    highest = Math.min(highest, state.player.y)
  }
  assert.equal(sprung, true)
  assert.ok(highest < STAND_Y - 220)
})

test("a one-way platform holds from above and lets the player jump up through it", () => {
  const level = flat({ platforms: [{ x: 120, y: GROUND_TOP - 90, w: 200 }] })
  let state = createPlayState(level)
  let rose = false
  for (let i = 0; i < 80; i += 1) {
    state = stepPlay(state, level, { ...hold, jumpPressed: i === 0 }, dt)
    if (state.player.y + state.player.h / 2 < GROUND_TOP - 100) rose = true
  }
  assert.equal(rose, true)
  assert.equal(state.player.grounded, true)
  assert.ok(Math.abs(state.player.y + state.player.h / 2 - (GROUND_TOP - 90)) < 0.5)
})

test("a moving platform carries the player along", () => {
  const mover = { x: 140, y: GROUND_TOP - 80, w: 120, dx: 300, dy: 0, period: 4 }
  const level = flat({ movers: [mover] })
  let state = createPlayState(level)
  state = { ...state, player: { ...state.player, x: 200, y: GROUND_TOP - 80 - PLAYER_H / 2 - 4, grounded: false } }
  state = frames(level, hold, 20, state)
  assert.equal(state.player.grounded, true)
  const startX = state.player.x
  const startPlatform = moverPosition(mover, state.time).x
  state = frames(level, hold, 60, state)
  const moved = moverPosition(mover, state.time).x - startPlatform
  assert.ok(moved > 40)
  assert.ok(Math.abs(state.player.x - startX - moved) < 2)
})

test("Nox runs faster than Piko", () => {
  const level = flat({ width: 3000, blocks: [{ x: 0, y: GROUND_TOP, w: 3000, h: 80 }] })
  const piko = runUp(level, 60, createPlayState(level, "piko"))
  const nox = runUp(level, 60, createPlayState(level, "nox"))
  assert.ok(nox.player.vx > piko.player.vx)
  assert.ok(nox.player.x > piko.player.x)
})

test("Nox dashes forward, then waits for the cooldown", () => {
  const level = flat({ width: 3000, blocks: [{ x: 0, y: GROUND_TOP, w: 3000, h: 80 }] })
  let state = runUp(level, 10, createPlayState(level, "nox"))
  state = stepPlay(state, level, { ...runRight, dashPressed: true }, dt)
  assert.equal(state.justDashed, true)
  assert.ok(state.player.dashTime > 0)
  assert.ok(state.player.vx >= DASH_SPEED)
  assert.ok(Math.abs(state.player.dashCooldown - DASH_COOLDOWN) < 0.02)
  const again = stepPlay(frames(level, runRight, 30, state), level, { ...runRight, dashPressed: true }, dt)
  assert.equal(again.justDashed, false)
  const later = frames(level, runRight, Math.ceil(DASH_COOLDOWN * 60), state)
  const ready = stepPlay(later, level, { ...runRight, dashPressed: true }, dt)
  assert.equal(ready.justDashed, true)
})

test("Piko has no dash", () => {
  const level = flat()
  const state = stepPlay(runUp(level, 10), level, { ...runRight, dashPressed: true }, dt)
  assert.equal(state.justDashed, false)
  assert.equal(state.player.dashTime, 0)
})

test("a dash through a blob pops it", () => {
  const level = flat({ blobs: [{ x: 420, y: STAND_Y, w: 42, h: 36, vx: 0, minX: 420, maxX: 420 }] })
  let state = runUp(level, 30, createPlayState(level, "nox"))
  state = stepPlay(state, level, { ...runRight, dashPressed: true }, dt)
  let popped = false
  for (let i = 0; i < 20; i += 1) {
    state = stepPlay(state, level, runRight, dt)
    if (state.justPopped) popped = true
    assert.equal(state.justRespawned, false)
  }
  assert.equal(popped, true)
})

test("a respawn uncurls the player and stops the dash", () => {
  const level = flat({ blocks: [{ x: 0, y: GROUND_TOP, w: 320, h: 80 }], width: 800 })
  let state = createPlayState(level, "nox")
  let respawned = null
  for (let i = 0; i < 300 && !respawned; i += 1) {
    state = stepPlay(state, level, { ...runRight, jumpPressed: i === 20, dashPressed: i === 22 }, dt)
    if (state.justRespawned) respawned = state
  }
  assert.ok(respawned)
  assert.equal(respawned.player.ball, false)
  assert.equal(respawned.player.h, PLAYER_H)
  assert.equal(respawned.player.dashTime, 0)
})

test("a boost fades back to the normal top speed while running", () => {
  const level = flat({
    width: 4000,
    blocks: [{ x: 0, y: GROUND_TOP, w: 4000, h: 80 }],
    boosts: [{ x: 200, y: GROUND_TOP - 18, w: 80, h: 18, speed: 480 }],
  })
  const state = frames(level, runRight, 200)
  assert.ok(Math.abs(state.player.vx - 260) < 1)
})

test("jumping just past a hill crest keeps going forward", () => {
  const level = flat({
    width: 3000,
    blocks: [
      { x: 0, y: GROUND_TOP, w: 400, h: 80 },
      { x: 700, y: GROUND_TOP - 80, w: 360, h: 160 },
      { x: 1480, y: GROUND_TOP, w: 1520, h: 80 },
    ],
    slopes: [
      { x: 400, w: 300, yLeft: GROUND_TOP, yRight: GROUND_TOP - 80 },
      { x: 1060, w: 420, yLeft: GROUND_TOP - 80, yRight: GROUND_TOP },
    ],
  })
  for (const startX of [1062, 1066, 1070]) {
    let state = createPlayState(level)
    const surface = GROUND_TOP - 80 + (80 * (startX - 1060)) / 420
    state = { ...state, player: { ...state.player, x: startX, y: surface - PLAYER_H / 2, vx: 260, grounded: true } }
    state = stepPlay(state, level, runRight, dt)
    state = stepPlay(state, level, { ...runRight, jumpPressed: true }, dt)
    assert.ok(state.player.x > startX, `from ${startX} landed at ${state.player.x}`)
    assert.ok(state.player.vx > 200)
  }
})
