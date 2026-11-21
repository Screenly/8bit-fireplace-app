/**
 * Santa's sleigh and two reindeer flying across the top of the firebox.
 */
import { packHex } from './colors'
import { FESTIVE, festiveSprite } from './festive-sprites'
import {
  drawSprite,
  flipped,
  type Plot,
  type Sprite,
} from './halloween-sprites'
import { randRange, type Rng } from './prng'

const SLEIGH = festiveSprite([
  '...........w........',
  '..........rr........',
  '..YgU....rrrr.......',
  '.yyyyy...wwww.......',
  '.yyyyy...fkff.......',
  '.yyyyy..wwwwwr......',
  'YYYYYYYYYYYYYYYYYY.Y',
  'rrrrrrrrrrrrrrrrrrrY',
  'drrrrrrrrrrrrrrrrrd.',
  '.dddddddddddddddd...',
  '..Y.....Y.....Y.....',
  'YYYYYYYYYYYYYYYYYYYY',
])

const DEER_BODY = [
  '........k..k.',
  '.........kk..',
  '.........yyy.',
  '........yykyN',
  'y.yyyyyyyyy..',
  '.yyyyyyyyyy..',
  '..yYYYYYyy...',
]
const DEER_LEGS = [
  ['..y.y...y.y..', '.y...y.y...y.'],
  ['..yy.....yy..', '...k......k..'],
]

const deer = (nose: string): Sprite[] =>
  DEER_LEGS.map((legs) =>
    festiveSprite([...DEER_BODY, ...legs].map((row) => row.replace('N', nose))),
  )

const LEAD = deer('R')
const DEER = deer('k')

const FIRST_WAIT: [number, number] = [30 * 6, 30 * 15]
const WAIT: [number, number] = [30 * 30, 30 * 60]
const GAP = 2

const NOSE_GLOW = [packHex('#ff5a3a'), packHex('#ffb0a0')]
const STARDUST = [
  packHex('#ffffff'),
  packHex('#fff2a0'),
  packHex('#e2ad30'),
  packHex('#8a5a14'),
]

interface Dust {
  x: number
  y: number
  life: number
}

export class Sleigh {
  justStarted = false

  private flying = false
  private wait: number
  private x = 0
  private y = 0
  private dir: 1 | -1 = 1
  private ticks = 0
  private readonly dust: Dust[] = []
  private readonly length: number

  constructor(
    private readonly width: number,
    private readonly band: { top: number; bottom: number },
    private readonly scale: number,
    private readonly rng: Rng,
  ) {
    this.length = (SLEIGH.w + GAP + DEER[0].w + GAP + LEAD[0].w) * scale
    this.wait = randRange(rng, ...FIRST_WAIT)
  }

  get active(): boolean {
    return this.flying
  }

  get sack(): { x: number; y: number } {
    const s = this.scale
    const offset = 3 * s
    const left = this.dir > 0 ? this.x + offset : this.x + this.length - offset
    return { x: left, y: this.y + 2 * s }
  }

  get heading(): 1 | -1 {
    return this.dir
  }

  tick(): void {
    this.ticks++
    this.justStarted = false
    for (let i = this.dust.length - 1; i >= 0; i--) {
      this.dust[i].y += 0.08
      if (--this.dust[i].life <= 0) this.dust.splice(i, 1)
    }
    if (!this.flying) {
      if (--this.wait > 0) return
      this.flying = true
      this.justStarted = true
      this.dir = this.rng() < 0.5 ? 1 : -1
      this.x = this.dir > 0 ? -this.length : this.width
      const { top, bottom } = this.band
      this.y = top + this.rng() * Math.max(0, bottom - top)
      return
    }
    this.x += this.dir * 0.9 * this.scale
    if (this.ticks % 2 === 0) {
      const tail = this.dir > 0 ? this.x : this.x + this.length
      this.dust.push({
        x: tail + (this.rng() - 0.5) * 4 * this.scale,
        y: this.y + (SLEIGH.h - 1) * this.scale + this.bob(0),
        life: randRange(this.rng, 20, 40),
      })
    }
    const gone = this.dir > 0 ? this.x > this.width : this.x < -this.length
    if (gone) {
      this.flying = false
      this.wait = randRange(this.rng, ...WAIT)
    }
  }

  draw(plot: Plot, pixels: Uint32Array, width: number, height: number): void {
    const s = this.scale
    const put = (x: number, y: number, color: number) => {
      for (let dy = 0; dy < s; dy++) {
        for (let dx = 0; dx < s; dx++) {
          const px = Math.round(x) + dx
          const py = Math.round(y) + dy
          if (px < 0 || py < 0 || px >= width || py >= height) continue
          pixels[py * width + px] = color
        }
      }
    }
    for (const d of this.dust) {
      const step = Math.min(STARDUST.length - 1, Math.floor((40 - d.life) / 10))
      if (d.life < 12 && d.life % 3 === 0) continue
      put(d.x, d.y, STARDUST[Math.max(0, step)])
    }
    if (!this.flying) return

    const frame = Math.floor(this.ticks / 6) % 2
    const right = this.dir > 0
    const pieces: [Sprite, number, number][] = [
      [SLEIGH, 0, 0],
      [DEER[frame], SLEIGH.w + GAP, 1],
      [LEAD[1 - frame], SLEIGH.w + GAP + DEER[0].w + GAP, 2],
    ]
    let reinFrom: { x: number; y: number } | null = null
    for (const [sprite, at, phase] of pieces) {
      const w = sprite.w * s
      const x = right ? this.x + at * s : this.x + this.length - at * s - w
      const y = this.y + this.bob(phase) + (sprite === SLEIGH ? 0 : 2 * s)
      drawSprite(plot, right ? sprite : flipped(sprite), x, y, s)
      const neck = {
        x: right
          ? x + (sprite === SLEIGH ? 13 : 9) * s
          : x + w - (sprite === SLEIGH ? 13 : 9) * s,
        y: y + (sprite === SLEIGH ? 5 : 4) * s,
      }
      if (reinFrom && sprite !== SLEIGH) {
        line(plot, reinFrom, neck, FESTIVE.GOLD_DARK)
      }
      if (sprite === SLEIGH) reinFrom = neck
      if (sprite === LEAD[0] || sprite === LEAD[1]) {
        const noseX = right ? x + w - s : x
        put(noseX, y + 3 * s, NOSE_GLOW[Math.floor(this.ticks / 8) % 2])
      }
    }
  }

  private bob(phase: number): number {
    return Math.round(Math.sin(this.ticks * 0.2 + phase * 1.3) * this.scale)
  }
}

function line(
  plot: Plot,
  a: { x: number; y: number },
  b: { x: number; y: number },
  color: number,
): void {
  const steps = Math.max(1, Math.round(Math.abs(b.x - a.x)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const sag = Math.sin(t * Math.PI) * 1.5
    plot(
      Math.round(a.x + (b.x - a.x) * t),
      Math.round(a.y + (b.y - a.y) * t + sag),
      color,
    )
  }
}
