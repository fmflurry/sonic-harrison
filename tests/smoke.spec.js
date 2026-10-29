import { expect, test } from "@playwright/test"
import { decodePng } from "../tools/png.js"

function watchErrors(page) {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

const inspect = (page) => page.evaluate(() => globalThis.__piko.inspect())

async function hold(page, key, ms) {
  await page.keyboard.down(key)
  await page.evaluate((wait) => new Promise((resolve) => setTimeout(resolve, wait)), ms)
}

test("the french title and a level load with no console errors", async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Piko Turbo" })).toBeVisible()
  await page.getByRole("button", { name: "Niveaux" }).click()
  for (const name of ["1 · La prairie", "2 · La colline", "3 · Le looping", "4 · La plage", "5 · La nuit étoilée"]) {
    await expect(page.getByRole("button", { name })).toBeVisible()
  }
  await page.getByRole("button", { name: "1 · La prairie" }).click()
  await expect(page.locator("#play-screen")).toBeVisible()
  await expect(page.locator("canvas")).toBeVisible()
  await expect(page.locator("#rings")).toHaveText("Anneaux : 0")
  await expect(page.locator("#level-name")).toHaveText("La prairie")
  await expect.poll(() => page.locator("canvas").evaluate((canvas) => canvas.width)).toBeGreaterThan(100)

  await page.keyboard.down("ArrowRight")
  await page.keyboard.down("Space")
  await page.getByRole("button", { name: "Sauter" }).dispatchEvent("pointerdown")
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)))
  await page.keyboard.up("Space")
  await page.keyboard.up("ArrowRight")
  await page.getByRole("button", { name: "Sauter" }).dispatchEvent("pointerup")

  expect(errors).toEqual([])
})

test("the character choice works by mouse and keyboard and is remembered", async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto("/")
  const piko = page.getByRole("radio", { name: "Piko" })
  const nox = page.getByRole("radio", { name: "Nox" })
  await expect(piko).toHaveAttribute("aria-checked", "true")
  await nox.click()
  await expect(nox).toHaveAttribute("aria-checked", "true")
  await expect(page.locator("#title-screen")).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("piko-turbo.character"))).toBe("nox")

  await page.reload()
  await expect(page.getByRole("radio", { name: "Nox" })).toHaveAttribute("aria-checked", "true")
  await page.getByRole("radio", { name: "Nox" }).focus()
  await page.keyboard.press("ArrowLeft")
  await expect(page.getByRole("radio", { name: "Piko" })).toHaveAttribute("aria-checked", "true")
  await expect(page.getByRole("radio", { name: "Piko" })).toBeFocused()
  expect(errors).toEqual([])
})

test("Piko runs right, curls into a ball with the down arrow and the game uses crisp pixels", async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto("/")
  await page.getByRole("button", { name: "Jouer" }).click()
  await expect(page.locator("#screen")).toBeVisible()
  const start = await inspect(page)
  expect(start.character).toBe("piko")
  expect(start.smoothing).toEqual({ screen: false, buffer: false })

  await hold(page, "ArrowRight", 800)
  const running = await inspect(page)
  expect(running.player.x).toBeGreaterThan(start.player.x + 100)
  expect(running.player.ball).toBe(false)

  await hold(page, "ArrowDown", 250)
  const rolling = await inspect(page)
  expect(rolling.player.ball).toBe(true)
  expect(rolling.player.h).toBeLessThan(start.player.h)
  await page.keyboard.up("ArrowDown")
  await page.keyboard.up("ArrowRight")

  await page.getByRole("button", { name: "Pause" }).click()
  await expect(page.getByRole("heading", { name: "Pause" })).toBeVisible()
  const counts = await page.evaluate(() => {
    const screen = document.querySelector("#screen")
    const count = (canvas) => {
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
      const seen = new Set()
      for (let i = 0; i < data.length; i += 4) seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])
      return seen.size
    }
    const blurred = document.createElement("canvas")
    blurred.width = screen.width
    blurred.height = screen.height
    const ctx = blurred.getContext("2d")
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(screen, 0, 0, screen.width * 0.37, screen.height * 0.37)
    ctx.drawImage(blurred, 0, 0, screen.width * 0.37, screen.height * 0.37, 0, 0, screen.width, screen.height)
    return { crisp: count(screen), blurred: count(blurred) }
  })
  await page.getByRole("button", { name: "Continuer" }).click()
  expect((await inspect(page)).smoothing).toEqual({ screen: false, buffer: false })
  expect(errors).toEqual([])
  expect(counts.crisp).toBeGreaterThan(8)
  expect(counts.crisp).toBeLessThan(120)
  expect(counts.blurred).toBeGreaterThan(counts.crisp * 4)
})

test("the canvas shows the sprite palettes at full strength", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Jouer" }).click()
  await expect(page.locator("#screen")).toBeVisible()
  await hold(page, "ArrowRight", 600)
  await page.keyboard.up("ArrowRight")
  const shot = decodePng(await page.locator("#screen").screenshot())
  const has = (hex) => {
    const value = Number.parseInt(hex.slice(1), 16)
    for (let i = 0; i < shot.data.length; i += 4) {
      if (((shot.data[i] << 16) | (shot.data[i + 1] << 8) | shot.data[i + 2]) === value) return true
    }
    return false
  }
  for (const colour of ["#2f7bff", "#1f4fd0", "#ff3b4e", "#3cb44a", "#d3924a"]) expect(has(colour), colour).toBe(true)
})

test("Nox dashes with Shift and the Eclair button shows its charge", async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto("/")
  await page.getByRole("radio", { name: "Nox" }).click()
  await page.getByRole("button", { name: "Jouer" }).click()
  await expect(page.getByRole("button", { name: "Éclair" })).toBeVisible()
  await hold(page, "ArrowRight", 400)
  await page.keyboard.down("ShiftLeft")
  await expect.poll(async () => (await inspect(page)).player.dashCooldown).toBeGreaterThan(0)
  const dashing = await inspect(page)
  expect(dashing.character).toBe("nox")
  await page.keyboard.up("ShiftLeft")
  await page.keyboard.up("ArrowRight")
  await expect(page.getByRole("button", { name: "Éclair" })).not.toHaveClass(/ready/)
  await expect(page.getByRole("button", { name: "Éclair" })).toHaveClass(/ready/, { timeout: 4000 })
  expect(errors).toEqual([])
})

test("Piko has no Eclair button and nobody needs a Boule button", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Jouer" }).click()
  await expect(page.getByRole("button", { name: "Sauter" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Éclair" })).toBeHidden()
  await expect(page.getByRole("button", { name: "Boule" })).toHaveCount(0)
})

test("a jump curls Piko into a ball in the browser", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Jouer" }).click()
  await expect(page.locator("#screen")).toBeVisible()
  await hold(page, "ArrowRight", 300)
  await page.keyboard.press("Space")
  await expect.poll(async () => (await inspect(page)).player.ball).toBe(true)
  expect((await inspect(page)).player.grounded).toBe(false)
  await page.keyboard.up("ArrowRight")
})

test("pause holds focus, survives a held key and Space presses menu buttons", async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto("/")
  await page.getByRole("radio", { name: "Nox" }).focus()
  await page.keyboard.press("Space")
  await expect(page.getByRole("radio", { name: "Nox" })).toHaveAttribute("aria-checked", "true")
  await page.getByRole("button", { name: "Jouer" }).focus()
  await page.keyboard.press("Space")
  await expect(page.locator("#play-screen")).toBeVisible()

  await hold(page, "ArrowRight", 300)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Pause" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continuer" })).toBeFocused()
  const pausedX = (await inspect(page)).player.x
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)))
  expect((await inspect(page)).player.x).toBe(pausedX)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Pause" })).toBeHidden()
  await expect(page.getByRole("button", { name: "Pause" })).toBeFocused()
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 400)))
  const after = await inspect(page)
  expect(after.player.x).toBeGreaterThan(pausedX + 50)
  expect(after.player.vx).toBeGreaterThan(250)
  await page.keyboard.up("ArrowRight")
  expect(errors).toEqual([])
})
