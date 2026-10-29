import { sfx } from "./audio.js"
import { drawFrame } from "./draw.js"
import { readHeld } from "./input.js"
import { levels } from "./levels.js"
import { VIEW_H, VIEW_W, createPlayState, stepPlay } from "./physics.js"

const STEP_MS = 1000 / 60

let pendingIndex = 0
let running = false
let game = null
let hooks = {
  onSync() {},
  onClear() {},
}

export function setHooks(next) {
  hooks = next
}

export function setRunning(value) {
  running = value
}

export function startLevel(index) {
  pendingIndex = index
  running = true
  if (!game) {
    game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: "game",
      width: VIEW_W,
      height: VIEW_H,
      backgroundColor: "#8fd4ff",
      banner: false,
      audio: { noAudio: true },
      disableContextMenu: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [PlayScene],
    })
    return
  }
  const scene = game.scene.getScene("play")
  if (scene) scene.scene.restart()
  game.scale.refresh()
}

const PhaserScene = globalThis.Phaser?.Scene ?? class {}

class PlayScene extends PhaserScene {
  constructor() {
    super("play")
  }

  create() {
    this.level = levels[pendingIndex]
    this.levelIndex = pendingIndex
    this.state = createPlayState(this.level)
    this.gfx = this.add.graphics()
    this.goalLabel = this.add
      .text(0, 0, "Arrivée", {
        fontFamily: "Trebuchet MS, Comic Sans MS, sans-serif",
        fontSize: "22px",
        color: "#6b3a00",
        fontStyle: "bold",
      })
      .setDepth(2)
    this.acc = 0
    this.jumpWasDown = false
    this.timeSec = 0
    this.cleared = false
    hooks.onSync(this.state, this.level)
  }

  update(_time, delta) {
    if (!running) return
    const held = readHeld()
    if (!this.cleared) {
      this.acc += Math.min(delta, 100)
      let jumpPressed = held.jump && !this.jumpWasDown
      let guard = 0
      while (this.acc >= STEP_MS && guard < 5 && !this.cleared) {
        if (jumpPressed && (this.state.player.grounded || this.state.player.coyote > 0)) sfx.jump()
        this.state = stepPlay(
          this.state,
          this.level,
          { left: held.left, right: held.right, jumpPressed },
          STEP_MS / 1000,
        )
        jumpPressed = false
        this.playCues(this.state)
        this.acc -= STEP_MS
        guard += 1
        if (this.state.phase === "clear") {
          this.cleared = true
          sfx.clear()
          hooks.onClear(this.state, this.levelIndex)
        }
      }
      this.jumpWasDown = held.jump
    }
    this.timeSec += Math.min(delta, 100) / 1000
    const camX = drawFrame(this.gfx, this.level, this.state, this.timeSec)
    this.goalLabel.setPosition(this.level.goal.x - camX + 20, this.level.goal.y + 20)
    hooks.onSync(this.state, this.level)
  }

  playCues(state) {
    if (state.justCollected) sfx.ring()
    if (state.justBoosted) sfx.boost()
    if (state.justCheckpoint) sfx.checkpoint()
    if (state.justRespawned) sfx.oups()
  }
}
