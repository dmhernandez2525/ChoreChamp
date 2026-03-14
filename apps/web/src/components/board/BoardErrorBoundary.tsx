import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@chorechamp/ui';

interface BoardErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface BoardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class BoardErrorBoundary extends Component<
  BoardErrorBoundaryProps,
  BoardErrorBoundaryState
> {
  constructor(props: BoardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BoardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BoardErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-500">
                An unexpected error occurred while rendering the board.
                Please try again or refresh the page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-2 w-full overflow-auto rounded-md bg-gray-100 p-3 text-left text-xs text-red-700">
                {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    {'\n\n'}
                    {this.state.error.stack}
                  </>
                )}
              </pre>
            )}

            <Button onClick={this.handleReset} variant="outline" className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
