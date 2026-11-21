/**
 * A decorated Christmas tree, grown procedurally at the scene's own pixel
 * size so finer screens get a more detailed tree.
 */
import { IndexedBitmap } from './bitmap'
import { packHex } from './colors'
import { CHRISTMAS_BULBS, FESTIVE, festiveSprite } from './festive-sprites'
import {
  colorAt,
  drawPotAndTrunk,
  growBranches,
  isPine,
  outline,
  type Growth,
} from './festive-tree-growth'
import type { Span } from './halloween-hearth'
import { drawSprite, type Plot, type Sprite } from './halloween-sprites'
import { randRange, type Rng } from './prng'

const STAR_SMALL = festiveSprite(['..Y..', '.YYY.', 'YYYYY', '.YYY.', '.Y.Y.'])
const STAR_BIG = festiveSprite([
  '...Y...',
  '...Y...',
  '..YYY..',
  'YYYYYYY',
  '.YYYYY.',
  '..YYY..',
  '.YY.YY.',
  '.Y...Y.',
])

const ORNAMENTS = [
  FESTIVE.RED_LIGHT,
  FESTIVE.BLUE,
  FESTIVE.GOLD,
  FESTIVE.SNOW,
  FESTIVE.RED,
]

const MIN_TREE_W = 15

function treeHeight(w: number): number {
  return Math.round(w * 1.55)
}

interface Light {
  x: number
  y: number
  lit: number
  unlit: number
  phase: number
  speed: number
}

const STAR_GLOW = [packHex('#fff6c0'), packHex('#ffffff')]
const SPARKLE = packHex('#fff2a0')

function drapeGarland(
  bmp: IndexedBitmap,
  top: number,
  bottom: number,
  rng: Rng,
): void {
  const strands = Math.max(2, Math.round((bottom - top) / 16))
  for (let k = 0; k < strands; k++) {
    const y0 = top + ((k + 0.8) / (strands + 0.6)) * (bottom - top)
    const tilt = (rng() - 0.5) * 0.5
    const sag = 2 + (bottom - top) / (strands * 4)
    for (let x = 0; x < bmp.width; x++) {
      const u = x / (bmp.width - 1)
      const y = Math.round(
        y0 + tilt * (x - bmp.width / 2) + 4 * u * (1 - u) * sag,
      )
      if (!isPine(colorAt(bmp, x, y))) continue
      bmp.set(x, y, x % 3 === 0 ? FESTIVE.SNOW : FESTIVE.GOLD)
    }
  }
}

function hangOrnament(
  bmp: IndexedBitmap,
  x: number,
  y: number,
  big: boolean,
  color: number,
): void {
  bmp.set(x, y, FESTIVE.GOLD_DARK)
  if (big) {
    bmp.fillRect(x - 1, y + 2, 3, 2, color)
    bmp.set(x, y + 1, color)
    bmp.set(x, y + 4, color)
    bmp.set(x - 1, y + 2, FESTIVE.SNOW)
  } else {
    bmp.set(x, y + 1, color)
  }
}

function decorate(bmp: IndexedBitmap, growth: Growth, rng: Rng): void {
  const big = bmp.width >= 34
  for (const [x, y] of growth.tips) {
    if (rng() < 0.45) continue
    const color = ORNAMENTS[Math.floor(rng() * ORNAMENTS.length)]
    const tx = Math.max(
      1,
      Math.min(bmp.width - 2, x - Math.sign(x - bmp.width / 2) * 2),
    )
    hangOrnament(bmp, tx, y - 2, big, color)
  }
  const pine = innerPine(bmp)
  const more = Math.round(pine.length / (big ? 130 : 70))
  for (let n = 0; n < more && pine.length > 0; n++) {
    const [x, y] = pine[Math.floor(rng() * pine.length)]
    const color = ORNAMENTS[Math.floor(rng() * ORNAMENTS.length)]
    if (big) hangOrnament(bmp, x, y, true, color)
    else bmp.set(x, y, color)
  }
}

function innerPine(bmp: IndexedBitmap): [number, number][] {
  const pine: [number, number][] = []
  for (let py = 0; py < bmp.height; py++) {
    for (let px = 1; px < bmp.width - 1; px++) {
      if (
        isPine(colorAt(bmp, px, py)) &&
        isPine(colorAt(bmp, px - 1, py)) &&
        isPine(colorAt(bmp, px + 1, py))
      ) {
        pine.push([px, py])
      }
    }
  }
  return pine
}

function stringLights(bmp: IndexedBitmap, rng: Rng): Light[] {
  const free = innerPine(bmp)
  const count = Math.max(5, Math.round(free.length / 24))
  const lights: Light[] = []
  for (let n = 0; n < count && free.length > 0; n++) {
    const [x, y] = free.splice(Math.floor(rng() * free.length), 1)[0]
    const [lit, unlit] = CHRISTMAS_BULBS[n % CHRISTMAS_BULBS.length]
    lights.push({
      x,
      y,
      lit: packHex(lit),
      unlit: packHex(unlit),
      phase: rng() * Math.PI * 2,
      speed: 0.04 + rng() * 0.08,
    })
  }
  return lights
}

export class ChristmasTree {
  readonly sprite: Sprite
  private readonly lights: Light[]
  private readonly star: { x: number; y: number }
  private readonly dot: number
  private ticks = 0
  private sparkle = 0

  constructor(
    readonly x: number,
    private readonly ground: number,
    w: number,
    towardFire: number,
    private readonly rng: Rng,
  ) {
    // Odd, so the trunk and the star sit on the exact middle.
    const width = w | 1
    const bmp = new IndexedBitmap(width, treeHeight(width))
    bmp.fill(FESTIVE.TRANSPARENT)
    const star = width >= 34 ? STAR_BIG : STAR_SMALL
    const top = star.h - 2
    const potH = drawPotAndTrunk(bmp, top + 4)
    const bottom =
      bmp.height - potH - Math.max(2, Math.round(bmp.height * 0.05))
    const growth = growBranches(bmp, top, bottom, towardFire, rng)
    outline(bmp)
    drapeGarland(bmp, top + 4, bottom, rng)
    decorate(bmp, growth, rng)
    this.lights = stringLights(bmp, rng)
    const cx = width >> 1
    drawSprite((px, py, c) => bmp.set(px, py, c), star, cx - (star.w >> 1), 0)
    this.sprite = { w: width, h: bmp.height, pixels: bmp.data }
    this.star = { x: cx, y: star === STAR_BIG ? 4 : 2 }
    this.dot = width >= 70 ? 2 : 1
  }

  get width(): number {
    return this.sprite.w
  }

  tick(): void {
    this.ticks++
    if (this.sparkle > 0) this.sparkle--
    else if (this.rng() < 0.012) this.sparkle = randRange(this.rng, 8, 16)
  }

  draw(plot: Plot, pixels: Uint32Array, width: number, height: number): void {
    const top = this.ground - this.sprite.h
    drawSprite(plot, this.sprite, this.x, top)

    const put = (px: number, py: number, color: number, size = 1) => {
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = this.x + px + dx
          const y = top + py + dy
          if (x < 0 || y < 0 || x >= width || y >= height) continue
          pixels[y * width + x] = color
        }
      }
    }
    for (const light of this.lights) {
      const on = Math.sin(this.ticks * light.speed + light.phase) > -0.3
      put(light.x, light.y, on ? light.lit : light.unlit, this.dot)
    }
    const { x, y } = this.star
    put(x, y, STAR_GLOW[Math.floor(this.ticks / 10) % 2])
    if (this.sparkle > 0) {
      const reach = this.sparkle > 6 ? 5 : 4
      put(x - reach, y, SPARKLE)
      put(x + reach, y, SPARKLE)
      put(x, y - reach + 1, SPARKLE)
    }
  }
}

export function widenHearth(spans: Span[], width: number): Span[] {
  if (spans.length !== 2) return spans
  const reach = Math.round(width * 0.06)
  return [
    { from: spans[0].from, to: spans[0].to + reach },
    { from: spans[1].from - reach, to: spans[1].to },
  ]
}

export function plantTree(
  spans: Span[],
  width: number,
  height: number,
  ground: number,
  rng: Rng,
): ChristmasTree | null {
  if (spans.length === 0) return null
  const roomy = [...spans].sort(
    (a, b) => b.to - b.from - (a.to - a.from) || rng() - 0.5,
  )[0]
  // A portrait hearth is too narrow for much of a tree, so there its
  // branches may reach out over the end of the log pile.
  const overhang = height > width ? Math.round(width * 0.12) : 0
  const room = roomy.to - roomy.from - 2 + overhang
  const w = Math.min(Math.round(height * 0.38), room)
  if (w < MIN_TREE_W) return null
  const left = roomy === spans[0]
  const x = left ? roomy.from + 1 : roomy.to - (w | 1) - 1
  return new ChristmasTree(x, ground, w, left ? 1 : -1, rng)
}
