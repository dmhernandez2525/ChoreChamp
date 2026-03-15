import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth context
let mockAuthData: { user: unknown; isLoading: boolean; signOut: () => Promise<void> } = {
  user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  isLoading: false,
  signOut: vi.fn().mockResolvedValue(undefined),
};
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthData,
}));

// Mock API client hooks
const mockUpdateProfile = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
const mockChangePassword = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
const mockDeleteAccount = { mutateAsync: vi.fn().mockResolvedValue(undefined) };

vi.mock('@chorechamp/api-client', () => ({
  useUpdateProfile: () => mockUpdateProfile,
  useChangePassword: () => mockChangePassword,
  useDeleteAccount: () => mockDeleteAccount,
}));

// Mock settings sections
vi.mock('../components/settings', () => ({
  ProfileSection: ({ user }: { user: unknown }) => (
    <div data-testid="profile-section">Profile for {(user as { name: string }).name}</div>
  ),
  SecuritySection: () => <div data-testid="security-section">Security</div>,
  NotificationsSection: () => <div data-testid="notifications-section">Notifications</div>,
  AccessibilitySection: () => <div data-testid="accessibility-section">Accessibility Settings</div>,
  CognitiveAccessibilitySection: () => <div data-testid="cognitive-accessibility">Cognitive</div>,
  LanguageSection: () => <div data-testid="language-section">Language</div>,
  SpecialNeedsSection: () => <div data-testid="special-needs">Special Needs</div>,
}));

// Mock common components
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import Settings from './Settings';

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthData = {
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      isLoading: false,
      signOut: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders loading skeletons when auth is loading', () => {
    mockAuthData = { ...mockAuthData, user: null, isLoading: true };

    render(<Settings />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('redirects to login when no user is found', () => {
    mockAuthData = { ...mockAuthData, user: null, isLoading: false };

    render(<Settings />);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the Settings heading', () => {
    render(<Settings />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the first three tab labels', () => {
    render(<Settings />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('renders at least profile, notifications, and security tabs', () => {
    render(<Settings />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('shows the profile section by default', () => {
    render(<Settings />);
    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
    expect(screen.getByText('Profile for Test User')).toBeInTheDocument();
  });

  it('switches to notifications tab on click', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByText('Notifications'));
    expect(screen.getByTestId('notifications-section')).toBeInTheDocument();
  });

  it('switches to security tab on click', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByText('Security'));
    expect(screen.getByTestId('security-section')).toBeInTheDocument();
  });

  it('renders the profile section with user data', () => {
    render(<Settings />);
    expect(screen.getByText('Profile for Test User')).toBeInTheDocument();
  });

  it('does not show notifications section when profile tab is active', () => {
    render(<Settings />);
    expect(screen.queryByTestId('notifications-section')).not.toBeInTheDocument();
  });

  it('renders a back link to the dashboard', () => {
    render(<Settings />);
    const backLink = screen.getByText('\u2190');
    expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
