import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { exclude: ['tests/visual/**', '**/node_modules/**'], environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] } });
