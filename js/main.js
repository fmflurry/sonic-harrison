import { spriteCanvas } from "./art.js"
import { isMuted, setMuted, unlockAudio } from "./audio.js"
import { characterOf, loadCharacter, saveCharacter } from "./characters.js"
import { bindInput, releaseAll } from "./input.js"
import { levels } from "./levels.js"
import { DASH_COOLDOWN } from "./physics.js"
import { inspect, isPaused, setHooks, setPaused, setRunning, stage, startLevel } from "./play.js"
import { loadProgress, saveProgress } from "./progress.js"
import { NOX } from "./sprites/nox.js"
import { PIKO } from "./sprites/piko.js"
import { bindViewport, refit } from "./viewport.js"

const $ = (selector) => document.querySelector(selector)
const titleScreen = $("#title-screen")
const selectScreen = $("#select-screen")
const playScreen = $("#play-screen")
const pauseScreen = $("#pause-screen")
const clearScreen = $("#clear-screen")
const rings = $("#rings")
const flags = $("#flags")
const progressFill = $("#progress-fill")
const levelName = $("#level-name")
const notice = $("#notice")
const clearRings = $("#clear-rings")
const nextButton = $("#next")
const levelList = $("#level-list")
const dashButton = $("#touch .dash")
const dashMeter = $("#dash-meter")
const dashFill = $("#dash-fill")
const muteButton = $("#mute")
const heroButtons = [...document.querySelectorAll(".hero")]
const storage = (() => {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
})()

let current = 0
let character = loadCharacter(storage)
let progress = loadProgress(storage)

function show(screen) {
  for (const candidate of [titleScreen, selectScreen, pauseScreen, clearScreen]) candidate.hidden = screen !== candidate
  playScreen.hidden = ![playScreen, clearScreen, pauseScreen].includes(screen)
  if (playScreen.hidden) setRunning(false)
  refit()
  requestAnimationFrame(refit)
}

function paintPortraits() {
  for (const button of heroButtons) {
    const hero = button.dataset.character === "nox" ? NOX : PIKO
    button.querySelector(".portrait").src = spriteCanvas(hero.frames.idle0, hero.palette).toDataURL()
  }
}

function chooseCharacter(id) {
  character = saveCharacter(storage, id)
  for (const button of heroButtons) {
    const chosen = button.dataset.character === character
    button.setAttribute("aria-checked", String(chosen))
    button.tabIndex = chosen ? 0 : -1
  }
  document.body.dataset.character = character
}

function renderLevelList() {
  levelList.replaceChildren(
    ...levels.map((level, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "big"
      button.textContent = `${index + 1} · ${level.name}`
      if (index < progress) {
        const star = document.createElement("span")
        star.className = "done"
        star.setAttribute("aria-hidden", "true")
        star.textContent = " ★"
        button.append(star)
      }
      button.addEventListener("click", () => begin(index))
      return button
    }),
  )
}

function begin(index) {
  current = index
  levelName.textContent = levels[index].name
  const dash = characterOf(character).dash
  dashButton.hidden = !dash
  dashMeter.hidden = !dash
  releaseAll()
  show(playScreen)
  try {
    startLevel(index, character)
  } catch (error) {
    $("#boot-error").hidden = false
    throw error
  }
}

function pause(value) {
  if (playScreen.hidden || !clearScreen.hidden) return
  setPaused(value)
  releaseAll()
  pauseScreen.hidden = !value
  refit()
}

titleScreen.addEventListener("click", (event) => {
  if (event.target.closest("#levels, .hero")) return
  begin(0)
})
for (const button of heroButtons) {
  button.addEventListener("click", () => chooseCharacter(button.dataset.character))
}
$(".heroes").addEventListener("keydown", (event) => {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return
  event.stopPropagation()
  event.preventDefault()
  const next = character === "piko" ? "nox" : "piko"
  chooseCharacter(next)
  heroButtons.find((button) => button.dataset.character === next)?.focus()
})
$("#levels").addEventListener("click", () => show(selectScreen))
$("#back-title").addEventListener("click", () => show(titleScreen))
$("#replay").addEventListener("click", () => begin(current))
$("#clear-levels").addEventListener("click", () => show(selectScreen))
nextButton.addEventListener("click", () => begin(current + 1))
$("#pause").addEventListener("click", () => pause(true))
$("#resume").addEventListener("click", () => pause(false))
$("#pause-levels").addEventListener("click", () => {
  setPaused(false)
  show(selectScreen)
})
$("#pause-title").addEventListener("click", () => {
  setPaused(false)
  show(titleScreen)
})
muteButton.addEventListener("click", () => {
  setMuted(!isMuted())
  muteButton.setAttribute("aria-pressed", String(isMuted()))
  muteButton.setAttribute("aria-label", isMuted() ? "Remettre le son" : "Couper le son")
})
window.addEventListener("keydown", (event) => {
  if (event.code === "Escape" || event.code === "KeyP") pause(!isPaused())
  if (event.code === "KeyM") muteButton.click()
})
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause(true)
})

setHooks({
  onSync(state, level) {
    rings.textContent = `Anneaux : ${state.ringCount}`
    flags.textContent = `Drapeaux : ${state.activeCheckpoint}/${level.checkpoints.length - 1}`
    progressFill.style.width = `${Math.min(100, (state.player.x / level.goal.x) * 100).toFixed(1)}%`
    notice.hidden = state.noticeTtl <= 0
    notice.textContent = state.notice
    if (!dashMeter.hidden) {
      const charge = 1 - state.player.dashCooldown / DASH_COOLDOWN
      dashFill.style.width = `${Math.round(charge * 100)}%`
      dashButton.style.setProperty("--charge", charge.toFixed(2))
      dashButton.classList.toggle("ready", charge >= 1)
    }
  },
  onClear(state, index) {
    setRunning(false)
    clearRings.textContent = `Anneaux : ${state.ringCount}`
    nextButton.hidden = current >= levels.length - 1
    progress = saveProgress(storage, Math.max(progress, index + 1))
    renderLevelList()
    show(clearScreen)
  },
})

globalThis.__piko = { inspect, stage, begin, chooseCharacter: (id) => chooseCharacter(id) }

paintPortraits()
chooseCharacter(character)
renderLevelList()
bindInput(unlockAudio)
bindViewport()
