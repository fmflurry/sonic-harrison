import { unlockAudio } from "./audio.js"
import { bindInput } from "./input.js"
import { levels } from "./levels.js"
import { setHooks, setRunning, startLevel } from "./play.js"

const titleScreen = document.querySelector("#title-screen")
const selectScreen = document.querySelector("#select-screen")
const playScreen = document.querySelector("#play-screen")
const clearScreen = document.querySelector("#clear-screen")
const bootError = document.querySelector("#boot-error")
const rings = document.querySelector("#rings")
const levelName = document.querySelector("#level-name")
const notice = document.querySelector("#notice")
const clearRings = document.querySelector("#clear-rings")
const nextButton = document.querySelector("#next")
const levelList = document.querySelector("#level-list")

let current = 0

function show(screen) {
  titleScreen.hidden = screen !== titleScreen
  selectScreen.hidden = screen !== selectScreen
  clearScreen.hidden = screen !== clearScreen
  playScreen.hidden = screen !== playScreen && screen !== clearScreen
  if (screen !== playScreen && screen !== clearScreen) setRunning(false)
}

function begin(index) {
  if (!globalThis.Phaser) {
    bootError.hidden = false
    return
  }
  current = index
  levelName.textContent = levels[index].name
  show(playScreen)
  startLevel(index)
}

levels.forEach((level, index) => {
  const button = document.createElement("button")
  button.type = "button"
  button.className = "big"
  button.textContent = `${index + 1} · ${level.name}`
  button.addEventListener("click", () => begin(index))
  levelList.append(button)
})

document.querySelector("#play").addEventListener("click", () => begin(0))
document.querySelector("#levels").addEventListener("click", () => show(selectScreen))
document.querySelector("#back-title").addEventListener("click", () => show(titleScreen))
document.querySelector("#replay").addEventListener("click", () => begin(current))
document.querySelector("#clear-levels").addEventListener("click", () => show(selectScreen))
nextButton.addEventListener("click", () => begin(current + 1))

setHooks({
  onSync(state) {
    rings.textContent = `Anneaux : ${state.ringCount}`
    notice.hidden = state.noticeTtl <= 0
    notice.textContent = state.notice
  },
  onClear(state) {
    setRunning(false)
    clearRings.textContent = `Anneaux : ${state.ringCount}`
    nextButton.hidden = current >= levels.length - 1
    show(clearScreen)
  },
})

bindInput(unlockAudio)
