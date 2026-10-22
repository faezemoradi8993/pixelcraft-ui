# PixelCraft UI — Figma-driven FeatureCard

React 19 / TypeScript showcase with three FeatureCard themes, Figma Auto Layout, Storybook, Playwright and GitHub Actions.

- [Live demo](https://faezemoradi8993.github.io/pixelcraft-ui/)
- [Figma design](https://www.figma.com/design/2eUZ8m0EBXVi9ZKFwGdUx4)
- [Figma fidelity review and agent contract](docs/agent-fidelity-loop.md)

## Development and CI

```bash
npm install
npm run build
npm test
npm run build-storybook
npx playwright install chromium
npm run test:visual
```

The responsive geometry/overflow suite covers **320, 375, 768 and 1440 CSS-pixel viewports**, all three themes. Browser screenshot regressions remain separate from Figma fidelity.

## Figma references — important approval boundary

The repository contains **nine genuine Figma PNG exports** in `tests/fidelity/candidates/`:
three 360×348 desktop cards; three 288px cards inside 320px mobile viewports; and three 343px cards inside 375px viewports. The Figma desktop and mobile frames use nested Auto Layout.

These PNGs have status **PENDING_HUMAN_APPROVAL**. They are design candidates, *not* automatically approved regression baselines.

Run `npm run build` and start `npm run preview -- --host 127.0.0.1 --port 4173` in one terminal. In a second terminal:

```bash
npm run fidelity:measure
```

The command compares all nine browser renders with Figma candidates and writes `test-results/fidelity/report-measure.json`, actual screenshots and diff PNGs. A difference above the provisional 1% threshold is reported as a failure; do **not** change the threshold or reference PNG to make tests pass.

Only **after visually reviewing the nine reference PNGs against Figma**, explicitly promote them:

```bash
npm run fidelity:approve -- --approve-reviewed-design
npm run fidelity:verify
```

The promotion command creates `tests/fidelity/references/` with SHA-256 integrity checks and refuses to overwrite existing golden files. Commit approved files in a reviewed PR and enforce `CODEOWNERS` with GitHub branch protection; adding `CODEOWNERS` alone is insufficient.

`npm run fidelity:capture` is provided for a first-time token-authenticated Figma export **only when the candidates are absent**. Never commit the Figma token.

The Visual Regression GitHub Actions workflow produces diagnostic Figma diffs from candidates, then **requires** approved golden references before it can pass. Until approved references are available, a failing fidelity gate is intentional. See [agent contract](AGENTS.md) for the maximum five-iteration repair workflow (instructions only; no autonomous coding agent runs in CI).

## Limitations

- Typography fidelity is not deterministic until Inter is bundled and font rendering is standardized.
- A green Playwright screenshot regression does not imply fidelity to Figma.
- The 768px tablet test checks responsive behavior, not pixel fidelity, because there is no approved tablet Figma reference.
- Pixel matching is one signal; geometry, text wrap, accessibility and human review matter.
