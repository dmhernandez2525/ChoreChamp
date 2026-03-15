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

// Mock auth context
const mockSignUp = vi.fn().mockResolvedValue(undefined);
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' | 'reset'; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>{children}</button>
  ),
}));

// Mock demo mode
let mockDemoMode = false;
vi.mock('../lib/demo-mode', () => ({
  get DEMO_MODE() {
    return mockDemoMode;
  },
}));

// Mock DemoRoleSelector
vi.mock('../components/DemoRoleSelector', () => ({
  DemoRoleSelector: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="demo-role-selector">
      <span>{title}</span>
      <span>{subtitle}</span>
    </div>
  ),
}));

import SignUp from './SignUp';

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDemoMode = false;
    mockSignUp.mockResolvedValue(undefined);
  });

  it('renders the signup form when not in demo mode', () => {
    render(<SignUp />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('renders DemoRoleSelector in demo mode', () => {
    mockDemoMode = true;
    render(<SignUp />);
    expect(screen.getByTestId('demo-role-selector')).toBeInTheDocument();
    expect(screen.getByText('ChoreChamp Demo')).toBeInTheDocument();
  });

  it('renders the ChoreChamp heading', () => {
    render(<SignUp />);
    expect(screen.getByText('ChoreChamp')).toBeInTheDocument();
  });

  it('renders name, email, password, and confirm password fields', () => {
    render(<SignUp />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('renders correct input types', () => {
    render(<SignUp />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('type', 'password');
  });

  it('renders the Create Account button', () => {
    render(<SignUp />);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders sign in link', () => {
    render(<SignUp />);
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    const signInLink = screen.getByText('Sign in');
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpass');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp with correct arguments on valid submit', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByText('Create Account'));

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
  });

  it('navigates to dashboard after successful sign up', async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message when sign up fails', async () => {
    mockSignUp.mockRejectedValue(new Error('Email already in use'));
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'taken@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('shows loading state while creating account', async () => {
    mockSignUp.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });
  });
});
