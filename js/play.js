import { ART_H, ART_W, levelArt, makeCanvas, sharedArt } from "./art.js"
import { sfx } from "./audio.js"
import { readHeld } from "./input.js"
import { levels } from "./levels.js"
import { VIEW_H, VIEW_W, createPlayState, moverPosition, stepPlay } from "./physics.js"
import { advanceEffects, createEffects, drawWorld } from "./render.js"

const STEP_MS = 1000 / 60
const MAX_STEPS = 5

let hooks = { onSync() {}, onClear() {} }
let running = false
let paused = false
let frameRequest = 0
let screen = null
let screenCtx = null
let buffer = null
let bufferCtx = null
let session = null

export function setHooks(next) {
  hooks = next
}

export function setRunning(value) {
  running = value
  if (!value) cancelAnimationFrame(frameRequest)
}

export function setPaused(value) {
  if (paused === value) return
  paused = value
  if (!session || !running) return
  cancelAnimationFrame(frameRequest)
  if (!paused) {
    session.last = performance.now()
    frameRequest = requestAnimationFrame(tick)
  }
}

export function isPaused() {
  return paused
}

function ensureCanvas() {
  if (screen) return
  const parent = document.querySelector("#game")
  screen = document.createElement("canvas")
  screen.id = "screen"
  screen.setAttribute("aria-label", "Le jeu")
  parent.append(screen)
  screenCtx = screen.getContext("2d", { alpha: false })
  buffer = makeCanvas(ART_W, ART_H)
  bufferCtx = buffer.getContext("2d")
}

// Fits the 16:9 view inside #game, like a letterbox, with the backing store at device pixels.
export function refreshGameScale() {
  if (!screen) return
  const parent = screen.parentElement
  const width = parent.clientWidth
  const height = parent.clientHeight
  if (width < 8 || height < 8) return
  const scale = Math.min(width / VIEW_W, height / VIEW_H)
  const cssW = Math.floor(VIEW_W * scale)
  const cssH = Math.floor(VIEW_H * scale)
  const ratio = window.devicePixelRatio || 1
  screen.style.width = `${cssW}px`
  screen.style.height = `${cssH}px`
  screen.style.left = `${Math.floor((width - cssW) / 2)}px`
  screen.style.top = `${Math.floor((height - cssH) / 2)}px`
  const backW = Math.max(1, Math.round(cssW * ratio))
  const backH = Math.max(1, Math.round(cssH * ratio))
  if (screen.width !== backW || screen.height !== backH) {
    screen.width = backW
    screen.height = backH
  }
  present()
}

function present() {
  if (!screenCtx || !session) return
  screenCtx.imageSmoothingEnabled = false
  screenCtx.drawImage(buffer, 0, 0, ART_W, ART_H, 0, 0, screen.width, screen.height)
}

function render() {
  drawWorld(bufferCtx, {
    level: session.level,
    state: session.state,
    art: sharedArt(),
    levelArt: session.levelArt,
    time: session.time,
    fx: session.fx,
    moverPosition,
  })
  present()
  session.frames += 1
}

function playCues(state) {
  if (state.justCollected) sfx.ring()
  if (state.justBoosted) sfx.boost()
  if (state.justCheckpoint) sfx.checkpoint()
  if (state.justRespawned) sfx.oups()
  if (state.justRolled) sfx.roll()
  if (state.justPopped) sfx.pop()
  if (state.justDashed) sfx.dash()
  if (state.justSprung) sfx.spring()
}

// Presses are latched until a physics step uses them: on a 120 Hz screen many frames run no step.
function latchPresses(held) {
  if (held.jump && !session.jumpWasDown) session.jumpQueued = true
  if (held.dash && !session.dashWasDown) session.dashQueued = true
  session.jumpWasDown = held.jump
  session.dashWasDown = held.dash
}

function tick(now) {
  if (!running || !session || paused) return
  frameRequest = requestAnimationFrame(tick)
  const delta = Math.max(0, Math.min(now - session.last, 100))
  session.last = now
  const held = readHeld()
  latchPresses(held)
  if (session.state.phase === "play") {
    session.acc += delta
    for (let steps = 0; session.acc >= STEP_MS && steps < MAX_STEPS; steps += 1) {
      const player = session.state.player
      if (session.jumpQueued && (player.grounded || player.coyote > 0) && player.mode === "free") sfx.jump()
      session.state = stepPlay(
        session.state,
        session.level,
        { left: held.left, right: held.right, down: held.down, jumpPressed: session.jumpQueued, dashPressed: session.dashQueued },
        STEP_MS / 1000,
      )
      session.jumpQueued = false
      session.dashQueued = false
      session.acc -= STEP_MS
      advanceEffects(session.fx, session.state, sharedArt(), session.time)
      playCues(session.state)
      if (session.state.phase === "clear") {
        sfx.clear()
        hooks.onClear(session.state, session.index)
        break
      }
    }
    session.acc = Math.min(session.acc, STEP_MS * MAX_STEPS)
  }
  session.time += delta / 1000
  render()
  hooks.onSync(session.state, session.level)
}

export function startLevel(index, character) {
  ensureCanvas()
  const level = levels[index]
  session = {
    index,
    level,
    levelArt: levelArt(level),
    state: createPlayState(level, character),
    fx: createEffects(),
    acc: 0,
    time: 0,
    last: performance.now(),
    frames: 0,
    jumpWasDown: true,
    dashWasDown: true,
    jumpQueued: false,
    dashQueued: false,
  }
  paused = false
  running = true
  cancelAnimationFrame(frameRequest)
  refreshGameScale()
  render()
  hooks.onSync(session.state, session.level)
  frameRequest = requestAnimationFrame(tick)
}

// Read-only view for the smoke tests and the screenshot tool.
export function inspect() {
  if (!session) return null
  return {
    levelIndex: session.index,
    levelName: session.level.name,
    character: session.state.character,
    phase: session.state.phase,
    player: { ...session.state.player },
    ringCount: session.state.ringCount,
    activeCheckpoint: session.state.activeCheckpoint,
    frames: session.frames,
    smoothing: {
      screen: screenCtx?.imageSmoothingEnabled,
      buffer: bufferCtx?.imageSmoothingEnabled,
    },
    canvas: { width: screen?.width, height: screen?.height },
  }
}

// Places the player for screenshots; only the report tool calls it.
export function stage(change) {
  if (!session) return
  const player = { ...session.state.player, ...change.player }
  session.state = { ...session.state, ...change.state, player }
  if (change.time !== undefined) session.time = change.time
  render()
}
