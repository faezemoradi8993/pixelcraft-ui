# Agent-driven Figma fidelity loop

## Golden reference acquisition (one-time, human-reviewed)
The three desktop Figma frames are nodes `1:2`, `1:9`, `1:16` in file `2eUZ8m0EBXVi9ZKFwGdUx4`. Export each at **1x** with a Figma personal access token:

```bash
npm install
FIGMA_TOKEN=... npm run fidelity:capture
```

Review the three PNGs in `tests/fidelity/references/` against the original Figma file, then commit **both** PNGs and `manifest.json`. The capture command refuses to overwrite an existing manifest. The verification command checks each image SHA-256; neither CI nor an agent may refresh references as a shortcut. Enforce approval using CODEOWNERS/branch rules in GitHub settings (not guaranteed by this script alone).

## Run verification
```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# in another terminal
npm run fidelity:verify
```

Outputs `test-results/fidelity/*-actual.png` and `*-diff.png`. The 1% threshold is **provisional**; inspect anti-aliasing and font rendering before treating it as acceptance. This is not an AI agent by itself.

## AI Agent instructions (Cursor/Codex/other coding agent)
1. Read Figma node specs and current component code; preserve reference PNGs and manifest.
2. Run build and fidelity verification against the local preview.
3. Inspect per-variant diff artifacts and geometry checks; modify only implementation files.
4. Retry at most **five** iterations; record the initial and final difference ratios.
5. If a threshold is met, run unit tests, Storybook build and Playwright regression tests. Open a PR, **do not merge automatically**.
6. If five attempts fail, stop with a discrepancy report. Never update the reference images, SHA manifest, thresholds, or tests to force a pass.

## Known blockers
The reference images have **not yet been captured or approved**. Typography is not deterministic until the approved Inter font is bundled. The Mint source has a text overlap; flag intentional deviations for human approval. No mobile Figma reference is identified. This script provides the measurement engine and agent contract, **not** autonomous orchestration or certified pixel-perfect fidelity.

## Enforcement status and limitations (audited)

The Visual Regression workflow now **fails closed** if `tests/fidelity/references/manifest.json` is absent; it no longer reports green for an unconfigured fidelity check. This means the PR remains blocked until genuine Figma exports are reviewed and committed. This is intentional.

`.github/CODEOWNERS` names the current repository owner for sensitive paths, but this **does not enforce approval by itself**. In GitHub repository settings enable a branch protection rule or ruleset for `main`: require pull requests, require the quality and visual-regression checks, require Code Owner review, and restrict bypass permissions where possible. A sole repository owner cannot count on self-approval as independent review; add an independent maintainer to enforce that separation.

No `package-lock.json` exists in this repository at audit time. CI therefore intentionally retains `npm install` rather than an invalid `npm ci` call. Generate and commit a genuine lockfile in a network-enabled development environment before switching to `npm ci` and dependency caching.

The recorded Figma source uses Inter but the web implementation does not bundle a verified local Inter font. Fidelity thresholds are provisional until fonts and Figma/Chromium render environments have been aligned.

This project does **not** yet contain a self-executing AI agent that edits source code. The `AGENTS.md` file defines the five-attempt contract for an external coding agent; CI runs verification, not auto-repair.
