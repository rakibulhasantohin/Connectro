import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Oops! Something happened</h2>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                {isFirestoreError ? "We encountered a permission or data issue with our database." : "An unexpected error occurred in the application."}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Error Details</p>
              <p className="text-xs font-mono text-zinc-600 break-all leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <button 
              onClick={this.handleReset}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
