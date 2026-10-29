import { expect, test } from "@playwright/test"

const landscapes = [
  { width: 1024, height: 470 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
]

async function expectInsideViewport(locator) {
  const count = await locator.count()
  expect(count).toBeGreaterThan(0)
  const boxes = await locator.evaluateAll((elements) => {
    const view = window.visualViewport
    const width = view?.width ?? window.innerWidth
    const height = view?.height ?? window.innerHeight
    return elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        label: element.id || element.getAttribute("aria-label") || element.textContent.trim().slice(0, 32),
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        viewWidth: width,
        viewHeight: height,
      }
    })
  })
  for (const box of boxes) {
    expect(box.width, box.label).toBeGreaterThan(0)
    expect(box.height, box.label).toBeGreaterThan(0)
    expect(box.top, box.label).toBeGreaterThanOrEqual(-1)
    expect(box.left, box.label).toBeGreaterThanOrEqual(-1)
    expect(box.right, box.label).toBeLessThanOrEqual(box.viewWidth + 1)
    expect(box.bottom, box.label).toBeLessThanOrEqual(box.viewHeight + 1)
  }
}

for (const viewport of landscapes) {
  test(`the menu fits and a tap starts the game at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")

    const titleBits = page.locator("#title-screen").locator("h1, p, button, svg")
    await expect(page.getByRole("heading", { name: "Piko Turbo" })).toBeVisible()
    await expectInsideViewport(titleBits)

    await page.locator("#title-screen .for").click()
    await expect(page.locator("#play-screen")).toBeVisible()
    await expect(page.locator("canvas")).toBeVisible()
    await expectInsideViewport(page.locator("#play-screen").locator("canvas, #touch button, #hud span"))
    await expect(page.getByRole("button", { name: "Gauche" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Droite" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Sauter" })).toBeVisible()
  })
}

test("a resize keeps the title and the touch buttons inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 470 })
  await page.goto("/")
  await page.setViewportSize({ width: 667, height: 375 })
  await expectInsideViewport(page.locator("#title-screen").locator("h1, p, button, svg"))
  await page.locator("h1").click()
  await expect(page.locator("canvas")).toBeVisible()
  await page.setViewportSize({ width: 844, height: 390 })
  await expectInsideViewport(page.locator("#play-screen").locator("canvas, #touch button, #hud span"))
})
