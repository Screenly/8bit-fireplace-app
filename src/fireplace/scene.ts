/**
 * Assembles the static parts of the picture.
 *
 * Everything that does not change frame to frame — wall, surround, mantel,
 * firebox, logs — is drawn once into indexed bitmaps and then packed with its
 * light band. Each frame only has to apply a palette and draw the flames.
 */
import { IndexedBitmap } from './bitmap'
import type { Layout, Rect } from './layout'
import { computeLayout } from './layout'
import { createLightField, packLayer } from './lighting'
import { drawAndirons, drawFirebox, drawLogs } from './logs'
import { drawMasonry, stoneStyle, wallStyle } from './masonry'
import { SCENE } from './palettes'
import type { Rng } from './prng'

export interface SceneData {
  /** Packed static pixels, drawn under the flames. */
  background: Uint8Array
  /** Packed pixels drawn over the flames; `SKIP_PIXEL` means "leave alone". */
  overlay: Uint8Array
  /** The area the flame simulation covers. */
  fire: Rect
  /** Seed heat per flame column, 0 to 1. */
  sourceStrength: (x: number) => number
  /** Where the overlay has anything to draw, so the blit stays cheap. */
  overlayBounds: Rect
  /** Where embers are thrown from, and how far they may travel. */
  sparkSource: Rect
  sparkBounds: Rect
  layout: Layout
}

function drawRoom(bmp: IndexedBitmap, layout: Layout, rng: Rng): void {
  const unit = Math.max(3, Math.round(layout.height * 0.035))
  drawMasonry(
    bmp,
    { x: 0, y: 0, w: layout.width, h: layout.floorY },
    wallStyle(unit),
    rng,
  )

  const floor = {
    x: 0,
    y: layout.floorY,
    w: layout.width,
    h: layout.height - layout.floorY,
  }
  drawMasonry(
    bmp,
    floor,
    {
      mortar: SCENE.VOID,
      faces: [SCENE.FLOOR_DARK, SCENE.FLOOR_MID, SCENE.FLOOR_LIGHT],
      highlight: SCENE.FLOOR_LIGHT,
      blockW: Math.max(8, unit * 4),
      blockH: Math.max(3, Math.round(unit * 1.4)),
      highlightChance: 0.3,
    },
    rng,
  )
}

function drawSurround(bmp: IndexedBitmap, layout: Layout, rng: Rng): void {
  const { surround, mantel, slab } = layout
  const blockW = Math.max(4, Math.round(surround.w * 0.17))
  const blockH = Math.max(3, Math.round(surround.h * 0.1))
  drawMasonry(bmp, surround, stoneStyle(blockW, blockH), rng)

  bmp.fillArea(mantel, SCENE.MANTEL_MID)
  bmp.hLine(mantel.x, mantel.y, mantel.w, SCENE.MANTEL_LIGHT)
  bmp.hLine(mantel.x, mantel.y + mantel.h - 1, mantel.w, SCENE.MANTEL_DARK)

  bmp.fillArea(slab, SCENE.STONE_MID)
  bmp.hLine(slab.x, slab.y, slab.w, SCENE.STONE_LIGHT)
  bmp.hLine(slab.x, slab.y + slab.h - 1, slab.w, SCENE.STONE_DARK)
}

/** Full pixel-art fireplace: room, surround, mantel, firebox and log pile. */
export function buildHearthScene(
  width: number,
  height: number,
  rng: Rng,
): SceneData {
  const layout = computeLayout(width, height)
  const background = new IndexedBitmap(width, height)
  drawRoom(background, layout, rng)
  drawSurround(background, layout, rng)
  drawFirebox(background, layout, rng)
  drawAndirons(background, layout)

  const overlay = new IndexedBitmap(width, height)
  overlay.fill(SCENE.TRANSPARENT)
  drawLogs(overlay, layout, rng)

  const field = createLightField(layout.fire, layout.opening)
  const headroom = Math.ceil(layout.logBed.h * 0.35)
  return {
    background: packLayer(background.data, width, height, field),
    overlay: packLayer(overlay.data, width, height, field, true),
    fire: layout.fire,
    sourceStrength: logBedStrength(layout),
    overlayBounds: {
      x: layout.logBed.x,
      y: layout.logBed.y - headroom,
      w: layout.logBed.w,
      h: layout.logBed.h + headroom,
    },
    sparkSource: emberSource(layout),
    sparkBounds: layout.opening,
    layout,
  }
}

/** Embers rise from the burning face of the log pile. */
function emberSource(layout: Layout): Rect {
  const depth = Math.max(2, Math.round(layout.fire.h * 0.12))
  return {
    x: layout.logBed.x,
    y: layout.fire.y + layout.fire.h - depth,
    w: layout.logBed.w,
    h: depth,
  }
}

/** Flames taper off past the ends of the log pile rather than stopping dead. */
function logBedStrength(layout: Layout): (x: number) => number {
  const { logBed, fire } = layout
  const half = Math.max(1, logBed.w / 2)
  const center = logBed.x + half
  return (x: number) => {
    const t = Math.abs(fire.x + x - center) / half
    if (t <= 0.82) return 1
    return Math.max(0, 1 - (t - 0.82) / 0.32)
  }
}

/** The "inferno" variant: no room at all, just a full-screen wall of flame. */
export function buildInfernoScene(width: number, height: number): SceneData {
  const layout = computeLayout(width, height)
  const fire = { x: 0, y: 0, w: width, h: height }
  const dark = new Uint8Array(width * height)
  const overlay = new Uint8Array(width * height).fill(255)
  const taper = Math.max(1, Math.round(width * 0.06))
  const depth = Math.max(2, Math.round(height * 0.08))
  return {
    background: dark,
    overlay,
    fire,
    sourceStrength: (x: number) => {
      const edge = Math.min(x, width - 1 - x)
      return edge >= taper ? 1 : Math.max(0.15, edge / taper)
    },
    overlayBounds: { x: 0, y: 0, w: 0, h: 0 },
    sparkSource: { x: 0, y: height - depth, w: width, h: depth },
    sparkBounds: fire,
    layout,
  }
}
