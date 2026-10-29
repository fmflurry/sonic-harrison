// Nox: an original dark violet hedgehog with silver-tipped spikes, a silver chest tuft,
// teal eyes and teal sneakers. Same poses as Piko, his own body and colours.
import { buildHeroFrames } from "./hero.js"
import { PIKO_BALLS } from "./piko.js"
import { swapChars } from "./pixels.js"

const BODY = [
  "......o....ooooo..........",
  ".....oDo.ooBBBBBoo........",
  "oooo.oDDoBBBBBBBBBoo......",
  "SSDDooDDBBBLLLBBBBBBo.....",
  ".ooSDDDBBLLLLLLBBBBBBo....",
  "...ooDDBLLLLLLBBBoooBo....",
  "....oDBBLLLLLBBBowwwoo....",
  "oooooBBBBLLLBBBowwwwwo....",
  "SSSDDBBBBBBBBBBowwwkko....",
  ".ooSDDDBBBBBBBBowwwkko....",
  "...ooDDBBBBBBBBBowwkko....",
  "....oDDBBBBBBBBBBoooccoo..",
  "ooooDBBBBBBBBBBBpcccccckko",
  "SSSDDBBBBBBBBBBccccccccoo.",
  ".ooSDBBBBBBBBBcccoccoo....",
  "...ooDBBBBBBBttTtoooo.....",
  "....oDDBBBBBBtttTto.......",
  ".....ooBBBBBBttTtto.......",
  ".......ooBBBBBtttto.......",
  ".........ooBBBBBBooo......",
  "...........oooooo.........",
]

const EYES = {
  open: ["BBBBBBo", "Boooooo", "owwiiko", "owwiiko", "Bowiiko", "BBoooko", "BBBBBcc"],
  blink: ["BBBBBBo", "BBBBBBo", "BBBBBBo", "BBBBBBo", "Booooko", "BBBBBBo", "BBBBBcc"],
  happy: ["BBBBBBo", "BBBBBBo", "BBBooBo", "BBoBBoo", "BoBBBBo", "BBBBBBo", "BBBBBcc"],
  hurt: ["BBBBBBo", "BBBBBoo", "BBBooBo", "BBoBBBo", "BBBooBo", "BBBBBoo", "BBBBBcc"],
}

export const NOX_PALETTE = {
  o: "#1a1030",
  D: "#3b2266",
  B: "#5a37a0",
  L: "#8a68d6",
  S: "#dfe6f2",
  c: "#efe3ff",
  t: "#f6f8fc",
  T: "#b9c2d8",
  w: "#ffffff",
  k: "#160c24",
  i: "#23d3c0",
  p: "#ff8fc8",
  r: "#22b8aa",
  R: "#0e7a72",
  W: "#ffffff",
}

export const NOX = {
  id: "nox",
  name: "Nox",
  palette: NOX_PALETTE,
  frames: buildHeroFrames({
    body: BODY,
    eyes: EYES,
    balls: PIKO_BALLS.map((rows) => swapChars(rows, { c: "S" })),
  }),
}
