'use client';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree and displays
 * a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Graceful error handling for demo failures
 * - User-friendly error messages
 * - Recovery options and reset functionality
 * - Error logging for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw, Bug } from 'lucide-react';

// ============================================================================
// ERROR BOUNDARY TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error logging service here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (
      hasError &&
      prevProps.resetKeys !== resetKeys &&
      resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.resetErrorBoundary();
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    });
  };

  handleRetry = () => {
    const maxRetries = 3;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(
        prevState => ({
          retryCount: prevState.retryCount + 1
        }),
        () => {
          // Add a small delay before retry
          this.resetTimeoutId = window.setTimeout(() => {
            this.resetErrorBoundary();
          }, 500);
        }
      );
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  getErrorMessage = (): string => {
    const { error } = this.state;
    
    if (!error) return 'An unknown error occurred';

    // Customize error messages for different error types
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This might be due to a network issue or an updated version.';
    }

    if (error.message.includes('ResizeObserver loop limit exceeded')) {
      return 'Display rendering error. This is usually temporary.';
    }

    if (error.message.includes('demo') || error.message.includes('Demo')) {
      return 'Demo execution failed. You can retry the demo or reset to continue.';
    }

    return error.message || 'An unexpected error occurred';
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, className } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const errorMessage = this.getErrorMessage();
      const maxRetries = 3;
      const canRetry = retryCount < maxRetries;

      return (
        <div className={`min-h-[200px] flex items-center justify-center p-8 ${className || ''}`}>
          <div className="max-w-lg w-full bg-red-50 border-2 border-red-200 rounded-lg p-6 animate-fadeIn">
            {/* ERROR HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Something went wrong
                </h3>
                <p className="text-sm text-red-600">
                  Error ID: {errorId}
                </p>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            <div className="mb-4">
              <p className="text-red-800 mb-2">
                {errorMessage}
              </p>
              
              {retryCount > 0 && (
                <p className="text-sm text-red-600">
                  Retry attempt: {retryCount}/{maxRetries}
                </p>
              )}
            </div>

            {/* ERROR DETAILS (Development only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-4">
                <summary className="text-sm text-red-700 cursor-pointer hover:text-red-900 flex items-center gap-1">
                  <Bug size={14} />
                  <span>Technical Details</span>
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded border text-xs text-red-800 font-mono overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg 
                           hover:bg-orange-700 transition-colors font-medium touch-manipulation"
                >
                  <RotateCcw size={16} />
                  <span>Try Again</span>
                </button>
              )}
              
              <button
                onClick={this.handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg 
                         hover:bg-red-700 transition-colors font-medium touch-manipulation"
              >
                <RefreshCw size={16} />
                <span>Refresh Page</span>
              </button>

              <button
                onClick={this.resetErrorBoundary}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg 
                         hover:bg-gray-700 transition-colors font-medium touch-manipulation"
              >
                <span>Reset</span>
              </button>
            </div>

            {/* HELP TEXT */}
            <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-700">
              <p>
                If this problem persists, try refreshing the page or contact support with the error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// HOOKS FOR FUNCTIONAL COMPONENTS
// ============================================================================

/**
 * Hook to create an error boundary effect in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Captured error:', error);
    setError(error);
  }, []);

  // Throw error to be caught by nearest error boundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

// ============================================================================
// HIGH-ORDER COMPONENT
// ============================================================================

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary; 