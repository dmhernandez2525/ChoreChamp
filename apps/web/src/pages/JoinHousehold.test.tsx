import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock API client hooks
const mockJoinHousehold = {
  mutateAsync: vi.fn().mockResolvedValue({ household: { id: 'joined-household-1' } }),
  isPending: false,
};

vi.mock('@chorechamp/api-client', () => ({
  useJoinHousehold: () => mockJoinHousehold,
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: string; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type as 'button' | 'submit' | 'reset' | undefined} {...props}>{children}</button>
  ),
}));

import JoinHousehold from './JoinHousehold';

describe('JoinHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJoinHousehold.mutateAsync.mockResolvedValue({ household: { id: 'joined-household-1' } });
    mockJoinHousehold.isPending = false;
  });

  it('renders the page heading and subheading', () => {
    render(<JoinHousehold />);
    expect(screen.getByRole('heading', { name: 'Join Household' })).toBeInTheDocument();
    expect(screen.getByText('Join a Family Household')).toBeInTheDocument();
  });

  it('renders the invite code input', () => {
    render(<JoinHousehold />);
    expect(screen.getByLabelText('Invite Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ABCD1234')).toBeInTheDocument();
  });

  it('renders cancel and join buttons', () => {
    render(<JoinHousehold />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Household' })).toBeInTheDocument();
  });

  it('disables join button when code is less than 8 characters', () => {
    render(<JoinHousehold />);
    const joinButton = screen.getByRole('button', { name: 'Join Household' });
    expect(joinButton).toBeDisabled();
  });

  it('navigates to dashboard on cancel click', async () => {
    const user = userEvent.setup();
    render(<JoinHousehold />);

    await user.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('converts input to uppercase and limits to 8 characters', async () => {
    const user = userEvent.setup();
    render(<JoinHousehold />);

    const input = screen.getByLabelText('Invite Code');
    await user.type(input, 'abcd1234extra');
    expect(input).toHaveValue('ABCD1234');
  });

  it('calls joinHousehold and navigates on successful submit', async () => {
    const user = userEvent.setup();
    render(<JoinHousehold />);

    await user.type(screen.getByLabelText('Invite Code'), 'ABCD1234');
    await user.click(screen.getByRole('button', { name: 'Join Household' }));

    await waitFor(() => {
      expect(mockJoinHousehold.mutateAsync).toHaveBeenCalledWith({ code: 'ABCD1234' });
      expect(mockNavigate).toHaveBeenCalledWith('/households/joined-household-1');
    });
  });

  it('shows error for invalid/not found code', async () => {
    mockJoinHousehold.mutateAsync.mockRejectedValue(new Error('Code not found'));
    const user = userEvent.setup();
    render(<JoinHousehold />);

    await user.type(screen.getByLabelText('Invite Code'), 'XXXX9999');
    await user.click(screen.getByRole('button', { name: 'Join Household' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid invite code. Please check and try again.')).toBeInTheDocument();
    });
  });

  it('shows error for expired code', async () => {
    mockJoinHousehold.mutateAsync.mockRejectedValue(new Error('Code expired'));
    const user = userEvent.setup();
    render(<JoinHousehold />);

    await user.type(screen.getByLabelText('Invite Code'), 'XXXX9999');
    await user.click(screen.getByRole('button', { name: 'Join Household' }));

    await waitFor(() => {
      expect(screen.getByText('This invite code has expired.')).toBeInTheDocument();
    });
  });

  it('shows error for max uses reached', async () => {
    mockJoinHousehold.mutateAsync.mockRejectedValue(new Error('max uses reached'));
    const user = userEvent.setup();
    render(<JoinHousehold />);

    await user.type(screen.getByLabelText('Invite Code'), 'XXXX9999');
    await user.click(screen.getByRole('button', { name: 'Join Household' }));

    await waitFor(() => {
      expect(screen.getByText('This invite code has reached its maximum uses.')).toBeInTheDocument();
    });
  });

  it('renders help section with link to create household', () => {
    render(<JoinHousehold />);
    expect(screen.getByText("Don't have a code?")).toBeInTheDocument();
    const createLink = screen.getByText(/Or create your own household/);
    expect(createLink.closest('a')).toHaveAttribute('href', '/households/new');
  });
});
