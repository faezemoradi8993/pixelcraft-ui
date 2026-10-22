import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const fileKey = '2eUZ8m0EBXVi9ZKFwGdUx4';
const cases = [
  { name: 'desktop-violet', nodeId: '1:2', viewport: 1440, width: 360, height: 348, index: 0 },
  { name: 'desktop-mint', nodeId: '1:9', viewport: 1440, width: 360, height: 348, index: 1 },
  { name: 'desktop-peach', nodeId: '1:16', viewport: 1440, width: 360, height: 348, index: 2 },
  { name: 'mobile-320-violet', nodeId: '1:25', viewport: 320, width: 288, height: 305, index: 0 },
  { name: 'mobile-320-mint', nodeId: '7:2', viewport: 320, width: 288, height: 305, index: 1 },
  { name: 'mobile-320-peach', nodeId: '7:9', viewport: 320, width: 288, height: 300, index: 2 },
  { name: 'mobile-375-violet', nodeId: '9:2', viewport: 375, width: 343, height: 300, index: 0 },
  { name: 'mobile-375-mint', nodeId: '9:9', viewport: 375, width: 343, height: 300, index: 1 },
  { name: 'mobile-375-peach', nodeId: '9:16', viewport: 375, width: 343, height: 300, index: 2 },
];
const candidates = 'tests/fidelity/candidates';
const references = 'tests/fidelity/references';
const output = 'test-results/fidelity';
const mode = process.argv[2];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const maxDiff = 0.01; // Provisional. Not overridable by an agent.

if (!['capture', 'measure', 'verify'].includes(mode)) {
  throw new Error('Usage: node scripts/fidelity.mjs capture|measure|verify');
}

if (mode === 'capture') {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('FIGMA_TOKEN is required to capture Figma candidates');
  if (existsSync(join(candidates, 'manifest.json')) ||
      cases.some(c => existsSync(join(candidates, c.name + '.png')))) {
    throw new Error('Figma candidates already exist. Never overwrite design exports automatically.');
  }
  const staging = await mkdtemp(join(tmpdir(), 'pixelcraft-figma-'));
  try {
    const url = new URL('https://api.figma.com/v1/images/' + fileKey);
    url.searchParams.set('ids', cases.map(c => c.nodeId).join(','));
    url.searchParams.set('format', 'png');
    url.searchParams.set('scale', '1');
    const response = await fetch(url, { headers: { 'X-Figma-Token': token } });
    if (!response.ok) throw new Error('Figma export failed: HTTP ' + response.status);
    const payload = await response.json();
    const manifest = { status: 'PENDING_HUMAN_APPROVAL', fileKey, scale: 1, references: {} };
    for (const c of cases) {
      const imageUrl = payload.images?.[c.nodeId];
      if (!imageUrl) throw new Error('Missing export for Figma node ' + c.nodeId);
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Figma image download failed for ' + c.name);
      const bytes = Buffer.from(await res.arrayBuffer());
      const png = PNG.sync.read(bytes);
      if (png.width !== c.width || png.height !== c.height) {
        throw new Error('Unexpected Figma frame size: ' + c.name + ': ' + png.width + 'x' + png.height);
      }
      const filename = c.name + '.png';
      await writeFile(join(staging, filename), bytes);
      manifest.references[c.name] = { nodeId: c.nodeId, viewport: c.viewport, filename, width: c.width, height: c.height };
    }
    await writeFile(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await mkdir(candidates, { recursive: true });
    const published = [];
    try {
      for (const c of cases) {
        const filename = c.name + '.png';
        await rename(join(staging, filename), join(candidates, filename));
        published.push(filename);
      }
      await rename(join(staging, 'manifest.json'), join(candidates, 'manifest.json'));
    } catch (error) {
      for (const filename of published) await rm(join(candidates, filename), { force: true });
      throw error;
    }
    console.log('Captured nine real Figma candidates. Approval is a separate, manual action.');
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  process.exit(0);
}

const source = mode === 'measure' ? candidates : references;
const manifestPath = join(source, 'manifest.json');
if (!existsSync(manifestPath)) {
  throw new Error('Fidelity ' + mode + ' is not configured: ' + manifestPath + ' is missing.');
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const status = mode === 'measure' ? 'PENDING_HUMAN_APPROVAL' : 'APPROVED';
if (manifest.status !== status || manifest.fileKey !== fileKey || manifest.scale !== 1) {
  throw new Error('Wrong Figma reference status or source. Expected: ' + status);
}
const sourceCases = [];
for (const c of cases) {
  const entry = manifest.references?.[c.name];
  if (!entry || entry.nodeId !== c.nodeId || entry.viewport !== c.viewport ||
      entry.filename !== c.name + '.png' || entry.width !== c.width || entry.height !== c.height) {
    throw new Error('Figma reference mapping mismatch: ' + c.name);
  }
  const bytes = await readFile(join(source, entry.filename));
  if (mode === 'verify' && sha256(bytes) !== entry.sha256) {
    throw new Error('Approved golden reference SHA-256 mismatch: ' + c.name);
  }
  const png = PNG.sync.read(bytes);
  if (png.width !== c.width || png.height !== c.height) {
    throw new Error('Invalid PNG dimensions for ' + c.name);
  }
  sourceCases.push({ ...c, expected: png });
}
await mkdir(output, { recursive: true });
const report = { mode, referenceStatus: status, maxDiff, results: [] };
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  let currentViewport = null;
  for (const c of sourceCases) {
    if (currentViewport !== c.viewport) {
      currentViewport = c.viewport;
      await page.setViewportSize({ width: c.viewport, height: 900 });
      await page.goto('http://127.0.0.1:4173/pixelcraft-ui/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
    }
    const card = page.locator('.cards article').nth(c.index);
    await card.scrollIntoViewIfNeeded();
    const actual = PNG.sync.read(await card.screenshot({ animations: 'disabled', scale: 'css' }));
    await writeFile(join(output, c.name + '-actual.png'), PNG.sync.write(actual));
    const result = { name: c.name, viewport: c.viewport, expected: c.width + 'x' + c.height, actual: actual.width + 'x' + actual.height };
    if (actual.width === c.width && actual.height === c.height) {
      const diff = new PNG({ width: c.width, height: c.height });
      const changed = pixelmatch(c.expected.data, actual.data, diff.data, c.width, c.height, { threshold: 0.1 });
      result.changedPixels = changed;
      result.diffRatio = changed / (c.width * c.height);
      await writeFile(join(output, c.name + '-diff.png'), PNG.sync.write(diff));
    }
    result.pass = result.diffRatio !== undefined && result.diffRatio <= maxDiff;
    report.results.push(result);
    console.log(JSON.stringify(result));
  }
} finally {
  await browser.close();
  await writeFile(join(output, 'report-' + mode + '.json'), JSON.stringify(report, null, 2) + '\n');
}
const failures = report.results.filter(x => !x.pass);
if (failures.length) {
  console.error(failures.length + '/' + cases.length + ' fidelity comparisons differ from Figma; inspect ' + output);
  process.exitCode = 1;
}
