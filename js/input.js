const key = { left: false, right: false, jump: false }
const touch = { left: false, right: false, jump: false }

const heldByCode = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "jump",
  Space: "jump",
}

export function readHeld() {
  return {
    left: key.left || touch.left,
    right: key.right || touch.right,
    jump: key.jump || touch.jump,
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
  window.addEventListener("blur", () => {
    key.left = false
    key.right = false
    key.jump = false
    touch.left = false
    touch.right = false
    touch.jump = false
  })

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
