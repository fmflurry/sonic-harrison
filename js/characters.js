export const CHARACTERS = {
  piko: { id: "piko", name: "Piko", maxRun: 260, accel: 1600, airAccel: 1100, dash: false },
  nox: { id: "nox", name: "Nox", maxRun: 290, accel: 1750, airAccel: 1200, dash: true },
}

export const DEFAULT_CHARACTER = "piko"
export const CHARACTER_KEY = "piko-turbo.character"

export function characterOf(id) {
  return CHARACTERS[id] ?? CHARACTERS[DEFAULT_CHARACTER]
}

export function loadCharacter(storage) {
  try {
    const saved = storage?.getItem(CHARACTER_KEY)
    return CHARACTERS[saved] ? saved : DEFAULT_CHARACTER
  } catch {
    return DEFAULT_CHARACTER
  }
}

export function saveCharacter(storage, id) {
  const valid = CHARACTERS[id] ? id : DEFAULT_CHARACTER
  try {
    storage?.setItem(CHARACTER_KEY, valid)
  } catch {
    // Private browsing can refuse storage; the choice still holds for this visit.
  }
  return valid
}
