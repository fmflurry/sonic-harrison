// Draws one frame into the 480x270 art-pixel buffer. Every position is rounded to whole art pixels,
// so the upscaled picture keeps one crisp pixel grid.
import { ART, ART_H, ART_W } from "./art.js"
import { POP_TIME, VIEW_W } from "./physics.js"

const HERO = 32
const TRAIL_SIZE = 5
const PARTICLES = 32
const POP_SHOW = 0.5
const SPRING_SHOW = 0.2
// Respawn shimmer toggles 2.5 times per second, under the 3 flashes per second limit for young players.
const SHIMMER_HZ = 2.5

export function cameraX(focusX, levelWidth) {
  const max = Math.max(0, levelWidth - VIEW_W)
  return Math.min(max, Math.max(0, focusX - 340))
}

export function createEffects() {
  return {
    trail: Array.from({ length: TRAIL_SIZE }, () => ({ x: 0, y: 0, frame: null, flip: false, age: 99 })),
    trailNext: 0,
    tick: 0,
    particles: Array.from({ length: PARTICLES }, () => ({ life: 0, x: 0, y: 0, vx: 0, vy: 0, colour: "#fff" })),
  }
}

function spawn(fx, x, y, vx, vy, life, colour) {
  for (const particle of fx.particles) {
    if (particle.life > 0) continue
    particle.x = x
    particle.y = y
    particle.vx = vx
    particle.vy = vy
    particle.life = life
    particle.colour = colour
    return
  }
}

function heroFrame(frames, state, time) {
  const player = state.player
  if (state.phase === "clear") return frames[Math.floor(time * 3) % 2 === 0 ? "cheer0" : "cheer1"]
  if (player.invuln > 1.45) return frames.hurt
  if (player.mode === "loop" || player.ball) {
    const fps = player.grounded || player.mode === "loop" ? 10 + Math.abs(player.vx || player.loopSpeed) / 18 : 24
    return frames.ballCycle[Math.floor(time * fps) % frames.ballCycle.length]
  }
  if (!player.grounded) return player.vy < 0 ? frames.rise : frames.fall
  if (player.braking) return frames.brake
  const speed = Math.abs(player.vx)
  if (speed > 12) return frames.runCycle[Math.floor(time * Math.max(8, speed / 20)) % frames.runCycle.length]
  return Math.floor(time * 3) % 8 === 7 ? frames.idle1 : frames.idle0
}

function drawHero(ctx, image, x, y, flip) {
  if (!flip) {
    ctx.drawImage(image, x, y)
    return
  }
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(image, -x - HERO, y)
  ctx.restore()
}

function layer(ctx, image, camA, speed, y = 0) {
  const offset = -Math.round((camA * speed) % image.width)
  ctx.drawImage(image, offset, y)
  ctx.drawImage(image, offset + image.width, y)
}

function drawClouds(ctx, art, camA) {
  const span = 640
  const shift = Math.round(camA * 0.15) % span
  for (let base = -shift; base < ART_W; base += span) {
    ctx.drawImage(art.cloud, base + 40, 26)
    ctx.drawImage(art.cloudSmall, base + 260, 52)
    ctx.drawImage(art.cloud, base + 420, 16)
    ctx.drawImage(art.cloudSmall, base + 560, 70)
  }
}

function drawWater(ctx, pond, water, camA, time) {
  const x = Math.round(pond.x / ART) - camA
  const w = Math.round(pond.w / ART)
  if (x > ART_W || x + w < 0) return
  const top = Math.round(pond.y / ART)
  ctx.fillStyle = water.body
  ctx.fillRect(x, top + 2, w, ART_H - top)
  ctx.fillStyle = water.deep
  ctx.fillRect(x, top + 14, w, ART_H - top)
  ctx.fillStyle = water.light
  ctx.fillRect(x, top, w, 2)
  ctx.fillStyle = water.top
  const shift = Math.floor(time * 6) % 8
  for (let at = shift; at < w; at += 8) ctx.fillRect(x + at, top, 3, 1)
  for (let at = (shift + 4) % 12; at < w; at += 12) ctx.fillRect(x + at, top + 6, 4, 1)
}

function drawDecor(ctx, level, art, levelArt, camA) {
  for (const item of level.decor) {
    const x = Math.round(item.x / ART) - camA
    if (x < -40 || x > ART_W + 40) continue
    const ground = Math.round(item.y / ART)
    let image
    if (item.type === "flower") image = levelArt.flowers[item.tint % levelArt.flowers.length]
    else if (item.type === "bush") image = art.bush
    else image = art[levelArt.theme.extra] ?? art.rock
    ctx.drawImage(image, x - (image.width >> 1), ground - image.height + 1)
  }
  for (const sign of level.signs) {
    const x = Math.round(sign.x / ART) - camA
    if (x < -20 || x > ART_W + 20) continue
    const image = art.signs[sign.type]
    ctx.drawImage(image, x - 9, Math.round(sign.y / ART) - image.height)
  }
}

function drawLedges(ctx, level, art, camA, time, moverPosition) {
  for (const platform of level.platforms) {
    const x = Math.round(platform.x / ART) - camA
    const w = Math.round(platform.w / ART)
    if (x > ART_W || x + w < 0) continue
    const y = Math.round(platform.y / ART)
    for (let at = 0; at < w; at += 16) ctx.drawImage(art.bridge, 0, 0, Math.min(16, w - at), 8, x + at, y, Math.min(16, w - at), 8)
  }
  for (const mover of level.movers) {
    const at = moverPosition(mover, time)
    const x = Math.round(at.x / ART) - camA
    const w = Math.round(mover.w / ART)
    if (x > ART_W || x + w < 0) continue
    const y = Math.round(at.y / ART)
    for (let step = 0; step < w; step += 16) ctx.drawImage(art.mover, 0, 0, Math.min(16, w - step), 8, x + step, y, Math.min(16, w - step), 8)
  }
}

function drawObjects(ctx, level, state, art, camA, time) {
  for (const pad of level.boosts) {
    const x = Math.round(pad.x / ART) - camA
    if (x < -50 || x > ART_W) continue
    ctx.drawImage(art.boost[Math.floor(time * 10) % art.boost.length], x, Math.round(pad.y / ART))
  }
  level.springs.forEach((spring, index) => {
    const x = Math.round(spring.x / ART) - camA
    if (x < -30 || x > ART_W) return
    const squashed = state.springIndex === index && state.time - state.springAt < SPRING_SHOW
    const image = art.spring[squashed ? 1 : 0]
    ctx.drawImage(image, x, Math.round((spring.y + spring.h) / ART) - image.height)
  })
  level.checkpoints.forEach((flag, index) => {
    if (index === 0) return
    const x = Math.round(flag.x / ART) - camA
    if (x < -30 || x > ART_W + 10) return
    const key = index <= state.activeCheckpoint ? "reached" : "waiting"
    const pole = art.flagPole[key]
    const ground = Math.round((flag.y + 24) / ART)
    ctx.drawImage(pole, x - 3, ground - pole.height)
    ctx.drawImage(art.flagCloth[key][Math.floor(time * 3 + index) % 2], x + 2, ground - pole.height + 4)
  })
  const goal = level.goal
  const gx = Math.round(goal.x / ART) - camA
  if (gx > -40 && gx < ART_W + 10) ctx.drawImage(art.goal, gx - 4, Math.round((goal.y + goal.h) / ART) - art.goal.height)
  const ringFrame = art.ring[Math.floor(time * 8) % art.ring.length]
  for (let i = 0; i < level.rings.length; i += 1) {
    if (state.collected[i]) continue
    const ring = level.rings[i]
    const x = Math.round(ring.x / ART) - camA
    if (x < -16 || x > ART_W + 16) continue
    ctx.drawImage(ringFrame, x - 8, Math.round(ring.y / ART) - 8)
  }
  for (const blob of state.blobs) {
    const x = Math.round(blob.x / ART) - camA
    if (x < -24 || x > ART_W + 24) continue
    const bottom = Math.round((blob.y + blob.h / 2) / ART)
    if (blob.popped > POP_TIME - POP_SHOW) {
      const pop = art.pop[blob.popped > POP_TIME - POP_SHOW / 2 ? 0 : 1]
      ctx.drawImage(pop, x - 8, bottom - 14)
      continue
    }
    if (blob.popped > 0) continue
    const image = art.blob[Math.floor(time * 3 + blob.minX) % 2]
    ctx.drawImage(image, x - 11, bottom - image.height + 1)
  }
}

// Trail and particles are kept in world art pixels so they stay put while the camera follows.
function updateEffects(fx, state, frame, ax, ay, flip) {
  fx.tick += 1
  const player = state.player
  if (player.dashTime > 0 && fx.tick % 3 === 0) {
    spawn(fx, ax + (flip ? 30 : 2), ay + 10 + (fx.tick % 12), flip ? 3 : -3, 0, 8, "#bff6ff")
  }
  if (player.dashTime > 0 && fx.tick % 2 === 0) {
    const slot = fx.trail[fx.trailNext]
    slot.x = ax
    slot.y = ay
    slot.frame = frame
    slot.flip = flip
    slot.age = 0
    fx.trailNext = (fx.trailNext + 1) % TRAIL_SIZE
  }
  for (const slot of fx.trail) slot.age += 1
  if (state.justCollected) {
    for (let i = 0; i < 3; i += 1) spawn(fx, ax + 16, ay + 14, (i - 1) * 0.8, -1.4, 18, "#fff6c2")
  }
  if (player.braking && fx.tick % 4 === 0) spawn(fx, ax + (flip ? 24 : 8), ay + 30, flip ? 0.6 : -0.6, -0.4, 14, "#f2e3c8")
  if (player.ball && player.grounded && Math.abs(player.vx) > 200 && fx.tick % 5 === 0) {
    spawn(fx, ax + 16 - Math.sign(player.vx) * 10, ay + 30, -Math.sign(player.vx) * 0.5, -0.3, 12, "#ffffff")
  }
}

function drawEffects(ctx, fx, camA) {
  for (const slot of fx.trail) {
    if (!slot.frame || slot.age > TRAIL_SIZE * 2) continue
    ctx.globalAlpha = 0.5 - slot.age * 0.04
    drawHero(ctx, slot.frame, slot.x - camA, slot.y, slot.flip)
  }
  ctx.globalAlpha = 1
  for (const particle of fx.particles) {
    if (particle.life <= 0) continue
    particle.life -= 1
    particle.x += particle.vx
    particle.y += particle.vy
    ctx.fillStyle = particle.colour
    ctx.fillRect(Math.round(particle.x) - camA, Math.round(particle.y), 2, 2)
  }
}

// Returns the camera position in game units so the caller can place DOM labels.
export function drawWorld(ctx, view) {
  const { level, state, art, levelArt, time, fx, moverPosition } = view
  const camX = cameraX(state.player.x, level.width)
  const camA = Math.round(camX / ART)
  ctx.imageSmoothingEnabled = false
  ctx.globalAlpha = 1
  ctx.drawImage(levelArt.sky, 0, 0)
  if (levelArt.theme.clouds) drawClouds(ctx, art, camA)
  if (levelArt.theme.stars) {
    const twinkle = Math.floor(time * 1.5) % 4
    ctx.drawImage(art.twinkle, 60 + twinkle * 90, 20 + twinkle * 7)
  }
  layer(ctx, levelArt.far, camA, 0.25)
  layer(ctx, levelArt.near, camA, 0.5)
  level.loops.forEach((loop, index) => {
    const image = levelArt.loops[index]
    ctx.drawImage(image.canvas, Math.round(loop.cx / ART) - camA - image.half, Math.round(loop.cy / ART) - image.half)
  })
  for (const pond of level.ponds) drawWater(ctx, pond, levelArt.theme.water, camA, time)
  const first = Math.floor(camA / levelArt.chunkWidth)
  for (let index = first; index <= first + 2 && index < levelArt.chunkCount; index += 1) {
    ctx.drawImage(levelArt.chunk(index), index * levelArt.chunkWidth - camA, 0)
  }
  drawDecor(ctx, level, art, levelArt, camA)
  drawLedges(ctx, level, art, camA, state.time, moverPosition)
  drawObjects(ctx, level, state, art, camA, time)

  const player = state.player
  const frames = art.heroes[state.character]
  const frame = heroFrame(frames, state, time)
  const worldX = Math.round(player.x / ART) - HERO / 2
  const ax = worldX - camA
  const ay = Math.round((player.y + player.h / 2) / ART) - HERO
  const flip = player.mode !== "loop" && player.facing < 0
  updateEffects(fx, state, frame, worldX, ay, flip)
  drawEffects(ctx, fx, camA)
  const shimmer = player.invuln > 0 && player.invuln <= 1.45 && Math.floor(time * SHIMMER_HZ * 2) % 2 === 0
  ctx.globalAlpha = shimmer ? 0.5 : 1
  drawHero(ctx, frame, ax, ay, flip)
  ctx.globalAlpha = 1
  return camX
}
