/**
 * Low-level colour packing.
 *
 * The renderer writes straight into a `Uint32Array` view of the canvas
 * `ImageData`, so colours are pre-packed into whatever byte order this machine
 * uses rather than being re-assembled per pixel.
 */
const LITTLE_ENDIAN =
  new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44

/** Packs 8-bit channels into a canvas-ready, fully opaque pixel. */
export function packRgb(r: number, g: number, b: number): number {
  return LITTLE_ENDIAN
    ? ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0
    : ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0
}

/** Splits an `#rrggbb` string into its channels. */
export function unpackHex(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
}

/** Packs an `#rrggbb` string into a canvas-ready pixel. */
export function packHex(hex: string): number {
  const [r, g, b] = unpackHex(hex)
  return packRgb(r, g, b)
}

export function clamp255(value: number): number {
  if (value < 0) return 0
  if (value > 255) return 255
  return Math.round(value)
}

/**
 * Brightens a colour towards the firelight tint. `amount` is 0 for a surface
 * the fire cannot reach and 1 for one pressed right against the flames.
 */
export function litColor(base: string, glow: string, amount: number): number {
  const [r, g, b] = unpackHex(base)
  const [gr, gg, gb] = unpackHex(glow)
  const lift = 1 + 0.34 * amount
  const tint = 0.22 * amount
  return packRgb(
    clamp255(r * lift + gr * tint),
    clamp255(g * lift + gg * tint),
    clamp255(b * lift + gb * tint),
  )
}
