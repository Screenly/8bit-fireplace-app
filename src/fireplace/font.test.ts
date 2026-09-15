import { describe, expect, test } from 'bun:test'
import { GLYPH_H, GLYPH_W, glyphFor, measureText } from './font'
import { fitTextScale, textHeight } from './text'

describe('glyphFor', () => {
  test('compiles art into one bitmask row per scanline', () => {
    const glyph = glyphFor('A')
    expect(glyph).toHaveLength(GLYPH_H)
    // '.###.' -> 0b01110
    expect(glyph[0]).toBe(0b01110)
    // '#...#' -> 0b10001
    expect(glyph[1]).toBe(0b10001)
  })

  test('folds lowercase onto the uppercase glyph', () => {
    expect(Array.from(glyphFor('a'))).toEqual(Array.from(glyphFor('A')))
  })

  test('renders unsupported characters as blank rather than failing', () => {
    expect(Array.from(glyphFor('é'))).toEqual(Array.from(glyphFor(' ')))
  })

  test('never sets a bit outside the glyph width', () => {
    for (const char of 'ABCXYZ0189?!&%@') {
      for (const row of glyphFor(char)) {
        expect(row).toBeLessThan(1 << GLYPH_W)
      }
    }
  })
})

describe('measureText', () => {
  test('is zero for empty text', () => {
    expect(measureText('', 2, 1)).toBe(0)
  })

  test('does not add tracking after the last glyph', () => {
    expect(measureText('AB', 1, 1)).toBe(GLYPH_W * 2 + 1)
  })

  test('scales linearly', () => {
    expect(measureText('HELLO', 4, 1)).toBe(measureText('HELLO', 2, 1) * 2)
  })
})

describe('fitTextScale', () => {
  test('picks the largest scale that fits, outline included', () => {
    const scale = fitTextScale('SCREENLY', 200, 40, 1)
    expect(measureText('SCREENLY', scale, 1) + 2 * scale).toBeLessThanOrEqual(
      200,
    )
    expect(textHeight(scale)).toBeLessThanOrEqual(40)
  })

  test('falls back to the smallest scale when nothing fits', () => {
    expect(fitTextScale('A VERY LONG CAPTION INDEED', 20, 8, 1)).toBe(1)
  })

  test('never exceeds the maximum scale', () => {
    expect(fitTextScale('HI', 10000, 10000, 1)).toBe(4)
  })
})
