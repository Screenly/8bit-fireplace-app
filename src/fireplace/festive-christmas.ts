/**
 * The Christmas hearth: the tree, presents dropped by the sleigh and a kid
 * who carries them off.
 */
import { Kid } from './festive-kid'
import { makePresent, placePresents, type Present } from './festive-presents'
import { Sleigh } from './festive-sleigh'
import { plantTree, widenHearth, type ChristmasTree } from './festive-tree'
import { freeSpot, type Span } from './halloween-hearth'
import { drawSprite, type Plot, type Sprite } from './halloween-sprites'
import { randRange, type Rng } from './prng'

interface Toss {
  sprite: Sprite
  from: { x: number; y: number }
  x: number
  t: number
}

const TOSS_TICKS = 45
const KEEP = 1

export interface ChristmasOptions {
  width: number
  height: number
  ground: number
  spans: Span[]
  sky: { top: number; bottom: number }
  scale: number
  rng: Rng
}

export class ChristmasHearth {
  private readonly presents: Present[] = []
  private readonly tosses: Toss[] = []
  private planned: { sprite: Sprite; x: number }[] = []
  private readonly tree: ChristmasTree | null
  private readonly sleigh: Sleigh
  private readonly kid: Kid | null
  private readonly ground: number
  private readonly spans: Span[]
  private readonly scale: number
  private readonly rng: Rng

  constructor(o: ChristmasOptions) {
    this.ground = o.ground
    this.spans = widenHearth(o.spans, o.width)
    this.scale = o.scale
    this.rng = o.rng
    this.tree = plantTree(this.spans, o.width, o.height, o.ground, o.rng)
    this.presents.push(
      ...placePresents(this.spans, o.rng, o.scale, this.occupied(), 2),
    )
    this.sleigh = new Sleigh(o.width, o.sky, o.scale + 1, o.rng)
    this.kid =
      o.spans.length > 0 ? new Kid(o.width, o.ground, o.scale * 3, o.rng) : null
  }

  tick(): void {
    this.tree?.tick()

    this.sleigh.tick()
    if (this.sleigh.justStarted) this.planDrops()
    this.dropFromSleigh()

    for (let i = this.tosses.length - 1; i >= 0; i--) {
      const toss = this.tosses[i]
      if (++toss.t < TOSS_TICKS) continue
      this.tosses.splice(i, 1)
      this.presents.push({ sprite: toss.sprite, x: toss.x })
    }

    if (this.kid) {
      if (this.kid.ready) {
        if (this.presents.length > KEEP) {
          const pick =
            this.presents[Math.floor(this.rng() * this.presents.length)]
          this.kid.fetch(pick)
        } else {
          this.kid.later()
        }
      }
      const taken = this.kid.tick()
      if (taken) this.presents.splice(this.presents.indexOf(taken), 1)
    }
  }

  draw(plot: Plot, pixels: Uint32Array, width: number, height: number): void {
    this.sleigh.draw(plot, pixels, width, height)
    this.tree?.draw(plot, pixels, width, height)
    for (const p of this.presents) {
      drawSprite(plot, p.sprite, p.x, this.ground - p.sprite.h)
    }
    for (const toss of this.tosses) {
      const u = toss.t / TOSS_TICKS
      const toY = this.ground - toss.sprite.h
      const arc = 22 * this.scale * 4 * u * (1 - u)
      const x = toss.from.x + (toss.x - toss.from.x) * u
      const y = toss.from.y + (toY - toss.from.y) * u - arc
      drawSprite(plot, toss.sprite, x, y)
    }
    this.kid?.draw(plot)
  }

  /**
   * Everything standing on the hearth, or on its way there. Presents can go
   * in front of the tree's lower branches, just not on its pot.
   */
  private occupied(): { x: number; sprite: { w: number } }[] {
    const tree = this.tree
    const pot = tree ? Math.ceil(tree.width * 0.16) + 1 : 0
    return [
      ...(tree
        ? [
            {
              x: Math.round(tree.x + tree.width / 2 - pot),
              sprite: { w: pot * 2 },
            },
          ]
        : []),
      ...this.presents,
      ...this.tosses.map((t) => ({ x: t.x, sprite: t.sprite })),
      ...this.planned,
    ]
  }

  private spot(sprite: Sprite): number | null {
    if (this.spans.length === 0) return null
    return freeSpot(this.spans, this.occupied(), sprite.w, this.rng)
  }

  private planDrops(): void {
    this.planned = []
    const count = randRange(this.rng, 1, 2)
    for (let i = 0; i < count; i++) {
      const sprite = makePresent(this.rng, 17, this.scale)
      const x = this.spot(sprite)
      if (x !== null) this.planned.push({ sprite, x })
    }
  }

  private dropFromSleigh(): void {
    if (!this.sleigh.active) {
      this.planned = []
      return
    }
    const { x, y } = this.sleigh.sack
    const heading = this.sleigh.heading
    this.planned = this.planned.filter((p) => {
      const centre = p.x + p.sprite.w / 2
      const over = heading > 0 ? x >= centre : x <= centre
      if (over) this.toss(p.sprite, { x: x - p.sprite.w / 2, y }, p.x)
      return !over
    })
  }

  private toss(sprite: Sprite, from: { x: number; y: number }, x: number) {
    this.tosses.push({ sprite, from, x, t: 0 })
  }
}
