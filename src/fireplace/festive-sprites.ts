/**
 * Palette and sprite art for the Christmas and New Year themes, drawn as
 * text like the Halloween sprites; `.` is transparent.
 */
import { parseSprite, type Sprite } from './halloween-sprites'

export const FESTIVE = {
  OUTLINE: 0,
  PINE_DARK: 1,
  PINE: 2,
  PINE_LIGHT: 3,
  RED_DARK: 4,
  RED: 5,
  RED_LIGHT: 6,
  SNOW: 7,
  SNOW_SHADE: 8,
  GOLD_DARK: 9,
  GOLD: 10,
  BLUE_DARK: 11,
  BLUE: 12,
  CHARCOAL: 13,
  SKIN: 14,
  TRANSPARENT: 15,
} as const

const FESTIVE_HEX =
  '#1c0d08 #0f3018 #1f5c2b #3d8f3b #6a1016 #b8222a #e04a3e #eef2f6 ' +
  '#a3aec0 #8a5a14 #e2ad30 #1d2f6e #3a64c8 #3c3046 #f0b088 #000000'

export const FESTIVE_PALETTE: readonly string[] = FESTIVE_HEX.split(' ')

/**
 * Held back like the pumpkins are, so the wrapping paper and the stockings
 * keep their colour next to the fire instead of washing out.
 */
export const FESTIVE_SENSITIVITY: Record<number, number> = {
  [FESTIVE.PINE_DARK]: 0.5,
  [FESTIVE.PINE]: 0.5,
  [FESTIVE.PINE_LIGHT]: 0.5,
  [FESTIVE.RED_DARK]: 0.5,
  [FESTIVE.RED]: 0.5,
  [FESTIVE.RED_LIGHT]: 0.5,
  [FESTIVE.SNOW]: 0.3,
  [FESTIVE.SNOW_SHADE]: 0.5,
  [FESTIVE.GOLD]: 0.5,
  [FESTIVE.BLUE]: 0.5,
  [FESTIVE.SKIN]: 0.5,
}

const KEY: Record<string, number> = {
  k: FESTIVE.OUTLINE,
  p: FESTIVE.PINE_DARK,
  g: FESTIVE.PINE,
  G: FESTIVE.PINE_LIGHT,
  d: FESTIVE.RED_DARK,
  r: FESTIVE.RED,
  R: FESTIVE.RED_LIGHT,
  w: FESTIVE.SNOW,
  s: FESTIVE.SNOW_SHADE,
  y: FESTIVE.GOLD_DARK,
  Y: FESTIVE.GOLD,
  u: FESTIVE.BLUE_DARK,
  U: FESTIVE.BLUE,
  b: FESTIVE.CHARCOAL,
  f: FESTIVE.SKIN,
}

export function festiveSprite(source: readonly string[]): Sprite {
  return parseSprite(source, KEY)
}

export function scaleSprite(s: Sprite, scale: number): Sprite {
  if (scale === 1) return s
  const w = s.w * scale
  const h = s.h * scale
  const pixels = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      pixels[y * w + x] =
        s.pixels[Math.floor(y / scale) * s.w + Math.floor(x / scale)]
    }
  }
  return { w, h, pixels }
}

export const BOW = festiveSprite([
  '.rr.rr.',
  'rRrdrRr',
  '.rrdrr.',
  '..r.r..',
  '.r...r.',
])

/**
 * A stocking with its toe to the right. `r`/`R` are the body and `w` the
 * stripes, swapped out per stocking so no two match.
 */
const STOCKING = [
  'kkkkkkkk..',
  'kwwwwwwk..',
  'kwswswsk..',
  'kkkkkkkk..',
  '.krrrrk...',
  '.krRrrk...',
  '.kwwwwk...',
  '.krrrrk...',
  '.krRrrk...',
  '.kwwwwk...',
  '.krrrrkkk.',
  '.krrrrrrrk',
  '.krRrrrrrk',
  '..krrrrrk.',
  '...kkkkk..',
]

const STOCKING_COLORS: readonly [string, string, string][] = [
  ['r', 'R', 'w'],
  ['g', 'G', 'w'],
  ['r', 'R', 'Y'],
  ['U', 'U', 'w'],
]

export const STOCKINGS: readonly Sprite[] = STOCKING_COLORS.map(
  ([body, light, stripe]) =>
    festiveSprite(
      STOCKING.map((row, y) =>
        // The cuff keeps its own white; only the leg below it is recoloured.
        y < 4
          ? row
          : row.replace(/[rRw]/g, (c) =>
              c === 'r' ? body : c === 'R' ? light : stripe,
            ),
      ),
    ),
)

const GLYPHS: Record<string, readonly string[]> = {
  A: ['###', '#.#', '###', '#.#', '#.#'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  ':': ['...', '.#.', '...', '.#.', '...'],
  E: ['###', '#..', '##.', '#..', '###'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  P: ['###', '#.#', '###', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  W: ['#.#', '#.#', '#.#', '###', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ' ': ['...', '...', '...', '...', '...'],
}

const GLYPH_W = 3
export const GLYPH_H = 5

export function textPixels(text: string): { w: number; on: boolean[][] } {
  const glyphs = [...text].map((c) => GLYPHS[c] ?? GLYPHS[' '])
  const w = Math.max(0, glyphs.length * (GLYPH_W + 1) - 1)
  const on = Array.from({ length: GLYPH_H }, (_, y) => {
    const row: boolean[] = []
    glyphs.forEach((glyph, i) => {
      if (i > 0) row.push(false)
      for (const c of glyph[y]) row.push(c === '#')
    })
    return row
  })
  return { w, on }
}

export const CHRISTMAS_BULBS: readonly [string, string][] = [
  ['#ff4a3a', '#4a120e'],
  ['#5cff6a', '#103a16'],
  ['#ffd040', '#4a3810'],
  ['#4aa0ff', '#122848'],
]

export const NEW_YEAR_BULBS: readonly [string, string][] = [
  ['#ffd040', '#4a3810'],
  ['#ffffff', '#3a3a44'],
  ['#9ad8ff', '#1c3444'],
  ['#ff6ad8', '#44143a'],
]

export const FIREWORK_RAMPS: readonly (readonly string[])[] = [
  ['#ffffff', '#ffd0c0', '#ff4a3a', '#a01c12', '#4a0c08'],
  ['#ffffff', '#fff2b0', '#ffc030', '#a06a10', '#4a3008'],
  ['#ffffff', '#d0ffd0', '#5cff6a', '#1c8a2a', '#0c3a12'],
  ['#ffffff', '#d0e8ff', '#4aa0ff', '#1c4aa0', '#0c1c4a'],
  ['#ffffff', '#ffd0f4', '#ff6ad8', '#a01c80', '#4a0c3a'],
  ['#ffffff', '#ffffff', '#d8d8e8', '#7a7a8a', '#34343c'],
]
