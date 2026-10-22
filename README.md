# PixelCraft UI — FeatureCard

React 19 + TypeScript UI case study with three responsive FeatureCard variants, Storybook, Vitest, Playwright and GitHub Actions.

- [Live demo](https://faezemoradi8993.github.io/pixelcraft-ui/)
- [Figma design](https://www.figma.com/design/2eUZ8m0EBXVi9ZKFwGdUx4)
- [Figma design audit](docs/figma-validation.md)
- [Agent fidelity loop instructions](docs/agent-fidelity-loop.md)

## Development

```bash
npm install
npm run build
npm test
npm run build-storybook
npx playwright install chromium
npm run test:visual
```

## Two independent visual checks

**Visual regression:** `npm run test:visual` compares browser screenshots with committed Playwright snapshots. Snapshot changes are reviewed in a PR; CI never rewrites baselines.

**Visual fidelity (Figma):** `npm run fidelity:verify` compares browser renders with separately approved Figma PNG exports. It fails until immutable Figma references have been captured and reviewed.

One-time reference capture (requires a personal Figma API token with appropriate file access):

```bash
FIGMA_TOKEN=... npm run fidelity:capture
```

Review and commit the generated `tests/fidelity/references/*.png` and `manifest.json`. **Never commit the token.** Run `npm run build`, start `npm run preview -- --host 127.0.0.1 --port 4173` in one terminal, then run `npm run fidelity:verify` in another. Difference images are written to `test-results/fidelity/`.

The [agent workflow](docs/agent-fidelity-loop.md) specifies up to five repair iterations. **The measurement engine is implemented; a self-running coding agent is not yet connected.** Golden Figma PNGs have not yet been captured or approved. Passing regression tests does not certify pixel-perfect parity.
