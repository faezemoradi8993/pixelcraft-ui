import { test, expect } from '@playwright/test';

const layouts = [
  { viewport: 320, cardWidth: 288 },
  { viewport: 375, cardWidth: 343 },
  { viewport: 768, cardWidth: null },
  { viewport: 1440, cardWidth: 360 },
] as const;

for (const layout of layouts) {
  test('responsive layout at ' + layout.viewport + 'px: all variants fit without content overlap', async ({ page }) => {
    await page.setViewportSize({ width: layout.viewport, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const cards = page.locator('.cards article');
    await expect(cards).toHaveCount(3);
    const docOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(docOverflow, 'Page must never scroll horizontally').toBe(false);

    for (const card of await cards.all()) {
      const box = await card.boundingBox();
      const title = await card.locator('h2').boundingBox();
      const description = await card.locator('p').boundingBox();
      const cta = await card.getByRole('link', { name: /^Explore / }).boundingBox();

      expect(box).not.toBeNull();
      expect(title).not.toBeNull();
      expect(description).not.toBeNull();
      expect(cta).not.toBeNull();
      if (!box || !title || !description || !cta) continue;
      if (layout.cardWidth !== null) expect(box.width).toBe(layout.cardWidth);
      expect(box.width).toBeLessThanOrEqual(layout.viewport);
      expect(title.y + title.height).toBeLessThanOrEqual(description.y + 1);
      expect(description.y + description.height).toBeLessThanOrEqual(cta.y + 1);
      expect(cta.y + cta.height).toBeLessThanOrEqual(box.y + box.height + 1);
      expect(title.x + title.width).toBeLessThanOrEqual(box.x + box.width + 1);
      expect(description.x + description.width).toBeLessThanOrEqual(box.x + box.width + 1);
      expect(cta.x + cta.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
  });
}
