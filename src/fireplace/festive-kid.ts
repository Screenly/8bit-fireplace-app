/**
 * A kid who sneaks in, grabs a present off the hearth and runs off with it.
 */
import { festiveSprite } from './festive-sprites'
import type { Present } from './festive-presents'
import { drawSprite, type Plot } from './halloween-sprites'
import { randRange, type Rng } from './prng'

const HEAD = [
  '..yyyy..',
  '.yyyyyy.',
  '.yffffy.',
  '.fkffkf.',
  '.ffffff.',
  '..fRRf..',
]
const BODY = ['.rwrwrw.', 'frwrwrwf', 'frwrwrwf', '.rwrwrw.']
const LEGS = [
  ['.rr..rr.', '.kk..kk.'],
  ['..rrrr..', '..kkkk..'],
]
const HEAD_UP = [
  'f.yyyy.f',
  'fyyyyyyf',
  'ryffffyr',
  'rfkffkfr',
  'rffffffr',
  '..fRRf..',
]
const BODY_UP = ['.rwrwrw.', '.rwrwrw.', '.rwrwrw.', '.rwrwrw.']

const WALK = LEGS.map((legs) => festiveSprite([...HEAD, ...BODY, ...legs]))
const CARRY = LEGS.map((legs) =>
  festiveSprite([...HEAD_UP, ...BODY_UP, ...legs]),
)

type Phase = 'waiting' | 'sneaking' | 'cheering' | 'running'

const FIRST_WAIT: [number, number] = [30 * 25, 30 * 50]
const WAIT: [number, number] = [30 * 20, 30 * 45]
const CHEER_TICKS = 24

export class Kid {
  private phase: Phase = 'waiting'
  private wait: number
  private x = 0
  private dir: 1 | -1 = 1
  private targetX = 0
  private present: Present | null = null
  private ticks = 0
  private cheer = 0
  private readonly w: number

  constructor(
    private readonly width: number,
    private readonly ground: number,
    private readonly scale: number,
    private readonly rng: Rng,
  ) {
    this.w = WALK[0].w * scale
    this.wait = randRange(rng, ...FIRST_WAIT)
  }

  get position(): number | null {
    return this.phase === 'waiting' ? null : this.x + this.w / 2
  }

  get ready(): boolean {
    return this.phase === 'waiting' && this.wait <= 0
  }

  later(): void {
    this.wait = randRange(this.rng, ...WAIT)
  }

  fetch(present: Present): void {
    this.present = present
    this.cheer = CHEER_TICKS
    this.go(present.x + present.sprite.w / 2)
  }

  private go(centre: number): void {
    this.dir = centre < this.width / 2 ? 1 : -1
    this.x = this.dir > 0 ? -this.w : this.width
    this.targetX = Math.round(centre - this.w / 2)
    this.phase = 'sneaking'
  }

  tick(): Present | null {
    this.ticks++
    switch (this.phase) {
      case 'waiting':
        if (this.wait > 0) this.wait--
        return null
      case 'sneaking': {
        this.x += this.dir * 0.6 * this.scale
        const there =
          this.dir > 0 ? this.x >= this.targetX : this.x <= this.targetX
        if (!there) return null
        this.x = this.targetX
        this.phase = 'cheering'
        return this.present
      }
      case 'cheering':
        if (--this.cheer <= 0) {
          this.phase = 'running'
          this.dir = this.dir > 0 ? -1 : 1
        }
        return null
      case 'running': {
        this.x += this.dir * 1.1 * this.scale
        const gone = this.x < -this.w - 40 || this.x > this.width + 40
        if (gone) {
          this.phase = 'waiting'
          this.present = null
          this.later()
        }
        return null
      }
    }
  }

  draw(plot: Plot): void {
    if (this.phase === 'waiting') return
    const s = this.scale
    const step = Math.floor(this.ticks / (this.phase === 'running' ? 4 : 7)) % 2
    const cheering = this.phase === 'cheering'
    const carrying = this.present !== null && this.phase !== 'sneaking'
    const jump = cheering && Math.floor(this.ticks / 6) % 2 === 0 ? 2 * s : 0
    const frames = carrying ? CARRY : WALK
    const sprite = frames[cheering ? 0 : step]
    const top = this.ground - sprite.h * s - jump
    drawSprite(plot, sprite, this.x, top, s)
    if (carrying && this.present) {
      const p = this.present.sprite
      drawSprite(plot, p, this.x + (this.w - p.w) / 2, top - p.h + s)
    }
  }
}
