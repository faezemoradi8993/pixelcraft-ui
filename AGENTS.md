# PixelCraft UI Agent Instructions

Use committed Figma Golden References when available. Do not modify reference images, manifests, or test thresholds during automated visual repair.

For visual changes, run the production build and fidelity verification. Inspect image diff artifacts; fix React/CSS implementation and repeat for at most five iterations. Do not substitute generated application screenshots for Figma references.

If references are missing, stop and report that human approval of Figma exports is required. After fidelity passes, run unit, Storybook, and visual regression tests, and submit a Pull Request for review. Never merge automatically.

Refer to docs/agent-fidelity-loop.md for details.
