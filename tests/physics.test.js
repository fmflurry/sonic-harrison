import assert from "node:assert/strict"
import { test } from "node:test"
import { createPlayState, GROUND_TOP, STAND_Y, stepPlay } from "../js/physics.js"
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
    for (let i = 0; i < 60 * 50 && state.phase !== "clear"; i += 1) {
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
