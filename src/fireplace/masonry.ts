/**
 * The sooty firebrick at the back of the firebox.
 *
 * Courses of blocks with mortar between them. Shades are picked from the
 * seeded RNG, which keeps a given screen's brickwork identical between runs.
 * Everything here is nearly black on its own — it only becomes visible when
 * the firelight tables brighten it.
 */
import type { IndexedBitmap } from './bitmap'
import type { Rect } from './layout'
import type { Rng } from './prng'
import { SCENE } from './palettes'

export interface MasonryStyle {
  mortar: number
  faces: readonly number[]
  /** Colour of the lit top edge of each block. */
  highlight: number
  blockW: number
  blockH: number
  /** Chance a block gets a highlighted top edge. */
  highlightChance: number
}

/** Lays courses of blocks across `area`, clipped to it. */
export function drawMasonry(
  bmp: IndexedBitmap,
  area: Rect,
  style: MasonryStyle,
  rng: Rng,
): void {
  const { blockW, blockH } = style
  bmp.fillArea(area, style.mortar)
  const rows = Math.ceil(area.h / blockH) + 1
  for (let row = 0; row < rows; row++) {
    const y = area.y + row * blockH
    const shift = row % 2 === 0 ? 0 : -Math.floor(blockW / 2)
    drawCourse(bmp, area, { ...style, y, shift }, rng)
  }
}

interface CourseStyle extends MasonryStyle {
  y: number
  shift: number
}

function drawCourse(
  bmp: IndexedBitmap,
  area: Rect,
  style: CourseStyle,
  rng: Rng,
): void {
  const { blockW, blockH, y, shift } = style
  const columns = Math.ceil(area.w / blockW) + 1
  for (let col = 0; col < columns; col++) {
    const x = area.x + shift + col * blockW
    const face = style.faces[Math.floor(rng() * style.faces.length)]
    clippedFill(bmp, area, x, y, blockW - 1, blockH - 1, face)
    if (rng() < style.highlightChance) {
      clippedFill(bmp, area, x, y, blockW - 1, 1, style.highlight)
    }
  }
}

function clippedFill(
  bmp: IndexedBitmap,
  area: Rect,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
): void {
  const x0 = Math.max(x, area.x)
  const y0 = Math.max(y, area.y)
  const x1 = Math.min(x + w, area.x + area.w)
  const y1 = Math.min(y + h, area.y + area.h)
  if (x1 <= x0 || y1 <= y0) return
  bmp.fillRect(x0, y0, x1 - x0, y1 - y0, color)
}

/** Firebrick, sized so the courses read at any resolution. */
export function firebrickStyle(unit: number): MasonryStyle {
  return {
    mortar: SCENE.MORTAR,
    faces: [SCENE.SOOT_DARK, SCENE.SOOT_MID, SCENE.SOOT_MID, SCENE.SOOT_LIGHT],
    highlight: SCENE.SOOT_LIGHT,
    blockW: Math.max(6, Math.round(unit * 2.4)),
    blockH: Math.max(3, unit),
    highlightChance: 0.18,
  }
}
