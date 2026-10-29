export const PROGRESS_KEY = "piko-turbo.progress"

export function loadProgress(storage) {
  try {
    const value = Number.parseInt(storage?.getItem(PROGRESS_KEY) ?? "0", 10)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

export function saveProgress(storage, cleared) {
  try {
    storage?.setItem(PROGRESS_KEY, String(cleared))
  } catch {
    // Private browsing can refuse storage; the stars then last for this visit only.
  }
  return cleared
}
