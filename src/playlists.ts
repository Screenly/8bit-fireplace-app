/** Which tunes each theme rotates through. */
import type { Theme } from './fireplace/engine'
import { CHRISTMAS_TRACKS, NEW_YEAR_TRACKS } from './christmas-score'
import { TRACKS as HALLOWEEN_TRACKS } from './halloween-score'
import type { Track } from './score'

/** What each theme plays. The standard fireplace is silent. */
export const PLAYLISTS: Record<Theme, readonly Track[]> = {
  standard: [],
  halloween: HALLOWEEN_TRACKS,
  christmas: CHRISTMAS_TRACKS,
  new_year: NEW_YEAR_TRACKS,
}

export const ALL_TRACKS: readonly Track[] = [
  ...new Set(Object.values(PLAYLISTS).flat()),
]
