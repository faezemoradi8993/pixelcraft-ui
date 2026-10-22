> **Update (2026-10-22):** The detailed audit below records an earlier pre-Auto-Layout state and is retained as historical evidence. Since that audit, the Mint description overlap has been fixed, all three 360×348 desktop references and all six mobile variants have been converted to nested Figma Auto Layout, and nine new Figma PNG candidates are staged in `tests/fidelity/candidates/`. The mobile reference dimensions are now **288px at 320px viewport** and **343px at 375px viewport**, with 16px gutters. See [current reference matrix and validation status](agent-fidelity-loop.md). **The earlier statements below about missing mobile references, absolute-only layout and Mint overlap are superseded.** Visual pixel parity with the React implementation remains unapproved.

---

# Figma design validation — FeatureCard

Reference: https://www.figma.com/design/2eUZ8m0EBXVi9ZKFwGdUx4

## Inspected Figma values (2026-10-22)
| Property | Figma reference | React CSS | Status |
|---|---|---|---|
| Desktop width | 360px | Grid max-width 360px | Intended match |
| Desktop height | 348px | min-height: 348px | Minimum only |
| Corner radius | 24px | 24px | Matches |
| Card padding | 30px | 30px | Matches |
| Icon size | 58x58px | 58x58px | Matches |
| Eyebrow font | Inter Bold 12px | font-size 12px, font-weight 700; Inter fallback | Partial |
| Title font | Inter Bold 28px | 28px, weight inherited (heading default bold) | Partial |
| Description font | Inter Regular 15px | 15px, normal weight | Partial |
| CTA font | Inter Bold 14px | 14px, weight 700 | Partial |
| Mobile review | 320px frame | 320px max-width example | Intended match |

## Important discrepancies and limitations
- The Figma reference uses **absolute positioning**. In the Mint card the title spans two lines and overlaps the description's Y-position (title Y=124, height=68; description Y=184). This is a **design-source defect**, not something CSS should reproduce.
- Figma description top is Y=184; CSS uses flow layout, so its actual Y depends on title wrapping and line-height.
- Figma CTA Y=290 while CSS uses flexbox `margin-top:auto`; actual position depends on content and card height.
- Inter is not bundled or fetched in the implementation, so font rendering varies by environment.
- A GitHub Actions screenshot baseline checks for **regressions relative to the approved browser render**; it does **not** automatically compare pixels against Figma. First generated baselines are **provisional**, and must be reviewed before claiming visual fidelity.
- Pixel-perfect parity has **not been certified**. Use manual Figma-vs-browser overlay/diff with identical frame, viewport, fonts and scaling before making such a claim.

## Review protocol
1. Check each Figma component at 360x348, and mobile at 320px.
2. Compare Violet, Mint, Peach screenshots against Figma exports at 1x, using same fonts and rendering environment where possible.
3. Record and fix differences in typography, wrapping, positions, spacing and focus states.
4. Review provisional screenshots under `tests/visual/feature-card.spec.ts-snapshots` and approve them by code review.
5. Future PRs run screenshot comparison automatically; failed diffs appear in the workflow artifact.


## Detailed fidelity audit (2026-10-22)
Inspected high-fidelity Figma design context for nodes `1:2`, `1:9`, `1:16` and current React/CSS source. This is a **structural audit**, not a certified pixel-diff result.

- All three desktop frames: **360×348**, white background, `#e8e6ef` 1px border, 24px corner radius.
- Icon container: Figma local offset **29px,29px**, **58×58**, radius **18px**. CSS padding 30px with border-box and 1px border gives inner origin 30px, an effective 1px difference in local coordinate conventions.
- Heading: Figma x=29, y=123, width=300, Inter Bold 28px. CSS uses top row 58px + body margin 36px after 30px padding: approximate y=124, but exact text glyph top depends on font metrics.
- Description: Figma x=29, y=183, width=298, Inter Regular 15px. CSS uses flow below heading + margin 16px, and cannot match all three absolute Y coordinates when title wraps.
- CTA: Figma x=29, y=289, Inter Bold 14px and Unicode `↗`; React uses an 18px Lucide ArrowUpRight icon with 9px gap, so the icon shape and spacing differ from the source. This is a documented visual mismatch.
- Font: CSS requests Inter but does not bundle it, so fallback rendering may alter line wraps and pixel comparison.
- Mobile: desktop node context does not establish an approved mobile visual reference. Existing mobile snapshot proves regression stability only.

**Decision:** No baseline re-approval or automatic snapshot updates were performed. Before pixel-perfect certification, provide a deterministic licensed/local Inter font, resolve Mint source overlap, align CTA representation with Figma, and compare 1x Figma exports against 1x Chromium screenshots with identical fonts. Preserve approved regression baselines until those changes have been reviewed.

## Release gate: design fidelity before regression baseline approval

**Reference of truth:** Figma node IDs `1:2`, `1:9`, `1:16` for desktop; mobile fidelity remains **unverified** until a mobile Figma frame is explicitly identified.

### Required order for a visual change

1. **Design audit:** record exact Figma node/frame, design dimensions, typography, colors, layout and expected responsive behavior. Mark intentional deviations (e.g. overlapping absolute-positioned text) explicitly.
2. **Implementation:** make related React/CSS changes together. Do not change approved screenshots as a shortcut.
3. **Local checks:** run `npm run build`, `npm test`, `npm run build-storybook`, then `npm run test:visual` after `npx playwright install chromium`.
4. **Fidelity review:** compare same-size 1x Figma export against browser screenshot at matching viewport, scale and font. Record observed differences and decisions. Geometry assertions help but are **not** a substitute for this review.
5. **Baseline proposal:** *only after fidelity review*, run `npm run test:visual:update` locally; review `git diff -- tests/visual/feature-card.spec.ts-snapshots` and commit intended PNG changes in the same PR as implementation. Never automatically regenerate screenshots in CI.
6. **Pull request:** require reviewer approval of visual diffs and passing build, unit, accessibility checks where available, and Visual Regression before merging. A changed baseline needs explicit reviewer acknowledgment.

### CI contract

The Visual Regression workflow has read-only repository permissions and **never writes to `main`**. It compares against committed snapshots on PRs and pushes. Missing baselines or unexpected visual changes fail the job; failed-run screenshots and diff artifacts are available for diagnosis.

### Current project caveats

- **Inter is not bundled**, so cross-machine fidelity is not deterministic yet. Supply a properly licensed self-hosted font or another explicitly approved design font before claiming exact typography.
- **Figma screenshot comparison has not been performed**. No pixel-perfect claim is authorized.
- Existing browser snapshots are regression references, **not Figma-approved fidelity references**.
