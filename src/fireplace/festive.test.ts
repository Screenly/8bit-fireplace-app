import { describe, expect, test } from 'bun:test'
import { FestiveDecor, festiveYear } from './festive'
import { Countdown, countdownText } from './festive-countdown'
import { makePresent, placePresents } from './festive-presents'
import { FESTIVE, textPixels } from './festive-sprites'
import { hearthSpans } from './halloween-hearth'
import { computeLayout } from './layout'
import { createRng } from './prng'
import { buildHearthScene, buildInfernoScene } from './scene'

describe('festiveYear', () => {
  test('wishes for the coming year at the end of December', () => {
    expect(festiveYear(new Date(2026, 11, 28))).toBe(2027)
    expect(festiveYear(new Date(2026, 11, 31, 23, 59))).toBe(2027)
  })

  test('keeps the same year once it has arrived', () => {
    expect(festiveYear(new Date(2027, 0, 1))).toBe(2027)
    expect(festiveYear(new Date(2027, 0, 6))).toBe(2027)
  })
})

describe('presents', () => {
  test('sit on both sides of the logs without overlapping', () => {
    const spans = hearthSpans(computeLayout(275, 155))
    for (let seed = 1; seed < 40; seed++) {
      const presents = placePresents(spans, createRng(seed))
      expect(presents.length).toBeGreaterThanOrEqual(2)
      expect(presents[0].x).toBeLessThan(spans[0].to)
      expect(presents[1].x).toBeGreaterThanOrEqual(spans[1].from)
      for (const p of presents) {
        const inside = spans.some(
          (s) => p.x >= s.from && p.x + p.sprite.w <= s.to,
        )
        expect(inside).toBe(true)
      }
      const sorted = [...presents].sort((a, b) => a.x - b.x)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].x).toBeGreaterThan(
          sorted[i - 1].x + sorted[i - 1].sprite.w,
        )
      }
    }
  })

  test('there are none without a hearth', () => {
    expect(placePresents([], createRng(1))).toHaveLength(0)
  })

  test('scale up whole pixels at a time', () => {
    const small = makePresent(createRng(5))
    const big = makePresent(createRng(5), 21, 2)
    expect(big.w).toBe(small.w * 2)
    expect(big.h).toBe(small.h * 2)
  })

  test('have a solid outline along the floor', () => {
    const p = makePresent(createRng(9))
    const floor = p.pixels.subarray((p.h - 1) * p.w, p.h * p.w)
    expect(Array.from(floor).every((c) => c === FESTIVE.OUTLINE)).toBe(true)
  })
})

describe('banner font', () => {
  test('spells the year with a gap between letters', () => {
    const { w, on } = textPixels('HAPPY 2027')
    expect(w).toBe(10 * 4 - 1)
    expect(on).toHaveLength(5)
    for (const row of on) expect(row).toHaveLength(w)
  })
})

type Hearth = {
  spans: { from: number; to: number }[]
  presents: { x: number; sprite: { w: number } }[]
  tree: { x: number; width: number } | null
}

function christmasDecor(
  scene: ReturnType<typeof buildHearthScene>,
): FestiveDecor {
  return new FestiveDecor(
    scene.layout,
    scene.light,
    'hearth',
    'classic',
    7,
    'christmas',
    2027,
    Date.now,
  )
}

describe('FestiveDecor', () => {
  for (const kind of ['christmas', 'new_year'] as const) {
    test(`${kind} stays inside any frame size`, () => {
      for (const variant of ['hearth', 'inferno'] as const) {
        for (const [w, h] of [
          [16, 16],
          [96, 160],
          [275, 155],
          [384, 216],
        ]) {
          const scene =
            variant === 'hearth'
              ? buildHearthScene(w, h, createRng(1))
              : buildInfernoScene(w, h)
          const decor = new FestiveDecor(
            scene.layout,
            scene.light,
            variant,
            'classic',
            7,
            kind,
            2027,
            () => new Date(2026, 11, 31, 23, 59, 50).getTime(),
          )
          const pixels = new Uint32Array(w * h).fill(1)
          // Six minutes: several sleigh passes and plenty of rockets.
          for (let i = 0; i < 30 * 60 * 6; i++) {
            decor.tick()
            if (i % 97 === 0) decor.paint(pixels, i % 6)
          }
          expect(pixels.length).toBe(w * h)
          expect(pixels.every((pixel) => pixel !== 0)).toBe(true)
        }
      }
    })
  }

  test('presents come and go, but the hearth never empties or overflows', () => {
    const scene = buildHearthScene(275, 155, createRng(1))
    const decor = christmasDecor(scene)
    const hearth = (decor as unknown as { christmas: Hearth }).christmas
    expect(hearth.tree).not.toBeNull()
    let added = 0
    let removed = 0
    let last = hearth.presents.length
    for (let i = 0; i < 30 * 60 * 30; i++) {
      decor.tick()
      const now = hearth.presents.length
      if (now > last) added++
      if (now < last) removed++
      last = now
      expect(now).toBeGreaterThanOrEqual(1)
    }
    expect(added).toBeGreaterThan(3)
    expect(removed).toBeGreaterThan(3)
    for (const p of hearth.presents) {
      const inside = hearth.spans.some(
        (s) => p.x >= s.from && p.x + p.sprite.w <= s.to,
      )
      expect(inside).toBe(true)
    }
  })
})

describe('New Year countdown', () => {
  test('shows days and then a ticking clock', () => {
    const second = 1000
    const day = 24 * 60 * 60 * second
    expect(
      countdownText(
        2 * day + 8 * 3600 * second + 55 * 60 * second + 7 * second,
      ),
    ).toBe('2D 08:55:07')
    expect(countdownText(3600 * second + 5 * second)).toBe('01:00:05')
    // Part of a second still to go counts as a whole one.
    expect(countdownText(9.2 * second)).toBe('00:00:10')
    expect(countdownText(-5 * second)).toBe('00:00:00')
  })

  test('sets off the finale when midnight comes', () => {
    let now = new Date(2026, 11, 31, 23, 59, 58).getTime()
    const countdown = new Countdown(275, 155, 30, 2, 2027, () => now)
    const fired: number[] = []
    for (let i = 0; i < 90; i++) {
      now += 1000 / 30
      if (countdown.tick()) fired.push(i)
    }
    expect(fired).toHaveLength(1)
    // About two seconds in, give or take a tick.
    expect(Math.abs(fired[0] - 60)).toBeLessThanOrEqual(1)
  })

  test('the board is gone once the new year is here', () => {
    const now = new Date(2027, 0, 2).getTime()
    const countdown = new Countdown(275, 155, 30, 2, 2027, () => now)
    const pixels = new Uint32Array(275 * 155)
    countdown.tick()
    countdown.draw(() => {
      throw new Error('drew the board after midnight')
    }, pixels)
    expect(pixels.every((p) => p === 0)).toBe(true)
  })
})

describe('New Year party', () => {
  test('the guests cheer and the confetti comes down at midnight', () => {
    const scene = buildHearthScene(275, 155, createRng(1))
    let now = new Date(2026, 11, 31, 23, 59, 55).getTime()
    const decor = new FestiveDecor(
      scene.layout,
      scene.light,
      'hearth',
      'classic',
      7,
      'new_year',
      2027,
      () => now,
    )
    type Party = {
      guests: { cheering: number; guests: unknown[] }
      confetti: { settled: unknown[]; showing: boolean }
    }
    const party = decor as unknown as Party
    expect(party.guests.guests.length).toBeGreaterThanOrEqual(2)
    expect(party.confetti.settled).toHaveLength(0)
    let cheered = false
    for (let i = 0; i < 30 * 20; i++) {
      now += 1000 / 30
      decor.tick()
      if (party.guests.cheering > 0) cheered = true
    }
    expect(cheered).toBe(true)
    expect(party.confetti.showing).toBe(true)
    expect(party.confetti.settled.length).toBeGreaterThan(100)
  })

  test('a screen started after midnight finds the mess already there', () => {
    const scene = buildHearthScene(275, 155, createRng(1))
    const decor = new FestiveDecor(
      scene.layout,
      scene.light,
      'hearth',
      'classic',
      7,
      'new_year',
      2027,
      () => new Date(2027, 0, 3).getTime(),
    )
    const { confetti } = decor as unknown as {
      confetti: { settled: unknown[]; showing: boolean }
    }
    expect(confetti.showing).toBe(true)
    expect(confetti.settled.length).toBeGreaterThan(100)
  })
})

describe('New Year in the inferno', () => {
  test('the inferno gets falling confetti but nothing left on a floor', () => {
    const scene = buildInfernoScene(275, 155)
    let now = new Date(2026, 11, 31, 23, 59, 58).getTime()
    const decor = new FestiveDecor(
      scene.layout,
      scene.light,
      'inferno',
      'classic',
      7,
      'new_year',
      2027,
      () => now,
    )
    const { confetti } = decor as unknown as {
      confetti: { settled: unknown[]; falling: unknown[]; showing: boolean }
    }
    let fell = false
    for (let i = 0; i < 30 * 12; i++) {
      now += 1000 / 30
      decor.tick()
      if (confetti.falling.length > 0) fell = true
    }
    expect(fell).toBe(true)
    expect(confetti.settled).toHaveLength(0)
    expect(confetti.showing).toBe(false)
  })
})
