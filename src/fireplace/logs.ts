/**
 * The firebox interior: sooty back wall, ash bed, glowing coals and the log
 * pile. The logs are drawn into an overlay that composites *after* the flames,
 * so the fire can lick up between them instead of sitting flatly on top.
 */
import type { IndexedBitmap } from './bitmap'
import type { Layout } from './layout'
import type { Rng } from './prng'
import { SCENE } from './palettes'

/** Sooty back wall and the bed of ash and coals the logs rest on. */
export function drawFirebox(
  bmp: IndexedBitmap,
  layout: Layout,
  rng: Rng,
): void {
  const { opening, ashBed } = layout
  bmp.fillArea(opening, SCENE.FIREBOX)

  const course = Math.max(2, Math.round(opening.h * 0.1))
  for (let y = opening.y + course; y < opening.y + opening.h; y += course) {
    bmp.hLine(opening.x, y, opening.w, SCENE.FIREBOX_BACK)
  }

  bmp.fillArea(ashBed, SCENE.IRON_DARK)
  for (let y = ashBed.y; y < ashBed.y + ashBed.h; y++) {
    const heat = 1 - (y - ashBed.y) / Math.max(1, ashBed.h)
    for (let x = ashBed.x; x < ashBed.x + ashBed.w; x++) {
      const roll = rng()
      if (roll < 0.07 * heat) bmp.set(x, y, SCENE.EMBER_HOT)
      else if (roll < 0.24 * heat) bmp.set(x, y, SCENE.EMBER_DARK)
      else if (roll < 0.34) bmp.set(x, y, SCENE.ASH)
    }
  }
}

/** Two iron andirons holding the pile off the ash. */
export function drawAndirons(bmp: IndexedBitmap, layout: Layout): void {
  const { logBed, ashBed } = layout
  const top = logBed.y + Math.round(logBed.h * 0.55)
  const height = ashBed.y + ashBed.h - top
  if (height < 2) return
  const inset = Math.max(1, Math.round(logBed.w * 0.06))
  for (const x of [logBed.x + inset, logBed.x + logBed.w - inset - 1]) {
    bmp.vLine(x, top, height, SCENE.IRON_MID)
    bmp.set(x, top, SCENE.IRON_DARK)
  }
  bmp.hLine(logBed.x + inset, top, logBed.w - inset * 2, SCENE.IRON_DARK)
}

/**
 * Three split logs. The tiers are deliberately off-centre and unequal —
 * a symmetric stack of same-sized bars reads as a staircase, not firewood.
 */
export function drawLogs(bmp: IndexedBitmap, layout: Layout, rng: Rng): void {
  const { logBed } = layout
  const thick = Math.max(3, Math.round(logBed.h * 0.4))
  const bottom = logBed.y + logBed.h
  const tiers = [
    { x: logBed.x, w: logBed.w, y: bottom - thick, t: thick, grain: 'right' },
    {
      x: logBed.x + Math.round(logBed.w * 0.07),
      w: Math.round(logBed.w * 0.78),
      y: bottom - thick * 2 + 1,
      t: thick,
      grain: 'left',
    },
    {
      x: logBed.x + Math.round(logBed.w * 0.38),
      w: Math.round(logBed.w * 0.45),
      y: bottom - thick * 3 + 2,
      t: Math.max(3, thick - 1),
      grain: 'right',
    },
  ] as const
  for (const tier of tiers) {
    if (tier.w < 3) continue
    drawLog(bmp, tier, rng)
  }
}

function shadeFor(row: number, thickness: number): number {
  const t = row / Math.max(1, thickness - 1)
  if (t < 0.1) return SCENE.LOG_HI
  if (t < 0.24) return SCENE.LOG_LIGHT
  if (t < 0.64) return SCENE.LOG_MID
  return SCENE.LOG_DARK
}

interface Tier {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly t: number
  readonly grain: 'left' | 'right'
}

function drawLog(bmp: IndexedBitmap, tier: Tier, rng: Rng): void {
  const { x, y, w, t } = tier
  for (let row = 0; row < t; row++) {
    const edge = row === 0 || row === t - 1 ? 1 : 0
    const shade = shadeFor(row, t)
    // The lit top edge is broken up so it reads as bark rather than a rule.
    const dashed = row === 0 && t > 3
    for (let col = edge; col < w - edge; col++) {
      if (dashed && rng() < 0.35) continue
      bmp.set(x + col, y + row, shade)
    }
  }
  drawBark(bmp, tier, rng)
  drawEndGrain(bmp, tier)
}

/** Short dark striations along the grain. */
function drawBark(bmp: IndexedBitmap, tier: Tier, rng: Rng): void {
  const { x, y, w, t } = tier
  const marks = Math.max(1, Math.round((w * t) / 14))
  for (let i = 0; i < marks; i++) {
    const row = 1 + Math.floor(rng() * Math.max(1, t - 2))
    const start = 1 + Math.floor(rng() * Math.max(1, w - 4))
    const length = 1 + Math.floor(rng() * 3)
    for (let col = start; col < Math.min(w - 1, start + length); col++) {
      bmp.set(x + col, y + row, SCENE.LOG_DARK)
    }
  }
}

/** The sawn end of a log, facing the viewer. */
function drawEndGrain(bmp: IndexedBitmap, tier: Tier): void {
  const { x, y, w, t } = tier
  if (t < 4) return
  const col = tier.grain === 'right' ? x + w - 1 : x
  for (let row = 1; row < t - 1; row++) bmp.set(col, y + row, SCENE.LOG_LIGHT)
  const middle = y + (t >> 1)
  bmp.set(col, middle, SCENE.LOG_DARK)
  bmp.set(col, middle - 1, SCENE.LOG_HI)
}
