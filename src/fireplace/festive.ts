/**
 * Christmas and New Year dressing for the firebox. The garland, stockings,
 * banner and rug never move, so they are drawn once into an indexed layer
 * and packed with the light field; everything else is drawn each frame.
 */
import { IndexedBitmap } from './bitmap'
import type { SceneVariant } from './engine'
import {
  drawBanner,
  drawGarland,
  drawStockings,
  FairyLights,
} from './festive-garland'
import { Fireworks } from './festive-newyear'
import { ChristmasHearth } from './festive-christmas'
import { Confetti } from './festive-confetti'
import { Guests, guestWidth } from './festive-guests'
import { drawRug, NEW_YEAR_RUG } from './festive-rug'
import { Snow } from './festive-snow'
import { Countdown } from './festive-countdown'
import { widenHearth } from './festive-tree'
import {
  CHRISTMAS_BULBS,
  FESTIVE,
  FESTIVE_PALETTE,
  FESTIVE_SENSITIVITY,
  NEW_YEAR_BULBS,
} from './festive-sprites'
import { hearthSpans, type Span } from './halloween-hearth'
import type { Layout } from './layout'
import { bandAt, packLayer, SKIP_PIXEL, type LightField } from './lighting'
import { buildPaletteTables, SCENE_COLORS } from './palettes'
import { createRng, type Rng } from './prng'
import { glowColor, type FlameColor } from './ramps'

export type FestiveKind = 'christmas' | 'new_year'

/**
 * The year a New Year banner wishes for: from midsummer on it is next year's,
 * so the last days of December already show the year that is coming.
 */
export function festiveYear(date: Date): number {
  return date.getFullYear() + (date.getMonth() >= 6 ? 1 : 0)
}

export class FestiveDecor {
  private readonly width: number
  private readonly height: number
  private readonly light: LightField
  private readonly layer: Uint8Array
  private readonly layerBottom: number
  private readonly floorTop: number
  private readonly tables: Uint32Array[]
  private readonly rng: Rng
  private readonly scale: number
  private readonly ground: number
  private readonly spans: Span[]
  private readonly lights: FairyLights

  private christmas: ChristmasHearth | null = null
  private snow: Snow | null = null
  private countdown: Countdown | null = null
  private guests: Guests | null = null
  private confetti: Confetti | null = null
  private fireworks: Fireworks | null = null

  constructor(
    layout: Layout,
    light: LightField,
    variant: SceneVariant,
    flame: FlameColor,
    seed: number,
    kind: FestiveKind,
    year: number,
    clock: () => number,
  ) {
    this.width = layout.width
    this.height = layout.height
    this.light = light
    // A separate stream, so dressing the hearth does not change the flames.
    const rng = createRng(seed ^ 0x2c1b3c6d)
    this.rng = rng
    this.tables = buildPaletteTables(
      FESTIVE_PALETTE,
      glowColor(flame),
      FESTIVE_SENSITIVITY,
    )
    const short = Math.min(this.width, this.height)
    this.scale = short >= 190 ? 2 : 1
    this.ground = layout.ashBed.y + 1
    this.spans = variant === 'hearth' ? hearthSpans(layout) : []

    const bmp = new IndexedBitmap(this.width, this.height)
    bmp.fill(FESTIVE.TRANSPARENT)
    const garland = drawGarland(bmp, this.scale, rng)
    const hung =
      kind === 'christmas'
        ? drawStockings(bmp, garland, this.scale, rng)
        : drawBanner(bmp, garland, `HAPPY ${year}`)
    this.layerBottom = Math.min(this.height, Math.max(garland.bottom, hung) + 2)
    if (kind === 'christmas') {
      this.dressForChristmas(variant === 'hearth')
      this.floorTop =
        variant === 'hearth' ? drawRug(bmp, layout.ashBed) : this.height
    } else {
      this.floorTop =
        variant === 'hearth'
          ? drawRug(bmp, layout.ashBed, NEW_YEAR_RUG)
          : this.height
      this.dressForNewYear(year, clock)
    }
    this.layer = packLayer(bmp.data, this.width, this.height, light, true)
    this.lights = new FairyLights(
      garland.bulbs,
      kind === 'christmas' ? CHRISTMAS_BULBS : NEW_YEAR_BULBS,
      this.scale,
      rng,
    )
  }

  tick(): void {
    this.lights.tick()
    this.christmas?.tick()
    this.snow?.tick()
    if (this.countdown?.tick()) {
      this.fireworks?.finale(30 * 30)
      this.guests?.midnight()
      this.confetti?.midnight()
    }
    this.guests?.tick(this.countdown?.finalSeconds ?? false)
    this.confetti?.tick()
    this.fireworks?.tick()
  }

  paint(pixels: Uint32Array, flickerIndex: number): void {
    const table = this.tables[flickerIndex]
    const plot = (x: number, y: number, color: number) => {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
      const band = bandAt(this.light, x, y)
      pixels[y * this.width + x] = table[band * SCENE_COLORS + color]
    }

    const bands: [number, number][] = [
      [0, this.layerBottom],
      [this.floorTop, this.height],
    ]
    for (const [from, to] of bands) {
      for (let i = from * this.width; i < to * this.width; i++) {
        const packed = this.layer[i]
        if (packed !== SKIP_PIXEL) pixels[i] = table[packed]
      }
    }
    this.lights.paint(pixels, this.width, this.height)

    this.christmas?.draw(plot, pixels, this.width, this.height)
    this.guests?.draw(plot)
    this.confetti?.draw(plot)
    this.snow?.draw(plot)
    this.fireworks?.draw(pixels)
    // Over the fireworks, so the big numbers at midnight stay readable.
    this.countdown?.draw(plot, pixels)
  }

  private dressForChristmas(hearth: boolean): void {
    const top = this.layerBottom + 2 * this.scale
    this.christmas = new ChristmasHearth({
      width: this.width,
      height: this.height,
      ground: this.ground,
      spans: this.spans,
      sky: {
        top,
        bottom: Math.max(
          top,
          Math.round(this.height * 0.34) - 14 * (this.scale + 1),
        ),
      },
      scale: this.scale,
      rng: this.rng,
    })
    this.snow = new Snow(
      this.width,
      this.height,
      hearth ? [0.28, 0.5] : [0.1, 0.25],
      this.scale,
      this.rng,
    )
  }

  private dressForNewYear(year: number, clock: () => number): void {
    const short = Math.min(this.width, this.height)
    this.countdown = new Countdown(
      this.width,
      this.height,
      this.layerBottom,
      Math.max(1, Math.round(short / 80)),
      year,
      clock,
    )
    this.fireworks = new Fireworks(
      this.width,
      this.height,
      {
        top: this.countdown.bottom + 4 * this.scale,
        bottom: Math.round(this.height * 0.42),
      },
      this.scale + 1,
      this.rng,
    )
    const guestScale = this.scale * 2
    this.guests = new Guests(
      this.guestSpots(guestWidth(guestScale)),
      this.width,
      this.ground,
      guestScale,
      this.rng,
    )
    this.confetti = new Confetti(
      this.width,
      this.height,
      // The inferno has no floor for confetti to settle on.
      this.floorTop < this.height ? this.floorTop : null,
      guestScale,
      this.rng,
      this.countdown.done,
    )
  }

  private guestSpots(w: number): number[] {
    const spots: number[] = []
    for (const span of widenHearth(this.spans, this.width)) {
      const room = span.to - span.from
      const count = room >= 2 * w + 12 ? 2 : room >= w ? 1 : 0
      const gap = (room - count * w) / (count + 1)
      for (let i = 0; i < count; i++) {
        spots.push(Math.round(span.from + gap + i * (w + gap)))
      }
    }
    return spots
  }
}
