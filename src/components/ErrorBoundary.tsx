import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let parsedDetails: any = null;
      try {
        parsedDetails = JSON.parse(this.state.errorMessage);
      } catch {
        // Not a JSON FirestoreErrorInfo
      }

      return (
        <div className="min-h-screen bg-[#F8F5EF] text-[#292824] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E6E0D6] rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-[#6E6A63] mb-4">
              {parsedDetails
                ? `Firestore operation (${parsedDetails.operationType}) on "${parsedDetails.path}" failed: ${parsedDetails.error}`
                : this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
