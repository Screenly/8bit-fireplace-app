/**
 * Three more carols, each from a melody long out of copyright and arranged
 * from scratch here:
 *
 * - Silent Night: Franz Gruber, 1818
 * - Good King Wenceslas: "Tempus adest floridum", printed in Piae Cantiones,
 *   1582
 * - Hark! The Herald Angels Sing: Felix Mendelssohn, 1840, as fitted to the
 *   words by W. H. Cummings, 1855
 */
import { phrase, type Note, type Track } from './score'
import { bar, C, D, F, G, G7, oompah, type Chord } from './score-backing'

function lullaby(chords: readonly Chord[]): Note[] {
  return chords.flatMap(([root, third, fifth], i): Note[] => {
    const at = i * 12
    return [
      [at, root, 6, 'bass'],
      [at + 6, root + 7, 6, 'bass'],
      [at, third, 12, 'pad'],
      [at, fifth, 12, 'pad'],
    ]
  })
}

const SILENT_NIGHT: Track = {
  id: 'silent_night',
  name: 'Silent night',
  bpm: 72,
  steps: 288,
  notes: [
    ...phrase(
      0,
      (
        [
          // Silent night, holy night.
          [67, 6],
          [69, 2],
          [67, 4],
          [64, 12],
          [67, 6],
          [69, 2],
          [67, 4],
          [64, 12],
          // All is calm, all is bright.
          [74, 8],
          [74, 4],
          [71, 12],
          [72, 8],
          [72, 4],
          [67, 12],
          // Round yon virgin mother and child.
          [69, 8],
          [69, 4],
          [72, 6],
          [71, 2],
          [69, 4],
          [67, 6],
          [69, 2],
          [67, 4],
          [64, 12],
          // Holy infant so tender and mild.
          [69, 8],
          [69, 4],
          [72, 6],
          [71, 2],
          [69, 4],
          [67, 6],
          [69, 2],
          [67, 4],
          [64, 12],
          // Sleep in heavenly peace.
          [74, 8],
          [74, 4],
          [77, 6],
          [74, 2],
          [71, 4],
          [72, 12],
          [76, 12],
          // Sleep in heavenly peace.
          [72, 6],
          [67, 2],
          [64, 4],
          [67, 6],
          [65, 2],
          [62, 4],
          [60, 24],
        ] as [number, number][]
      ).map(([note, length]) => [note + 12, length]),
      'lead',
    ),
    ...lullaby([
      C,
      C,
      C,
      C,
      G7,
      G7,
      C,
      C,
      F,
      F,
      C,
      C,
      F,
      F,
      C,
      C,
      G7,
      G7,
      C,
      C,
      C,
      G7,
      C,
      C,
    ]),
  ],
}

const GOOD_KING_WENCESLAS: Track = (() => {
  const looked: [number, number][] = [
    [67, 4],
    [67, 4],
    [67, 4],
    [69, 4],
    [67, 4],
    [67, 4],
    [62, 8],
  ]
  const feast: [number, number][] = [
    [64, 4],
    [62, 4],
    [64, 4],
    [66, 4],
    [67, 8],
    [67, 8],
  ]
  const melody: [number, number][] = [
    // Good King Wenceslas looked out / on the feast of Stephen.
    ...looked,
    ...feast,
    // When the snow lay round about / deep and crisp and even.
    ...looked,
    ...feast,
    // Brightly shone the moon that night.
    [74, 4],
    [72, 4],
    [71, 4],
    [69, 4],
    [71, 4],
    [69, 4],
    [67, 8],
    // Though the frost was cruel.
    ...feast,
    // When a poor man came in sight.
    [62, 4],
    [62, 4],
    [64, 4],
    [66, 4],
    [67, 4],
    [67, 4],
    [69, 8],
    // Gathering winter fuel.
    [74, 4],
    [72, 4],
    [71, 4],
    [69, 4],
    [67, 8],
    [72, 8],
    [67, 16],
  ]
  const verse = [G, G, D, G]
  const bars = [...verse, ...verse, G, G, D, G, D, D, D, C, G]
  return {
    id: 'good_king_wenceslas',
    name: 'Good King Wenceslas',
    bpm: 112,
    steps: 272,
    notes: [
      ...phrase(0, melody, 'lead'),
      ...oompah(bars.flatMap((chord) => bar(chord))),
    ],
  }
})()

const HARK_THE_HERALD: Track = (() => {
  const hark: [number, number][] = [
    [62, 4],
    [67, 4],
    [67, 6],
    [66, 2],
    [67, 4],
    [71, 4],
    [71, 4],
    [69, 4],
  ]
  const melody: [number, number][] = [
    // Hark! the herald angels sing.
    ...hark,
    // Glory to the newborn King.
    [74, 4],
    [74, 4],
    [74, 6],
    [72, 2],
    [71, 4],
    [69, 4],
    [71, 8],
    // Peace on earth and mercy mild.
    ...hark,
    // God and sinners reconciled.
    [74, 4],
    [69, 4],
    [69, 6],
    [66, 2],
    [66, 4],
    [64, 4],
    [62, 8],
  ]
  const halves = [G, G, G, D, G, C, D, G, G, G, G, D, D, D, D, D]
  return {
    id: 'hark_the_herald',
    name: 'Hark! The herald angels sing',
    bpm: 108,
    steps: 128,
    notes: [...phrase(0, melody, 'lead'), ...oompah(halves)],
  }
})()

export const CAROLS: readonly Track[] = [
  SILENT_NIGHT,
  GOOD_KING_WENCESLAS,
  HARK_THE_HERALD,
]
