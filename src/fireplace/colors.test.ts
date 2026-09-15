import { describe, expect, test } from 'bun:test'
import { clamp255, litColor, packHex, packRgb, unpackHex } from './colors'
import {
  buildLightTables,
  FLICKER_STEPS,
  LIGHT_BANDS,
  SCENE,
  SCENE_COLORS,
  SCENE_PALETTE,
} from './palettes'
import { buildFlameTable, FLAME_RAMPS, FLAME_STEPS } from './ramps'

describe('packing', () => {
  test('round-trips a hex colour through the channel helpers', () => {
    expect(unpackHex('#3b2413')).toEqual([0x3b, 0x24, 0x13])
    expect(packHex('#3b2413')).toBe(packRgb(0x3b, 0x24, 0x13))
  })

  test('always produces an opaque pixel', () => {
    // Fully transparent would be 0, which the renderer uses as "skip".
    expect(packHex('#000000')).not.toBe(0)
  })

  test('clamps out-of-range channels', () => {
    expect(clamp255(-40)).toBe(0)
    expect(clamp255(900)).toBe(255)
    expect(clamp255(17.6)).toBe(18)
  })
})

describe('litColor', () => {
  test('leaves a colour untouched with no firelight on it', () => {
    expect(litColor('#3b2413', '#ffad2b', 0)).toBe(packHex('#3b2413'))
  })

  test('brightens as the firelight rises', () => {
    const dim = litColor('#3b2413', '#ffad2b', 0.2)
    const bright = litColor('#3b2413', '#ffad2b', 0.9)
    expect(bright).not.toBe(dim)
  })
})

describe('palette tables', () => {
  test('covers every colour in every light band', () => {
    const tables = buildLightTables('classic')
    expect(tables).toHaveLength(FLICKER_STEPS)
    for (const table of tables) {
      expect(table).toHaveLength(LIGHT_BANDS * SCENE_COLORS)
      expect(table.every((pixel) => pixel !== 0)).toBe(true)
    }
  })

  test('holds the caption colour steady so text cannot flicker away', () => {
    const tables = buildLightTables('classic')
    const values = tables.map(
      (table) => table[(LIGHT_BANDS - 1) * SCENE_COLORS + SCENE.TEXT],
    )
    expect(new Set(values).size).toBe(1)
  })

  test('takes the ember colour from the flame ramp', () => {
    const azure = buildLightTables('azure')[0][SCENE.EMBER_HOT]
    const classic = buildLightTables('classic')[0][SCENE.EMBER_HOT]
    expect(azure).not.toBe(classic)
  })

  test('fits the whole palette inside a single byte with its band', () => {
    expect(SCENE_PALETTE.length).toBeLessThanOrEqual(SCENE_COLORS)
    expect(LIGHT_BANDS * SCENE_COLORS).toBeLessThanOrEqual(255)
  })
})

describe('flame ramps', () => {
  test('every ramp has the same number of steps', () => {
    for (const ramp of Object.values(FLAME_RAMPS)) {
      expect(ramp).toHaveLength(FLAME_STEPS + 1)
    }
  })

  test('keeps slot zero transparent so the hearth shows through', () => {
    expect(buildFlameTable('classic')[0]).toBe(0)
  })

  test('packs every other slot opaquely', () => {
    const table = buildFlameTable('violet')
    for (let i = 1; i < table.length; i++) expect(table[i]).not.toBe(0)
  })
})
