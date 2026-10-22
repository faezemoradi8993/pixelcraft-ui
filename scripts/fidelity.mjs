import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const variants = ['violet', 'mint', 'peach'];
const references = 'tests/fidelity/references';
const output = 'test-results/fidelity';
const manifestPath = join(references, 'manifest.json');
const mode = process.argv[2] ?? 'verify';
if (!['capture', 'verify'].includes(mode)) throw new Error('Use capture or verify');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ensure = async p => mkdir(p, { recursive: true });
await ensure(output);

if (mode === 'capture') {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('FIGMA_TOKEN required for one-time capture');
  if (existsSync(manifestPath)) throw new Error('Reference manifest exists; never overwrite approved references automatically');
  await ensure(references);
  const fileKey = '2eUZ8m0EBXVi9ZKFwGdUx4';
  const nodes = ['1:2', '1:9', '1:16'];
  const url = new URL('https://api.figma.com/v1/images/' + fileKey);
  url.searchParams.set('ids', nodes.join(','));
  url.searchParams.set('format', 'png');
  url.searchParams.set('scale', '1');
  const response = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!response.ok) throw new Error('Figma export API error: ' + response.status);
  const payload = await response.json();
  const manifest = { fileKey, scale: 1, references: {} };
  for (let i = 0; i < variants.length; i++) {
    const imageUrl = payload.images?.[nodes[i]];
    if (!imageUrl) throw new Error('Missing Figma export for node ' + nodes[i]);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Could not download Figma export');
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    const png = PNG.sync.read(bytes);
    if (png.width !== 360 || png.height !== 348) throw new Error('Unexpected Figma frame size for ' + variants[i]);
    const filename = variants[i] + '.png';
    await writeFile(join(references, filename), bytes, { flag: 'wx' });
    manifest.references[variants[i]] = { nodeId: nodes[i], filename, sha256: sha(bytes), width: png.width, height: png.height };
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log('Captured references. Human review required before committing PNGs and manifest.');
} else {
  if (!existsSync(manifestPath)) throw new Error('Missing immutable Figma references. Run capture once with FIGMA_TOKEN, review and commit.');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const browser = await chromium.launch();
  let failures = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.goto(process.env.FIDELITY_URL ?? 'http://127.0.0.1:4173/pixelcraft-ui/');
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i], entry = manifest.references[variant];
      if (!entry) throw new Error('Missing reference entry ' + variant);
      const bytes = await readFile(join(references, entry.filename));
      if (sha(bytes) !== entry.sha256) throw new Error('Golden reference changed: ' + variant);
      const expected = PNG.sync.read(bytes);
      const card = page.locator('.cards article').nth(i);
      await card.scrollIntoViewIfNeeded();
      const actual = PNG.sync.read(await card.screenshot({ animations: 'disabled', scale: 'css' }));
      if (actual.width !== expected.width || actual.height !== expected.height) {
        console.error(variant + ': dimension mismatch, expected ' + expected.width + 'x' + expected.height + ', got ' + actual.width + 'x' + actual.height);
        failures++;
        continue;
      }
      const diff = new PNG({ width: expected.width, height: expected.height });
      const changed = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 });
      const ratio = changed / (expected.width * expected.height);
      await writeFile(join(output, variant + '-actual.png'), PNG.sync.write(actual));
      await writeFile(join(output, variant + '-diff.png'), PNG.sync.write(diff));
      console.log(variant + ': ' + (ratio * 100).toFixed(2) + '% differing pixels');
      if (ratio > Number(process.env.FIDELITY_MAX_DIFF ?? '0.01')) failures++;
    }
  } finally { await browser.close(); }
  if (failures) { console.error(failures + ' fidelity comparison(s) failed. Inspect test-results/fidelity.'); process.exitCode = 1; }
}
