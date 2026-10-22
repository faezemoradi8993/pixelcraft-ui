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
