import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useParams: () => ({ householdId: 'test-household-id' }),
}));

// Mock UI components
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, _variant, _size, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    _variant?: string;
    _size?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock api-client hooks
vi.mock('@chorechamp/api-client', () => ({
  apiClient: {
    getNotifications: vi.fn().mockResolvedValue([]),
    getNotificationPreferences: vi.fn().mockResolvedValue({}),
    markNotificationRead: vi.fn().mockResolvedValue({}),
    markAllNotificationsRead: vi.fn().mockResolvedValue({}),
    updateNotificationPreferences: vi.fn().mockResolvedValue({}),
  },
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders the Back link to dashboard', () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });
    const backLink = screen.getByText('Back').closest('a');
    expect(backLink).toBeTruthy();
  });

  it('renders All, Unread, and Settings tabs', () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows notification preferences on the Settings tab', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />, { wrapper: createWrapper() });

    await user.click(screen.getByText('Settings'));
    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
  });
});
