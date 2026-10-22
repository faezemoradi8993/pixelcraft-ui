import { readFile, writeFile, copyFile, mkdir, rm } from 'node:fs/promises';
import { existsSync, constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PNG } from 'pngjs';

if (process.argv[2] !== '--approve-reviewed-design') {
  throw new Error('Manual approval required: npm run fidelity:approve -- --approve-reviewed-design');
}
const from = 'tests/fidelity/candidates', to = 'tests/fidelity/references';
if (existsSync(join(to, 'manifest.json'))) throw new Error('Approved golden reference manifest already exists; refusing to overwrite');
const source = JSON.parse(await readFile(join(from, 'manifest.json'), 'utf8'));
if (source.status !== 'PENDING_HUMAN_APPROVAL' || source.fileKey !== '2eUZ8m0EBXVi9ZKFwGdUx4' || source.scale !== 1) {
  throw new Error('Unexpected candidate design manifest');
}
const expected = [
  ['desktop-violet', '1:2', 1440, 360, 348], ['desktop-mint', '1:9', 1440, 360, 348],
  ['desktop-peach', '1:16', 1440, 360, 348], ['mobile-320-violet', '1:25', 320, 288, 305],
  ['mobile-320-mint', '7:2', 320, 288, 305], ['mobile-320-peach', '7:9', 320, 288, 300],
  ['mobile-375-violet', '9:2', 375, 343, 300], ['mobile-375-mint', '9:9', 375, 343, 300],
  ['mobile-375-peach', '9:16', 375, 343, 300],
];
if (Object.keys(source.references ?? {}).length !== expected.length) throw new Error('Unexpected reference count');
const approved = { status: 'APPROVED', fileKey: source.fileKey, scale: 1, references: {} };
for (const [name, nodeId, viewport, width, height] of expected) {
  const ref = source.references?.[name];
  if (!ref || ref.nodeId !== nodeId || ref.viewport !== viewport || ref.width !== width ||
      ref.height !== height || ref.filename !== name + '.png') throw new Error('Invalid mapping: ' + name);
  const bytes = await readFile(join(from, ref.filename));
  const png = PNG.sync.read(bytes);
  if (png.width !== width || png.height !== height) throw new Error('Image dimensions differ: ' + name);
  approved.references[name] = {
    nodeId, viewport, width, height, filename: ref.filename,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
await mkdir(to, { recursive: true });
const copied = [];
try {
  for (const [name] of expected) {
    const filename = name + '.png';
    await copyFile(join(from, filename), join(to, filename), constants.COPYFILE_EXCL);
    copied.push(filename);
  }
  await writeFile(join(to, 'manifest.json'), JSON.stringify(approved, null, 2) + '\n', { flag: 'wx' });
  console.log('Approved golden references staged locally. Commit files in a reviewed PR with protected CODEOWNERS.');
} catch (error) {
  for (const filename of copied) await rm(join(to, filename), { force: true });
  throw error;
}
