// Piko: an original round blue hedgehog with big eyes and red sneakers.
import { buildHeroFrames } from "./hero.js"

const BODY = [
  ".....oo....ooooo..........",
  ".....oDo.ooBBBBBoo........",
  ".ooo.oDDoBBBBBBBBBoo......",
  "oDDDooDDBBBLLLBBBBBBo.....",
  ".oDDDDDBBLLLLLLBBBBBBo....",
  "..oDDDDBLLLLLLBBBoooBo....",
  "...oDDBBLLLLLBBBowwwoo....",
  "....oBBBBLLLBBBowwwwwo....",
  ".oooDBBBBBBBBBBowwwkko....",
  "oDDDDBBBBBBBBBBowwwkko....",
  "oDDDDBBBBBBBBBBBowwkko....",
  ".ooDDBBBBBBBBBBBBoooccoo..",
  "...ooBBBBBBBBBBBpcccccckko",
  "....oBBBBBBBBBBccccccccoo.",
  "....oBBBBBBBBBcccoccoo....",
  "...oDDBBBBBBBBcccoooo.....",
  "..oDDDDBBBBBBBccccco......",
  "...ooooBBBBBBBBccccco.....",
  ".......ooBBBBBBBcccco.....",
  ".........ooBBBBBBooo......",
  "...........oooooo.........",
]
const BALL_A = [
  ".......oooooooo.......",
  ".....ooLBBBBBBBoo.....",
  "....oLLLLDDBBBBBBo....",
  "...oLLLLLDDDBBBBBBo...",
  "..oLLLLLBBBDDBBBBBDo..",
  ".oLLLLBBBBBBDDBBBBDDo.",
  ".oLLLBBBBBBBBDBBBBDDo.",
  "oLLLLBBDDccccDDBBBDDBo",
  "oBBBBDDDccccccDBBBDDBo",
  "oBBBDDBBBccccccBBBDDBo",
  "oBBDDBBBBBcccBBBBBDDBo",
  "oBDDBBBBBBBBBBBBBDDBBo",
  "oBDDBBBBBBBBBBBBDDBBBo",
  "oBDDBBBDDBBBBDDDDBBBBo",
  "oBDDBBBDDBBBBDDBBBBBBo",
  ".oDDBBBBDBBBBBBBrBBBo.",
  ".oDDBBBBDDBBBBBrrrrBo.",
  "..oDBBBBBDDBBBBrrrro..",
  "...oBBBBBBDDDDDrrro...",
  "....oBBBBBBDDDDDro....",
  ".....ooBBBBBBBBoo.....",
  ".......oooooooo.......",
]
const BALL_B = [
  ".......oooooooo.......",
  ".....ooLLLLLLLLoo.....",
  "....oBBLLLLLLLLLBo....",
  "...oBBBBLLLLLLLDBBo...",
  "..oBBBBBBBBBBBLDDBBo..",
  ".oBBDDDDDDBBBBBDDBBBo.",
  ".oBDDDBBBDDDBBBBDBBBo.",
  "oBDDBBBBBBBccBBBDBBBBo",
  "oDDBBBBBBBBcccBBDBBBBo",
  "oDBBBBBBBBBccccDDBBBBo",
  "oDBBBBDDBBBccccDBBBBBo",
  "oBBBBBDBBBBBcccDBBBBDo",
  "oBBBBDDBBBBBBBcBBBBBDo",
  "oBBBBDBBBBBBBBBBBBBDDo",
  "oBBBBDBBBBDBBBBBBBDDBo",
  ".oBBBDBBBBDDDBBBDDDBo.",
  ".oBBBDDBBBBBDDDDDDBBo.",
  "..oBBDDBBBBBBBBBBBBo..",
  "...oBBDDBrrrBBBBBBo...",
  "....oBBDDrrrBBBBBo....",
  ".....ooBrrrrrBBoo.....",
  ".......oooooooo.......",
]

const EYES = {
  open: ["BBoooBo", "Bowwwoo", "owwwwwo", "owwwkko", "owwwkko", "Bowwkko", "BBooocc"],
  blink: ["BBBBBBo", "BBBBBBo", "BBBBBBo", "BBBBBBo", "Booooko", "BBBBBBo", "BBBBBcc"],
  happy: ["BBBBBBo", "BBBBBBo", "BBBooBo", "BBoBBoo", "BoBBBBo", "BBBBBBo", "BBBBBcc"],
  hurt: ["BBBBBBo", "BBBBBoo", "BBBooBo", "BBoBBBo", "BBBooBo", "BBBBBoo", "BBBBBcc"],
}

export const PIKO_PALETTE = {
  o: "#14244a",
  D: "#1f4fd0",
  B: "#2f7bff",
  L: "#79b4ff",
  c: "#fff1d6",
  w: "#ffffff",
  k: "#1b2433",
  p: "#ff8fb1",
  r: "#ff3b4e",
  R: "#b81f37",
  W: "#ffffff",
}

export const PIKO_BALLS = [BALL_A, BALL_B]

export const PIKO = {
  id: "piko",
  name: "Piko",
  palette: PIKO_PALETTE,
  frames: buildHeroFrames({ body: BODY, eyes: EYES, balls: PIKO_BALLS }),
}
