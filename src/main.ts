import './style.css'
import {
  getHardware,
  getScreenName,
  getScreenlyVersion,
  reportError,
  setupErrorHandling,
  setupSentry,
  signalReady,
} from '@screenly/edge-apps'
import { createStage, present, type Stage } from './fireplace/display'
import { readSettings, type FireplaceSettings } from './fireplace/settings'

/** The simulation runs at a fixed 30 ticks per second on every player. */
const TICK_MS = 1000 / 30
/** Ticks caught up in one frame before the clock is considered lost. */
const MAX_CATCH_UP = 4
const RESIZE_DEBOUNCE_MS = 250

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight }
}

function start(canvas: HTMLCanvasElement, settings: FireplaceSettings): void {
  let stage: Stage = createStage(canvas, settings, viewport())
  let last = Date.now()
  let accumulator = 0
  let ready = false
  let reported = false

  const rebuild = debounce(() => {
    try {
      stage = createStage(canvas, settings, viewport())
      accumulator = TICK_MS
    } catch (error) {
      reportError(error, { source: 'resize' })
    }
  }, RESIZE_DEBOUNCE_MS)

  function frame(): void {
    const now = Date.now()
    // A player's clock can jump when NTP lands; clamp rather than fast-forward.
    const delta = Math.min(1000, Math.max(0, now - last))
    last = now
    accumulator += delta

    let ticks = 0
    while (accumulator >= TICK_MS && ticks < MAX_CATCH_UP) {
      stage.engine.tick()
      accumulator -= TICK_MS
      ticks++
    }
    if (accumulator > TICK_MS * MAX_CATCH_UP) accumulator = 0

    if (ticks > 0 || !ready) {
      try {
        present(stage)
      } catch (error) {
        if (!reported) {
          reported = true
          reportError(error, { source: 'render' })
        }
      }
      if (!ready) {
        ready = true
        signalReady()
      }
    }
    window.requestAnimationFrame(frame)
  }

  window.addEventListener('resize', rebuild)
  window.addEventListener('orientationchange', rebuild)
  window.requestAnimationFrame(frame)
}

function debounce(action: () => void, wait: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(action, wait)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupErrorHandling()
  setupSentry('8bit-fireplace', {
    '8bit-fireplace': {
      screenName: getScreenName(),
      // The renderer is CPU-bound on the flame simulation, so hardware class
      // and player version are the first things worth knowing about a crash.
      hardware: getHardware(),
      screenlyVersion: getScreenlyVersion(),
    },
  })

  const settings = readSettings()
  document.body.classList.toggle('crt', settings.crt)

  try {
    const canvas = document.getElementById('fireplace')
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Missing #fireplace canvas')
    }
    start(canvas, settings)
  } catch (error) {
    // Nothing can be drawn, but the player must not be left waiting on a
    // ready signal that will never come — that holds a blank screen for the
    // asset's whole duration instead of moving on to the next one.
    reportError(error, { source: 'startup' })
    signalReady()
  }
})
