import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mx-auto shadow-inner">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-100">
                Arayüzde Bir Hata Oluştu
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yapay zeka analiz paneli beklenmeyen bir hatayla karşılaştı ancak uygulamanız güvenle korumaya alındı.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-36">
                <code>{this.state.error.toString()}</code>
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Uygulamayı Sıfırla ve Yeniden Başlat</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
