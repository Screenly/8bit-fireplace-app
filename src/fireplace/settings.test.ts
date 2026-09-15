import { afterEach, describe, expect, test } from 'bun:test'
import { resetScreenlyMock, setupScreenlyMock } from '@screenly/edge-apps/test'
import {
  MAX_CAPTION,
  normalizeCaption,
  pickChoice,
  readSettings,
  seedFrom,
} from './settings'

describe('pickChoice', () => {
  const allowed = ['classic', 'azure'] as const

  test('accepts a valid choice', () => {
    expect(pickChoice('azure', allowed, 'classic')).toBe('azure')
  })

  test('is forgiving about case and whitespace', () => {
    expect(pickChoice('  AZURE ', allowed, 'classic')).toBe('azure')
  })

  test('falls back rather than blanking the screen', () => {
    expect(pickChoice('chartreuse', allowed, 'classic')).toBe('classic')
    expect(pickChoice(undefined, allowed, 'classic')).toBe('classic')
    expect(pickChoice(42, allowed, 'classic')).toBe('classic')
  })
})

describe('normalizeCaption', () => {
  test('trims surrounding whitespace', () => {
    expect(normalizeCaption('  Happy Holidays  ')).toBe('Happy Holidays')
  })

  test('caps the length so it cannot overflow the screen', () => {
    expect(normalizeCaption('x'.repeat(200))).toHaveLength(MAX_CAPTION)
  })

  test('treats a missing value as no caption', () => {
    expect(normalizeCaption(undefined)).toBe('')
  })
})

describe('seedFrom', () => {
  test('is stable for a given screen', () => {
    expect(seedFrom('srly-lobby-01')).toBe(seedFrom('srly-lobby-01'))
  })

  test('differs between screens', () => {
    expect(seedFrom('srly-lobby-01')).not.toBe(seedFrom('srly-lobby-02'))
  })

  test('never returns zero, even for an empty name', () => {
    expect(seedFrom('')).toBeGreaterThan(0)
  })
})

describe('readSettings', () => {
  afterEach(() => {
    resetScreenlyMock()
  })

  test('reads the configured values', () => {
    setupScreenlyMock(
      { hostname: 'srly-lobby-01' },
      {
        caption: ' Winter 2026 ',
        crt_effect: 'true',
        flame_color: 'emerald',
        flame_height: 'high',
        pixel_size: 'chunky',
        scene: 'inferno',
      },
    )
    expect(readSettings()).toEqual({
      caption: 'Winter 2026',
      crt: true,
      flame: 'emerald',
      flameHeight: 'high',
      pixelSize: 'chunky',
      variant: 'inferno',
      seed: seedFrom('srly-lobby-01'),
    })
  })

  test('falls back to a lit hearth when nothing is configured', () => {
    setupScreenlyMock({ hostname: 'srly-lobby-01' }, {})
    const settings = readSettings()
    expect(settings.flame).toBe('classic')
    expect(settings.flameHeight).toBe('medium')
    expect(settings.pixelSize).toBe('classic')
    expect(settings.variant).toBe('hearth')
    expect(settings.caption).toBe('')
    expect(settings.crt).toBe(false)
  })

  test('ignores nonsense values instead of failing', () => {
    setupScreenlyMock(
      { hostname: 'srly-lobby-01' },
      { flame_color: 'chartreuse', pixel_size: '', scene: 'volcano' },
    )
    const settings = readSettings()
    expect(settings.flame).toBe('classic')
    expect(settings.pixelSize).toBe('classic')
    expect(settings.variant).toBe('hearth')
  })
})
