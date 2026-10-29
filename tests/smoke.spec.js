import { expect, test } from "@playwright/test"

test("the french title and a level load with no console errors", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Piko Turbo" })).toBeVisible()
  await page.getByRole("button", { name: "Niveaux" }).click()
  await expect(page.getByRole("button", { name: "1 · La prairie" })).toBeVisible()
  await expect(page.getByRole("button", { name: "2 · La colline" })).toBeVisible()
  await expect(page.getByRole("button", { name: "3 · Le looping" })).toBeVisible()
  await page.getByRole("button", { name: "1 · La prairie" }).click()
  await expect(page.locator("#play-screen")).toBeVisible()
  await expect(page.locator("canvas")).toBeVisible()
  await expect(page.locator("#rings")).toHaveText("Anneaux : 0")
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
