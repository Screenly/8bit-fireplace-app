/**
 * Chords and backing patterns shared by the Christmas tunes. A chord is its
 * bass note and two notes above it.
 */
import type { Note } from './score'

export type Chord = readonly [root: number, third: number, fifth: number]

export const G: Chord = [43, 67, 71]
export const C: Chord = [48, 64, 67]
export const F: Chord = [41, 65, 69]
export const G7: Chord = [43, 65, 71]
export const D: Chord = [38, 66, 69]
export const A: Chord = [45, 64, 69]
export const B: Chord = [47, 63, 66]
export const EM: Chord = [40, 64, 67]

/**
 * A bouncy 4/4 backing: the bass walks root and fifth on the beat and the
 * chord is stabbed on the off-beats. One chord per half bar.
 */
export function oompah(chords: readonly Chord[]): Note[] {
  return chords.flatMap(([root, third, fifth], half): Note[] => {
    const at = half * 8
    return [
      [at, root, 3, 'bass'],
      [at + 4, root + 7, 3, 'bass'],
      [at + 2, third, 2, 'arp'],
      [at + 2, fifth, 2, 'arp'],
      [at + 6, third, 2, 'arp'],
      [at + 6, fifth, 2, 'arp'],
    ]
  })
}

/** One chord per bar of 3/4: bass on one, stabs on two and three. */
export function waltz(chords: readonly Chord[]): Note[] {
  return chords.flatMap(([root, third, fifth], bar): Note[] => {
    const at = bar * 12
    return [
      [at, root, 4, 'bass'],
      [at + 4, third, 2, 'arp'],
      [at + 4, fifth, 2, 'arp'],
      [at + 8, third, 2, 'arp'],
      [at + 8, fifth, 2, 'arp'],
    ]
  })
}

export const bar = (chord: Chord): Chord[] => [chord, chord]
