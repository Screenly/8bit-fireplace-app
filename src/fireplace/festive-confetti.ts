/**
 * Confetti that comes down at midnight and the party mess left on the floor.
 */
import { FESTIVE, festiveSprite } from './festive-sprites'
import {
  drawSprite,
  flipped,
  type Plot,
  type Sprite,
} from './halloween-sprites'
import { randRange, type Rng } from './prng'

const COLORS = [
  FESTIVE.RED_LIGHT,
  FESTIVE.GOLD,
  FESTIVE.BLUE,
  FESTIVE.SNOW,
  FESTIVE.PINE_LIGHT,
]

const HAT = festiveSprite(['w....', 'rr...', 'rYrr.', 'rrYrr', '.kkkk'])
const HAT_BLUE = festiveSprite(['w....', 'UU...', 'UwUU.', 'UUwUU', '.kkkk'])
const BLOWER = festiveSprite(['..rY', '.r..', 'rYrY'])
const RATTLE = festiveSprite(['.YY.', 'YrrY', '.YY.', '..k.', '..k.'])

const SHOWER_TICKS = 30 * 6

interface Bit {
  x: number
  y: number
  vy: number
  sway: number
  color: number
  floor: number
}

interface Prop {
  sprite: Sprite
  x: number
}

export class Confetti {
  private readonly falling: Bit[] = []
  private readonly settled: { x: number; y: number; color: number }[] = []
  private readonly props: Prop[] = []
  private shower = 0
  private showing: boolean
  private ticks = 0

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly floor: number,
    private readonly scale: number,
    private readonly rng: Rng,
    over: boolean,
  ) {
    this.showing = over
    this.layOutProps()
    if (over) {
      const count = Math.round(width * 0.9)
      for (let i = 0; i < count; i++) this.settled.push(this.landing())
    }
  }

  midnight(): void {
    this.shower = SHOWER_TICKS
  }

  tick(): void {
    this.ticks++
    if (this.shower > 0) {
      this.shower--
      for (let i = 0; i < 4; i++) this.drop()
      if (this.shower === 0) this.showing = true
    }
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const b = this.falling[i]
      b.y += b.vy
      b.x += Math.sin(this.ticks * 0.15 + b.sway) * 0.4
      if (b.y >= b.floor) {
        this.falling.splice(i, 1)
        if (this.settled.length < this.width * 1.2) {
          this.settled.push({ x: Math.round(b.x), y: b.floor, color: b.color })
        }
      }
    }
  }

  draw(plot: Plot): void {
    for (const c of this.settled) plot(c.x, c.y, c.color)
    if (this.showing) {
      const s = this.scale
      for (const p of this.props) {
        drawSprite(plot, p.sprite, p.x, this.height - 1 - p.sprite.h * s, s)
      }
    }
    for (const b of this.falling) {
      const x = Math.round(b.x)
      const y = Math.round(b.y)
      plot(x, y, b.color)
      if (Math.floor((this.ticks + b.sway * 10) / 4) % 2 === 0) {
        plot(x + 1, y, b.color)
      }
    }
  }

  private landing(): { x: number; y: number; color: number } {
    return {
      x: Math.floor(this.rng() * this.width),
      y: randRange(this.rng, this.floor, this.height - 2),
      color: COLORS[Math.floor(this.rng() * COLORS.length)],
    }
  }

  private drop(): void {
    const land = this.landing()
    this.falling.push({
      x: land.x,
      y: -2 - this.rng() * 10,
      vy: 0.6 + this.rng() * 0.8,
      sway: this.rng() * Math.PI * 2,
      color: land.color,
      floor: land.y,
    })
  }

  private layOutProps(): void {
    const s = this.scale
    const pieces = [HAT, HAT_BLUE, BLOWER, RATTLE]
    const slot = this.width / pieces.length
    pieces.forEach((sprite, i) => {
      const art = this.rng() < 0.5 ? sprite : flipped(sprite)
      const room = Math.max(0, slot - art.w * s)
      this.props.push({
        sprite: art,
        x: Math.round(i * slot + this.rng() * room),
      })
    })
  }
}
