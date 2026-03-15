import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardErrorBoundary } from '../BoardErrorBoundary';

vi.mock('@chorechamp/ui', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    className?: string;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <svg data-testid="alert-triangle-icon" className={className} />
  ),
}));

let shouldThrowFlag = true;

function ThrowingComponent() {
  if (shouldThrowFlag) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
}

describe('BoardErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldThrowFlag = true;
    // Suppress React error boundary console.error output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    shouldThrowFlag = false;
    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(
        'An unexpected error occurred while rendering the board. Please try again or refresh the page.'
      )
    ).toBeInTheDocument();
  });

  it('renders the alert icon on error', () => {
    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
  });

  it('renders the Try Again button on error', () => {
    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('recovers when Try Again is clicked and child no longer throws', () => {
    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Stop the child from throwing, then click Try Again
    shouldThrowFlag = false;
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Normal content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <BoardErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    // The error message is inside a <pre> with stack trace, so use a function matcher
    const pre = screen.getByText((content, element) => {
      return element?.tagName === 'PRE' && content.includes('Test error message');
    });
    expect(pre).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('logs error to console', () => {
    render(
      <BoardErrorBoundary>
        <ThrowingComponent />
      </BoardErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });
});
