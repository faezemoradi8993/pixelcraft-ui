import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from './FeatureCard';
describe('FeatureCard', () => {
  it('renders an accessible link with the expected destination', () => {
    render(<FeatureCard eyebrow="Case study" title="Design systems" description="Description" href="https://example.com" />);
    expect(screen.getByRole('heading', { name: 'Design systems' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Design systems' })).toHaveAttribute('href', 'https://example.com');
  });
});