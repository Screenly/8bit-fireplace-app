/**
 * Embers lifted off the fire.
 *
 * A small pool of particles rising out of the flames and cooling as they go.
 * The pool is fixed-size and recycled so the app never allocates once it is
 * running.
 */
import type { Rect } from './layout'
import type { Rng } from './prng'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export class Sparks {
  private readonly pool: Spark[] = []
  private readonly rng: Rng
  private readonly source: Rect
  private readonly bounds: Rect
  private pending = 0

  constructor(source: Rect, bounds: Rect, rng: Rng, capacity: number) {
    this.source = source
    this.bounds = bounds
    this.rng = rng
    for (let i = 0; i < capacity; i++) {
      this.pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1 })
    }
  }

  /** Advances one tick. `energy` (0..1) drives how many embers are thrown. */
  update(energy: number): void {
    this.pending += energy * this.source.w * 0.035
    for (const spark of this.pool) {
      if (spark.life > 0) {
        this.advance(spark)
      } else if (this.pending >= 1) {
        this.pending -= 1
        this.spawn(spark)
      }
    }
    if (this.pending > 8) this.pending = 8
  }

  /** Visits every live ember with its remaining heat, from 1 down to 0. */
  forEach(visit: (x: number, y: number, heat: number) => void): void {
    for (const spark of this.pool) {
      if (spark.life <= 0) continue
      visit(
        Math.round(spark.x),
        Math.round(spark.y),
        spark.life / spark.maxLife,
      )
    }
  }

  private spawn(spark: Spark): void {
    spark.x = this.source.x + this.rng() * this.source.w
    spark.y = this.source.y + this.rng() * this.source.h
    spark.vx = (this.rng() - 0.5) * 0.18
    spark.vy = -(0.3 + this.rng() * 0.45)
    spark.maxLife = 30 + Math.floor(this.rng() * 55)
    spark.life = spark.maxLife
  }

  private advance(spark: Spark): void {
    spark.x += spark.vx
    spark.y += spark.vy
    spark.vx += (this.rng() - 0.5) * 0.05
    spark.vy *= 0.994
    spark.life--
    if (!contains(this.bounds, spark.x, spark.y)) spark.life = 0
  }
}

function contains(rect: Rect, x: number, y: number): boolean {
  return (
    x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h
  )
}
