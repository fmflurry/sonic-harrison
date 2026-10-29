// Screenshots for the PR report: PW_CHROMIUM=/path/to/chrome node tools/capture-report.mjs <out-dir>
// Serves the repo root on a local port and drives the real game with keys and the __piko hook.
import { spawn } from "node:child_process"
import { mkdirSync } from "node:fs"
import { chromium } from "@playwright/test"

const out = process.argv[2] ?? "docs/pr-reports/feat-pixel-art-spin-nox-levels"
const port = 4179
const base = `http://127.0.0.1:${port}/`
const sizes = { wide: { width: 1280, height: 720 }, phone: { width: 844, height: 390 } }

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { stdio: "ignore" })
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})

async function open(size, character = "piko") {
  const page = await browser.newPage({ viewport: sizes[size] })
  const errors = []
  page.on("pageerror", (error) => errors.push(`${size} ${character}: ${error.stack}`))
  for (let tries = 0; tries < 20; tries += 1) {
    try {
      await page.goto(base)
      break
    } catch {
      await page.waitForTimeout(200)
    }
  }
  await page.evaluate((id) => globalThis.__piko.chooseCharacter(id), character)
  return { page, errors }
}

async function startAt(page, levelIndex, x) {
  await page.evaluate(
    async ({ levelIndex, x }) => {
      const { levels } = await import("./js/levels.js")
      const level = levels[levelIndex]
      globalThis.__piko.begin(levelIndex)
      if (x === null) return
      let top = Infinity
      for (const block of level.blocks) if (x >= block.x && x <= block.x + block.w) top = Math.min(top, block.y)
      globalThis.__piko.stage({ player: { x, y: top - 24, vx: 0, vy: 0, grounded: true } })
    },
    { levelIndex, x },
  )
  await page.waitForTimeout(250)
}

async function shot(page, name) {
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(`${out}/${name}.png`)
}

mkdirSync(out, { recursive: true })
const failures = []

for (const size of ["wide", "phone"]) {
  const { page, errors } = await open(size)
  await shot(page, `menu-${size}`)
  await page.locator(".hero[data-character='nox']").click()
  await shot(page, `menu-nox-${size}`)
  await page.close()
  failures.push(...errors)
}

for (const size of ["wide", "phone"]) {
  const { page, errors } = await open(size)
  await startAt(page, 0, null)
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(1400)
  await shot(page, `piko-run-${size}`)
  await page.keyboard.press("Space")
  await page.waitForTimeout(220)
  await shot(page, `piko-jump-${size}`)
  await page.keyboard.up("ArrowRight")
  await page.close()
  failures.push(...errors)
}

for (const size of ["wide", "phone"]) {
  const { page, errors } = await open(size)
  const x = await page.evaluate(async () => {
    const { levels } = await import("./js/levels.js")
    return levels[0].sections.find((section) => section.label === "Turbo").x
  })
  await startAt(page, 0, x + 40)
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(1500)
  await shot(page, `piko-ball-${size}`)
  await page.keyboard.up("ArrowRight")
  await page.close()
  failures.push(...errors)
}

for (const size of ["wide", "phone"]) {
  const { page, errors } = await open(size, "nox")
  await startAt(page, 4, null)
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(900)
  await page.keyboard.down("ShiftLeft")
  await page.waitForTimeout(140)
  await shot(page, `nox-dash-${size}`)
  await page.keyboard.up("ShiftLeft")
  await page.keyboard.up("ArrowRight")
  await page.close()
  failures.push(...errors)
}

const moments = [
  { level: 0, label: "Les pierres", lead: 300 },
  { level: 1, label: "Grande descente", lead: 700, roll: true },
  { level: 2, label: "Premier looping", lead: 1450 },
  { level: 3, label: "Le radeau", lead: 700 },
  { level: 4, label: "Double looping", lead: 1500 },
]
for (const moment of moments) {
  const { page, errors } = await open("wide", moment.level === 4 ? "nox" : "piko")
  const x = await page.evaluate(
    async ({ level, label }) => {
      const { levels } = await import("./js/levels.js")
      return levels[level].sections.find((section) => section.label === label).x
    },
    moment,
  )
  await startAt(page, moment.level, x + 40)
  await page.keyboard.down("ArrowRight")
  if (moment.roll) await page.keyboard.down("ArrowDown")
  await page.waitForTimeout((moment.lead / 260) * 1000)
  await shot(page, `level-${moment.level + 1}`)
  await page.close()
  failures.push(...errors)
}

await browser.close()
server.kill()
if (failures.length) {
  console.error(failures)
  process.exit(1)
}
