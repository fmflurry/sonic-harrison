import { GROUND_TOP, VIEW_W } from "./physics.js"

export function cameraX(focusX, levelWidth) {
  const max = Math.max(0, levelWidth - VIEW_W)
  return Math.min(max, Math.max(0, focusX - 340))
}

function mixByte(start, end, t) {
  return Math.round(start + (end - start) * t)
}

function drawSky(g) {
  const steps = 32
  const band = 420 / steps
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1)
    const color =
      (mixByte(0x69, 0xe7, t) << 16) + (mixByte(0xc8, 0xfb, t) << 8) + mixByte(0xff, 0xff, t)
    g.fillStyle(color, 1)
    g.fillRect(0, i * band, VIEW_W, band + 1)
  }
  g.fillStyle(0xe7fbff, 1)
  g.fillRect(0, 420, VIEW_W, 120)
}

function drawHills(g, camX) {
  g.fillStyle(0xd7f8bf, 1)
  g.beginPath()
  g.moveTo(0, 360)
  for (let x = 0; x <= VIEW_W; x += 24) {
    const world = camX * 0.25 + x
    g.lineTo(x, 348 + Math.sin(world * 0.007) * 28 + Math.sin(world * 0.018) * 8)
  }
  g.lineTo(VIEW_W, 540)
  g.lineTo(0, 540)
  g.closePath()
  g.fillPath()

  g.fillStyle(0xb6ee9a, 1)
  g.beginPath()
  g.moveTo(0, 430)
  for (let x = 0; x <= VIEW_W; x += 24) {
    const world = camX * 0.45 + x
    g.lineTo(x, 418 + Math.sin(world * 0.011 + 1) * 18)
  }
  g.lineTo(VIEW_W, 540)
  g.lineTo(0, 540)
  g.closePath()
  g.fillPath()
}

function drawCloud(g, cloud, camX) {
  const span = VIEW_W + 320
  const x = ((cloud.x - camX * 0.4) % span + span) % span - 80
  const y = cloud.y
  const s = cloud.s
  g.fillStyle(0xffffff, 0.95)
  g.fillCircle(x, y, 22 * s)
  g.fillCircle(x + 26 * s, y + 6, 16 * s)
  g.fillCircle(x - 24 * s, y + 8, 14 * s)
}

function drawLoop(g, loop, camX) {
  const x = loop.cx - camX
  g.lineStyle(48, 0x3d7dff, 1)
  g.strokeCircle(x, loop.cy, loop.r)
  g.lineStyle(14, 0xfff1a8, 1)
  g.strokeCircle(x, loop.cy, loop.r)
  g.lineStyle(5, 0xffffff, 0.85)
  g.strokeCircle(x, loop.cy, loop.r + 16)
}

function drawPond(g, pond, camX) {
  const x = pond.x - camX
  const mid = x + pond.w / 2
  g.fillStyle(0x49c8ff, 1)
  g.fillEllipse(mid, 512, pond.w, 56)
  g.fillStyle(0xe8f9ff, 0.8)
  g.fillEllipse(mid - 8, 500, pond.w * 0.45, 16)
  g.fillStyle(0xffffff, 1)
  g.fillCircle(mid - 12, 508, 3)
  g.fillCircle(mid + 10, 508, 3)
  g.lineStyle(3, 0x0c6796, 1)
  g.beginPath()
  g.arc(mid, 510, 10, 0.15, Math.PI - 0.15, false)
  g.strokePath()
}

function drawSlope(g, slope, camX) {
  const x0 = slope.x - camX
  const x1 = slope.x + slope.w - camX
  g.fillStyle(0xd3924a, 1)
  g.beginPath()
  g.moveTo(x0, slope.yLeft)
  g.lineTo(x1, slope.yRight)
  g.lineTo(x1, 540)
  g.lineTo(x0, 540)
  g.closePath()
  g.fillPath()
  g.lineStyle(18, 0x3cb44a, 1)
  g.beginPath()
  g.moveTo(x0, slope.yLeft)
  g.lineTo(x1, slope.yRight)
  g.strokePath()
  g.lineStyle(6, 0x9af0b0, 1)
  g.beginPath()
  g.moveTo(x0, slope.yLeft - 4)
  g.lineTo(x1, slope.yRight - 4)
  g.strokePath()
}

function drawBlock(g, block, camX) {
  const x = block.x - camX
  if (x > VIEW_W + 40 || x + block.w < -40) return
  g.fillStyle(0xd3924a, 1)
  g.fillRect(x, block.y, block.w, block.h)
  g.fillStyle(0x3cb44a, 1)
  g.fillRect(x, block.y - 10, block.w, 18)
  g.fillStyle(0x9af0b0, 1)
  g.fillRect(x, block.y - 10, block.w, 6)
}

function drawBush(g, bush, camX) {
  const x = bush.x - camX
  const y = bush.y
  g.fillStyle(0x2f9e44, 1)
  g.fillCircle(x - 12, y - 14, 16)
  g.fillCircle(x + 12, y - 18, 18)
  g.fillCircle(x, y - 8, 14)
}

function drawFlower(g, flower, camX) {
  const x = flower.x - camX
  const y = flower.y - 16
  g.fillStyle(0x2f9e44, 1)
  g.fillRect(x - 2, y, 4, 18)
  g.fillStyle(flower.color, 1)
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2
    g.fillCircle(x + Math.cos(angle) * 7, y + Math.sin(angle) * 7, 4)
  }
  g.fillStyle(0xfff3a0, 1)
  g.fillCircle(x, y, 3.5)
}

function drawBoost(g, pad, camX, time) {
  const x = pad.x - camX
  g.fillStyle(0xff8a1e, 1)
  g.fillRoundedRect(x, pad.y, pad.w, pad.h, 6)
  g.fillStyle(0xfff6d0, 1)
  const shift = (time * 80) % 16
  for (let i = 0; i < 4; i += 1) {
    const cx = x + 14 + i * 18 + shift * 0.2
    g.fillTriangle(cx, pad.y + 9, cx + 10, pad.y + 4, cx + 10, pad.y + 14)
  }
}

function drawRing(g, ring, camX, time) {
  const x = ring.x - camX
  const squash = 16 + Math.sin(time * 7 + ring.x) * 6
  g.lineStyle(6, 0xffcf33, 1)
  g.strokeEllipse(x, ring.y, squash, 22)
  g.lineStyle(2, 0xfff6c2, 1)
  g.strokeEllipse(x, ring.y, squash, 22)
}

function drawFlag(g, checkpoint, camX, reached, time) {
  const x = checkpoint.x - camX
  const wave = Math.sin(time * 5 + checkpoint.x) * 3
  g.fillStyle(0xf7fbff, 1)
  g.fillRoundedRect(x - 4, GROUND_TOP - 86, 8, 86, 3)
  g.fillStyle(reached ? 0x7bed4a : 0xff5d8f, 1)
  g.fillTriangle(x + 4, GROUND_TOP - 84, x + 32 + wave, GROUND_TOP - 70, x + 4, GROUND_TOP - 54)
}

function drawStar(g, x, y, radius) {
  g.fillStyle(0xffe14a, 1)
  g.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const arm = i % 2 === 0 ? radius : radius * 0.42
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const px = x + Math.cos(angle) * arm
    const py = y + Math.sin(angle) * arm
    if (i === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.closePath()
  g.fillPath()
}

function drawGoal(g, goal, camX) {
  const x = goal.x - camX
  g.fillStyle(0xfff6d0, 1)
  g.fillRoundedRect(x, goal.y, 14, goal.h, 4)
  g.fillStyle(0xff4d6d, 1)
  g.fillRoundedRect(x + 14, goal.y + 18, 52, 28, 8)
  drawStar(g, x + 7, goal.y + 4, 16)
}

function drawBlob(g, blob, camX, time) {
  const x = blob.x - camX
  const y = blob.y + Math.sin(time * 6 + blob.x) * 3
  g.fillStyle(0xffb703, 1)
  g.fillEllipse(x, y, blob.w, blob.h + 4)
  g.fillStyle(0xffe29a, 1)
  g.fillEllipse(x, y + 6, blob.w * 0.62, blob.h * 0.42)
  g.fillStyle(0xffffff, 1)
  g.fillCircle(x - 8, y - 4, 5)
  g.fillCircle(x + 8, y - 4, 5)
  g.fillStyle(0x243047, 1)
  g.fillCircle(x - 6, y - 4, 2.2)
  g.fillCircle(x + 10, y - 4, 2.2)
  g.lineStyle(2, 0x243047, 1)
  g.beginPath()
  g.arc(x, y + 6, 7, 0.2, Math.PI - 0.2, false)
  g.strokePath()
}

function drawPiko(g, player, camX, time) {
  if (player.invuln > 0 && Math.floor(time * 14) % 2 === 0) return
  const bob = player.grounded ? Math.abs(Math.sin(time * 12)) * -3 * Math.min(1, Math.abs(player.vx) / 200) : 0
  const stride = player.grounded ? Math.sin(time * 14) * Math.min(1, Math.abs(player.vx) / 180) : 0
  g.save()
  g.translateCanvas(player.x - camX, player.y + bob)
  if (player.mode === "loop") g.rotateCanvas(player.loopAngle - Math.PI / 2)
  else g.scaleCanvas(player.facing, 1)

  if (player.mode !== "loop" && player.grounded) {
    g.fillStyle(0x14315c, 0.15)
    g.fillEllipse(0, player.h / 2 + 4, 30, 8)
  }
  g.fillStyle(0x1f4fd0, 1)
  const spikes = [
    [-18, -4],
    [-10, -18],
    [0, -26],
    [10, -18],
    [18, -4],
  ]
  for (const [sx, sy] of spikes) {
    g.fillTriangle(sx, sy + 10, sx + 7, sy - 6, sx - 7, sy + 4)
  }
  g.fillStyle(0x2f7bff, 1)
  g.fillEllipse(0, 2, 36, 38)
  g.fillStyle(0xd7f0ff, 1)
  g.fillEllipse(4, 8, 18, 16)
  g.fillStyle(0xff3b4e, 1)
  g.fillEllipse(-9, 18 + stride * 4, 14, 8)
  g.fillEllipse(10, 18 - stride * 4, 14, 8)
  g.fillStyle(0xffffff, 1)
  g.fillEllipse(-9, 17 + stride * 4, 8, 3)
  g.fillEllipse(10, 17 - stride * 4, 8, 3)
  g.fillCircle(7, -2, 6)
  g.fillCircle(15, -1, 5)
  g.fillStyle(0x1b2433, 1)
  g.fillCircle(9, -2, 2.4)
  g.fillCircle(16, -1, 2)
  g.lineStyle(2, 0x1b2433, 1)
  g.beginPath()
  g.arc(10, 5, 6, 0.25, Math.PI - 0.5, false)
  g.strokePath()
  g.restore()
}

export function drawFrame(g, level, state, time) {
  const camX = cameraX(state.player.x, level.width)
  g.clear()
  drawSky(g)
  drawHills(g, camX)
  for (const item of level.decor) {
    if (item.type === "cloud") drawCloud(g, item, camX)
  }
  if (level.loop) drawLoop(g, level.loop, camX)
  for (const pond of level.ponds) drawPond(g, pond, camX)
  for (const slope of level.slopes) drawSlope(g, slope, camX)
  for (const block of level.blocks) drawBlock(g, block, camX)
  for (const item of level.decor) {
    if (item.type === "bush") drawBush(g, item, camX)
    if (item.type === "flower") drawFlower(g, item, camX)
  }
  for (const pad of level.boosts) drawBoost(g, pad, camX, time)
  level.rings.forEach((ring, index) => {
    if (!state.collected[index]) drawRing(g, ring, camX, time)
  })
  level.checkpoints.forEach((checkpoint, index) => {
    drawFlag(g, checkpoint, camX, index <= state.activeCheckpoint, time)
  })
  drawGoal(g, level.goal, camX)
  for (const blob of state.blobs) drawBlob(g, blob, camX, time)
  drawPiko(g, state.player, camX, time)
  return camX
}
