// Renders the committed sprite data to PNG sheets for review: node tools/render-sprites.mjs
// Output: docs/sprites/sprite-sheet.png (every sprite at x2) and docs/sprites/heroes-x6.png.
import { mkdirSync, writeFileSync } from "node:fs"
import { NOX } from "../js/sprites/nox.js"
import { PIKO } from "../js/sprites/piko.js"
import { rasterize } from "../js/sprites/pixels.js"
import { BLOB, BOOST, DECOR, FLAG, GOAL, PLATFORM, POP, RING, SIGNS, SPRING } from "../js/sprites/world.js"
import { encodePng } from "./png.js"

const BACKDROP = [155, 224, 168, 255]
const ROW_GAP = 4

function sheet(rows, scale) {
  const tiles = rows.map((row) => row.map(([sprite, palette]) => rasterize(sprite, palette)))
  const width = Math.max(...tiles.map((row) => row.reduce((sum, tile) => sum + tile.width + ROW_GAP, ROW_GAP)))
  const height = tiles.reduce((sum, row) => sum + Math.max(...row.map((tile) => tile.height)) + ROW_GAP, ROW_GAP)
  const data = new Uint8ClampedArray(width * scale * height * scale * 4)
  for (let i = 0; i < data.length; i += 4) data.set(BACKDROP, i)
  let top = ROW_GAP
  for (const row of tiles) {
    let left = ROW_GAP
    for (const tile of row) {
      for (let y = 0; y < tile.height * scale; y += 1) {
        for (let x = 0; x < tile.width * scale; x += 1) {
          const from = (Math.floor(y / scale) * tile.width + Math.floor(x / scale)) * 4
          if (!tile.data[from + 3]) continue
          data.set(tile.data.subarray(from, from + 4), ((top * scale + y) * width * scale + left * scale + x) * 4)
        }
      }
      left += tile.width + ROW_GAP
    }
    top += Math.max(...row.map((tile) => tile.height)) + ROW_GAP
  }
  return encodePng({ width: width * scale, height: height * scale, data })
}

function heroRows(hero) {
  const names = Object.keys(hero.frames)
  const poses = names.filter((name) => !name.startsWith("ball"))
  const balls = names.filter((name) => name.startsWith("ball"))
  const pick = (list) => list.map((name) => [hero.frames[name], hero.palette])
  return [pick(poses.slice(0, 8)), pick(poses.slice(8)), pick(balls)]
}

const worldRows = [
  [...RING.frames.map((rows) => [rows, RING.palette]), ...BLOB.frames.map((rows) => [rows, BLOB.palette]), ...POP.frames.map((rows) => [rows, POP.palette])],
  [...SPRING.frames.map((rows) => [rows, SPRING.palette]), ...BOOST.frames.map((rows) => [rows, BOOST.palette])],
  [
    [FLAG.pole, FLAG.palettes.waiting],
    ...FLAG.cloth.map((rows) => [rows, FLAG.palettes.waiting]),
    [FLAG.pole, FLAG.palettes.reached],
    ...FLAG.cloth.map((rows) => [rows, FLAG.palettes.reached]),
    [GOAL.rows, GOAL.palette],
    [SIGNS.right, SIGNS.palette],
    [SIGNS.roll, SIGNS.palette],
    [SIGNS.jump, SIGNS.palette],
  ],
  [
    [DECOR.cloud, DECOR.palette],
    [DECOR.cloudSmall, DECOR.palette],
    [DECOR.bush, DECOR.palette],
    [DECOR.flower, DECOR.palette],
    [DECOR.palm, DECOR.palette],
    [DECOR.crystal, DECOR.palette],
    [DECOR.rock, DECOR.palette],
    [DECOR.shell, DECOR.palette],
    [PLATFORM.bridge, PLATFORM.palette],
    [PLATFORM.mover, PLATFORM.palette],
  ],
]

mkdirSync("docs/sprites", { recursive: true })
writeFileSync("docs/sprites/sprite-sheet.png", sheet([...heroRows(PIKO), ...heroRows(NOX), ...worldRows], 2))
writeFileSync("docs/sprites/heroes-x6.png", sheet([...heroRows(PIKO), ...heroRows(NOX)], 6))
console.log("wrote docs/sprites/sprite-sheet.png and docs/sprites/heroes-x6.png")
