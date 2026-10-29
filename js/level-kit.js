// Builds long levels from short, named sections laid out left to right.
// The cursor (x, floor) walks along the ground; every section returns the builder for chaining.
import { GRAVITY, GROUND_TOP, JUMP_VY, PLAYER_H } from "./physics.js"

const BOTTOM = 620
const RUN_SPEED = 260
const RING_LIFT = 44
const RING_STEP = 70

function seeded(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function course({ name, theme, seed = 1 }) {
  const level = {
    name,
    theme,
    width: 0,
    deathY: 700,
    spawn: null,
    blocks: [],
    slopes: [],
    platforms: [],
    movers: [],
    springs: [],
    rings: [],
    blobs: [],
    boosts: [],
    checkpoints: [],
    goal: null,
    loops: [],
    ponds: [],
    gaps: [],
    signs: [],
    decor: [],
    sections: [],
  }
  const random = seeded(seed)
  let x = 0
  let floor = GROUND_TOP

  const standY = () => floor - PLAYER_H / 2
  const ringRow = (x0, x1, y) => {
    for (let at = x0; at <= x1 + 0.01; at += RING_STEP) level.rings.push({ x: Math.round(at), y })
  }
  // Rings along the path of a full-speed jump that leaves the ground at takeOff.
  const jumpRings = (takeOff, groundY, count = 4) => {
    const air = (2 * -JUMP_VY) / GRAVITY
    for (let i = 1; i <= count; i += 1) {
      const t = (air * i) / (count + 1)
      const lift = -JUMP_VY * t - (GRAVITY * t * t) / 2
      level.rings.push({ x: Math.round(takeOff + RUN_SPEED * t), y: Math.round(groundY - PLAYER_H / 2 - lift) })
    }
  }
  const scatter = (x0, x1, top) => {
    for (let at = x0 + 60; at < x1 - 60; at += 120 + random() * 160) {
      const pick = random()
      if (pick < 0.45) level.decor.push({ type: "flower", x: Math.round(at), y: top, tint: Math.floor(random() * 3) })
      else if (pick < 0.65) level.decor.push({ type: "bush", x: Math.round(at), y: top })
      else if (pick < 0.75) level.decor.push({ type: "theme", x: Math.round(at), y: top })
    }
  }

  const kit = {
    get x() {
      return x
    },
    get floor() {
      return floor
    },
    level,
    section(label) {
      level.sections.push({ label, x })
      return kit
    },
    start(length = 900) {
      level.spawn = { x: 200, y: standY() }
      level.checkpoints.push({ x: 200, y: standY() })
      level.signs.push({ type: "right", x: 330, y: floor })
      return kit.ground(length, { rings: false })
    },
    ground(length, { rings = true, decor = true } = {}) {
      level.blocks.push({ x, y: floor, w: length, h: BOTTOM - floor })
      if (rings) ringRow(x + 160, x + length - 160, floor - RING_LIFT)
      if (decor) scatter(x, x + length, floor)
      x += length
      return kit
    },
    gap(width, { rings = true, water = true } = {}) {
      level.gaps.push({ x, w: width, rise: 0 })
      if (water) level.ponds.push({ x, w: width, y: floor + 26 })
      if (rings) jumpRings(x - 40, floor)
      x += width
      return kit
    },
    // Water with flat stepping stones: every hop is a short gap.
    stones(count, { stone = 150, hop = 100 } = {}) {
      const start = x
      for (let i = 0; i < count; i += 1) {
        level.gaps.push({ x, w: hop, rise: 0 })
        jumpRings(x - 40, floor, 3)
        x += hop
        level.blocks.push({ x, y: floor, w: stone, h: BOTTOM - floor })
        x += stone
      }
      level.gaps.push({ x, w: hop, rise: 0 })
      jumpRings(x - 40, floor, 3)
      x += hop
      level.ponds.push({ x: start, w: x - start, y: floor + 26 })
      return kit
    },
    slope(rise, length, { rings = true } = {}) {
      const top = floor - rise
      level.slopes.push({ x, w: length, yLeft: floor, yRight: top })
      if (rings) {
        for (let at = 80; at < length - 40; at += RING_STEP + 10) {
          const t = at / length
          level.rings.push({ x: Math.round(x + at), y: Math.round(floor - rise * t - RING_LIFT) })
        }
      }
      x += length
      floor = top
      return kit
    },
    hill(height, { up = 420, top = 360, down = 420 } = {}) {
      return kit.slope(height, up).ground(top).slope(-height, down)
    },
    drop(depth) {
      floor += depth
      return kit
    },
    checkpoint() {
      level.checkpoints.push({ x: x - 120, y: standY() })
      return kit
    },
    boost(offset = 0, speed = 480) {
      level.boosts.push({ x: x - offset, y: floor - 18, w: 88, h: 18, speed })
      return kit
    },
    blob(offset, range = 110) {
      const at = x - offset
      level.blobs.push({ x: at, y: floor - 22, w: 42, h: 36, vx: 34, minX: at - range, maxX: at + range })
      return kit
    },
    spring(offset, power = 1150) {
      const at = x - offset
      level.springs.push({ x: at, y: floor - 24, w: 40, h: 24, power })
      for (let lift = 110; lift <= 290; lift += 60) level.rings.push({ x: at + 20 + lift / 3, y: floor - lift })
      return kit
    },
    // A spring at the foot of a wall: running into it is enough to reach the top.
    springCliff(height) {
      kit.spring(170)
      floor -= height
      return kit
    },
    sign(type, offset) {
      level.signs.push({ type, x: x - offset, y: floor })
      return kit
    },
    // Optional floating bridges with rings; the ground below stays the main road.
    bridges(count, { height = 84, width = 200, spacing = 340 } = {}) {
      for (let i = 0; i < count; i += 1) {
        const at = x - count * spacing + i * spacing + 60
        const y = floor - height - (i % 2) * 40
        level.platforms.push({ x: at, y, w: width })
        ringRow(at + 40, at + width - 40, y - RING_LIFT)
      }
      return kit
    },
    // Optional lift that carries the player up to a ring ledge and back.
    lift(offset, { rise = 150, width = 120, period = 4.5 } = {}) {
      const at = x - offset
      level.movers.push({ x: at, y: floor - 70, w: width, dx: 0, dy: -rise, period })
      const ledge = { x: at + width + 30, y: floor - 70 - rise, w: 240 }
      level.platforms.push(ledge)
      ringRow(ledge.x + 40, ledge.x + ledge.w - 40, ledge.y - RING_LIFT)
      return kit
    },
    // Optional ferry high above a stepping-stone pond, boarded from a shore ledge.
    // It flies above the jump height so the stones stay the plain road.
    ferry(offset, span, { height = 150, width = 140, period = 6 } = {}) {
      const at = x - offset
      level.platforms.push({ x: at - 300, y: floor - 80, w: 200 })
      level.movers.push({ x: at - 60, y: floor - height, w: width, dx: span, dy: 0, period })
      ringRow(at + 40, at + span + width - 40, floor - height - RING_LIFT)
      return kit
    },
    loop(radius = 112) {
      const cx = x - 360
      const cy = floor - PLAYER_H / 2 - radius
      const loop = { cx, cy, r: radius, minSpeed: 340 }
      level.loops.push(loop)
      for (const angle of [0.35, -0.45, -1.57, -2.5, 2.85]) {
        level.rings.push({
          x: Math.round(cx + Math.cos(angle) * (radius - 6)),
          y: Math.round(cy + Math.sin(angle) * (radius - 6)),
        })
      }
      return kit
    },
    decor(type, offset, extra = {}) {
      level.decor.push({ type, x: x - offset, y: floor, ...extra })
      return kit
    },
    finish(length = 900) {
      kit.ground(length, { rings: false })
      level.goal = { x: x - 300, y: floor - 110, w: 64, h: 110 }
      ringRow(x - length + 120, x - 420, floor - RING_LIFT - 30)
      kit.ground(600, { rings: false })
      level.width = x
      return level
    },
  }
  return kit
}
