# Figma-driven visual fidelity — FeatureCard

**Implementation status (2026-10-22):** all three desktop Figma components and six mobile review frames have nested Auto Layout; nine authentic 1x Figma screenshots are staged as **unapproved candidates**, all wired into `scripts/fidelity.mjs`. Automated code-fixing orchestration is **not yet connected**. There is no claim of certified pixel-perfect output.

## Reference matrix

| Case | Browser viewport | Card dimensions | Figma node |
|---|---:|---:|---|
| desktop-violet | 1440px | 360×348 | `1:2` |
| desktop-mint | 1440px | 360×348 | `1:9` |
| desktop-peach | 1440px | 360×348 | `1:16` |
| mobile-320-violet | 320px | 288×305 | `1:25` |
| mobile-320-mint | 320px | 288×305 | `7:2` |
| mobile-320-peach | 320px | 288×300 | `7:9` |
| mobile-375-violet | 375px | 343×300 | `9:2` |
| mobile-375-mint | 375px | 343×300 | `9:9` |
| mobile-375-peach | 375px | 343×300 | `9:16` |

The Figma file is [FeatureCard Desktop & Mobile](https://www.figma.com/design/2eUZ8m0EBXVi9ZKFwGdUx4). Mobile viewports use 16px horizontal page gutters: 320→288 and 375→343. The desktop Mint text-overlap defect was corrected. The Figma designs now use Auto Layout for header/body and flexible CTA spacing. Width wrapping was inspected at the exact published sizes; a Figma design does not guarantee arbitrary viewport correctness by itself.

## Run local fidelity measurement

```bash
npm install
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# another terminal:
npm run fidelity:measure
```

Read `test-results/fidelity/report-measure.json` and nine actual/diff PNG pairs. Reports distinguish mismatched dimensions from mismatched pixels. `measure` evaluates **unapproved Figma candidates**; it is diagnostic and cannot satisfy the protected CI fidelity gate.

## Review and approval

1. Visually inspect `tests/fidelity/candidates/*.png` against Figma nodes and record any intended deviations.
2. Establish deterministic typography: legally obtained self-hosted Inter font, browser version, viewport, DPR=1 and `document.fonts.ready`. Avoid accepting pixel thresholds before this.
3. Once each image is accepted, explicitly run `npm run fidelity:approve -- --approve-reviewed-design` locally. It copies the candidates, verifies dimensions and writes an **APPROVED** SHA-256 manifest under `tests/fidelity/references/`.
4. Review the new golden-reference files in the PR. Do not bypass CODEOWNERS reviews; configure required reviews and CI status checks in repository branch-protection settings.
5. Run `npm run fidelity:verify` against approved PNGs. The CI gate fails if references are absent or their SHA differs from the manifest.

`CODEOWNERS` names a reviewer, **but cannot enforce a rule until GitHub branch protection or rulesets are configured**. A repository owner approving their own changes is not independent review.

## Safe five-iteration AI repair contract

The Agent reads Figma specs, runs the React build and `fidelity:measure`, inspects image diffs, edits React/CSS **only** and remeasures, at most five attempts. The agent may not change `tests/fidelity/references/**`, candidate screenshots, diff thresholds, tests, or CI workflows to get a green result. Once approved references exist, the agent uses `fidelity:verify`.

After improving fidelity, run unit tests, Storybook build, responsive geometry tests, screenshot regression tests, and raise a PR. Changes to Playwright baselines require explicit human review. If a source design has a defect, flag it rather than reproducing it silently. Stop after five attempts and report remaining mismatches.

## CI behavior

`Visual Regression` on PR and main now:
1. Installs dependencies and Chromium; builds app.
2. Produces *diagnostic* diffs against nine Figma candidate images (failure tolerated, never treated as approval).
3. Runs Playwright screenshot baselines and behavioral responsive tests at 320/375/768/1440.
4. Requires `tests/fidelity/references/manifest.json` and then verifies all **nine approved** Figma references. Without the approved manifest CI intentionally fails.
5. Uploads diff and HTML report artifacts.

## Open issues

- Inter is not yet packaged locally. Differences in font rasterization and Unicode CTA icon may remain.
- The original browser screenshot baseline was recorded before final Figma reconciliation; deliberate UI changes can fail regression until snapshots are reviewed and intentionally accepted.
- No 768px tablet-specific Figma reference exists; this viewport is checked for overflow, wrapping and element placement, not 1x image fidelity.
- There is still no background/self-executing Codex/Cursor workflow. `AGENTS.md` is an instruction contract, not an executor.
- The PR must not merge solely because an old regression workflow is green.
