// Hero frame builder shared by Piko and Nox. A character brings its own body, eye patches, ball
// drawings and palette; the poses below (feet, legs, arms per frame) are common to both.
import { SOFT_OUTLINE, blank, compose, rotateRows } from "./pixels.js"

export const FRAME = 32

const SHOE = [
  "..oooo...",
  ".orrWWo..",
  "orrrrrroo",
  "oRRRRRRRo",
  ".ooooooo.",
]

const BACK_SHOE = [
  "..oooo...",
  ".oRRWWo..",
  "oRRRRRRoo",
  "oRRRRRRRo",
  ".ooooooo.",
]

const HAND = [".oo.", "occo", "occo", ".oo."]

const BODY_AT = { x: 3, y: 5 }
const EYE_AT = { x: 15, y: 5 }
const HIP_BACK = { x: 13, y: 23 }
const HIP_FRONT = { x: 16, y: 23 }
const SHOULDER_BACK = { x: 12, y: 18 }
const SHOULDER_FRONT = { x: 16, y: 19 }

function thickLine(x0, y0, x1, y1, char) {
  const grid = blank(FRAME, FRAME).map((row) => [...row])
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps)
    const y = Math.round(y0 + ((y1 - y0) * i) / steps)
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
    ]) {
      if (grid[y + dy]?.[x + dx] !== undefined) grid[y + dy][x + dx] = char
    }
  }
  return outline(grid.map((row) => row.join("")), SOFT_OUTLINE)
}

export function outline(rows, edge = "o") {
  return rows.map((row, y) =>
    [...row]
      .map((char, x) => {
        if (char !== ".") return char
        const near = [rows[y - 1]?.[x], rows[y + 1]?.[x], row[x - 1], row[x + 1]]
        return near.some((value) => value && value !== "." && value !== edge) ? edge : "."
      })
      .join(""),
  )
}

function leg(hip, foot, back) {
  const shoe = back ? BACK_SHOE : SHOE
  return [
    { rows: thickLine(hip.x, hip.y, foot.x + 3, foot.y + 1, back ? "D" : "B"), x: 0, y: 0 },
    { rows: shoe, x: foot.x, y: foot.y },
  ]
}

function arm(shoulder, hand, back) {
  return [
    { rows: thickLine(shoulder.x, shoulder.y, hand.x + 1, hand.y + 1, back ? "D" : "B"), x: 0, y: 0 },
    { rows: HAND, x: hand.x, y: hand.y },
  ]
}

function shift(point, dx, dy) {
  return { x: point.x + dx, y: point.y + dy }
}

// Each pose: eyes, body offset, feet (shoe top-left) and hands (top-left), back limb first.
const STAND_BACK_FOOT = { x: 9, y: 27 }
const STAND_FRONT_FOOT = { x: 15, y: 27 }

function standing(eyes, extra = {}) {
  return {
    eyes,
    dx: 0,
    dy: 0,
    backFoot: STAND_BACK_FOOT,
    frontFoot: STAND_FRONT_FOOT,
    backHand: { x: 8, y: 20 },
    frontHand: { x: 18, y: 21 },
    ...extra,
  }
}

const RUN_FOOT_X = [7, 4, 0, -4, -6, -3, 2, 5]
const RUN_FOOT_LIFT = [0, 0, 0, 0, -1, -3, -3, -1]
const RUN_BOB = [0, -1, -1, 0, 0, -1, -1, 0]

function runPose(index) {
  const front = index
  const back = (index + 4) % 8
  const bob = RUN_BOB[index]
  return {
    eyes: "open",
    dx: 1,
    dy: bob,
    backFoot: { x: 11 + RUN_FOOT_X[back], y: 27 + RUN_FOOT_LIFT[back] },
    frontFoot: { x: 12 + RUN_FOOT_X[front], y: 27 + RUN_FOOT_LIFT[front] },
    backHand: { x: 13 - RUN_FOOT_X[front], y: 19 + bob },
    frontHand: { x: 15 - RUN_FOOT_X[back], y: 20 + bob },
  }
}

export const POSES = {
  idle0: standing("open"),
  idle1: standing("blink"),
  run0: runPose(0),
  run1: runPose(1),
  run2: runPose(2),
  run3: runPose(3),
  run4: runPose(4),
  run5: runPose(5),
  run6: runPose(6),
  run7: runPose(7),
  rise: {
    eyes: "open",
    armsUp: true,
    dx: 0,
    dy: -2,
    backFoot: { x: 8, y: 24 },
    frontFoot: { x: 15, y: 25 },
    backHand: { x: 1, y: 9 },
    frontHand: { x: 27, y: 8 },
  },
  fall: {
    eyes: "open",
    armsUp: true,
    dx: 0,
    dy: -1,
    backFoot: { x: 6, y: 27 },
    frontFoot: { x: 18, y: 26 },
    backHand: { x: 0, y: 13 },
    frontHand: { x: 27, y: 13 },
  },
  brake: {
    eyes: "open",
    dx: -2,
    dy: 0,
    backFoot: { x: 5, y: 27 },
    frontFoot: { x: 21, y: 27 },
    backHand: { x: 4, y: 18 },
    frontHand: { x: 8, y: 21 },
  },
  hurt: {
    eyes: "hurt",
    armsUp: true,
    dx: 0,
    dy: -1,
    backFoot: { x: 5, y: 26 },
    frontFoot: { x: 19, y: 26 },
    backHand: { x: 0, y: 6 },
    frontHand: { x: 27, y: 5 },
  },
  cheer0: standing("happy", { armsUp: true, backHand: { x: 7, y: 21 }, frontHand: { x: 26, y: 4 } }),
  cheer1: standing("happy", {
    armsUp: true,
    dy: -2,
    backFoot: { x: 9, y: 25 },
    frontFoot: { x: 15, y: 25 },
    backHand: { x: 0, y: 4 },
    frontHand: { x: 27, y: 2 },
  }),
}

function buildPose(character, pose) {
  const body = { x: BODY_AT.x + pose.dx, y: BODY_AT.y + pose.dy }
  const lift = (point) => shift(point, pose.dx, pose.dy)
  const frontArm = arm(lift(SHOULDER_FRONT), pose.frontHand, false)
  return compose(FRAME, FRAME, [
    ...arm(lift(SHOULDER_BACK), pose.backHand, true),
    ...(pose.armsUp ? frontArm : []),
    ...leg(lift(HIP_BACK), pose.backFoot, true),
    { rows: character.body, x: body.x, y: body.y },
    { rows: character.eyes[pose.eyes], x: body.x + EYE_AT.x - BODY_AT.x, y: body.y + EYE_AT.y - BODY_AT.y },
    ...(character.extras?.(pose, body) ?? []),
    ...leg(lift(HIP_FRONT), pose.frontFoot, false),
    ...(pose.armsUp ? [] : frontArm),
  ])
}

// Two hand-drawn ball angles (0 and 45 degrees) turned by quarter turns give eight spin frames.
function ballFrames(character) {
  const frames = []
  for (let turn = 0; turn < 4; turn += 1) {
    for (const drawing of character.balls) {
      const rows = rotateRows(drawing, turn)
      const x = Math.floor((FRAME - rows[0].length) / 2)
      frames.push(compose(FRAME, FRAME, [{ rows, x, y: FRAME - rows.length }]))
    }
  }
  return frames
}

export function buildHeroFrames(character) {
  const frames = {}
  for (const [name, pose] of Object.entries(POSES)) frames[name] = buildPose(character, pose)
  ballFrames(character).forEach((rows, index) => {
    frames[`ball${index}`] = rows
  })
  return frames
}

export const ANIMATIONS = {
  run: ["run0", "run1", "run2", "run3", "run4", "run5", "run6", "run7"],
  ball: ["ball0", "ball1", "ball2", "ball3", "ball4", "ball5", "ball6", "ball7"],
}
