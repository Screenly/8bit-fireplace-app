import { describe, expect, test } from 'bun:test'
import { ALL_TRACKS, pinnedTrack, PLAYLISTS } from './playlists'

describe('playlists', () => {
  test('every seasonal theme has several tunes to rotate between', () => {
    for (const theme of ['halloween', 'christmas', 'new_year'] as const) {
      expect(PLAYLISTS[theme].length).toBeGreaterThanOrEqual(3)
    }
    expect(PLAYLISTS.standard).toHaveLength(0)
  })

  test('New Year opens with Auld Lang Syne', () => {
    expect(PLAYLISTS.new_year[0].id).toBe('auld_lang_syne')
  })

  test('a picked tune is pinned only in its own season', () => {
    expect(pinnedTrack('christmas', 'jingle_bells')?.id).toBe('jingle_bells')
    // New Year plays the carols, but a picked carol shuffles there.
    expect(pinnedTrack('new_year', 'jingle_bells')).toBeNull()
    expect(pinnedTrack('new_year', 'auld_lang_syne')?.id).toBe('auld_lang_syne')
    expect(pinnedTrack('halloween', 'jingle_bells')).toBeNull()
    expect(pinnedTrack('christmas', 'shuffle')).toBeNull()
  })

  test('every tune has its own id and name', () => {
    expect(new Set(ALL_TRACKS.map((t) => t.id)).size).toBe(ALL_TRACKS.length)
    expect(new Set(ALL_TRACKS.map((t) => t.name)).size).toBe(ALL_TRACKS.length)
  })
})

describe('tunes', () => {
  for (const track of ALL_TRACKS) {
    test(`${track.name} fits inside its loop`, () => {
      expect(track.notes.length).toBeGreaterThan(0)
      for (const [step, note, length] of track.notes) {
        expect(step).toBeGreaterThanOrEqual(0)
        expect(step + length).toBeLessThanOrEqual(track.steps)
        expect(length).toBeGreaterThan(0)
        // Somewhere between a low bass and a high bell.
        expect(note).toBeGreaterThanOrEqual(24)
        expect(note).toBeLessThanOrEqual(96)
      }
    })
  }
})
