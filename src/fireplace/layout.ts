/**
 * Scene geometry, in virtual (chunky) pixels.
 *
 * Nothing here is hard-coded to a display size: every part of the fireplace is
 * derived from the virtual framebuffer, so the same art composes correctly on
 * every resolution Screenly supports, landscape or portrait.
 */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Layout {
  width: number
  height: number
  portrait: boolean
  /** First row of the floor. */
  floorY: number
  /** The stone fireplace surround. */
  surround: Rect
  /** The firebox opening the fire burns inside. */
  opening: Rect
  /** The wooden mantel shelf. */
  mantel: Rect
  /** The stone slab that juts out onto the floor. */
  slab: Rect
  /** The ash bed at the bottom of the firebox. */
  ashBed: Rect
  /** Where the logs are stacked. */
  logBed: Rect
  /** The area the flame simulation covers. */
  fire: Rect
  /** Where an optional caption is drawn. */
  caption: Rect
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/**
 * Picks an integer upscale factor so every virtual pixel lands on a whole
 * number of device pixels — uneven pixel sizes are the fastest way to make
 * pixel art look wrong.
 */
export function computeScale(
  width: number,
  height: number,
  targetShortSide: number,
): number {
  const short = Math.max(1, Math.min(width, height))
  return Math.max(1, Math.round(short / targetShortSide))
}

/** The virtual framebuffer size for a viewport at a given upscale factor. */
export function computeVirtualSize(
  width: number,
  height: number,
  scale: number,
): { width: number; height: number } {
  return {
    width: Math.max(16, Math.ceil(width / scale)),
    height: Math.max(16, Math.ceil(height / scale)),
  }
}

function computeSurround(width: number, height: number, floorY: number): Rect {
  const portrait = height > width
  const w = Math.round(clamp(width * (portrait ? 0.8 : 0.46), 40, width - 8))
  const maxH = floorY - Math.round(height * 0.17)
  const h = Math.round(
    clamp(w * (portrait ? 1.35 : 0.95), 30, Math.max(30, maxH)),
  )
  return { x: Math.round((width - w) / 2), y: floorY - h, w, h }
}

function computeOpening(surround: Rect): { opening: Rect; frame: number } {
  const frame = Math.max(3, Math.round(surround.w * 0.11))
  const lip = Math.max(2, Math.round(surround.h * 0.05))
  const w = surround.w - frame * 2
  const available = surround.h - frame - lip
  // A firebox much taller than it is wide reads as a doorway. Any surplus
  // height becomes stonework above the opening — a chimney breast.
  const h = Math.min(available, Math.round(w * 1.2))
  return {
    frame,
    opening: {
      x: surround.x + frame,
      y: surround.y + (available - h) + frame,
      w,
      h,
    },
  }
}

/** Derives the whole scene from a virtual framebuffer size. */
export function computeLayout(width: number, height: number): Layout {
  const portrait = height > width
  const floorY = Math.round(height * (portrait ? 0.8 : 0.84))
  const surround = computeSurround(width, height, floorY)
  const { opening, frame } = computeOpening(surround)

  const ashH = Math.max(
    2,
    Math.min(Math.round(opening.h * 0.09), Math.round(opening.w * 0.06)),
  )
  const ashBed = {
    x: opening.x,
    y: opening.y + opening.h - ashH,
    w: opening.w,
    h: ashH,
  }
  const logH = Math.max(4, Math.round(opening.h * 0.2))
  const logPad = Math.max(1, Math.round(opening.w * 0.08))
  const logBed = {
    x: opening.x + logPad,
    y: ashBed.y - logH,
    w: opening.w - logPad * 2,
    h: logH,
  }

  const mantelH = Math.max(3, Math.round(surround.h * 0.07))
  const overhang = Math.max(2, Math.round(frame * 0.7))
  const slabH = Math.max(2, Math.round(height * 0.025))
  const captionY = floorY + slabH + Math.max(1, Math.round(height * 0.015))

  return {
    width,
    height,
    portrait,
    floorY,
    surround,
    opening,
    ashBed,
    logBed,
    mantel: {
      x: surround.x - overhang,
      y: surround.y - mantelH,
      w: surround.w + overhang * 2,
      h: mantelH,
    },
    slab: {
      x: surround.x - overhang * 2,
      y: floorY,
      w: surround.w + overhang * 4,
      h: slabH,
    },
    fire: {
      x: opening.x,
      y: opening.y,
      w: opening.w,
      h: Math.max(4, logBed.y + Math.round(logBed.h * 0.45) - opening.y),
    },
    caption: {
      x: 0,
      y: captionY,
      w: width,
      h: Math.max(
        0,
        height - captionY - Math.max(1, Math.round(height * 0.015)),
      ),
    },
  }
}

/** The full-screen "inferno" variant: no room, just a wall of flame. */
export function computeInfernoFire(width: number, height: number): Rect {
  return { x: 0, y: 0, w: width, h: height }
}
