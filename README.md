# PixelCraft UI — FeatureCard

Independent **React 19 + TypeScript** UI case study showcasing a reusable, responsive card component. No proprietary assets or source code.

**[Figma design reference](https://www.figma.com/design/2eUZ8m0EBXVi9ZKFwGdUx4)**

## Features
- Three visual variants: Violet, Mint and Peach
- Responsive layout and long-content Storybook example
- Accessible headings and link names, visible keyboard focus, reduced-motion support
- React Testing Library + Vitest test
- Playwright screenshot capture script (not an automated Figma pixel-diff)

## Local development
```bash
npm install
npm run dev
npm run build
npm test
npm run storybook
```

## Screenshot capture
Install Chromium with `npx playwright install chromium`, then run `npm run screenshots`. The script expects Chromium at `/usr/bin/chromium` unless `CHROMIUM_PATH` is provided.

Figma contains three desktop components (360 × 348) and a mobile example (320px wide). Styling and copy were aligned with that reference, but **pixel-perfect parity has not been independently verified**. Build, unit tests and screenshot comparison have **not been confirmed passing** in the publishing environment.

## Repository status
Source is published here; no hosted demo, CI or LinkedIn Featured entry is implied by this repository.

## Visual regression (Playwright)

The `Visual Regression` GitHub Actions workflow captures the three desktop variants and one mobile variant. On its first successful run on `main`, it generates **provisional** PNG snapshots and commits them. Later runs compare against these baselines; diffs are uploaded as workflow artifacts. A passing screenshot test proves regression stability against its baseline, **not** pixel-perfect matching to Figma.

Run locally with `npm run build && npx playwright install chromium && npm run test:visual`. To intentionally update baselines, use `npm run test:visual:update` and review the PNG changes before committing. See [Figma validation audit](docs/figma-validation.md) for measured values and known discrepancies.
