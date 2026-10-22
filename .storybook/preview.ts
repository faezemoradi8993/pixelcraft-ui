import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import type { Preview } from '@storybook/react';
import '../src/styles/global.css';
const preview: Preview = { parameters: { controls: { expanded: true }, a11y: { test: 'todo' } } };
export default preview;