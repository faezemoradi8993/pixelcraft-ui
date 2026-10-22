import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173/pixelcraft-ui/', trace: 'retain-on-failure', screenshot: 'only-on-failure', ...devices['Desktop Chrome'], deviceScaleFactor: 1, reducedMotion: 'reduce' },
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173/pixelcraft-ui/', reuseExistingServer: !process.env.CI, timeout: 30_000 }
});
