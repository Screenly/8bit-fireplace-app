/**
 * The garland across the top of the firebox, its fairy lights, and the
 * stockings or banner hung from it.
 */
import type { IndexedBitmap } from './bitmap'
import { packHex } from './colors'
import { BOW, FESTIVE, GLYPH_H, STOCKINGS, textPixels } from './festive-sprites'
import { drawSprite, flipped, type Sprite } from './halloween-sprites'
import { randRange, type Rng } from './prng'

export interface Garland {
  readonly anchors: readonly number[]
  readonly bottom: number
  readonly curve: (x: number) => number
  readonly thickness: number
  readonly bulbs: readonly { x: number; y: number }[]
}

export function stamp(
  bmp: IndexedBitmap,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
): void {
  drawSprite((px, py, c) => bmp.set(px, py, c), sprite, x, y, scale)
}

export function drawGarland(
  bmp: IndexedBitmap,
  scale: number,
  rng: Rng,
): Garland {
  const { width, height } = bmp
  const short = Math.min(width, height)
  const swags = Math.max(2, Math.round(width / 55))
  const swagW = width / swags
  const thickness = Math.max(3, Math.round(short * 0.028))
  const sag = Math.max(3, Math.round(Math.min(height * 0.09, swagW * 0.2)))
  const curve = (x: number) => {
    const t = (x % swagW) / swagW
    return 1 + sag * 4 * t * (1 - t)
  }

  for (let x = 0; x < width; x++) {
    const top = Math.round(curve(x))
    for (let dy = -1; dy <= thickness; dy++) {
      const r = rng()
      let color: number
      if (dy === -1 || dy === thickness) {
        if (r > 0.4) continue
        color = FESTIVE.PINE_DARK
      } else if (r < 0.03) {
        color = FESTIVE.RED_LIGHT
      } else if (r < 0.06) {
        color = FESTIVE.GOLD
      } else {
        const shade = rng() + (dy / thickness) * 0.6
        color =
          shade < 0.45
            ? FESTIVE.PINE_LIGHT
            : shade < 1.05
              ? FESTIVE.PINE
              : FESTIVE.PINE_DARK
      }
      bmp.set(x, top + dy, color)
    }
  }

  const bulbs: { x: number; y: number }[] = []
  for (let i = 0; i < swags; i++) {
    const count = Math.max(2, Math.round(swagW / (7 * scale)))
    for (let k = 0; k < count; k++) {
      const x = Math.round(i * swagW + ((k + 0.5) / count) * swagW)
      bulbs.push({ x, y: Math.round(curve(x)) + thickness })
    }
  }

  const anchors: number[] = []
  for (let i = 1; i < swags; i++) anchors.push(Math.round(i * swagW))
  for (const x of anchors) stamp(bmp, BOW, x - (BOW.w >> 1), 0, 1)

  const bottom = 1 + sag + thickness + 2 * scale + 1
  return { anchors, bottom, curve, thickness, bulbs }
}

export function drawStockings(
  bmp: IndexedBitmap,
  garland: Garland,
  scale: number,
  rng: Rng,
): number {
  const { anchors } = garland
  const most = STOCKINGS.length
  const picks =
    anchors.length <= most
      ? anchors
      : Array.from(
          { length: most },
          (_, i) =>
            anchors[Math.round((i * (anchors.length - 1)) / (most - 1))],
        )
  const designs = shuffle([...STOCKINGS], rng)
  const top = Math.round(garland.thickness * 0.6) + 1
  let bottom = 0
  picks.forEach((x, i) => {
    const design = designs[i % designs.length]
    const art = rng() < 0.5 ? design : flipped(design)
    stamp(bmp, art, x - Math.round((art.w * scale) / 2), top, scale)
    bottom = Math.max(bottom, top + art.h * scale)
  })
  // The bows go back on top, so each stocking hangs from one.
  for (const x of picks) stamp(bmp, BOW, x - (BOW.w >> 1), 0, 1)
  return bottom
}

export function drawBanner(
  bmp: IndexedBitmap,
  garland: Garland,
  text: string,
): number {
  const { width, height } = bmp
  const { w: textW, on } = textPixels(text)
  const short = Math.min(width, height)
  const s = Math.max(
    1,
    Math.min(
      Math.floor((width * 0.6) / textW),
      Math.max(1, Math.round(short / 80)),
    ),
  )
  const pad = 2 * s
  const w = textW * s + pad * 2
  const h = GLYPH_H * s + s + pad * 2
  const left = Math.round((width - w) / 2)
  const top = garland.bottom + 2 * s

  for (const x of [left + pad, left + w - pad - 1]) {
    const from = Math.round(garland.curve(x)) + garland.thickness
    bmp.line(x, from, x, top, FESTIVE.GOLD_DARK)
  }

  const tail = 3 * s
  const mid = (h - 1) / 2
  for (let y = 0; y < h; y++) {
    const notch = Math.round(2 * s * (1 - Math.abs(y - mid) / mid))
    for (let x = notch; x < tail + s; x++) {
      bmp.set(left - tail + x, top + y + s, FESTIVE.RED_DARK)
      bmp.set(left + w + tail - 1 - x, top + y + s, FESTIVE.RED_DARK)
    }
  }
  for (let y = 0; y < h; y++) {
    const color =
      y < s ? FESTIVE.RED_LIGHT : y >= h - s ? FESTIVE.RED_DARK : FESTIVE.RED
    bmp.hLine(left, top + y, w, color)
  }

  for (const [dy, color] of [
    [s, FESTIVE.RED_DARK],
    [0, FESTIVE.GOLD],
  ] as const) {
    on.forEach((row, gy) => {
      row.forEach((lit, gx) => {
        if (!lit) return
        bmp.fillRect(left + pad + gx * s, top + pad + gy * s + dy, s, s, color)
      })
    })
  }
  return top + h + s
}

type LightMode = 'steady' | 'alternate' | 'chase' | 'twinkle'
const LIGHT_MODES: readonly LightMode[] = [
  'steady',
  'alternate',
  'chase',
  'twinkle',
]
const MODE_TICKS: [number, number] = [30 * 8, 30 * 15]

export class FairyLights {
  private readonly lit: Uint32Array
  private readonly unlit: Uint32Array
  private readonly on: boolean[]
  private mode: LightMode = 'steady'
  private modeTicks: number
  private ticks = 0

  constructor(
    private readonly bulbs: readonly { x: number; y: number }[],
    colors: readonly [string, string][],
    private readonly scale: number,
    private readonly rng: Rng,
  ) {
    const color = (i: number) => colors[i % colors.length]
    this.lit = Uint32Array.from(bulbs, (_, i) => packHex(color(i)[0]))
    this.unlit = Uint32Array.from(bulbs, (_, i) => packHex(color(i)[1]))
    this.on = bulbs.map(() => true)
    this.modeTicks = randRange(rng, ...MODE_TICKS)
  }

  tick(): void {
    this.ticks++
    if (--this.modeTicks <= 0) {
      const others = LIGHT_MODES.filter((m) => m !== this.mode)
      this.mode = others[Math.floor(this.rng() * others.length)]
      this.modeTicks = randRange(this.rng, ...MODE_TICKS)
    }
    const { on } = this
    switch (this.mode) {
      case 'steady':
        on.fill(true)
        break
      case 'alternate': {
        const phase = Math.floor(this.ticks / 15) % 2
        for (let i = 0; i < on.length; i++) on[i] = i % 2 === phase
        break
      }
      case 'chase': {
        const step = Math.floor(this.ticks / 4)
        for (let i = 0; i < on.length; i++) on[i] = (i + step) % 3 !== 0
        break
      }
      case 'twinkle':
        for (let i = 0; i < on.length; i++) {
          if (this.rng() < 0.04) on[i] = !on[i]
        }
        break
    }
  }

  paint(pixels: Uint32Array, width: number, height: number): void {
    const s = this.scale
    this.bulbs.forEach((bulb, i) => {
      const color = this.on[i] ? this.lit[i] : this.unlit[i]
      for (let dy = 0; dy < 2 * s; dy++) {
        for (let dx = 0; dx < s; dx++) {
          const x = bulb.x + dx
          const y = bulb.y + dy
          if (x < 0 || y < 0 || x >= width || y >= height) continue
          pixels[y * width + x] = color
        }
      }
    })
  }
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}
