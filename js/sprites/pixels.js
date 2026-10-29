// Pixel art helpers shared by the game (browser) and tools/ (Node).
// A sprite is an array of equal-length strings, one character per pixel.
// "." is transparent; any other character is looked up in a palette of "#rrggbb" colours.

export const CLEAR = "."
// A soft outline pixel becomes "o" only where nothing is painted yet, so limb outlines never cut into a body.
export const SOFT_OUTLINE = "q"

export function size(rows) {
  return { width: rows[0]?.length ?? 0, height: rows.length }
}

export function checkRows(rows, label = "sprite") {
  const { width } = size(rows)
  rows.forEach((row, index) => {
    if (row.length !== width) throw new Error(`${label}: row ${index} is ${row.length} wide, expected ${width}`)
  })
  return rows
}

export function blank(width, height) {
  return Array.from({ length: height }, () => CLEAR.repeat(width))
}

export function flipRows(rows) {
  return rows.map((row) => [...row].reverse().join(""))
}

// Quarter turns clockwise. Exact for pixel grids, so a spin needs one drawing per 90 degrees.
export function rotateRows(rows, quarterTurns) {
  let out = rows
  for (let turn = 0; turn < ((quarterTurns % 4) + 4) % 4; turn += 1) {
    const { width, height } = size(out)
    const next = []
    for (let x = 0; x < width; x += 1) {
      let line = ""
      for (let y = height - 1; y >= 0; y -= 1) line += out[y][x]
      next.push(line)
    }
    out = next
  }
  return out
}

// Paints layers in order onto a width x height grid. Each layer is { rows, x, y, flip }.
export function compose(width, height, layers) {
  const grid = blank(width, height).map((row) => [...row])
  for (const layer of layers) {
    if (!layer) continue
    const rows = layer.flip ? flipRows(layer.rows) : layer.rows
    rows.forEach((row, dy) => {
      const y = layer.y + dy
      if (y < 0 || y >= height) return
      for (let dx = 0; dx < row.length; dx += 1) {
        const x = layer.x + dx
        if (x < 0 || x >= width || row[dx] === CLEAR) continue
        if (row[dx] === SOFT_OUTLINE) {
          if (grid[y][x] === CLEAR) grid[y][x] = "o"
          continue
        }
        grid[y][x] = row[dx]
      }
    })
  }
  return grid.map((row) => row.join(""))
}

// Swaps characters, e.g. to recolour a shared part for another character.
export function swapChars(rows, mapping) {
  return rows.map((row) => [...row].map((char) => mapping[char] ?? char).join(""))
}

export function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function rasterize(rows, palette) {
  const { width, height } = size(rows)
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const char = rows[y][x]
      if (char === CLEAR) continue
      const hex = palette[char]
      if (!hex) throw new Error(`no colour for "${char}" at ${x},${y}`)
      const [r, g, b] = hexToRgb(hex)
      const at = (y * width + x) * 4
      data[at] = r
      data[at + 1] = g
      data[at + 2] = b
      data[at + 3] = 255
    }
  }
  return { width, height, data }
}
