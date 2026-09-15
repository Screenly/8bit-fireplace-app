import { describe, expect, test } from 'bun:test'
import { decayForReach, FIRE_MAX, FireSim, heatToRamp } from './fire'
import { createRng } from './prng'

function makeFire(width = 40, height = 30, reach = 20): FireSim {
  const fire = new FireSim({ width, height, reach, rng: createRng(7) })
  fire.setSource(() => 1)
  return fire
}

describe('decayForReach', () => {
  test('taller flames lose less heat per row', () => {
    expect(decayForReach(10)).toBeGreaterThan(decayForReach(60))
  })

  test('stays within a range that always burns out', () => {
    for (const reach of [0, 1, 5, 50, 500, 10000]) {
      const decay = decayForReach(reach)
      expect(decay).toBeGreaterThanOrEqual(2)
      expect(decay).toBeLessThanOrEqual(16)
    }
  })
})

describe('heatToRamp', () => {
  test('maps no heat to the transparent slot', () => {
    expect(heatToRamp(0, 15)).toBe(0)
  })

  test('maps full heat to the brightest slot', () => {
    expect(heatToRamp(FIRE_MAX, 15)).toBe(15)
  })

  test('never overflows the ramp', () => {
    for (let heat = 0; heat <= FIRE_MAX; heat++) {
      const index = heatToRamp(heat, 15)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThanOrEqual(15)
    }
  })
})

describe('FireSim', () => {
  test('is deterministic for a given seed', () => {
    const a = makeFire()
    const b = makeFire()
    a.prewarm(50)
    b.prewarm(50)
    expect(Array.from(a.cells)).toEqual(Array.from(b.cells))
  })

  test('carries heat up from the source once warmed', () => {
    const fire = makeFire()
    fire.prewarm(60)
    const middle = Math.floor(fire.height / 2) * fire.width
    const row = fire.cells.slice(middle, middle + fire.width)
    expect(row.some((heat) => heat > 0)).toBe(true)
  })

  test('reports energy as a fraction', () => {
    const fire = makeFire()
    fire.prewarm(60)
    const energy = fire.energy()
    expect(energy).toBeGreaterThan(0)
    expect(energy).toBeLessThanOrEqual(1)
  })

  test('stays unlit where the source is cold', () => {
    const fire = new FireSim({
      width: 60,
      height: 24,
      reach: 16,
      rng: createRng(3),
    })
    // Only the middle third is alight.
    fire.setSource((x) => (x >= 20 && x < 40 ? 1 : 0))
    fire.prewarm(80)
    const top = fire.cells.slice(0, fire.width)
    expect(top[0]).toBe(0)
    expect(top[fire.width - 1]).toBe(0)
  })

  test('does not lean the fire off one edge', () => {
    const fire = new FireSim({
      width: 120,
      height: 90,
      reach: 80,
      rng: createRng(11),
    })
    fire.setSource(() => 1)
    fire.prewarm(300)
    const row = Math.floor(fire.height * 0.5) * fire.width
    let left = 0
    let right = 0
    const half = fire.width / 2
    for (let x = 0; x < fire.width; x++) {
      if (fire.cells[row + x] === 0) continue
      if (x < half) left++
      else right++
    }
    // A biased spread used to shear the whole fire against one wall.
    expect(Math.abs(left - right)).toBeLessThan(fire.width * 0.2)
  })

  test('clamps degenerate sizes rather than throwing', () => {
    const fire = new FireSim({
      width: 0,
      height: 0,
      reach: 1,
      rng: createRng(1),
    })
    fire.setSource(() => 5)
    fire.step()
    expect(fire.cells.length).toBeGreaterThan(0)
    expect(fire.cells.every((heat) => heat <= FIRE_MAX)).toBe(true)
  })
})
