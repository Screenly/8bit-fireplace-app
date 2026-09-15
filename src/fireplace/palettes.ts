/**
 * The 32-colour scene palette and the pre-baked firelight tables.
 *
 * Every static pixel of the room is stored as `band * SCENE_COLORS + colour`,
 * where `band` is how exposed that pixel is to the fire. Lighting a frame is
 * then one table lookup per pixel — the same palette-animation trick 8-bit
 * games used, and cheap enough for a Raspberry Pi at 4K.
 */
import { litColor } from './colors'
import { FLAME_RAMPS, glowColor, type FlameColor } from './ramps'

/** Named slots in the scene palette. */
export const SCENE = {
  VOID: 0,
  WALL_DARK: 1,
  WALL_MID: 2,
  WALL_LIGHT: 3,
  MORTAR: 4,
  BRICK_DARK: 5,
  BRICK_MID: 6,
  BRICK_LIGHT: 7,
  BRICK_HI: 8,
  STONE_DARK: 9,
  STONE_MID: 10,
  STONE_LIGHT: 11,
  FIREBOX: 12,
  FIREBOX_BACK: 13,
  LOG_DARK: 14,
  LOG_MID: 15,
  LOG_LIGHT: 16,
  LOG_HI: 17,
  EMBER_DARK: 18,
  EMBER_HOT: 19,
  ASH: 20,
  FLOOR_DARK: 21,
  FLOOR_MID: 22,
  FLOOR_LIGHT: 23,
  MANTEL_DARK: 24,
  MANTEL_MID: 25,
  MANTEL_LIGHT: 26,
  TEXT: 27,
  TEXT_SHADOW: 28,
  IRON_DARK: 29,
  IRON_MID: 30,
  /** Overlay-only sentinel: leave whatever is underneath alone. */
  TRANSPARENT: 31,
} as const

/** Palette size. A power of two so a pixel can pack colour plus light band. */
export const SCENE_COLORS = 32

const PALETTE_HEX =
  '#05060a #16131c #211c29 #2c2535 #1a1620 #3a2a2a #4a3532 #5c423c ' +
  '#6e5046 #2a2730 #3b3742 #4e4956 #0a0710 #140d14 #24150c #3b2413 ' +
  '#4a2c17 #5c3a20 #8a2b06 #d4520c #4a4450 #1b1720 #262230 #332d3d ' +
  '#33221a #4d3527 #6a4a34 #ffe9b8 #2a1608 #17151c #2a2731 #000000'

export const SCENE_PALETTE: readonly string[] = PALETTE_HEX.split(' ')

/**
 * How strongly each colour reacts to firelight. Text is pinned so it never
 * flickers out of legibility, and embers are already glowing at full heat.
 */
const GLOW_SENSITIVITY: Record<number, number> = {
  [SCENE.TEXT]: 0,
  [SCENE.TEXT_SHADOW]: 0,
  [SCENE.EMBER_HOT]: 0.2,
  [SCENE.EMBER_DARK]: 0.4,
}

/** Number of spatial firelight bands baked into the scene pixels. */
export const LIGHT_BANDS = 4
/** Number of pre-baked flicker steps. */
export const FLICKER_STEPS = 6

const BAND_STRENGTH = [0, 0.18, 0.42, 0.74]

/**
 * Builds one lookup table per flicker step, each indexed by a packed scene
 * pixel.
 */
export function buildLightTables(flame: FlameColor): Uint32Array[] {
  const glow = glowColor(flame)
  const palette = paletteFor(flame)
  const tables: Uint32Array[] = []
  for (let step = 0; step < FLICKER_STEPS; step++) {
    const flicker = 0.72 + (0.28 * step) / (FLICKER_STEPS - 1)
    tables.push(buildLightTable(palette, glow, flicker))
  }
  return tables
}

/**
 * The coals take their colour from the flame ramp, so a blue or green fire
 * does not sit on a bed of orange embers.
 */
function paletteFor(flame: FlameColor): string[] {
  const ramp = FLAME_RAMPS[flame]
  const palette = [...SCENE_PALETTE]
  palette[SCENE.EMBER_DARK] = ramp[4]
  palette[SCENE.EMBER_HOT] = ramp[9]
  return palette
}

function buildLightTable(
  palette: readonly string[],
  glow: string,
  flicker: number,
): Uint32Array {
  const table = new Uint32Array(LIGHT_BANDS * SCENE_COLORS)
  for (let band = 0; band < LIGHT_BANDS; band++) {
    for (let color = 0; color < SCENE_COLORS; color++) {
      const sensitivity = GLOW_SENSITIVITY[color] ?? 1
      const amount = BAND_STRENGTH[band] * flicker * sensitivity
      table[band * SCENE_COLORS + color] = litColor(
        palette[color],
        glow,
        amount,
      )
    }
  }
  return table
}

/** Packs a scene colour and its light band into a single framebuffer byte. */
export function packScenePixel(color: number, band: number): number {
  return band * SCENE_COLORS + color
}
