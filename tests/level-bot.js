// A scripted player for the level checks: hold right, jump at gaps and in front of blobs.
import { createPlayState, moverPosition, stepPlay } from "../js/physics.js"

export const BOT_DT = 1 / 60
const LOOK_AHEAD = 30
const BLOB_RANGE = 130

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
  for (const platform of level.platforms ?? []) {
    if (x >= platform.x && x <= platform.x + platform.w && Math.abs(platform.y - feet) < 8) return true
  }
  return false
}

function onMoverAhead(level, state, x, feet) {
  const movers = level.movers ?? []
  for (const mover of movers) {
    const at = moverPosition(mover, state.time)
    if (x >= at.x && x <= at.x + mover.w && Math.abs(at.y - feet) < 8) return true
  }
  return false
}

export function botInput(level, state) {
  const player = state.player
  const feet = player.y + player.h / 2
  let jump = false
  if (player.grounded && player.mode === "free") {
    const ahead = player.x + LOOK_AHEAD
    if (!hasSupport(level, ahead, feet) && !onMoverAhead(level, state, ahead, feet)) jump = true
    for (const blob of state.blobs) {
      const ahead = blob.x - player.x
      if (blob.popped <= 0 && ahead > -20 && ahead < BLOB_RANGE) jump = true
    }
  }
  return { left: false, right: true, jumpPressed: jump, down: false, dashPressed: false }
}

export function runBot(level, character = "piko", maxSeconds = 400) {
  let state = createPlayState(level, character)
  const checkpointTimes = [0]
  let respawns = 0
  const respawnAt = []
  let frame = 0
  let lastX = 0
  for (; frame < maxSeconds * 60 && state.phase !== "clear"; frame += 1) {
    state = stepPlay(state, level, botInput(level, state), BOT_DT)
    if (state.justCheckpoint) checkpointTimes.push((frame + 1) * BOT_DT)
    if (state.justRespawned) {
      respawns += 1
      respawnAt.push(lastX)
    }
    lastX = Math.round(state.player.x)
  }
  const seconds = frame * BOT_DT
  return {
    cleared: state.phase === "clear",
    seconds,
    respawns,
    respawnAt,
    rings: state.ringCount,
    checkpointTimes,
    reachedCheckpoints: state.activeCheckpoint + 1,
    stuckAt: Math.round(state.player.x),
  }
}
