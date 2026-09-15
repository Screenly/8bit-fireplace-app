/**
 * Blitting for the bitmap font, straight into the frame buffer.
 */
import { GLYPH_H, GLYPH_W, glyphFor, measureText } from './font'

export interface TextStyle {
  scale: number
  tracking: number
  color: number
  shadow: number
}

interface Target {
  pixels: Uint32Array
  width: number
  height: number
}

function blitGlyph(
  target: Target,
  mask: Uint8Array,
  left: number,
  top: number,
  scale: number,
  color: number,
): void {
  for (let row = 0; row < GLYPH_H; row++) {
    const bits = mask[row]
    if (bits === 0) continue
    for (let col = 0; col < GLYPH_W; col++) {
      if ((bits & (1 << (GLYPH_W - 1 - col))) === 0) continue
      fillBlock(target, left + col * scale, top + row * scale, scale, color)
    }
  }
}

function fillBlock(
  target: Target,
  x: number,
  y: number,
  size: number,
  color: number,
): void {
  const x1 = Math.min(target.width, x + size)
  const y1 = Math.min(target.height, y + size)
  for (let py = Math.max(0, y); py < y1; py++) {
    const offset = py * target.width
    for (let px = Math.max(0, x); px < x1; px++)
      target.pixels[offset + px] = color
  }
}

const OUTLINE = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

/**
 * Draws `text` anchored at its top-left corner.
 *
 * The glyphs get a full outline rather than a drop shadow: a caption has to
 * stay readable both against dark stone and against the white-hot core of the
 * fire, and a one-sided shadow only works for one of those.
 */
export function drawText(
  target: Target,
  text: string,
  x: number,
  y: number,
  style: TextStyle,
): void {
  const step = (GLYPH_W + style.tracking) * style.scale
  for (let i = 0; i < text.length; i++) {
    const mask = glyphFor(text[i])
    const left = x + i * step
    for (const [dx, dy] of OUTLINE) {
      const s = style.scale
      blitGlyph(target, mask, left + dx * s, y + dy * s, s, style.shadow)
    }
    blitGlyph(target, mask, left, y, style.scale, style.color)
  }
}

/** Draws `text` horizontally centred in the target. */
export function drawCenteredText(
  target: Target,
  text: string,
  y: number,
  style: TextStyle,
): void {
  const width = measureText(text, style.scale, style.tracking)
  drawText(target, text, Math.round((target.width - width) / 2), y, style)
}

/** Height a line of text occupies at `scale`, outline included. */
export function textHeight(scale: number): number {
  return (GLYPH_H + 2) * scale
}

/** Largest scale at which `text` still fits within `maxWidth`/`maxHeight`. */
export function fitTextScale(
  text: string,
  maxWidth: number,
  maxHeight: number,
  tracking: number,
): number {
  for (let scale = 4; scale > 1; scale--) {
    const fits =
      measureText(text, scale, tracking) + 2 * scale <= maxWidth &&
      textHeight(scale) <= maxHeight
    if (fits) return scale
  }
  return 1
}
