import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock demo-mode (default: not demo mode)
let mockDemoMode = false;
vi.mock('../lib/demo-mode', () => ({
  get DEMO_MODE() {
    return mockDemoMode;
  },
}));

import Landing from './Landing';

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDemoMode = false;
  });

  it('renders the ChoreChamp brand name in header', () => {
    render(<Landing />);
    expect(screen.getByText('ChoreChamp')).toBeInTheDocument();
  });

  it('renders Sign In link in header', () => {
    render(<Landing />);
    const signInLink = screen.getByText('Sign In');
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('renders Get Started link in header', () => {
    render(<Landing />);
    const getStartedLink = screen.getByText('Get Started');
    expect(getStartedLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('renders the hero section with main heading', () => {
    render(<Landing />);
    expect(screen.getByText(/Make Chores Fun for the/)).toBeInTheDocument();
    expect(screen.getByText('Whole Family')).toBeInTheDocument();
  });

  it('renders the hero description', () => {
    render(<Landing />);
    expect(screen.getByText(/turns household tasks into an engaging game/)).toBeInTheDocument();
  });

  it('renders Start Free Trial CTA', () => {
    render(<Landing />);
    const ctaLink = screen.getByText('Start Free Trial');
    expect(ctaLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('renders Learn More link when not in demo mode', () => {
    render(<Landing />);
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.queryByText('Try Demo')).not.toBeInTheDocument();
  });

  it('renders Try Demo link when in demo mode', () => {
    mockDemoMode = true;
    render(<Landing />);
    expect(screen.getByText('Try Demo')).toBeInTheDocument();
    expect(screen.getByText('Try Demo').closest('a')).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Learn More')).not.toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    render(<Landing />);
    expect(screen.getByText('Streaks & Points')).toBeInTheDocument();
    expect(screen.getByText('Badges & Achievements')).toBeInTheDocument();
    expect(screen.getByText('Family Friendly')).toBeInTheDocument();
    expect(screen.getByText('70+ Chore Templates')).toBeInTheDocument();
    expect(screen.getByText('Photo Proof')).toBeInTheDocument();
    expect(screen.getByText('Streak Freezes')).toBeInTheDocument();
  });

  it('renders pricing section with 3 plans', () => {
    render(<Landing />);
    expect(screen.getByText('Simple Pricing')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders pricing amounts', () => {
    render(<Landing />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('renders the bottom CTA section', () => {
    render(<Landing />);
    expect(screen.getByText('Ready to Make Chores Fun?')).toBeInTheDocument();
    expect(screen.getByText('Start Your 14-Day Free Trial')).toBeInTheDocument();
  });

  it('renders the footer with copyright', () => {
    render(<Landing />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year} ChoreChamp`))).toBeInTheDocument();
  });

  it('renders the features section heading', () => {
    render(<Landing />);
    expect(screen.getByText('Everything You Need to Manage Chores')).toBeInTheDocument();
  });
});
