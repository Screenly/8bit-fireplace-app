import { describe, expect, test } from 'bun:test'
import {
  computeLayout,
  computeScale,
  computeVirtualSize,
  type Rect,
} from './layout'

/** Every resolution a Screenly player can run at. */
const RESOLUTIONS = [
  [4096, 2160],
  [2160, 4096],
  [3840, 2160],
  [2160, 3840],
  [1920, 1080],
  [1080, 1920],
  [1280, 720],
  [720, 1280],
  [800, 480],
  [480, 800],
] as const

const TARGETS = [108, 156, 216]

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  )
}

describe('computeScale', () => {
  test('keeps the upscale factor a whole number of at least one', () => {
    for (const [w, h] of RESOLUTIONS) {
      for (const target of TARGETS) {
        const scale = computeScale(w, h, target)
        expect(Number.isInteger(scale)).toBe(true)
        expect(scale).toBeGreaterThanOrEqual(1)
      }
    }
  })

  test('never scales below one on a tiny viewport', () => {
    expect(computeScale(64, 32, 216)).toBe(1)
  })
})

describe('computeVirtualSize', () => {
  test('covers the whole viewport once upscaled', () => {
    for (const [w, h] of RESOLUTIONS) {
      const scale = computeScale(w, h, 156)
      const size = computeVirtualSize(w, h, scale)
      expect(size.width * scale).toBeGreaterThanOrEqual(w)
      expect(size.height * scale).toBeGreaterThanOrEqual(h)
    }
  })
})

describe('computeLayout', () => {
  test('nests the scene correctly at every supported resolution', () => {
    for (const [w, h] of RESOLUTIONS) {
      for (const target of TARGETS) {
        const scale = computeScale(w, h, target)
        const size = computeVirtualSize(w, h, scale)
        const layout = computeLayout(size.width, size.height)
        const screen = { x: 0, y: 0, w: size.width, h: size.height }

        expect(contains(screen, layout.surround)).toBe(true)
        expect(contains(layout.surround, layout.opening)).toBe(true)
        expect(contains(layout.opening, layout.ashBed)).toBe(true)
        expect(contains(layout.opening, layout.logBed)).toBe(true)
        expect(contains(layout.opening, layout.fire)).toBe(true)
        expect(contains(screen, layout.caption)).toBe(true)
        expect(layout.portrait).toBe(h > w)
      }
    }
  })

  test('keeps the firebox from stretching into a doorway', () => {
    const layout = computeLayout(120, 320)
    expect(layout.opening.h).toBeLessThanOrEqual(layout.opening.w * 1.2 + 1)
  })

  test('leaves the caption clear of the bottom edge', () => {
    const layout = computeLayout(280, 158)
    expect(layout.caption.y + layout.caption.h).toBeLessThan(158)
  })

  test('produces whole-pixel geometry', () => {
    const layout = computeLayout(275, 155)
    for (const rect of [layout.surround, layout.opening, layout.fire]) {
      for (const value of [rect.x, rect.y, rect.w, rect.h]) {
        expect(Number.isInteger(value)).toBe(true)
      }
    }
  })
})
