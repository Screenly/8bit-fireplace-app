/**
 * The countdown to midnight on New Year's Eve, by the screen's own clock.
 */
import { packHex } from './colors'
import { FESTIVE, GLYPH_H, textPixels } from './festive-sprites'
import type { Plot } from './halloween-sprites'

const DAY = 24 * 60 * 60 * 1000
const CELEBRATE_MS = 8000

const DIGIT = packHex('#ffd040')
const DIGIT_DIM = packHex('#5a4010')
const BIG = [packHex('#fff2b0'), packHex('#ffd040')]
const BIG_SHADOW = packHex('#3a1a04')

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * What the board says with `ms` to go: `3D 14:05:09`, then `14:05:09` on the
 * last day.
 */
export function countdownText(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const days = Math.floor(total / 86400)
  const clock = `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
  return days > 0 ? `${days}D ${clock}` : clock
}

export class Countdown {
  private readonly midnight: number
  private readonly year: number
  private left: number
  private celebrateUntil = 0

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly top: number,
    private readonly scale: number,
    year: number,
    private readonly clock: () => number,
  ) {
    this.midnight = new Date(year, 0, 1).getTime()
    this.year = year
    this.left = this.midnight - clock()
  }

  get done(): boolean {
    return this.left <= 0
  }

  get finalSeconds(): boolean {
    return this.left > 0 && this.left <= 10_000
  }

  tick(): boolean {
    const now = this.clock()
    const before = this.left
    this.left = this.midnight - now
    if (before > 0 && this.left <= 0) {
      this.celebrateUntil = now + CELEBRATE_MS
      return true
    }
    return false
  }

  get bottom(): number {
    return this.top + this.boardHeight()
  }

  private boardHeight(): number {
    return GLYPH_H * this.scale + 4 * this.scale
  }

  draw(plot: Plot, pixels: Uint32Array): void {
    if (this.left > 0) this.drawBoard(plot, pixels)
    const now = this.clock()
    if (this.left > 0 && this.left <= 10_000) {
      const seconds = Math.ceil(this.left / 1000)
      const into = 1 - (this.left % 1000) / 1000
      this.drawBig(pixels, String(seconds), into < 0.15 ? 1 : 0)
    } else if (now < this.celebrateUntil) {
      const flash = Math.floor((this.celebrateUntil - now) / 250) % 2
      this.drawBig(pixels, String(this.year), flash)
    }
  }

  private drawBoard(plot: Plot, pixels: Uint32Array): void {
    const s = this.scale
    const text = countdownText(this.left)
    const { w, on } = textPixels(text)
    // Sized for the widest text it will show, so it does not jump about.
    const widest = textPixels(this.left > DAY ? '0D 00:00:00' : '00:00:00').w
    const boardW = Math.max(w, widest) * s + 6 * s
    const boardH = this.boardHeight()
    const left = Math.round((this.width - boardW) / 2)
    for (let y = 0; y < boardH; y++) {
      for (let x = 0; x < boardW; x++) {
        const edge = Math.min(x, y, boardW - 1 - x, boardH - 1 - y)
        let color: number = FESTIVE.OUTLINE
        if (edge < s) color = FESTIVE.GOLD_DARK
        plot(left + x, this.top + y, color)
      }
    }
    const textLeft = left + Math.round((boardW - w * s) / 2)
    const textTop = this.top + 2 * s
    on.forEach((row, gy) => {
      row.forEach((lit, gx) => {
        this.block(
          pixels,
          textLeft + gx * s,
          textTop + gy * s,
          s,
          lit ? DIGIT : DIGIT_DIM,
          lit,
        )
      })
    })
  }

  private drawBig(pixels: Uint32Array, text: string, bright: number): void {
    const { w, on } = textPixels(text)
    const size = Math.max(3, Math.round((this.height * 0.16) / GLYPH_H))
    const left = Math.round((this.width - w * size) / 2)
    const top = Math.max(
      this.bottom + 4 * this.scale,
      Math.round(this.height * 0.38 - (GLYPH_H * size) / 2),
    )
    for (const [d, color] of [
      [Math.max(1, Math.round(size / 3)), BIG_SHADOW],
      [0, BIG[bright]],
    ] as const) {
      on.forEach((row, gy) => {
        row.forEach((lit, gx) => {
          if (lit) {
            this.block(
              pixels,
              left + gx * size + d,
              top + gy * size + d,
              size,
              color,
              true,
            )
          }
        })
      })
    }
  }

  private block(
    pixels: Uint32Array,
    x: number,
    y: number,
    size: number,
    color: number,
    lit: boolean,
  ): void {
    if (!lit && size < 2) return
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = x + dx
        const py = y + dy
        if (px < 0 || py < 0 || px >= this.width || py >= this.height) continue
        pixels[py * this.width + px] = color
      }
    }
  }
}
