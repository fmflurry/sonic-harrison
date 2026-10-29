import assert from "node:assert/strict"
import { test } from "node:test"
import { CHARACTERS } from "../js/characters.js"
import { levels } from "../js/levels.js"
import { jumpApex, jumpReach } from "../js/physics.js"
import { runBot } from "./level-bot.js"

const MIN_SECONDS = 70
const MAX_SECONDS = 170
const MAX_CHECKPOINT_GAP_SECONDS = 35
const GAP_SAFETY = 1.25
const slowestRun = Math.min(...Object.values(CHARACTERS).map((character) => character.maxRun))

test("there are five levels and the first three keep their names", () => {
  assert.equal(levels.length, 5)
  assert.deepEqual(
    levels.slice(0, 3).map((level) => level.name),
    ["La prairie", "La colline", "Le looping"],
  )
})

for (const level of levels) {
  test(`${level.name}: every gap is at most 80% of a running jump`, () => {
    const reach = jumpReach(slowestRun)
    assert.ok(level.gaps.length > 0)
    for (const gap of level.gaps) {
      assert.ok(gap.w * GAP_SAFETY <= reach, `gap of ${gap.w} at x=${gap.x}, reach ${reach.toFixed(0)}`)
    }
  })

  test(`${level.name}: optional ledges stay below 80% of the jump height`, () => {
    for (const platform of level.platforms) {
      const below = [...level.blocks].find((block) => platform.x >= block.x && platform.x <= block.x + block.w)
      if (!below) continue
      const climb = below.y - platform.y
      if (level.movers.length && climb > 140) continue
      assert.ok(climb * GAP_SAFETY <= jumpApex() + 40, `ledge ${climb} high at x=${platform.x}`)
    }
  })

  for (const character of Object.keys(CHARACTERS)) {
    test(`${level.name}: a bot running right with ${character} reaches the goal in about two minutes`, () => {
      const run = runBot(level, character)
      assert.ok(run.cleared, `${character} stuck at x=${run.stuckAt}`)
      assert.equal(run.respawns, 0, `${character} fell or bumped into a blob`)
      assert.ok(run.rings > 60, `${run.rings} rings`)
      if (character === "piko") {
        assert.ok(run.seconds >= MIN_SECONDS && run.seconds <= MAX_SECONDS, `${run.seconds.toFixed(1)} s`)
        assert.equal(run.reachedCheckpoints, level.checkpoints.length)
        const times = [...run.checkpointTimes, run.seconds]
        for (let i = 1; i < times.length; i += 1) {
          const gap = times[i] - times[i - 1]
          assert.ok(gap <= MAX_CHECKPOINT_GAP_SECONDS, `${gap.toFixed(1)} s between flag ${i - 1} and ${i}`)
        }
      }
    })
  }
}
