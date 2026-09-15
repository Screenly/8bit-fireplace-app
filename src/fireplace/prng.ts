/**
 * Deterministic pseudo-random number generator (mulberry32).
 *
 * Every random decision in the app goes through this so that a given seed
 * always produces the same scene and the same flame animation. That keeps the
 * committed screenshots byte-stable and makes the simulation unit-testable.
 */
export type Rng = () => number

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in `[0, max)`. */
export function randInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max)
}

/** Integer in `[min, max]`. */
export function randRange(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}
