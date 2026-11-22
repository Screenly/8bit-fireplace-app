/**
 * Snow drifting down the flue and melting before it reaches the flames.
 */
import { FESTIVE } from './festive-sprites'
import type { Plot } from './halloween-sprites'
import type { Rng } from './prng'

interface Flake {
  x: number
  y: number
  vy: number
  phase: number
  big: boolean
  meltY: number
  melting: number
}

const MELT_TICKS = 8

export class Snow {
  private readonly flakes: Flake[]
  private ticks = 0

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly melt: readonly [number, number],
    private readonly scale: number,
    private readonly rng: Rng,
  ) {
    const count = Math.max(4, Math.round(width / 10))
    this.flakes = Array.from({ length: count }, () => {
      const flake = this.newFlake()
      // Spread down the flue from the start, not all queued at the top.
      flake.y = rng() * flake.meltY
      return flake
    })
  }

  tick(): void {
    this.ticks++
    for (const flake of this.flakes) {
      if (flake.melting > 0) {
        if (--flake.melting === 0) Object.assign(flake, this.newFlake())
        continue
      }
      flake.y += flake.vy
      flake.x += Math.sin(flake.phase + this.ticks * 0.04) * 0.15
      if (flake.y >= flake.meltY) flake.melting = MELT_TICKS
    }
  }

  draw(plot: Plot): void {
    const s = this.scale
    const dot = (px: number, py: number, color: number) => {
      for (let dy = 0; dy < s; dy++) {
        for (let dx = 0; dx < s; dx++) plot(px + dx, py + dy, color)
      }
    }
    for (const flake of this.flakes) {
      const x = Math.round(flake.x)
      const y = Math.round(flake.y)
      if (flake.melting > 0) {
        if (flake.melting % 2 === 0) plot(x, y, FESTIVE.SNOW_SHADE)
        continue
      }
      dot(x, y, FESTIVE.SNOW)
      if (!flake.big) continue
      dot(x - s, y, FESTIVE.SNOW_SHADE)
      dot(x + s, y, FESTIVE.SNOW_SHADE)
      dot(x, y - s, FESTIVE.SNOW_SHADE)
      dot(x, y + s, FESTIVE.SNOW_SHADE)
    }
  }

  private newFlake(): Flake {
    const [lo, hi] = this.melt
    return {
      x: this.rng() * this.width,
      y: -2 - this.rng() * this.height * 0.2,
      vy: (0.12 + this.rng() * 0.22) * this.scale,
      phase: this.rng() * Math.PI * 2,
      big: this.rng() < 0.2,
      meltY: this.height * (lo + this.rng() * (hi - lo)),
      melting: 0,
    }
  }
}
