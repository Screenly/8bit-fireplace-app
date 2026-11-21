/**
 * Fireworks shot up out of the fire. They glow on their own, so they are
 * written straight into the frame rather than lit by the fire.
 */
import { packHex } from './colors'
import { FIREWORK_RAMPS } from './festive-sprites'
import { randRange, type Rng } from './prng'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
}

interface Rocket {
  x: number
  y: number
  vy: number
  burstY: number
  ramp: number
}

interface Burst {
  sparks: Spark[]
  ramp: number
}

const FIRST_LAUNCH: [number, number] = [30, 90]
const LAUNCH_GAP: [number, number] = [25, 110]
const MAX_BURSTS = 3
const FINALE_BURSTS = 9

export class Fireworks {
  private readonly rockets: Rocket[] = []
  private readonly bursts: Burst[] = []
  private readonly ramps: Uint32Array[]
  private wait: number
  private finaleTicks = 0

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly band: { top: number; bottom: number },
    private readonly scale: number,
    private readonly rng: Rng,
  ) {
    this.ramps = FIREWORK_RAMPS.map(
      (ramp) => new Uint32Array(ramp.map((hex) => packHex(hex))),
    )
    this.wait = randRange(rng, ...FIRST_LAUNCH)
  }

  finale(ticks: number): void {
    this.finaleTicks = ticks
    this.wait = 0
  }

  tick(): void {
    if (this.finaleTicks > 0) this.finaleTicks--
    if (--this.wait <= 0) {
      const finale = this.finaleTicks > 0
      this.wait = finale
        ? randRange(this.rng, 3, 12)
        : randRange(this.rng, ...LAUNCH_GAP)
      const most = finale ? FINALE_BURSTS : MAX_BURSTS
      if (this.bursts.length + this.rockets.length < most) this.launch()
    }
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i]
      r.y += r.vy
      r.vy = Math.min(-0.6, r.vy * 0.985)
      if (r.y <= r.burstY) {
        this.rockets.splice(i, 1)
        this.burst(r)
      }
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const burst = this.bursts[i]
      for (let j = burst.sparks.length - 1; j >= 0; j--) {
        const s = burst.sparks[j]
        s.x += s.vx
        s.y += s.vy
        s.vx *= 0.96
        s.vy = s.vy * 0.96 + 0.025
        if (++s.age >= s.life) burst.sparks.splice(j, 1)
      }
      if (burst.sparks.length === 0) this.bursts.splice(i, 1)
    }
  }

  draw(pixels: Uint32Array): void {
    for (const r of this.rockets) {
      const ramp = this.ramps[1]
      for (let t = 0; t < 4; t++) {
        this.set(pixels, r.x, r.y + t * 2, ramp[Math.min(4, t + 1)])
      }
      this.set(pixels, r.x, r.y, ramp[0])
    }
    for (const burst of this.bursts) {
      const ramp = this.ramps[burst.ramp]
      for (const s of burst.sparks) {
        const t = s.age / s.life
        if (t > 0.7 && (s.age + Math.round(s.x)) % 3 === 0) continue
        const step = Math.min(ramp.length - 1, Math.floor(t * ramp.length))
        this.set(pixels, s.x, s.y, ramp[step])
      }
    }
  }

  private set(pixels: Uint32Array, x: number, y: number, color: number) {
    const px = Math.round(x)
    const py = Math.round(y)
    for (let dy = 0; dy < this.scale; dy++) {
      for (let dx = 0; dx < this.scale; dx++) {
        const sx = px + dx
        const sy = py + dy
        if (sx < 0 || sy < 0 || sx >= this.width || sy >= this.height) continue
        pixels[sy * this.width + sx] = color
      }
    }
  }

  private launch(): void {
    const { top, bottom } = this.band
    const margin = Math.round(this.width * 0.12)
    this.rockets.push({
      x: randRange(this.rng, margin, Math.max(margin, this.width - margin)),
      y: this.height * 0.65,
      vy: -(1.6 + this.rng() * 0.8) * this.scale,
      burstY: top + this.rng() * Math.max(1, bottom - top),
      ramp: Math.floor(this.rng() * this.ramps.length),
    })
  }

  private burst(rocket: Rocket): void {
    const count = randRange(this.rng, 30, 48)
    const power = (0.7 + this.rng() * 0.5) * this.scale
    const sparks: Spark[] = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.rng() * 0.3
      const speed = power * (0.6 + this.rng() * 0.6)
      sparks.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: randRange(this.rng, 35, 60),
      })
    }
    this.bursts.push({ sparks, ramp: rocket.ramp })
  }
}
