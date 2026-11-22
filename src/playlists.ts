/** Which tunes each theme rotates through. */
import type { Theme } from './fireplace/engine'
import {
  AULD_LANG_SYNE,
  CHRISTMAS_TRACKS,
  NEW_YEAR_TRACKS,
} from './christmas-score'
import { TRACKS as HALLOWEEN_TRACKS } from './halloween-score'
import type { Track } from './score'

/** What each theme plays. The standard fireplace is silent. */
export const PLAYLISTS: Record<Theme, readonly Track[]> = {
  standard: [],
  halloween: HALLOWEEN_TRACKS,
  christmas: CHRISTMAS_TRACKS,
  new_year: NEW_YEAR_TRACKS,
}

/**
 * The tunes that belong to each theme. New Year plays the carols too, but
 * they are Christmas tunes, so picking one only pins it at Christmas.
 */
const OWN_TRACKS: Record<Theme, readonly Track[]> = {
  standard: [],
  halloween: HALLOWEEN_TRACKS,
  christmas: CHRISTMAS_TRACKS,
  new_year: [AULD_LANG_SYNE],
}

/** The tune `music` pins during `theme`, or `null` to shuffle. */
export function pinnedTrack(theme: Theme, music: string): Track | null {
  return OWN_TRACKS[theme].find((t) => t.id === music) ?? null
}

export const ALL_TRACKS: readonly Track[] = [
  ...new Set(Object.values(PLAYLISTS).flat()),
]
