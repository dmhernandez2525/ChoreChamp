import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKey changes
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
          <View className="flex-1 items-center justify-center p-6">
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm max-w-md w-full">
              <Text className="text-5xl text-center mb-4">😵</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Oops! Something went wrong
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
                {"We're sorry for the inconvenience. Please try again."}
              </Text>

              <TouchableOpacity
                className="bg-primary-500 dark:bg-primary-600 rounded-xl py-3 px-6 mb-3"
                onPress={this.handleRetry}
              >
                <Text className="text-white font-semibold text-center">
                  Try Again
                </Text>
              </TouchableOpacity>

              {__DEV__ && this.state.error && (
                <View className="mt-4 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                  <Text className="text-danger-700 dark:text-danger-300 text-xs font-mono">
                    {this.state.error.toString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
  onReset,
}: ErrorBoundaryWrapperProps): React.ReactElement {
  const [resetKey, setResetKey] = React.useState(0);

  const handleReset = () => {
    setResetKey((k) => k + 1);
    onReset?.();
  };

  return (
    <ErrorBoundary
      resetKey={resetKey}
      fallback={
        fallback || (
          <ErrorFallback onRetry={handleReset} />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}

interface ErrorFallbackProps {
  onRetry: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  onRetry,
  title = 'Something went wrong',
  message = 'Please try again or check your connection.',
}: ErrorFallbackProps): React.ReactElement {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm max-w-sm w-full">
        <Text className="text-4xl text-center mb-4">⚠️</Text>
        <Text className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
          {title}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
          {message}
        </Text>
        <TouchableOpacity
          className="bg-primary-500 dark:bg-primary-600 rounded-xl py-3"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold text-center">
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
