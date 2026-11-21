/**
 * Jingle Bells, Deck the Halls, We Wish You a Merry Christmas and Auld Lang
 * Syne: traditional melodies long out of copyright, arranged from scratch.
 */
import { CAROLS } from './carols-score'
import { line, phrase, type Note, type Track } from './score'
import { A, B, bar, C, D, EM, G, oompah, waltz } from './score-backing'

const JINGLE_BELLS: Track = (() => {
  const first: [number, number][] = [
    [71, 4],
    [71, 4],
    [71, 8],
    [71, 4],
    [71, 4],
    [71, 8],
    [71, 4],
    [74, 4],
    [67, 6],
    [69, 2],
    [71, 16],
    [72, 4],
    [72, 4],
    [72, 6],
    [72, 2],
    [72, 4],
    [71, 4],
    [71, 4],
    [71, 2],
    [71, 2],
  ]
  const melody: [number, number][] = [
    ...first,
    [71, 4],
    [69, 4],
    [69, 4],
    [71, 4],
    [69, 8],
    [74, 8],
    ...first,
    [74, 4],
    [74, 4],
    [72, 4],
    [69, 4],
    [67, 16],
  ]
  const chords = [
    ...bar(G),
    ...bar(G),
    ...bar(G),
    ...bar(G),
    ...bar(C),
    ...bar(G),
    ...bar(A),
    ...bar(D),
    ...bar(G),
    ...bar(G),
    ...bar(G),
    ...bar(G),
    ...bar(C),
    ...bar(G),
    D,
    D,
    ...bar(G),
  ]
  return {
    id: 'jingle_bells',
    name: 'Jingle bells',
    bpm: 132,
    steps: 256,
    notes: [
      ...phrase(0, melody, 'lead'),
      ...oompah(chords),
      ...line(
        Array.from({ length: 16 }, () => 91),
        16,
        2,
        'bell',
      ),
    ],
  }
})()

const DECK_THE_HALLS: Track = (() => {
  const deck: [number, number][] = [
    [74, 6],
    [72, 2],
    [71, 4],
    [69, 4],
    [67, 4],
    [69, 4],
    [71, 4],
    [67, 4],
    [69, 2],
    [71, 2],
    [72, 2],
    [69, 2],
    [71, 6],
    [69, 2],
    [67, 4],
    [66, 4],
    [67, 8],
  ]
  const melody: [number, number][] = [
    ...deck,
    ...deck,
    [69, 6],
    [71, 2],
    [72, 4],
    [69, 4],
    [71, 6],
    [72, 2],
    [74, 4],
    [69, 4],
    [71, 2],
    [73, 2],
    [74, 4],
    [76, 2],
    [78, 2],
    [79, 4],
    [78, 4],
    [76, 4],
    [74, 8],
    [74, 6],
    [72, 2],
    [71, 4],
    [69, 4],
    [67, 4],
    [69, 4],
    [71, 4],
    [67, 4],
    [76, 2],
    [76, 2],
    [76, 2],
    [76, 2],
    [74, 6],
    [72, 2],
    [71, 4],
    [69, 4],
    [67, 8],
  ]
  const verse = [G, G, D, G, C, G, D, G]
  const chords = [...verse, ...verse, D, D, G, D, G, A, D, D, ...verse]
  return {
    id: 'deck_the_halls',
    name: 'Deck the halls',
    bpm: 116,
    steps: 256,
    notes: [...phrase(0, melody, 'lead'), ...oompah(chords)],
  }
})()

const WE_WISH: Track = {
  id: 'we_wish',
  name: 'We wish you a merry Christmas',
  bpm: 156,
  steps: 96,
  notes: [
    ...phrase(
      0,
      (
        [
          [67, 4],
          [67, 2],
          [69, 2],
          [67, 2],
          [66, 2],
          [64, 4],
          [64, 4],
          [64, 4],
          [69, 4],
          [69, 2],
          [71, 2],
          [69, 2],
          [67, 2],
          [66, 4],
          [62, 4],
          [62, 4],
          [71, 4],
          [71, 2],
          [72, 2],
          [71, 2],
          [69, 2],
          [67, 4],
          [64, 4],
          [62, 2],
          [62, 2],
          [64, 4],
          [69, 4],
          [66, 4],
          [67, 8],
          // "We" of the next time round.
          [62, 4],
        ] as [number, number][]
      ).map(([note, length]) => [note + 12, length]),
      'lead',
    ),
    ...waltz([G, C, A, D, B, EM, C, G]),
  ],
}

export const AULD_LANG_SYNE: Track = {
  id: 'auld_lang_syne',
  name: 'Auld lang syne',
  bpm: 84,
  steps: 128,
  notes: [
    ...phrase(
      0,
      (
        [
          [67, 6],
          [67, 2],
          [67, 4],
          [71, 4],
          [69, 6],
          [67, 2],
          [69, 4],
          [71, 4],
          [67, 6],
          [67, 2],
          [71, 4],
          [74, 4],
          [76, 12],
          [76, 4],
          [74, 6],
          [71, 2],
          [71, 4],
          [67, 4],
          [69, 6],
          [67, 2],
          [69, 4],
          [71, 4],
          [67, 6],
          [64, 2],
          [64, 4],
          [62, 4],
          [67, 12],
          // "Should" of the next time round.
          [62, 4],
        ] as [number, number][]
      ).map(([note, length]) => [note + 12, length]),
      'lead',
    ),
    ...[G, D, G, C, G, D, EM, G].flatMap(([root, third, fifth], i): Note[] => [
      [i * 16, root, 8, 'bass'],
      [i * 16 + 8, root + 7, 8, 'bass'],
      [i * 16, third, 16, 'pad'],
      [i * 16, fifth, 16, 'pad'],
    ]),
  ],
}

export const CHRISTMAS_TRACKS: readonly Track[] = [
  JINGLE_BELLS,
  DECK_THE_HALLS,
  WE_WISH,
  ...CAROLS,
]

export const NEW_YEAR_TRACKS: readonly Track[] = [
  AULD_LANG_SYNE,
  ...CHRISTMAS_TRACKS,
]
