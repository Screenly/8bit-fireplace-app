/**
 * A rug over the hearth floor. The floor is only a few pixels deep, so the
 * border is kept thin enough for the pattern to show.
 */
import type { IndexedBitmap } from './bitmap'
import { FESTIVE } from './festive-sprites'

export interface RugColors {
  ground: number
  stripe: number
  diamonds: readonly [[number, number], [number, number]]
  dot: number
}

const CHRISTMAS_RUG: RugColors = {
  ground: FESTIVE.RED_DARK,
  stripe: FESTIVE.PINE_DARK,
  diamonds: [
    [FESTIVE.RED_LIGHT, FESTIVE.RED],
    [FESTIVE.GOLD, FESTIVE.GOLD_DARK],
  ],
  dot: FESTIVE.GOLD_DARK,
}

export const NEW_YEAR_RUG: RugColors = {
  ground: FESTIVE.BLUE_DARK,
  stripe: FESTIVE.BLUE,
  diamonds: [
    [FESTIVE.SNOW, FESTIVE.SNOW_SHADE],
    [FESTIVE.GOLD, FESTIVE.GOLD_DARK],
  ],
  dot: FESTIVE.GOLD_DARK,
}

export function drawRug(
  bmp: IndexedBitmap,
  ash: { y: number },
  colors: RugColors = CHRISTMAS_RUG,
): number {
  const { width, height } = bmp
  const top = Math.min(height - 5, ash.y)
  const rows = height - top
  const margin = Math.max(3, Math.round(width * 0.05))
  const left = margin
  const right = width - margin
  const mid = top + Math.floor(rows / 2)
  const stripe = rows >= 11

  for (let y = top; y < height; y++) {
    const r = y - top
    const fromBottom = height - 1 - y
    for (let x = left; x < right; x++) {
      let color: number
      const edge = Math.min(r, fromBottom, x - left, right - 1 - x)
      if (edge === 0) color = FESTIVE.OUTLINE
      else if (edge === 1) color = FESTIVE.GOLD_DARK
      else if (edge === 2 && stripe) color = colors.stripe
      else color = field(x - left, y - mid, colors)
      bmp.set(x, y, color)
    }
    if (r % 2 === 1 && fromBottom > 0) {
      for (const x of [left - 1, left - 2, right, right + 1]) {
        bmp.set(
          x,
          y,
          x === left - 2 || x === right + 1
            ? FESTIVE.SNOW_SHADE
            : FESTIVE.GOLD_DARK,
        )
      }
    }
  }
  return top
}

function field(x: number, dy: number, colors: RugColors): number {
  const period = 8
  const cx = x % period
  const [centre, edge] = colors.diamonds[Math.floor(x / period) % 2]
  const dx = Math.abs(cx - period / 2)
  const d = dx + Math.abs(dy)
  if (d === 0) return centre
  if (d === 1) return edge
  if (d === 2 && dy === 0) return edge
  if (cx === 0 && dy === 0) return colors.dot
  return colors.ground
}
