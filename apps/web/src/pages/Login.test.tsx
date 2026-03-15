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
const mockSignIn = vi.fn().mockResolvedValue(undefined);
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' | 'reset'; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>{children}</button>
  ),
}));

// Mock demo mode (default: not demo mode)
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

import Login from './Login';

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDemoMode = false;
    mockSignIn.mockResolvedValue(undefined);
  });

  it('renders the login form when not in demo mode', () => {
    render(<Login />);
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('renders DemoRoleSelector in demo mode', () => {
    mockDemoMode = true;
    render(<Login />);
    expect(screen.getByTestId('demo-role-selector')).toBeInTheDocument();
    expect(screen.getByText('ChoreChamp Demo')).toBeInTheDocument();
  });

  it('renders the ChoreChamp heading', () => {
    render(<Login />);
    expect(screen.getByText('ChoreChamp')).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    render(<Login />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders email input with correct type and placeholder', () => {
    render(<Login />);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
  });

  it('renders password input with correct type', () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders the Sign In button', () => {
    render(<Login />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    render(<Login />);
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('calls signIn with email and password on form submit', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('navigates to dashboard after successful sign in', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message when sign in fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state while signing in', async () => {
    // Make signIn hang so we can catch the loading state
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });
});
