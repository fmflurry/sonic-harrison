let ctx = null
let soundBlocked = false

export function unlockAudio() {
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AudioContext || soundBlocked) return
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === "suspended") {
    ctx.resume().then(null, () => {
      soundBlocked = true
    })
  }
}

function beep({ freq, dur, type, gain, slide }) {
  if (!ctx || soundBlocked || ctx.state !== "running") return
  const start = ctx.currentTime
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), start + dur)
  amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

export const sfx = {
  jump() {
    beep({ freq: 420, dur: 0.09, type: "square", gain: 0.045, slide: 680 })
  },
  ring() {
    beep({ freq: 880, dur: 0.08, type: "sine", gain: 0.06, slide: 1320 })
  },
  boost() {
    beep({ freq: 180, dur: 0.16, type: "sawtooth", gain: 0.03, slide: 760 })
  },
  checkpoint() {
    ;[523, 659, 784].forEach((freq, index) => {
      setTimeout(() => beep({ freq, dur: 0.12, type: "sine", gain: 0.05 }), index * 90)
    })
  },
  oups() {
    beep({ freq: 340, dur: 0.16, type: "triangle", gain: 0.05, slide: 170 })
  },
  clear() {
    ;[523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => beep({ freq, dur: 0.16, type: "sine", gain: 0.055 }), index * 110)
    })
  },
}
