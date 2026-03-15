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
const mockCreateHousehold = {
  mutateAsync: vi.fn().mockResolvedValue({ household: { id: 'new-household-1' } }),
  isPending: false,
};

vi.mock('@chorechamp/api-client', () => ({
  useCreateHousehold: () => mockCreateHousehold,
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: string; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type as 'button' | 'submit' | 'reset' | undefined} {...props}>{children}</button>
  ),
}));

import CreateHousehold from './CreateHousehold';

describe('CreateHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mutateAsync.mockResolvedValue({ household: { id: 'new-household-1' } });
    mockCreateHousehold.isPending = false;
  });

  it('renders the Create Household heading', () => {
    render(<CreateHousehold />);
    expect(screen.getByRole('heading', { name: 'Create Household' })).toBeInTheDocument();
    expect(screen.getByText('Create Your Family Household')).toBeInTheDocument();
  });

  it('renders the household name input', () => {
    render(<CreateHousehold />);
    expect(screen.getByLabelText('Household Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('The Smith Family')).toBeInTheDocument();
  });

  it('renders timezone and week start selectors', () => {
    render(<CreateHousehold />);
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByLabelText('Week Starts On')).toBeInTheDocument();
  });

  it('renders the points name input with default value', () => {
    render(<CreateHousehold />);
    const pointsInput = screen.getByLabelText('What do you want to call points?');
    expect(pointsInput).toBeInTheDocument();
    expect(pointsInput).toHaveValue('Stars');
  });

  it('renders cancel and create buttons', () => {
    render(<CreateHousehold />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Household' })).toBeInTheDocument();
  });

  it('navigates to dashboard on cancel click', async () => {
    const user = userEvent.setup();
    render(<CreateHousehold />);

    await user.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error when submitting with whitespace-only name', async () => {
    const user = userEvent.setup();
    render(<CreateHousehold />);

    // Type whitespace to bypass the required attribute, but trigger the trim check
    const nameInput = screen.getByLabelText('Household Name');
    await user.type(nameInput, '   ');
    await user.click(screen.getByRole('button', { name: 'Create Household' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a household name')).toBeInTheDocument();
    });
    expect(mockCreateHousehold.mutateAsync).not.toHaveBeenCalled();
  });

  it('calls createHousehold and navigates on successful submit', async () => {
    const user = userEvent.setup();
    render(<CreateHousehold />);

    await user.type(screen.getByLabelText('Household Name'), 'My Family');
    await user.click(screen.getByRole('button', { name: 'Create Household' }));

    await waitFor(() => {
      expect(mockCreateHousehold.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Family',
          pointsName: 'Stars',
          weekStartsOn: 0,
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/households/new-household-1');
    });
  });

  it('shows error message on failed creation', async () => {
    mockCreateHousehold.mutateAsync.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<CreateHousehold />);

    await user.type(screen.getByLabelText('Household Name'), 'My Family');
    await user.click(screen.getByRole('button', { name: 'Create Household' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create household. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders the info box about what happens next', () => {
    render(<CreateHousehold />);
    expect(screen.getByText('What happens next?')).toBeInTheDocument();
    expect(screen.getByText(/You'll be added as a parent/)).toBeInTheDocument();
  });

  it('renders a back link to the dashboard', () => {
    render(<CreateHousehold />);
    const backLink = screen.getByText(/Back/);
    expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
