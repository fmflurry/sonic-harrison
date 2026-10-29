// Turns pixel data into canvases once, so the frame loop only copies finished images.
import { hexToRgb, rasterize } from "./sprites/pixels.js"
import { ANIMATIONS } from "./sprites/hero.js"
import { NOX } from "./sprites/nox.js"
import { PIKO } from "./sprites/piko.js"
import { BLOB, BOOST, DECOR, FLAG, GOAL, PLATFORM, POP, RING, SIGNS, SPRING, TILES } from "./sprites/world.js"
import { THEMES } from "./themes.js"

export const ART = 2
export const ART_W = 480
export const ART_H = 270
const CHUNK = 256
const LAYER_W = 512

export function makeCanvas(width, height) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false
  return canvas
}

export function spriteCanvas(rows, palette) {
  const raster = rasterize(rows, palette)
  const canvas = makeCanvas(raster.width, raster.height)
  canvas.getContext("2d").putImageData(new ImageData(raster.data, raster.width, raster.height), 0, 0)
  return canvas
}

function framesOf(sprite) {
  return sprite.frames.map((rows) => spriteCanvas(rows, sprite.palette))
}

function heroCanvases(hero) {
  const frames = {}
  for (const [name, rows] of Object.entries(hero.frames)) frames[name] = spriteCanvas(rows, hero.palette)
  frames.runCycle = ANIMATIONS.run.map((name) => frames[name])
  frames.ballCycle = ANIMATIONS.ball.map((name) => frames[name])
  return frames
}

let shared = null

export function sharedArt() {
  if (shared) return shared
  shared = {
    heroes: { piko: heroCanvases(PIKO), nox: heroCanvases(NOX) },
    ring: framesOf(RING),
    blob: framesOf(BLOB),
    pop: framesOf(POP),
    boost: framesOf(BOOST),
    spring: framesOf(SPRING),
    goal: spriteCanvas(GOAL.rows, GOAL.palette),
    flagPole: {
      waiting: spriteCanvas(FLAG.pole, FLAG.palettes.waiting),
      reached: spriteCanvas(FLAG.pole, FLAG.palettes.reached),
    },
    flagCloth: {
      waiting: FLAG.cloth.map((rows) => spriteCanvas(rows, FLAG.palettes.waiting)),
      reached: FLAG.cloth.map((rows) => spriteCanvas(rows, FLAG.palettes.reached)),
    },
    signs: {
      right: spriteCanvas(SIGNS.right, SIGNS.palette),
      roll: spriteCanvas(SIGNS.roll, SIGNS.palette),
      jump: spriteCanvas(SIGNS.jump, SIGNS.palette),
    },
    bridge: spriteCanvas(PLATFORM.bridge, PLATFORM.palette),
    mover: spriteCanvas(PLATFORM.mover, PLATFORM.palette),
    cloud: spriteCanvas(DECOR.cloud, DECOR.palette),
    cloudSmall: spriteCanvas(DECOR.cloudSmall, DECOR.palette),
    bush: spriteCanvas(DECOR.bush, DECOR.palette),
    palm: spriteCanvas(DECOR.palm, DECOR.palette),
    crystal: spriteCanvas(DECOR.crystal, DECOR.palette),
    rock: spriteCanvas(DECOR.rock, DECOR.palette),
    shell: spriteCanvas(DECOR.shell, DECOR.palette),
    twinkle: spriteCanvas(DECOR.twinkle, DECOR.palette),
  }
  return shared
}

function fillBands(ctx, colours, height) {
  const band = Math.ceil(height / colours.length)
  colours.forEach((colour, index) => {
    ctx.fillStyle = colour
    ctx.fillRect(0, index * band, ART_W, band)
  })
}

function starField(ctx, width, height, seed) {
  let value = seed
  const random = () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
  for (let i = 0; i < 70; i += 1) {
    const x = Math.floor(random() * width)
    const y = Math.floor(random() * height)
    ctx.fillStyle = random() < 0.3 ? "#fff3a0" : "#ffffff"
    ctx.fillRect(x, y, 1, 1)
  }
}

function hillLayer(layer) {
  const canvas = makeCanvas(LAYER_W, ART_H)
  const ctx = canvas.getContext("2d")
  for (let x = 0; x < LAYER_W; x += 1) {
    const phase = (x / LAYER_W) * Math.PI * 2
    const turns = Math.max(1, Math.round((LAYER_W * layer.wave) / (Math.PI * 2)))
    const height =
      layer.base / ART -
      Math.round(layer.amp / ART + (Math.sin(phase * turns) * layer.amp) / ART + (Math.sin(phase * turns * 3 + 1) * layer.amp) / (ART * 4))
    ctx.fillStyle = layer.top
    ctx.fillRect(x, height, 1, 2)
    ctx.fillStyle = layer.body
    ctx.fillRect(x, height + 2, 1, ART_H - height)
    ctx.fillStyle = layer.top
    for (let y = height + 4 + (x % 2); y < height + 9; y += 2) ctx.fillRect(x, y, 1, 1)
    if (!layer.sea && x % 32 < 3) {
      ctx.fillStyle = layer.top
      ctx.fillRect(x, height + 14 + ((x >> 5) % 3) * 9, 1, 6)
    }
    if (layer.sea && x % 9 === 0) {
      ctx.fillStyle = layer.top
      ctx.fillRect(x, height + 6 + (x % 4), 3, 1)
    }
  }
  return canvas
}

function loopCanvas(loop, theme) {
  const outer = Math.round((loop.r + 24) / ART) + 6
  const inner = Math.round((loop.r + 24) / ART)
  const size = outer * 2 + 2
  const canvas = makeCanvas(size, size)
  const ctx = canvas.getContext("2d")
  const image = ctx.createImageData(size, size)
  const colours = Object.fromEntries(Object.entries(theme.loop).map(([key, hex]) => [key, hexToRgb(hex)]))
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - size / 2
      const dy = y + 0.5 - size / 2
      const distance = Math.hypot(dx, dy)
      if (distance < inner - 1 || distance > outer) continue
      const segment = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 24)
      let colour = segment % 2 === 0 ? colours.a : colours.b
      if (distance < inner) colour = colours.light
      else if (distance > outer - 1) colour = colours.dark
      const at = (y * size + x) * 4
      image.data.set([...colour, 255], at)
    }
  }
  ctx.putImageData(image, 0, 0)
  return { canvas, half: size / 2 }
}

// ImageData is RGBA in memory; a little-endian Uint32 view reads it as ABGR.
function packed(hex) {
  const [r, g, b] = hexToRgb(hex)
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

// Highest ground (smallest y) under one art column, or Infinity.
function surfaceAt(level, worldX) {
  let top = Infinity
  for (const block of level.blocks) {
    if (worldX >= block.x && worldX < block.x + block.w) top = Math.min(top, block.y)
  }
  for (const slope of level.slopes) {
    if (worldX < slope.x || worldX >= slope.x + slope.w) continue
    const t = (worldX - slope.x) / slope.w
    top = Math.min(top, slope.yLeft + (slope.yRight - slope.yLeft) * t)
  }
  return top
}

function terrainChunk(level, theme, index) {
  const canvas = makeCanvas(CHUNK, ART_H)
  const ctx = canvas.getContext("2d")
  const image = ctx.createImageData(CHUNK, ART_H)
  const pixels = new Uint32Array(image.data.buffer)
  const colours = Object.fromEntries(Object.entries(theme.tiles).map(([key, hex]) => [key, packed(hex)]))
  const edge = packed(theme.edge)
  const tops = new Float64Array(CHUNK + 2)
  for (let x = -1; x <= CHUNK; x += 1) tops[x + 1] = surfaceAt(level, (index * CHUNK + x) * ART + 1) / ART
  for (let x = 0; x < CHUNK; x += 1) {
    const top = Math.round(tops[x + 1])
    if (!Number.isFinite(top)) continue
    const worldX = index * CHUNK + x
    const leftTop = tops[x]
    const rightTop = tops[x + 2]
    for (let y = Math.max(0, top); y < ART_H; y += 1) {
      const depth = y - top
      const char =
        depth < TILES.grass.length
          ? TILES.grass[depth][worldX % 16]
          : TILES.soil[(y - TILES.grass.length) % 16][worldX % 16]
      const exposed = (!Number.isFinite(leftTop) || leftTop > y + 0.5) || (!Number.isFinite(rightTop) || rightTop > y + 0.5)
      pixels[y * CHUNK + x] = exposed && depth >= 2 ? edge : colours[char]
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export function levelArt(level) {
  const theme = THEMES[level.theme] ?? THEMES.meadow
  const sky = makeCanvas(ART_W, ART_H)
  const skyCtx = sky.getContext("2d")
  fillBands(skyCtx, theme.sky, ART_H)
  if (theme.stars) starField(skyCtx, ART_W, 170, 7)
  const flowerColours = theme.flowers.map((colour) =>
    spriteCanvas(DECOR.flower, { ...DECOR.palette, f: colour, F: colour, y: "#fff3a0" }),
  )
  const chunks = new Map()
  return {
    theme,
    sky,
    far: hillLayer(theme.far),
    near: hillLayer(theme.near),
    loops: level.loops.map((loop) => loopCanvas(loop, theme)),
    flowers: flowerColours,
    chunkWidth: CHUNK,
    chunkCount: Math.ceil(level.width / ART / CHUNK),
    chunk(index) {
      if (!chunks.has(index)) chunks.set(index, terrainChunk(level, theme, index))
      return chunks.get(index)
    },
  }
}
