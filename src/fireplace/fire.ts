/**
 * The flame simulation.
 *
 * This is the classic cellular "Doom fire": heat is seeded along the bottom
 * row and, once per tick, every cell copies itself one row up into a randomly
 * nudged column while losing a little energy. It is a handful of integer
 * operations per cell, which is what makes a full-screen fire affordable on a
 * Raspberry Pi.
 */
import type { Rng } from './prng'

/** Internal heat resolution. Quantised down to the 15-step ramp on render. */
export const FIRE_MAX = 63

/** How many columns the draught may lean the flames over their full height. */
const MAX_LEAN = 10

export interface FireOptions {
  width: number
  height: number
  /** Rows the flames should reach, on average, above their source. */
  reach: number
  rng: Rng
}

export class FireSim {
  readonly width: number
  readonly height: number
  /** Heat per cell, row 0 at the top. */
  readonly cells: Uint8Array

  private readonly rng: Rng
  private readonly decayMax: number
  private readonly source: Uint8Array
  private readonly jitter: Uint8Array
  private readonly sway: number
  private tick = 0

  constructor({ width, height, reach, rng }: FireOptions) {
    this.width = Math.max(1, Math.floor(width))
    this.height = Math.max(2, Math.floor(height))
    this.rng = rng
    this.cells = new Uint8Array(this.width * this.height)
    this.source = new Uint8Array(this.width)
    this.jitter = new Uint8Array(this.width)
    this.decayMax = decayForReach(reach)
    this.sway = Math.min(0.3, MAX_LEAN / this.height)
  }

  /** Seeds the bottom row: `strength(x)` is 0 (no fire) to 1 (full heat). */
  setSource(strength: (x: number) => number): void {
    for (let x = 0; x < this.width; x++) {
      this.source[x] = Math.round(
        FIRE_MAX * Math.max(0, Math.min(1, strength(x))),
      )
      this.jitter[x] = Math.floor(this.rng() * 5)
    }
    this.applySource()
  }

  /** Advances the fire by one tick. */
  step(): void {
    this.tick++
    // A gentle draught, scaled down as the fire gets taller: the lean
    // compounds once per row, so a fixed bias shears a full-screen fire clean
    // off one edge.
    const draught = Math.sin(this.tick * 0.021) * this.sway
    for (let y = 1; y < this.height; y++) {
      // Cells spread into a neighbouring column and the last write to a
      // column wins, so scanning one way alone walks the whole fire sideways
      // a column per row. Alternating the direction cancels that out while
      // keeping the gaps that give the flames their wispy shape.
      this.spreadRow(y, draught, (y & 1) === 0)
    }
    this.breathe()
    this.applySource()
  }

  private spreadRow(y: number, draught: number, forward: boolean): void {
    const { width: w, cells } = this
    const src = y * w
    const dst = src - w
    const lean = draught > 0 ? 1 : -1
    for (let i = 0; i < w; i++) {
      const x = forward ? i : w - 1 - i
      const heat = cells[src + x]
      let target = x - ((this.rng() * 3) | 0) + 1
      if (this.rng() < Math.abs(draught)) target += lean
      if (target < 0) target = 0
      else if (target >= w) target = w - 1
      const loss = heat === 0 ? 0 : (this.rng() * this.decayMax) | 0
      cells[dst + target] = heat > loss ? heat - loss : 0
    }
  }

  /** Runs the simulation forward so the fire is already alight on frame one. */
  prewarm(ticks: number): void {
    for (let i = 0; i < ticks; i++) this.step()
  }

  /**
   * How lively the fire is right now, as 0..1. Sampled a little above the
   * source so it tracks the flames rather than the constant seed row.
   */
  energy(): number {
    const row = Math.max(0, this.height - 1 - Math.round(this.height * 0.25))
    let total = 0
    const offset = row * this.width
    for (let x = 0; x < this.width; x++) total += this.cells[offset + x]
    return total / (this.width * FIRE_MAX)
  }

  private breathe(): void {
    const rolls = Math.max(1, this.width >> 3)
    for (let i = 0; i < rolls; i++) {
      const x = (this.rng() * this.width) | 0
      this.jitter[x] = Math.floor(this.rng() * 7)
    }
  }

  private applySource(): void {
    const offset = (this.height - 1) * this.width
    for (let x = 0; x < this.width; x++) {
      const seed = this.source[x]
      this.cells[offset + x] =
        seed === 0 ? 0 : Math.max(0, seed - this.jitter[x])
    }
  }
}

/** Converts a desired flame height in rows into a per-tick energy loss. */
export function decayForReach(reach: number): number {
  const rows = Math.max(1, reach)
  return Math.max(2, Math.min(16, Math.round(1 + (2 * FIRE_MAX) / rows)))
}

/** Maps internal heat onto an index in the 15-step flame ramp. */
export function heatToRamp(heat: number, steps: number): number {
  if (heat <= 0) return 0
  const index = Math.ceil((heat * steps) / FIRE_MAX)
  return index > steps ? steps : index
}
