import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const variants = [
  { name: 'violet', nodeId: '1:2' },
  { name: 'mint', nodeId: '1:9' },
  { name: 'peach', nodeId: '1:16' },
];
const fileKey = '2eUZ8m0EBXVi9ZKFwGdUx4';
const references = 'tests/fidelity/references';
const output = 'test-results/fidelity';
const manifestPath = join(references, 'manifest.json');
const mode = process.argv[2];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
if (!['capture', 'verify'].includes(mode)) throw new Error('Use capture or verify');
const maxDiff = 0.01; // Changes require reviewed code changes, not an environment override.

if (mode === 'capture') {
  if (existsSync(manifestPath) || variants.some(v => existsSync(join(references, v.name + '.png')))) {
    throw new Error('Golden references already exist. Refusing to overwrite.');
  }
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('FIGMA_TOKEN required for one-time capture');
  const staging = await mkdtemp(join(tmpdir(), 'pixelcraft-figma-'));
  try {
    const url = new URL('https://api.figma.com/v1/images/' + fileKey);
    url.searchParams.set('ids', variants.map(v => v.nodeId).join(','));
    url.searchParams.set('format', 'png');
    url.searchParams.set('scale', '1');
    const result = await fetch(url, { headers: { 'X-Figma-Token': token } });
    if (!result.ok) throw new Error('Figma export failed: HTTP ' + result.status);
    const payload = await result.json();
    const manifest = { fileKey, scale: 1, references: {} };
    for (const variant of variants) {
      const imageUrl = payload.images?.[variant.nodeId];
      if (!imageUrl) throw new Error('Missing Figma frame ' + variant.nodeId);
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Figma image download failed');
      const bytes = Buffer.from(await response.arrayBuffer());
      const png = PNG.sync.read(bytes);
      if (png.width !== 360 || png.height !== 348) {
        throw new Error('Unexpected Figma dimensions for ' + variant.name);
      }
      const filename = variant.name + '.png';
      await writeFile(join(staging, filename), bytes);
      manifest.references[variant.name] = { nodeId: variant.nodeId, filename, sha256: sha(bytes), width: 360, height: 348 };
    }
    await writeFile(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await mkdir(references, { recursive: true });
    const published = [];
    try {
      for (const variant of variants) {
        const name = variant.name + '.png';
        await rename(join(staging, name), join(references, name));
        published.push(name);
      }
      await rename(join(staging, 'manifest.json'), manifestPath);
    } catch (error) {
      for (const name of published) await rm(join(references, name), { force: true });
      throw error;
    }
    console.log('Figma frames captured. Human approval is required before committing references.');
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
} else {
  if (!existsSync(manifestPath)) {
    throw new Error('FIDELITY NOT CONFIGURED: approved Figma reference manifest is missing.');
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.fileKey !== fileKey || manifest.scale !== 1) throw new Error('Unrecognized Figma manifest');
  const approved = [];
  for (const variant of variants) {
    const entry = manifest.references?.[variant.name];
    if (!entry || entry.nodeId !== variant.nodeId || entry.filename !== variant.name + '.png') {
      throw new Error('Invalid golden reference mapping: ' + variant.name);
    }
    const bytes = await readFile(join(references, entry.filename));
    if (sha(bytes) !== entry.sha256) throw new Error('Golden reference integrity failed: ' + variant.name);
    const png = PNG.sync.read(bytes);
    if (png.width !== 360 || png.height !== 348 || entry.width !== 360 || entry.height !== 348) {
      throw new Error('Invalid golden reference dimensions: ' + variant.name);
    }
    approved.push({ ...variant, expected: png });
  }

  await mkdir(output, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;
  const report = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:4173/pixelcraft-ui/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < approved.length; i++) {
      const { name, expected } = approved[i];
      const card = page.locator('.cards article').nth(i);
      await card.scrollIntoViewIfNeeded();
      const actual = PNG.sync.read(await card.screenshot({ animations: 'disabled', scale: 'css' }));
      await writeFile(join(output, name + '-actual.png'), PNG.sync.write(actual));
      if (actual.width !== expected.width || actual.height !== expected.height) {
        report.push({ name, pass: false, expected: '360x348', actual: actual.width + 'x' + actual.height });
        failures++;
        continue;
      }
      const diff = new PNG({ width: expected.width, height: expected.height });
      const changed = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 });
      const ratio = changed / (expected.width * expected.height);
      await writeFile(join(output, name + '-diff.png'), PNG.sync.write(diff));
      const pass = ratio <= maxDiff;
      report.push({ name, pass, diffRatio: ratio, changedPixels: changed });
      if (!pass) failures++;
    }
    await writeFile(join(output, 'report.json'), JSON.stringify({ maxDiff, results: report }, null, 2) + '\n');
    for (const result of report) console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
  if (failures) {
    console.error(failures + ' fidelity mismatch(es); see test-results/fidelity/report.json');
    process.exitCode = 1;
  }
}
