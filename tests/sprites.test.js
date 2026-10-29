import assert from "node:assert/strict"
import { readdirSync, statSync } from "node:fs"
import { test } from "node:test"
import { FRAME, POSES } from "../js/sprites/hero.js"
import { NOX } from "../js/sprites/nox.js"
import { PIKO } from "../js/sprites/piko.js"
import { CLEAR, rasterize, rotateRows } from "../js/sprites/pixels.js"
import * as world from "../js/sprites/world.js"

const MAX_SPRITE_BYTES = 300 * 1024

for (const hero of [PIKO, NOX]) {
  test(`${hero.name} has every pose and eight ball frames, all 32x32 and in palette`, () => {
    for (const name of Object.keys(POSES)) assert.ok(hero.frames[name], name)
    for (let i = 0; i < 8; i += 1) assert.ok(hero.frames[`ball${i}`], `ball${i}`)
    for (const [name, rows] of Object.entries(hero.frames)) {
      assert.equal(rows.length, FRAME, name)
      for (const row of rows) assert.equal(row.length, FRAME, name)
      assert.doesNotThrow(() => rasterize(rows, hero.palette), name)
    }
  })

  test(`${hero.name} run cycle has eight different frames`, () => {
    const runs = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((i) => hero.frames[`run${i}`].join("\n")))
    assert.equal(runs.size, 8)
  })
}

test("Piko and Nox are drawn differently, not just recoloured", () => {
  const shape = (rows) => rows.map((row) => row.replace(/[^.]/g, "#")).join("\n")
  assert.notEqual(shape(PIKO.frames.idle0), shape(NOX.frames.idle0))
})

test("four quarter turns bring a sprite back to itself", () => {
  const rows = ["ab.", "..c"]
  assert.deepEqual(rotateRows(rows, 4), rows)
  assert.deepEqual(rotateRows(rows, 1), [".a", ".b", "c."])
})

function eachSprite(value, visit, path = "world") {
  if (Array.isArray(value) && typeof value[0] === "string") return visit(value, path)
  if (Array.isArray(value)) return value.forEach((item, index) => eachSprite(item, visit, `${path}[${index}]`))
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key !== "palette" && key !== "palettes") eachSprite(item, visit, `${path}.${key}`)
    }
  }
}

test("world sprites have straight rows and colours for every pixel", () => {
  for (const [name, sprite] of Object.entries(world)) {
    if (name === "TILES") continue
    const palettes = sprite.palettes ? Object.values(sprite.palettes) : [sprite.palette]
    eachSprite(sprite, (rows, path) => {
      const width = rows[0].length
      for (const row of rows) assert.equal(row.length, width, path)
      for (const palette of palettes) {
        for (const row of rows) for (const char of row) if (char !== CLEAR) assert.ok(palette[char], `${path} "${char}"`)
      }
    }, name)
  }
})

test("terrain tiles are 16 pixels wide", () => {
  for (const row of [...world.TILES.grass, ...world.TILES.soil]) assert.equal(row.length, 16)
  assert.equal(world.TILES.soil.length, 16)
})

test("all sprite data stays under 300 KB", () => {
  const folder = new URL("../js/sprites/", import.meta.url)
  const bytes = readdirSync(folder).reduce((sum, file) => sum + statSync(new URL(file, folder)).size, 0)
  assert.ok(bytes < MAX_SPRITE_BYTES, `${bytes} bytes`)
})
