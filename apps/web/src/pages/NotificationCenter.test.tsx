import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock UI components
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, variant, size, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Track callbacks from NotificationList and NotificationPreferences
vi.mock('../components/notifications', () => ({
  NotificationList: ({ notifications, onRead, onReadAll }: {
    notifications: { id: string; title: string; read: boolean }[];
    onRead: (id: string) => void;
    onReadAll: () => void;
  }) => {
    return (
      <div data-testid="notification-list">
        <span data-testid="notification-count">{notifications.length}</span>
        {notifications.map((n) => (
          <div key={n.id} data-testid={`notification-${n.id}`}>
            <span>{n.title}</span>
            {!n.read && <span data-testid={`unread-${n.id}`}>unread</span>}
            <button onClick={() => onRead(n.id)}>Mark Read</button>
          </div>
        ))}
        <button onClick={onReadAll}>Mark All Read</button>
      </div>
    );
  },
  NotificationPreferences: ({ onSave }: { onSave: (prefs: unknown) => void }) => (
    <div data-testid="notification-preferences">
      <button onClick={() => onSave({ email: true })}>Save Preferences</button>
    </div>
  ),
}));

import NotificationCenter from './NotificationCenter';

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<NotificationCenter />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays the unread notification count', () => {
    render(<NotificationCenter />);
    // The demo data has 3 unread notifications
    expect(screen.getByText(/You have 3 unread notifications/)).toBeInTheDocument();
  });

  it('renders the Back link to dashboard', () => {
    render(<NotificationCenter />);
    const backLink = screen.getByText('Back').closest('a');
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });

  it('renders All, Unread, and Settings tabs', () => {
    render(<NotificationCenter />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows all notifications by default on the All tab', () => {
    render(<NotificationCenter />);
    // 8 demo notifications total
    expect(screen.getByTestId('notification-count')).toHaveTextContent('8');
  });

  it('filters to unread notifications on the Unread tab', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByText('Unread'));
    // 3 unread in demo data
    expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
  });

  it('shows notification preferences on the Settings tab', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByText('Settings'));
    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-list')).not.toBeInTheDocument();
  });

  it('marks a single notification as read', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    // Initially 3 unread
    expect(screen.getByText(/You have 3 unread notifications/)).toBeInTheDocument();

    // Click "Mark Read" on the first notification
    const markReadButtons = screen.getAllByText('Mark Read');
    await user.click(markReadButtons[0]);

    // Now 2 unread
    expect(screen.getByText(/You have 2 unread notifications/)).toBeInTheDocument();
  });

  it('marks all notifications as read', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByText('Mark All Read'));
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
  });

  it('displays the unread badge count on the Unread tab', () => {
    render(<NotificationCenter />);
    // The Unread tab should show count "3"
    const unreadTab = screen.getByText('Unread');
    const badge = unreadTab.parentElement?.querySelector('.rounded-full');
    expect(badge).toHaveTextContent('3');
  });
});
