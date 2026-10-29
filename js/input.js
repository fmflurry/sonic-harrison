const FIELDS = ["left", "right", "jump", "down", "dash"]
const key = Object.fromEntries(FIELDS.map((field) => [field, false]))
const touch = Object.fromEntries(FIELDS.map((field) => [field, false]))

const heldByCode = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "jump",
  Space: "jump",
  ArrowDown: "down",
  ShiftLeft: "dash",
  ShiftRight: "dash",
}

export function readHeld() {
  return {
    left: key.left || touch.left,
    right: key.right || touch.right,
    jump: key.jump || touch.jump,
    down: key.down || touch.down,
    dash: key.dash || touch.dash,
  }
}

// Touch buttons can lose their pointerup under an overlay; held keys still get their keyup.
export function releaseTouch() {
  for (const field of FIELDS) touch[field] = false
}

function releaseAll() {
  for (const field of FIELDS) key[field] = false
  releaseTouch()
}

// While a level runs, the game keys belong to the game; elsewhere Space and arrows keep their
// usual job of pressing and moving between buttons.
export function bindInput(onGesture, gameHasKeys) {
  window.addEventListener("keydown", (event) => {
    const field = heldByCode[event.code]
    if (!field) return
    if (!gameHasKeys()) return
    event.preventDefault()
    if (event.repeat && key[field]) return
    key[field] = true
    onGesture()
  })
  window.addEventListener("keyup", (event) => {
    const field = heldByCode[event.code]
    if (!field) return
    key[field] = false
  })
  window.addEventListener("blur", releaseAll)

  for (const button of document.querySelectorAll("[data-hold]")) {
    const field = button.dataset.hold
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault()
      touch[field] = true
      if (event.isTrusted) button.setPointerCapture(event.pointerId)
      onGesture()
    })
    const release = (event) => {
      event.preventDefault()
      touch[field] = false
    }
    button.addEventListener("pointerup", release)
    button.addEventListener("pointercancel", release)
  }
}
