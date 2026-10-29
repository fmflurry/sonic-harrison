import { GROUND_TOP, STAND_Y } from "./physics.js"

const DIRT = 540 - GROUND_TOP

function block(x, w, top = GROUND_TOP) {
  return { x, y: top, w, h: top === GROUND_TOP ? DIRT : 540 - top }
}

function pad(x, speed = 470) {
  return { x, y: GROUND_TOP - 18, w: 88, h: 18, speed }
}

function blob(x, minX, maxX) {
  return { x, y: GROUND_TOP - 22, w: 42, h: 36, vx: 42, minX, maxX }
}

function row(x0, x1, step, y) {
  const rings = []
  for (let x = x0; x <= x1 + 0.01; x += step) rings.push({ x, y })
  return rings
}

function arc(x0, x1, y, lift) {
  return [0.2, 0.45, 0.7].map((t) => ({
    x: x0 + (x1 - x0) * t,
    y: y - Math.sin(t * Math.PI) * lift,
  }))
}

function loopRings(loop) {
  return [0.35, -0.45, -1.57, -2.5, 2.85].map((angle) => ({
    x: loop.cx + Math.cos(angle) * (loop.r - 6),
    y: loop.cy + Math.sin(angle) * (loop.r - 6),
  }))
}

const loop = { cx: 1080, cy: STAND_Y - 112, r: 112, minSpeed: 340 }

export const levels = [
  {
    name: "La prairie",
    width: 3000,
    deathY: 700,
    spawn: { x: 400, y: STAND_Y },
    blocks: [block(0, 1020), block(1100, 600), block(2660, 340)],
    slopes: [
      { x: 1700, w: 300, yLeft: GROUND_TOP, yRight: 348 },
      { x: 2000, w: 360, yLeft: 348, yRight: 348 },
      { x: 2360, w: 300, yLeft: 348, yRight: GROUND_TOP },
    ],
    rings: [
      ...row(560, 900, 170, GROUND_TOP - 70),
      ...arc(1000, 1140, GROUND_TOP - 64, 64),
      ...row(1240, 1600, 180, GROUND_TOP - 70),
      ...row(2060, 2280, 110, 348 - 52),
      ...row(2720, 2840, 60, GROUND_TOP - 110),
    ],
    blobs: [],
    boosts: [pad(2740)],
    checkpoints: [
      { x: 400, y: STAND_Y },
      { x: 1260, y: STAND_Y },
    ],
    goal: { x: 2880, y: GROUND_TOP - 110, w: 64, h: 110 },
    loop: null,
    ponds: [{ x: 1020, w: 80 }],
    decor: [
      { type: "cloud", x: 180, y: 90, s: 1 },
      { type: "cloud", x: 760, y: 60, s: 1.3 },
      { type: "cloud", x: 1500, y: 100, s: 0.9 },
      { type: "cloud", x: 2300, y: 70, s: 1.2 },
      { type: "bush", x: 520, y: GROUND_TOP },
      { type: "bush", x: 1500, y: GROUND_TOP },
      { type: "flower", x: 360, y: GROUND_TOP, color: 0xff5d8f },
      { type: "flower", x: 640, y: GROUND_TOP, color: 0xffd23f },
      { type: "flower", x: 860, y: GROUND_TOP, color: 0xb388ff },
      { type: "flower", x: 1400, y: GROUND_TOP, color: 0xffffff },
    ],
  },
  {
    name: "La colline",
    width: 3600,
    deathY: 700,
    spawn: { x: 400, y: STAND_Y },
    blocks: [block(0, 640), block(1260, 500), block(1880, 600), block(2940, 660)],
    slopes: [
      { x: 640, w: 300, yLeft: GROUND_TOP, yRight: 380 },
      { x: 940, w: 320, yLeft: 380, yRight: GROUND_TOP },
      { x: 2480, w: 240, yLeft: GROUND_TOP, yRight: 330 },
      { x: 2720, w: 220, yLeft: 330, yRight: GROUND_TOP },
    ],
    rings: [
      ...row(380, 560, 90, GROUND_TOP - 72),
      ...row(780, 1120, 110, 340),
      ...arc(1740, 1980, GROUND_TOP - 64, 80),
      ...row(2140, 2400, 130, GROUND_TOP - 70),
      ...row(3080, 3320, 120, GROUND_TOP - 70),
    ],
    blobs: [blob(1480, 1400, 1600)],
    boosts: [pad(1680)],
    checkpoints: [
      { x: 400, y: STAND_Y },
      { x: 1300, y: STAND_Y },
      { x: 2140, y: STAND_Y },
    ],
    goal: { x: 3440, y: GROUND_TOP - 110, w: 64, h: 110 },
    loop: null,
    ponds: [{ x: 1760, w: 120 }],
    decor: [
      { type: "cloud", x: 240, y: 80, s: 1.1 },
      { type: "cloud", x: 1100, y: 50, s: 1.4 },
      { type: "cloud", x: 2100, y: 90, s: 1 },
      { type: "cloud", x: 3000, y: 64, s: 1.2 },
      { type: "bush", x: 480, y: GROUND_TOP },
      { type: "flower", x: 340, y: GROUND_TOP, color: 0xff5d8f },
      { type: "flower", x: 2100, y: GROUND_TOP, color: 0x7bedff },
      { type: "flower", x: 3040, y: GROUND_TOP, color: 0xffd23f },
    ],
  },
  {
    name: "Le looping",
    width: 3200,
    deathY: 700,
    spawn: { x: 400, y: STAND_Y },
    blocks: [block(0, 3200)],
    slopes: [],
    rings: [
      ...row(380, 620, 120, GROUND_TOP - 70),
      ...loopRings(loop),
      ...row(1560, 1800, 120, GROUND_TOP - 80),
      ...row(2480, 2720, 120, GROUND_TOP - 70),
    ],
    blobs: [blob(2100, 2000, 2220)],
    boosts: [pad(760, 520)],
    checkpoints: [
      { x: 400, y: STAND_Y },
      { x: 1560, y: STAND_Y },
      { x: 2360, y: STAND_Y },
    ],
    goal: { x: 3040, y: GROUND_TOP - 110, w: 64, h: 110 },
    loop,
    ponds: [],
    decor: [
      { type: "cloud", x: 200, y: 70, s: 1.2 },
      { type: "cloud", x: 1680, y: 56, s: 1.3 },
      { type: "cloud", x: 2500, y: 96, s: 1 },
      { type: "flower", x: 360, y: GROUND_TOP, color: 0xff5d8f },
      { type: "flower", x: 1680, y: GROUND_TOP, color: 0xffd23f },
      { type: "flower", x: 2600, y: GROUND_TOP, color: 0xb388ff },
      { type: "bush", x: 560, y: GROUND_TOP },
    ],
  },
]
