/**
 * Wrapped presents, each made up from a random size, paper and ribbon.
 */
import { FESTIVE, scaleSprite } from './festive-sprites'
import { freeSpot, type Span } from './halloween-hearth'
import type { Sprite } from './halloween-sprites'
import { randRange, type Rng } from './prng'

export interface Present {
  readonly sprite: Sprite
  readonly x: number
}

const WRAPS: readonly [number, number, number][] = [
  [FESTIVE.RED, FESTIVE.RED_DARK, FESTIVE.GOLD],
  [FESTIVE.PINE_LIGHT, FESTIVE.PINE, FESTIVE.RED_LIGHT],
  [FESTIVE.BLUE, FESTIVE.BLUE_DARK, FESTIVE.SNOW],
  [FESTIVE.GOLD, FESTIVE.GOLD_DARK, FESTIVE.RED],
  [FESTIVE.PINE, FESTIVE.PINE_DARK, FESTIVE.GOLD],
  [FESTIVE.SNOW, FESTIVE.SNOW_SHADE, FESTIVE.RED],
]

interface Box {
  w: number
  h: number
  wrap: readonly [number, number, number]
  dotted: boolean
}

function randomBox(rng: Rng, minW: number, maxW: number): Box {
  // Odd widths, so the ribbon runs down the exact middle.
  const w = randRange(rng, minW >> 1, maxW >> 1) * 2 + 1
  return {
    w,
    h: randRange(rng, 9, Math.max(9, Math.min(16, w - 3))),
    wrap: WRAPS[Math.floor(rng() * WRAPS.length)],
    dotted: rng() < 0.35,
  }
}

/**
 * Draws a box into `pixels` with the top of its bow at `top`. Without a bow
 * the box still starts two rows down, where it would have been.
 */
function paintBox(
  pixels: Uint8Array,
  stride: number,
  left: number,
  top: number,
  box: Box,
  bow = true,
): void {
  const [paper, shade, ribbon] = box.wrap
  const set = (x: number, y: number, c: number) => {
    pixels[(top + y) * stride + left + x] = c
  }
  const cx = box.w >> 1
  if (bow) {
    for (const dx of [-2, -1, 1, 2]) set(cx + dx, 0, ribbon)
    for (const dx of [-1, 0, 1]) set(cx + dx, 1, ribbon)
  }

  const bandY = 2 + Math.floor(box.h * 0.45)
  for (let y = 2; y < box.h + 2; y++) {
    for (let x = 0; x < box.w; x++) {
      const edge = x === 0 || x === box.w - 1 || y === 2 || y === box.h + 1
      let c = paper
      if (x === box.w - 2 || y === box.h) c = shade
      if (box.dotted && (x + y * 2) % 4 === 0) c = ribbon
      if (x === cx || y === bandY) c = ribbon
      set(x, y, edge ? FESTIVE.OUTLINE : c)
    }
  }
}

export function makePresent(rng: Rng, maxW = 21, scale = 1): Sprite {
  const base = randomBox(rng, Math.min(13, maxW - 2), maxW)
  const stacked = base.w >= 17 && rng() < 0.4
  const top = stacked ? randomBox(rng, 9, base.w - 6) : null
  const w = base.w
  // The top box sits right on the lid, where the base's bow would be.
  const h = base.h + 2 + (top ? top.h : 0)
  const pixels = new Uint8Array(w * h).fill(FESTIVE.TRANSPARENT)
  if (top) {
    const offset = randRange(rng, 1, w - top.w - 1)
    paintBox(pixels, w, offset, 0, top)
    paintBox(pixels, w, 0, top.h, base, false)
  } else {
    paintBox(pixels, w, 0, 0, base)
  }
  return scaleSprite({ w, h, pixels }, scale)
}

export function placePresents(
  spans: readonly Span[],
  rng: Rng,
  scale = 1,
  taken: readonly { x: number; sprite: { w: number } }[] = [],
  most = 4,
): Present[] {
  const presents: Present[] = []
  if (spans.length === 0) return presents
  let misses = 0
  const order: Span[][] = [[spans[0]], [spans[1]]]
  while (misses < 3 && presents.length < most) {
    const where = order.shift() ?? spans
    const sprite = makePresent(rng, 21, scale)
    const x = freeSpot(where, [...taken, ...presents], sprite.w, rng)
    if (x === null) {
      misses++
      continue
    }
    presents.push({ sprite, x })
  }
  return presents
}
