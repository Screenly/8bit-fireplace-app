/**
 * New Year's Eve party guests: they bop, blow party horns, watch the final
 * seconds and cheer at midnight.
 */
import { FESTIVE, festiveSprite } from './festive-sprites'
import { drawSprite, type Plot, type Sprite } from './halloween-sprites'
import { randRange, type Rng } from './prng'

/*
 * Half rows: each is mirrored to make a symmetric figure ten pixels wide.
 * H and h are the hat's stripes, A the hair, S the top, T a tie or brooch
 * and P the trousers.
 */
const MAN = [
  '....w',
  '....H',
  '...Hh',
  '...hH',
  '..AAA',
  '.Afff',
  '..fkf',
  '..ffd',
  '....f',
  '.SSSS',
  'fSSST',
  'fSSST',
  'fSSSS',
  '.SSSS',
  '.kkkk',
  '.PPPP',
  '.PP..',
  '.PP..',
  '.PP..',
  '.kk..',
]

const WOMAN = [
  '....w',
  '....H',
  '...Hh',
  '...hH',
  '..AAA',
  '.Afff',
  '.Afkf',
  '.Affd',
  '.A..f',
  '.SSSS',
  'fSSSS',
  'fSSST',
  'fSSSS',
  '.SSSS',
  'SSSSS',
  'SSSSS',
  '...f.',
  '...f.',
  '...f.',
  '..kk.',
]

function armsUp(rows: readonly string[]): string[] {
  return rows.map((row, y) => {
    if (y === 4) return `f${row.slice(1)}`
    if (y >= 5 && y <= 8) return `S${row.slice(1)}`
    if (y >= 10 && y <= 12) return `.${row.slice(1)}`
    return row
  })
}

interface Outfit {
  hat: [string, string]
  hair: string
  top: string
  accent: string
  bottom: string
}

const HATS: [string, string][] = [
  ['r', 'Y'],
  ['U', 'w'],
  ['g', 'Y'],
  ['Y', 'R'],
]
const HAIR = ['y', 'k', 'Y', 'd']
const TOPS = ['U', 'r', 'g', 'w', 'u']
const ACCENTS = ['R', 'Y', 'w']
const BOTTOMS = ['b', 'u', 'k']

function dress(rows: readonly string[], o: Outfit): Sprite {
  const swap: Record<string, string> = {
    H: o.hat[0],
    h: o.hat[1],
    A: o.hair,
    S: o.top,
    T: o.accent,
    P: o.bottom,
  }
  return festiveSprite(
    rows.map((half) => {
      const row = half.replace(/[HhASTP]/g, (c) => swap[c])
      return row + [...row].reverse().join('')
    }),
  )
}

const MOUTH = { x: 5, y: 7 }
const HORN_TICKS = 40
const HORN_GAP: [number, number] = [30 * 6, 30 * 18]
const CHEER_TICKS = 30 * 5
const HORN_COLORS = [FESTIVE.RED, FESTIVE.GOLD]

interface Guest {
  x: number
  stand: Sprite
  cheer: Sprite
  phase: number
  side: 1 | -1
  horn: number
  hornWait: number
}

export const guestWidth = (scale: number) => 10 * scale

export class Guests {
  private readonly guests: Guest[] = []
  private ticks = 0
  private cheering = 0
  private watching = false

  constructor(
    spots: readonly number[],
    width: number,
    private readonly ground: number,
    private readonly scale: number,
    private readonly rng: Rng,
  ) {
    // Hats, hair and tops are dealt out without repeats, so no two guests
    // at the party look alike.
    const hats = shuffle(HATS, rng)
    const hair = shuffle(HAIR, rng)
    const tops = shuffle(TOPS, rng)
    const first = rng() < 0.5 ? 0 : 1
    spots.forEach((x, i) => {
      const pick = <T>(items: readonly T[]) =>
        items[Math.floor(rng() * items.length)]
      const outfit: Outfit = {
        hat: hats[i % hats.length],
        hair: hair[i % hair.length],
        top: tops[i % tops.length],
        accent: pick(ACCENTS),
        bottom: pick(BOTTOMS),
      }
      const figure = (i + first) % 2 === 0 ? MAN : WOMAN
      this.guests.push({
        x,
        stand: dress(figure, outfit),
        cheer: dress(armsUp(figure), outfit),
        phase: randRange(rng, 0, 29),
        side: x + guestWidth(scale) / 2 < width / 2 ? 1 : -1,
        horn: 0,
        hornWait: randRange(rng, ...HORN_GAP),
      })
    })
  }

  midnight(): void {
    this.cheering = CHEER_TICKS
  }

  tick(watching: boolean): void {
    this.ticks++
    this.watching = watching
    if (this.cheering > 0) this.cheering--
    for (const g of this.guests) {
      if (g.horn > 0) g.horn--
      else if (!watching && this.cheering === 0 && --g.hornWait <= 0) {
        g.horn = HORN_TICKS
        g.hornWait = randRange(this.rng, ...HORN_GAP)
      }
    }
  }

  draw(plot: Plot): void {
    const s = this.scale
    for (const g of this.guests) {
      const cheering = this.cheering > 0
      const sprite = cheering ? g.cheer : g.stand
      let lift = 0
      if (cheering) {
        lift = Math.floor((this.ticks + g.phase) / 6) % 2 === 0 ? 3 * s : 0
      } else if (!this.watching) {
        lift = Math.floor((this.ticks + g.phase) / 15) % 2 === 0 ? s : 0
      }
      const top = this.ground - sprite.h * s - lift
      drawSprite(plot, sprite, g.x, top, s)
      if (g.horn > 0 && !cheering) this.drawHorn(plot, g, top)
    }
  }

  private drawHorn(plot: Plot, g: Guest, top: number): void {
    const s = this.scale
    const t = 1 - Math.abs(g.horn / HORN_TICKS - 0.5) * 2
    const length = Math.max(1, Math.round(t * 7))
    const mouthX = g.x + (MOUTH.x + (g.side > 0 ? 1 : -1)) * s
    const y = top + MOUTH.y * s
    for (let i = 0; i < length; i++) {
      const color = HORN_COLORS[i % 2]
      const curl = i === length - 1 && length < 7 ? s : 0
      for (let a = 0; a < s; a++) {
        for (let b = 0; b < s; b++) {
          plot(mouthX + g.side * i * s + a, y + curl + b, color)
        }
      }
    }
  }
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
