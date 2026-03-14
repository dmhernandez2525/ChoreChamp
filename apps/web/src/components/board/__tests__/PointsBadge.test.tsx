import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PointsBadge } from '../PointsBadge';

// Mock the UI package
vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('PointsBadge', () => {
  it('renders the point value', () => {
    render(<PointsBadge points={10} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('10');
  });

  it('renders with aria-label for accessibility', () => {
    render(<PointsBadge points={25} />);

    expect(screen.getByLabelText('25 points')).toBeInTheDocument();
  });

  it('renders compact variant by default (as a span)', () => {
    render(<PointsBadge points={5} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('renders expanded variant with "pts" label (as a div)', () => {
    render(<PointsBadge points={15} variant="expanded" />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.tagName).toBe('DIV');
    expect(badge).toHaveTextContent('15');
    expect(badge).toHaveTextContent('pts');
  });

  it('does not show "pts" in compact variant', () => {
    render(<PointsBadge points={15} variant="compact" />);

    const badge = screen.getByTestId('points-badge');
    expect(badge).not.toHaveTextContent('pts');
  });

  it('applies bronze tier colors for points under 10', () => {
    render(<PointsBadge points={5} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-800');
    expect(badge.className).toContain('border-amber-300');
  });

  it('applies silver tier colors for points between 10 and 24', () => {
    render(<PointsBadge points={15} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-700');
    expect(badge.className).toContain('border-gray-300');
  });

  it('applies gold tier colors for points 25 and above', () => {
    render(<PointsBadge points={50} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-800');
    expect(badge.className).toContain('border-yellow-400');
  });

  it('applies gold tier at the exact boundary of 25', () => {
    render(<PointsBadge points={25} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('bg-yellow-100');
  });

  it('applies silver tier at the exact boundary of 10', () => {
    render(<PointsBadge points={10} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('applies bronze tier at 9 (just below silver threshold)', () => {
    render(<PointsBadge points={9} />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('bg-amber-100');
  });

  it('passes additional className to the badge element', () => {
    render(<PointsBadge points={10} className="custom-class" />);

    const badge = screen.getByTestId('points-badge');
    expect(badge.className).toContain('custom-class');
  });
});
