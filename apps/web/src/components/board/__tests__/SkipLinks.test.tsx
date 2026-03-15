import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLinks } from '../SkipLinks';

describe('SkipLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a nav element with aria-label', () => {
    render(<SkipLinks />);
    const nav = screen.getByLabelText('Skip navigation');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
  });

  it('renders "Skip to main content" link', () => {
    render(<SkipLinks />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('renders "Skip to board" link', () => {
    render(<SkipLinks />);
    const link = screen.getByText('Skip to board');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#board-content');
  });

  it('links are anchor elements', () => {
    render(<SkipLinks />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });

  it('links have sr-only class for visual hiding', () => {
    render(<SkipLinks />);
    const link = screen.getByText('Skip to main content');
    expect(link.className).toContain('sr-only');
  });

  it('focuses the target element when link is clicked', () => {
    // Set up a target element in the DOM
    const target = document.createElement('div');
    target.id = 'main-content';
    document.body.appendChild(target);

    const focusSpy = vi.spyOn(target, 'focus');

    render(<SkipLinks />);
    const link = screen.getByText('Skip to main content');

    fireEvent.click(link);

    expect(target).toHaveAttribute('tabindex', '-1');
    expect(focusSpy).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(target);
    focusSpy.mockRestore();
  });

  it('removes tabindex from target after blur', () => {
    const target = document.createElement('div');
    target.id = 'main-content';
    document.body.appendChild(target);

    render(<SkipLinks />);
    const link = screen.getByText('Skip to main content');

    fireEvent.click(link);
    expect(target).toHaveAttribute('tabindex', '-1');

    fireEvent.blur(target);
    expect(target).not.toHaveAttribute('tabindex');

    document.body.removeChild(target);
  });

  it('prevents default anchor behavior on click', () => {
    render(<SkipLinks />);
    const link = screen.getByText('Skip to main content');

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    link.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  it('does nothing when target element does not exist', () => {
    render(<SkipLinks />);
    const link = screen.getByText('Skip to board');

    // #board-content does not exist in the DOM, should not throw
    expect(() => fireEvent.click(link)).not.toThrow();
  });
});
