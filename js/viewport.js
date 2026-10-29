import { refreshGameScale } from "./play.js"

const MARGIN = 12

function applyAppHeight() {
  // Safari's layout viewport stays taller than the visible area while the toolbar is open.
  const height = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`)
}

function fitStage(stage) {
  const content = stage.querySelector(":scope > .fit-content")
  if (!content) return
  if (stage.clientWidth < 8 || stage.clientHeight < 8) {
    content.style.transform = ""
    content.style.maxWidth = ""
    return
  }
  const availW = Math.max(1, stage.clientWidth - MARGIN)
  const availH = Math.max(1, stage.clientHeight - MARGIN)
  content.style.transform = "none"
  content.style.maxWidth = `${availW}px`
  const width = content.offsetWidth
  const height = content.offsetHeight
  if (width < 1 || height < 1) return
  const scale = Math.min(1, availW / width, availH / height)
  content.style.transformOrigin = "center center"
  content.style.transform = scale < 0.999 ? `scale(${scale})` : ""
}

export function refit() {
  applyAppHeight()
  for (const stage of document.querySelectorAll(".fit-stage")) fitStage(stage)
  refreshGameScale()
}

export function bindViewport() {
  let frame = 0
  const schedule = () => {
    refit()
    window.cancelAnimationFrame(frame)
    frame = window.requestAnimationFrame(refit)
    window.setTimeout(refit, 120)
  }
  window.addEventListener("resize", schedule)
  window.addEventListener("orientationchange", schedule)
  window.visualViewport?.addEventListener("resize", schedule)
  window.visualViewport?.addEventListener("scroll", schedule)
  document.fonts?.ready?.then(() => refit())
  const observer = new ResizeObserver(() => refit())
  for (const stage of document.querySelectorAll(".fit-stage")) observer.observe(stage)
  const game = document.querySelector("#game")
  if (game) observer.observe(game)
  refit()
}
