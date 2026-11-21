/**
 * The shared shape of every tune: MIDI note numbers on a grid of sixteenth
 * notes, with helpers for writing them down.
 */
/**
 * - `arp`: thin pulse wave, short and plucky
 * - `bass`: triangle wave
 * - `lead`: reedy pulse wave with vibrato
 * - `pad`: thin pulse wave held for the full length, for an organ-like body
 * - `bell`: high triangle that rings out and decays, like a music box
 */
export type Voice = 'arp' | 'bass' | 'lead' | 'pad' | 'bell'

/** `[step, midi note, length in sixteenths, voice]` */
export type Note = readonly [number, number, number, Voice]

export interface Track {
  /** The value used for it in the `music` setting. */
  readonly id: string
  readonly name: string
  readonly bpm: number
  /** Loop length in sixteenth notes. */
  readonly steps: number
  readonly notes: readonly Note[]
  /** The lead sits out every other pass, so the loop breathes. */
  readonly leadEveryOther?: boolean
}

/** Repeats a voice's line, one entry per `every` sixteenths. */
export function line(
  notes: readonly (number | null)[],
  every: number,
  length: number,
  voice: Voice,
): Note[] {
  return notes.flatMap((note, i) =>
    note === null ? [] : [[i * every, note, length, voice] as const],
  )
}

/** Notes given as `[midi, length]` back to back from a starting step. */
export function phrase(
  start: number,
  notes: [number, number][],
  voice: Voice,
): Note[] {
  let step = start
  return notes.flatMap(([note, length]) => {
    const at = step
    step += length
    return note === 0 ? [] : [[at, note, length, voice] as const]
  })
}

export function hz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}
