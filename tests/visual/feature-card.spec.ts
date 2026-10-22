import { test, expect } from '@playwright/test';

const cases = [
  { name: 'violet', title: 'Build with confidence', width: 1440, height: 900, index: 0 },
  { name: 'mint', title: 'Make every pixel count', width: 1440, height: 900, index: 1 },
  { name: 'peach', title: 'Designed to scale', width: 1440, height: 900, index: 2 },
  { name: 'mobile-violet', title: 'Build with confidence', width: 375, height: 850, index: 0 },
] as const;

for (const item of cases) {
  test(item.name, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator('.cards article').nth(item.index);
    await expect(card.getByRole('heading', { name: item.title })).toBeVisible();
    await expect(card).toHaveScreenshot(`${item.name}.png`);
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(280);
    expect(box!.height).toBeGreaterThanOrEqual(item.width < 640 ? 300 : 348);
  });
}
