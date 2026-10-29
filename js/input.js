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

function releaseAll() {
  for (const field of FIELDS) {
    key[field] = false
    touch[field] = false
  }
}

export function bindInput(onGesture) {
  window.addEventListener("keydown", (event) => {
    const field = heldByCode[event.code]
    if (!field || event.repeat) return
    event.preventDefault()
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

export { releaseAll }
