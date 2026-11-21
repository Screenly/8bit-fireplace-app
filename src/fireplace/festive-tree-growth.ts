/**
 * Growing the Christmas tree: pot, trunk, drooping branches and outline.
 */
import type { IndexedBitmap } from './bitmap'
import { FESTIVE } from './festive-sprites'
import type { Rng } from './prng'

export function isPine(c: number): boolean {
  return (
    c === FESTIVE.PINE || c === FESTIVE.PINE_LIGHT || c === FESTIVE.PINE_DARK
  )
}

export function colorAt(bmp: IndexedBitmap, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= bmp.width || y >= bmp.height) {
    return FESTIVE.TRANSPARENT
  }
  return bmp.data[y * bmp.width + x]
}

export function drawPotAndTrunk(bmp: IndexedBitmap, top: number): number {
  const { width, height: h } = bmp
  const cx = width >> 1
  const potH = Math.max(3, Math.round(h * 0.09))
  const potW = Math.max(5, Math.round(width * 0.3)) | 1
  for (let py = 0; py < potH; py++) {
    const half = (potW >> 1) - Math.floor((py / potH) * 2)
    let color: number = FESTIVE.RED
    if (py === 0) color = FESTIVE.RED_LIGHT
    else if (py === Math.round(potH * 0.4)) color = FESTIVE.GOLD
    else if (py === potH - 1) color = FESTIVE.RED_DARK
    for (let dx = -half; dx <= half; dx++) {
      const edge = Math.abs(dx) === half
      bmp.set(cx + dx, h - potH + py, edge ? FESTIVE.OUTLINE : color)
    }
  }
  const trunkHalf = Math.max(1, Math.round(width * 0.04))
  for (let y = top; y < h - potH; y++) {
    for (let dx = -trunkHalf; dx <= trunkHalf; dx++) {
      const edge = Math.abs(dx) === trunkHalf
      bmp.set(cx + dx, y, edge ? FESTIVE.OUTLINE : FESTIVE.GOLD_DARK)
    }
  }
  return potH
}

function drawClump(
  bmp: IndexedBitmap,
  cx: number,
  cy: number,
  r: number,
  towardFire: number,
  rng: Rng,
): void {
  const rx = r * 1.35
  const ry = r * 0.85
  for (let oy = -Math.ceil(ry); oy <= Math.ceil(ry); oy++) {
    for (let ox = -Math.ceil(rx); ox <= Math.ceil(rx); ox++) {
      const nx = ox / rx
      const ny = oy / ry
      const d = nx * nx + ny * ny
      if (d > 1 || (d > 0.6 && rng() < 0.3)) continue
      const light = -ny * 0.9 + nx * towardFire * 0.45 + (rng() - 0.5) * 0.5
      let color: number = FESTIVE.PINE
      if (ny > 0.6 || light < -0.35) color = FESTIVE.PINE_DARK
      else if (light > 0.35) color = FESTIVE.PINE_LIGHT
      bmp.set(Math.round(cx + ox), Math.round(cy + oy), color)
    }
  }
  for (let i = 0; i < 2; i++) {
    if (rng() < 0.5) continue
    const x = Math.round(cx + (rng() - 0.5) * rx * 2)
    bmp.set(x, Math.round(cy + ry + 1), FESTIVE.PINE_DARK)
  }
}

export interface Growth {
  tips: [number, number][]
}

/**
 * Whorls of branches from the bottom up, so each tier's needles lie over
 * the tops of the branches below it.
 */
export function growBranches(
  bmp: IndexedBitmap,
  top: number,
  bottom: number,
  towardFire: number,
  rng: Rng,
): Growth {
  const cx = bmp.width >> 1
  const height = bottom - top
  const maxHalf = bmp.width / 2 - 1.5
  const spacing = Math.max(3, Math.min(8, Math.round(height / 11)))
  const whorls = Math.max(4, Math.round(height / spacing))
  const clumpSize = Math.max(1.2, Math.min(3.2, bmp.width / 18))
  const tips: [number, number][] = []

  // A dark core first, so gaps between branches read as depth, not holes.
  for (let y = top + 2; y < bottom; y++) {
    const t = (y - top) / height
    const half = Math.round(maxHalf * (0.05 + 0.95 * t ** 0.85) * 0.7)
    bmp.hLine(cx - half, y, half * 2 + 1, FESTIVE.PINE_DARK)
  }

  for (let i = whorls - 1; i >= 0; i--) {
    const y = top + ((i + 0.7) / whorls) * height
    const t = (y - top) / height
    const reach = maxHalf * (0.05 + 0.95 * t ** 0.85)
    for (const side of [-1, 1]) {
      const length = reach * (0.85 + rng() * 0.2)
      const lift = (rng() - 0.5) * spacing * 0.5
      const step = Math.max(1.2, clumpSize * 0.9)
      for (let d = 0; d <= length; d += step) {
        const along = d / Math.max(1, length)
        const droop = along ** 1.7 * Math.max(2, length * 0.22)
        const r = clumpSize * (1.25 - 0.5 * along) * (0.85 + rng() * 0.3)
        drawClump(bmp, cx + side * d, y + lift + droop, r, towardFire, rng)
      }
      tips.push([
        Math.round(cx + side * length),
        Math.round(y + lift + Math.max(2, length * 0.22) + clumpSize),
      ])
    }
    drawClump(bmp, cx, y, clumpSize * 1.2, towardFire, rng)
  }
  return { tips }
}

export function outline(bmp: IndexedBitmap): void {
  const { width, height } = bmp
  const edge: number[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (colorAt(bmp, x, y) !== FESTIVE.TRANSPARENT) continue
      const near =
        isPine(colorAt(bmp, x - 1, y)) ||
        isPine(colorAt(bmp, x + 1, y)) ||
        isPine(colorAt(bmp, x, y - 1)) ||
        isPine(colorAt(bmp, x, y + 1))
      if (near) edge.push(y * width + x)
    }
  }
  for (const i of edge) bmp.data[i] = FESTIVE.OUTLINE
}
