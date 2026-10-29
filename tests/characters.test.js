import assert from "node:assert/strict"
import { test } from "node:test"
import { CHARACTER_KEY, CHARACTERS, characterOf, loadCharacter, saveCharacter } from "../js/characters.js"
import { loadProgress, PROGRESS_KEY, saveProgress } from "../js/progress.js"

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

const brokenStorage = {
  getItem() {
    throw new Error("blocked")
  },
  setItem() {
    throw new Error("blocked")
  },
}

test("Piko is the default character", () => {
  assert.equal(loadCharacter(memoryStorage()), "piko")
  assert.equal(loadCharacter(null), "piko")
  assert.equal(loadCharacter(brokenStorage), "piko")
})

test("the chosen character is remembered", () => {
  const storage = memoryStorage()
  assert.equal(saveCharacter(storage, "nox"), "nox")
  assert.equal(storage.data[CHARACTER_KEY], "nox")
  assert.equal(loadCharacter(storage), "nox")
})

test("an unknown saved character falls back to Piko", () => {
  assert.equal(loadCharacter(memoryStorage({ [CHARACTER_KEY]: "shadow" })), "piko")
  assert.equal(saveCharacter(memoryStorage(), "bogus"), "piko")
})

test("blocked storage still lets the player choose for this visit", () => {
  assert.equal(saveCharacter(brokenStorage, "nox"), "nox")
})

test("only Nox dashes and Nox is the faster runner", () => {
  assert.equal(CHARACTERS.piko.dash, false)
  assert.equal(CHARACTERS.nox.dash, true)
  assert.ok(CHARACTERS.nox.maxRun > CHARACTERS.piko.maxRun)
  assert.equal(characterOf("missing").id, "piko")
})

test("the best progress is stored as a number of cleared levels", () => {
  const storage = memoryStorage()
  assert.equal(loadProgress(storage), 0)
  saveProgress(storage, 3)
  assert.equal(storage.data[PROGRESS_KEY], "3")
  assert.equal(loadProgress(storage), 3)
  assert.equal(loadProgress(memoryStorage({ [PROGRESS_KEY]: "nope" })), 0)
  assert.equal(loadProgress(brokenStorage), 0)
})
