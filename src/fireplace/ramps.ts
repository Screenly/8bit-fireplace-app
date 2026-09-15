/**
 * Flame colour ramps.
 *
 * Each ramp is a 15-step gradient from the coolest visible flame to the white
 * core. Index 0 means "no flame" and is never drawn, which is what lets the
 * fire composite over the hearth without a separate mask.
 */
import { packHex } from './colors'

export type FlameColor = 'classic' | 'azure' | 'emerald' | 'violet'

export const FLAME_COLORS: readonly FlameColor[] = [
  'classic',
  'azure',
  'emerald',
  'violet',
]

const CLASSIC =
  '#310a00 #5a1200 #7d1c00 #9c2a00 #b83a00 #cf4d05 #e0620c #ef7a14 #f9931e #ffad2b #ffc44a #ffd76e #ffe697 #fff3c4 #fffdf0'
const AZURE =
  '#000f31 #001a5a #00267d #00359c #0046b8 #0559cf #0c6ee0 #1485ef #1e9cf9 #2bb4ff #4ac9ff #6edaff #97e9ff #c4f5ff #f0fdff'
const EMERALD =
  '#00310a #005a12 #007d1c #009c2a #00b83a #05cf4d #0ce062 #14ef7a #1ef993 #2bffad #4affc4 #6effd7 #97ffe6 #c4fff3 #f0fffd'
const VIOLET =
  '#20002f #370050 #4d0072 #660091 #8100ad #9a0bc4 #b11ad6 #c62ce6 #d842f2 #e65bfb #ef79ff #f69aff #fabcff #fddcff #fff4ff'

export const FLAME_RAMPS: Record<FlameColor, readonly string[]> = {
  classic: ['', ...CLASSIC.split(' ')],
  azure: ['', ...AZURE.split(' ')],
  emerald: ['', ...EMERALD.split(' ')],
  violet: ['', ...VIOLET.split(' ')],
}

/** Highest index a flame cell can map to. */
export const FLAME_STEPS = FLAME_RAMPS.classic.length - 1

/** The mid-bright colour of a ramp, used as the tint for reflected firelight. */
export function glowColor(flame: FlameColor): string {
  return FLAME_RAMPS[flame][10]
}

/** Packs a ramp into canvas-ready pixels; index 0 stays transparent. */
export function buildFlameTable(flame: FlameColor): Uint32Array {
  const ramp = FLAME_RAMPS[flame]
  const table = new Uint32Array(ramp.length)
  for (let i = 1; i < ramp.length; i++) table[i] = packHex(ramp[i])
  return table
}
