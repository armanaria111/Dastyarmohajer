import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      this.setState({ hasError: false, error: null });
    }
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans"
        >
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                سامانه دستیار مهاجر در حال بازیابی
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                یک اختلال موقت در بارگذاری برنامه رخ داده است. با کلیک بر روی دکمه زیر می‌توانید صفحه را مجدداً تازه‌سازی نمایید.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-left font-mono text-[11px] text-rose-300 max-h-28 overflow-y-auto" dir="ltr">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} />
                <span>بارگذاری مجدد صفحه</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <Home size={15} />
                <span>بازگشت به صفحه اصلی</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
