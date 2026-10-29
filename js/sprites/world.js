// World pixel art: objects, decor and 16x16 terrain tiles. Each sprite carries its own palette.
import { flipRows } from "./pixels.js"

const RING_PALETTE = { o: "#8a5200", y: "#ffcf33", Y: "#fff6c2", d: "#d99a00" }

const RING_FACE = [
  ".....oooooo.....",
  "...ooyyyyyyoo...",
  "..oyYYyyyyyydo..",
  ".oyYYoooooodydo.",
  ".oyYo......odyo.",
  "oyYo........oydo",
  "oyYo........oydo",
  "oyyo........oydo",
  "oyyo........oydo",
  "oyyo........oddo",
  "oydo........oddo",
  ".oydo......odyo.",
  ".odydoooooodddo.",
  "..odddddddddo...",
  "...ooddddddoo...",
  ".....oooooo.....",
]

const RING_TURN = [
  "......oooo......",
  ".....oyyyyo.....",
  "....oyYyyydo....",
  "....oYYooydo....",
  "...oyYo..oydo...",
  "...oyYo..oydo...",
  "...oyyo..oydo...",
  "...oyyo..oydo...",
  "...oyyo..oddo...",
  "...oyyo..oddo...",
  "...oydo..oddo...",
  "....oydooddo....",
  "....oydddddo....",
  "....oodddddo....",
  ".....oddddo.....",
  "......oooo......",
]

const RING_EDGE = [
  ".......oo.......",
  "......oyyo......",
  "......oYyo......",
  "......oYdo......",
  "......oYdo......",
  "......oydo......",
  "......oydo......",
  "......oydo......",
  "......oydo......",
  "......oydo......",
  "......oddo......",
  "......oddo......",
  "......oddo......",
  "......oddo......",
  "......oddo......",
  ".......oo.......",
]

export const RING = {
  palette: RING_PALETTE,
  frames: [RING_FACE, RING_TURN, RING_EDGE, flipRows(RING_TURN)],
}

const BLOB_PALETTE = {
  o: "#7a3300",
  O: "#ffb703",
  h: "#ffe29a",
  s: "#e88a00",
  w: "#ffffff",
  k: "#243047",
  p: "#ff7aa8",
}

const BLOB_UP = [
  "........oooooo........",
  ".....oooOOOOOOooo.....",
  "....oOOOhhhOOOOOOo....",
  "...oOOhhhhOOOOOOOOo...",
  "..oOOOhhOOOOOOOOOOOo..",
  "..oOOOOOOOOOOOOOOOOo..",
  ".oOOOOoooOOOOoooOOOOo.",
  ".oOOOowwkoOOowwkoOOOo.",
  ".oOOOowwkoOOowwkoOOOo.",
  "oOOOOOoooOOOOoooOOOOOo",
  "oOOppOOOOOOOOOOOOppOOo",
  "oOOOOOOOokkkkoOOOOOOOo",
  "oOOOOOOOOokkoOOOOOOOso",
  "oOsOOOOOOOOOOOOOOOOsso",
  ".osssOOOOOOOOOOOOssso.",
  "..osssssssssssssssso..",
  "...oooooooooooooooo...",
]

const BLOB_SQUASH = [
  "......................",
  "........oooooo........",
  "....oooOOOOOOOOooo....",
  "...oOOhhhhOOOOOOOOo...",
  "..oOOhhhOOOOOOOOOOOo..",
  ".oOOOOoooOOOOoooOOOOo.",
  ".oOOOowwkoOOowwkoOOOo.",
  "oOOOOowwkoOOowwkoOOOOo",
  "oOOOOOoooOOOOoooOOOOOo",
  "oOOppOOOOOOOOOOOOppOOo",
  "oOOOOOOOokkkkoOOOOOOOo",
  "oOOOOOOOOokkoOOOOOOOso",
  "oOsOOOOOOOOOOOOOOOOsso",
  "oosssOOOOOOOOOOOOsssoo",
  ".osssssssssssssssssso.",
  "..oooooooooooooooooo..",
  "......................",
]

export const BLOB = { palette: BLOB_PALETTE, frames: [BLOB_UP, BLOB_SQUASH] }

const POP_PALETTE = { y: "#fff3a0", w: "#ffffff", p: "#ff9ec4" }

export const POP = {
  palette: POP_PALETTE,
  frames: [
    [
      "................",
      ".......y........",
      ".......y........",
      "..p....w....p...",
      "...p...w...p....",
      "................",
      "......www.......",
      ".yyww.wyw.wwyy..",
      "......www.......",
      "................",
      "...p...w...p....",
      "..p....w....p...",
      ".......y........",
      ".......y........",
      "................",
      "................",
    ],
    [
      ".y.....y.....y..",
      "..y....y....y...",
      "................",
      "................",
      "....p.....p.....",
      "................",
      "................",
      "yy.....w.....yy.",
      "................",
      "................",
      "....p.....p.....",
      "................",
      "................",
      "..y....y....y...",
      ".y.....y.....y..",
      "................",
    ],
  ],
}

const FLAG_POLE = [
  ".oooo.",
  "oyYYyo",
  "oyyydo",
  ".oooo.",
  "..oo..",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  ".oWgo.",
  "oooooo",
  "oggggo",
  "oooooo",
]

const FLAG_CLOTH = [
  [
    "oo.........",
    "offoo......",
    "offffoo....",
    "offFfffoo..",
    "offFFffffoo",
    "offFfffoo..",
    "offffoo....",
    "offoo......",
    "oo.........",
  ],
  [
    "oo.........",
    "ofoo.......",
    "offfoo.....",
    "offFffoo...",
    "offFFfffooo",
    "offfFffffo.",
    "offfffoo...",
    "offoo......",
    "oo.........",
  ],
]

export const FLAG = {
  pole: FLAG_POLE,
  cloth: FLAG_CLOTH,
  palettes: {
    waiting: { o: "#3a2a4a", y: "#ffcf33", Y: "#fff6c2", d: "#d99a00", W: "#ffffff", g: "#b9c8dc", f: "#ff5d8f", F: "#c73668" },
    reached: { o: "#1d4a26", y: "#ffcf33", Y: "#fff6c2", d: "#d99a00", W: "#ffffff", g: "#b9c8dc", f: "#7bed4a", F: "#3cb44a" },
  },
}

const BOOST_PALETTE = { o: "#7a3300", a: "#ff8a1e", A: "#ffb35c", s: "#d96a00", w: "#fff6d0" }

function boostFrame(shift) {
  const rows = [
    ".oooooooooooooooooooooooooooooooooooooooooo.",
    "oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo",
    "oaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaao",
    "oaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaao",
    "oaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaao",
    "oaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaao",
    "oaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaao",
    "osssssssssssssssssssssssssssssssssssssssssso",
    ".oooooooooooooooooooooooooooooooooooooooooo.",
  ].map((row) => [...row])
  const chevron = [
    [0, 2],
    [1, 3],
    [2, 4],
    [1, 5],
    [0, 6],
  ]
  for (let base = 4 + shift; base < 40; base += 10) {
    for (const [dx, y] of chevron) {
      rows[y][base + dx] = "w"
      rows[y][base + dx + 1] = "w"
    }
  }
  return rows.map((row) => row.join(""))
}

export const BOOST = { palette: BOOST_PALETTE, frames: [boostFrame(0), boostFrame(3), boostFrame(6)] }

const SPRING_PALETTE = { o: "#2a2a3a", y: "#ffe14a", Y: "#fff6c2", d: "#e2a100", r: "#ff4d6d", R: "#b8213f", g: "#c9d4e6", G: "#7f8ca3" }

export const SPRING = {
  palette: SPRING_PALETTE,
  frames: [
    [
      ".oooooooooooooooooo.",
      "oYYYYYYYYYYYYYYYYYYo",
      "oyyyyyyyyyyyyyyyyyyo",
      "oddddddddddddddddddo",
      ".oooooooooooooooooo.",
      "....oGGGGGGGGGGo....",
      "....ogggggggggGo....",
      "....oGGGGGGGGGGo....",
      "....ogggggggggGo....",
      ".oooooooooooooooooo.",
      "orrrrrrrrrrrrrrrrrRo",
      "oRRRRRRRRRRRRRRRRRRo",
      ".oooooooooooooooooo.",
    ],
    [
      "....................",
      "....................",
      "....................",
      "....................",
      ".oooooooooooooooooo.",
      "oYYYYYYYYYYYYYYYYYYo",
      "oyyyyyyyyyyyyyyyyyyo",
      "oddddddddddddddddddo",
      ".oooooooooooooooooo.",
      ".oooooooooooooooooo.",
      "orrrrrrrrrrrrrrrrrRo",
      "oRRRRRRRRRRRRRRRRRRo",
      ".oooooooooooooooooo.",
    ],
  ],
}

const GOAL_PALETTE = {
  o: "#3a2a1a",
  p: "#fff6d0",
  P: "#d8c79a",
  y: "#ffe14a",
  Y: "#fff6c2",
  d: "#e2a100",
  k: "#1b2433",
  w: "#ffffff",
  r: "#ff4d6d",
}

function goalRows() {
  const star = [
    "......oo......",
    ".....oyyo.....",
    ".....oyYo.....",
    "oooooyYYyooooo",
    "oyyyyYYYyyyyyo",
    ".oyyyyyyyyyyo.",
    "..oyyyyyyyyo..",
    "..oyyyyyyyyo..",
    ".oyyydooyyyyo.",
    ".oyydo..oyyyo.",
    "oyddo....oddyo",
    "ooo........ooo",
  ]
  const banner = []
  for (let y = 0; y < 14; y += 1) {
    let row = "o"
    for (let x = 0; x < 20; x += 1) {
      const dark = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0
      row += y === 0 || y === 13 || x === 19 ? "o" : dark ? "k" : "w"
    }
    banner.push(row)
  }
  const rows = []
  for (let y = 0; y < 56; y += 1) {
    let row = ".".repeat(4)
    row += y < 12 ? "" : "opPo"
    rows.push(row)
  }
  const width = 28
  const grid = rows.map((row) => [...row.padEnd(width, ".")])
  star.forEach((line, y) => [...line].forEach((char, x) => char !== "." && (grid[y][x] = char)))
  banner.forEach((line, y) => [...line].forEach((char, x) => char !== "." && (grid[14 + y][x + 7] = char)))
  for (let x = 2; x < 10; x += 1) {
    grid[53][x] = "o"
    grid[54][x] = x === 2 || x === 9 ? "o" : "r"
    grid[55][x] = "o"
  }
  return grid.map((row) => row.join(""))
}

export const GOAL = { palette: GOAL_PALETTE, rows: goalRows() }

const DECOR_PALETTE = {
  o: "#1d5a2a",
  g: "#2f9e44",
  G: "#5fd16a",
  h: "#a6f0a0",
  w: "#ffffff",
  W: "#dff3ff",
  b: "#b8dcf5",
  f: "#ff5d8f",
  F: "#c73668",
  y: "#fff3a0",
  t: "#8a5a2a",
  T: "#5e3a1a",
  l: "#3cb44a",
  L: "#7fe07a",
  c: "#7bf0ff",
  C: "#2fb8d6",
  s: "#9aa6b8",
  S: "#c9d4e6",
  k: "#4a3a6a",
}

export const DECOR = {
  palette: DECOR_PALETTE,
  cloud: [
    "..........wwwwww................",
    "........wwwwwwwwww..............",
    "......wwwwwwwwwwwwww...wwwww....",
    "..wwwwwwwwwwwwwwwwwwwwwwwwwwwww.",
    ".wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
    "WWwwwwwwwwwwwwwwwwwwwwwwwwwwwwWW",
    ".WWWWWWWwwwwwwwwwwwwwwwwWWWWWWW.",
    "..bbbWWWWWWWWWWWWWWWWWWWWWbbb...",
    "......bbbbbbbbbbbbbbbbbbbb......",
  ],
  cloudSmall: [
    ".....wwwww..........",
    "...wwwwwwwww..www...",
    ".wwwwwwwwwwwwwwwwww.",
    "wwwwwwwwwwwwwwwwwwww",
    "WWwwwwwwwwwwwwwwwwWW",
    ".WWWWWWWWWWWWWWWWWW.",
    "...bbbbbbbbbbbbbb...",
  ],
  bush: [
    "........oooo............",
    "......ooGGGGoo..oooo....",
    ".....oGGhhGGGGooGGGGo...",
    "....oGGhhGGGGGGGGhGGGo..",
    "..ooGGGGGGGGGGGGGGGGGo..",
    ".oGGGGGGgGGGGGGGgGGGGGo.",
    "oGGhGGGggGGGGGGggGGGGGGo",
    "oGGGGGgggGGGgGggggGGGGGo",
    "ogGGGgggggGggggggggGGggo",
    "oggggggggggggggggggggggo",
    ".oggggggggggggggggggggo.",
    "..oooooooooooooooooooo..",
  ],
  flower: [
    "..fff..",
    ".ffyff.",
    "ffyyyff",
    ".ffyff.",
    "..fFf..",
    "...l...",
    ".L.l...",
    ".LLl.L.",
    "...lLL.",
    "...l...",
  ],
  palm: [
    "......llll....llll......",
    "....llLLLLl..lLLLLll....",
    "..lLLLllLLLllLLLllLLLl..",
    ".lLl....lLLLLLLl....lLl.",
    "lLl...lllLLttLLlll...lLl",
    "ll...lLLl.ttTt.lLLl...ll",
    "l...lLl...tTtt...lLl...l",
    "....ll....ttTt....ll....",
    "....l.....tTtt.....l....",
    "..........ttTt..........",
    "..........tTtt..........",
    "...........tTt..........",
    "...........ttTt.........",
    "...........tTtt.........",
    "...........ttTt.........",
    "...........tTtt.........",
    "...........ttTt.........",
    "............tTt.........",
    "............ttT.........",
    "............tTt.........",
    "............ttT.........",
    "............tTt.........",
    "...........ttTtt........",
    "..........tttTTtt.......",
  ],
  crystal: [
    "....o.....",
    "...oco....",
    "...occo...",
    "..occCo...",
    "..occCo.o.",
    ".occcCooco",
    ".occcCoccC",
    ".occcCoccC",
    ".occcCoccC",
    "ooccccoccC",
    "occccCoocC",
    "oooooooooo",
  ],
  rock: [
    "....oooooo......",
    "..ooSSSSSSoo....",
    ".oSSSSSssSSSoo..",
    "oSSSSsssssSSSSo.",
    "oSSSsssssssSSSSo",
    "osssssssssssssso",
    ".oooooooooooooo.",
  ],
  shell: [
    "..ooo..",
    ".ofFfo.",
    "ofFfFfo",
    "ofFfFfo",
    ".ooooo.",
  ],
  star: [".w.", "wWw", ".w."],
  twinkle: ["..w..", "..W..", "wWWWw", "..W..", "..w.."],
}

const SIGN_PALETTE = { o: "#3a2a1a", p: "#fff6d0", P: "#d8c79a", t: "#b07a3a", T: "#7a4f22", b: "#1f4fd0", B: "#2f7bff", r: "#ff4d6d" }

const SIGN_BOARD = [
  "oooooooooooooooooo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oppppppppppppppppo",
  "oPPPPPPPPPPPPPPPPo",
  "oooooooootoooooooo",
  "........otTo......",
  "........otTo......",
  "........otTo......",
  "........otTo......",
  "........otTo......",
  "........otTo......",
  ".......ootTTo.....",
].map((row) => row.padEnd(18, "."))

function signWith(icon) {
  const grid = SIGN_BOARD.map((row) => [...row])
  icon.forEach((line, y) => [...line].forEach((char, x) => char !== "." && (grid[2 + y][3 + x] = char)))
  return grid.map((row) => row.join(""))
}

export const SIGNS = {
  palette: SIGN_PALETTE,
  right: signWith([
    "......b.....",
    "......bb....",
    "bbbbbbbBb...",
    "bBBBBBBBBb..",
    "bBBBBBBBBBb.",
    "bBBBBBBBBb..",
    "bbbbbbbBb...",
    "......bb....",
    "......b.....",
  ]),
  roll: signWith([
    "...bbbb.....",
    "..bBBBBb....",
    ".bBBbBBBb...",
    ".bBbBBbBb..r",
    ".bBBBbBBb.rr",
    ".bBBbBBBb..r",
    "..bBBBBb....",
    "...bbbb.....",
    "rrrrrrrrrrr.",
  ]),
  jump: signWith([
    ".....bb.....",
    "....bBBb....",
    "...bBBBBb...",
    "..bBBBBBBb..",
    ".....BB.....",
    ".....BB.....",
    ".....BB.....",
    "............",
    "rrrrrrrrrrrr",
  ]),
}

const PLATFORM_PALETTE = { o: "#3a2a1a", t: "#d39a52", T: "#a8702e", h: "#f0c27a", m: "#c9d4e6", M: "#7f8ca3", n: "#eef3fb", r: "#ff8a1e" }

export const PLATFORM = {
  palette: PLATFORM_PALETTE,
  bridge: [
    "oooooooooooooooo",
    "hhhhhhhhhhhhhhho",
    "ttttttttttttttto",
    "ttTttttttTttttto",
    "ttttttttttttttto",
    "TTTTTTTTTTTTTTTo",
    "ooooooooooooooo.",
    ".o..........o...",
  ],
  mover: [
    "oooooooooooooooo",
    "nnnnnnnnnnnnnnno",
    "mmmmmmmmmmmmmmmo",
    "mmrrmmmmmmmrrmmo",
    "mmmmmmmmmmmmmmmo",
    "MMMMMMMMMMMMMMMo",
    "oooooooooooooooo",
    "................",
  ],
}

// Terrain tiles: "g" grass rows sit on the surface, "d" rows tile the ground below it.
// Letters are theme colours: A light, B mid, C dark, a/b/c for the soil.
export const TILES = {
  grass: [
    "AAAAAAAAAAAAAAAA",
    "AABAAAAAAABAAAAA",
    "BBBBBABBBBBBBABB",
    "BBBBBBBBBBBBBBBB",
    "CBBBBCBBBCBBBBBC",
    "CCBCCCCBCCCBCCCC",
  ],
  soil: [
    "aaaaaaaabbbbbbbb",
    "aaaaaaaabbbbbbbb",
    "aacaaaaabbbbbbbb",
    "aaaaaaaabbbbcbbb",
    "aaaaaaaabbbbbbbb",
    "aaaaacaabbbbbbbb",
    "aaaaaaaabbbbbbbb",
    "ccccccccbbbbbbbb",
    "bbbbbbbbaaaaaaaa",
    "bbbbbbbbaaaaaaaa",
    "bbbcbbbbaaaaaaaa",
    "bbbbbbbbaaaacaaa",
    "bbbbbbbbaaaaaaaa",
    "bbbbbbbbaaaaaaaa",
    "bbbbbcbbaaaaaaaa",
    "bbbbbbbbcccccccc",
  ],
}
