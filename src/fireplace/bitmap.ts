/**
 * A clipped, indexed-colour bitmap — the surface all the pixel art is drawn
 * onto before the palette is applied.
 */
import type { Rect } from './layout'

export class IndexedBitmap {
  readonly width: number
  readonly height: number
  readonly data: Uint8Array

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height)
  }

  fill(color: number): void {
    this.data.fill(color)
  }

  set(x: number, y: number, color: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    this.data[y * this.width + x] = color
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0
    return this.data[y * this.width + x]
  }

  fillRect(x: number, y: number, w: number, h: number, color: number): void {
    const x0 = Math.max(0, x)
    const y0 = Math.max(0, y)
    const x1 = Math.min(this.width, x + w)
    const y1 = Math.min(this.height, y + h)
    for (let py = y0; py < y1; py++) {
      this.data.fill(color, py * this.width + x0, py * this.width + x1)
    }
  }

  fillArea(rect: Rect, color: number): void {
    this.fillRect(rect.x, rect.y, rect.w, rect.h, color)
  }

  hLine(x: number, y: number, w: number, color: number): void {
    this.fillRect(x, y, w, 1, color)
  }

  vLine(x: number, y: number, h: number, color: number): void {
    this.fillRect(x, y, 1, h, color)
  }

  /** A one-pixel outline just inside `rect`. */
  strokeRect(rect: Rect, color: number): void {
    this.hLine(rect.x, rect.y, rect.w, color)
    this.hLine(rect.x, rect.y + rect.h - 1, rect.w, color)
    this.vLine(rect.x, rect.y, rect.h, color)
    this.vLine(rect.x + rect.w - 1, rect.y, rect.h, color)
  }
}
