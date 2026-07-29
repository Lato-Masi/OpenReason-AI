import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Terminal, Bug, ShieldAlert, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught component error:', error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleCopyError = (): void => {
    const { error, errorInfo } = this.state;
    const diagnosticText = `[OpenReason Error Diagnostics]
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error: ${error?.name || 'UnknownError'} - ${error?.message || 'No message provided'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}
`;

    navigator.clipboard.writeText(diagnosticText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(err => {
      console.error('Failed to copy error to clipboard:', err);
    });
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, copied, showDetails } = this.state;

      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-rose-500/30 selection:text-rose-200">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-mono font-bold text-white tracking-wide">
                      Application Resilience Safeguard
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1">
                      <Bug className="w-3 h-3 text-rose-400" /> Exception Intercepted
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    An unhandled rendering error was isolated to prevent full application crash.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message Summary */}
            <div className="p-6 space-y-5">
              <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400">
                  <span className="flex items-center gap-1.5 uppercase">
                    <ShieldAlert className="w-4 h-4" />
                    {error?.name || 'Runtime Exception'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Isolated Context
                  </span>
                </div>
                <p className="text-sm font-mono text-zinc-200 break-words font-semibold">
                  {error?.message || 'An unexpected error occurred during interface execution.'}
                </p>
              </div>

              {/* Collapsible Diagnostic Logs */}
              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <button
                    onClick={this.toggleDetails}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{showDetails ? 'Hide' : 'Show'} Full Stack Trace & Diagnostics</span>
                  </button>

                  <button
                    onClick={this.handleCopyError}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copy technical diagnostic report to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy Stack Trace</span>
                      </>
                    )}
                  </button>
                </div>

                {showDetails && (
                  <div className="p-3 bg-black/90 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 max-h-60 overflow-y-auto space-y-3">
                    <div>
                      <span className="text-rose-400 font-bold block mb-1">Error Stack:</span>
                      <pre className="whitespace-pre-wrap font-mono text-zinc-400 text-[10px] leading-relaxed">
                        {error?.stack || 'No stack trace available.'}
                      </pre>
                    </div>
                    {errorInfo?.componentStack && (
                      <div className="border-t border-zinc-800/80 pt-2">
                        <span className="text-indigo-400 font-bold block mb-1">Component Hierarchy Stack:</span>
                        <pre className="whitespace-pre-wrap font-mono text-zinc-500 text-[10px] leading-relaxed">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono text-xs">
                <button
                  onClick={this.handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Recovering View
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full sm:w-auto px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-zinc-400" />
                  Reload Application
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>OpenReason Runtime Resilience Layer</span>
              <span className="text-zinc-400">Status: Fault Handled</span>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
