import type { Meta, StoryObj } from '@storybook/react';
import { FeatureCard } from './FeatureCard';
const meta = { title: 'Components/FeatureCard', component: FeatureCard, parameters: { layout: 'centered' }, decorators: [(Story) => <div style={{ width: 'min(360px, 90vw)' }}><Story /></div>], args: { eyebrow: 'DESIGN SYSTEM', title: 'Build with confidence', description: 'Reusable components, accessible patterns and a consistent visual language.', href: 'https://github.com/faezemoradi8993/pixelcraft-ui', theme: 'violet' } } satisfies Meta<typeof FeatureCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Violet: Story = {};
export const Mint: Story = { args: { theme: 'mint', eyebrow: 'PERFORMANCE', title: 'Make every pixel count', description: 'Thoughtful interactions and fast, responsive experiences for every screen.' } };
export const Peach: Story = { args: { theme: 'peach', eyebrow: 'ENGINEERING', title: 'Designed to scale', description: 'Modular frontend patterns that keep growing applications maintainable.' } };
export const LongContent: Story = { args: { title: 'A longer title to demonstrate flexible and responsive card layouts', description: 'Longer content should wrap naturally without overlapping the call to action or clipping text at smaller widths.' } };