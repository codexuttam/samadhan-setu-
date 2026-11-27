import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  language?: 'en' | 'hi';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI ErrorBoundary caught error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isHi = this.props.language === 'hi';

    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center select-none">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-xs space-y-5">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-[#0F1B2D]">
              {isHi ? 'कुछ गलत हो गया' : 'Something went wrong'}
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {isHi
                ? 'इस पृष्ठ को लोड करते समय एक अप्रत्याशित त्रुटि आई। आप पुनः प्रयास कर सकते हैं या पृष्ठ रीलोड कर सकते हैं।'
                : 'An unexpected error occurred while loading this view. You can try recovering or reload the page.'}
            </p>
            {this.state.errorMessage && (
              <p className="text-[11px] font-mono text-red-600 bg-red-50/70 px-3 py-1.5 rounded-lg break-words">
                {this.state.errorMessage}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 bg-[#0F1B2D] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-[#FF6A2A]" />
              <span>{isHi ? 'पुनः प्रयास करें' : 'Try Again'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isHi ? 'पृष्ठ रीलोड करें' : 'Reload Page'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
