import { test } from '@playwright/test'
import {
  captureScreenshot,
  createMockScreenlyForScreenshots,
  RESOLUTIONS,
} from '@screenly/edge-apps/test/screenshots'

const { screenlyJsContent } = createMockScreenlyForScreenshots(
  { hostname: 'srly-fireplace-demo', screen_name: 'Fireplace Demo' },
  {
    caption: '',
    crt_effect: 'false',
    flame_color: 'classic',
    flame_height: 'medium',
    pixel_size: 'classic',
    scene: 'hearth',
  },
)

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height}`, async ({ browser }) => {
    await captureScreenshot(browser, {
      width,
      height,
      filenamePrefix: 'fireplace-app',
      screenlyJsContent,
    })
  })
}
