import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service (if available)
    // e.g., Sentry.captureException(error);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-4">
          <Card className="max-w-2xl w-full shadow-2xl border-2 border-red-500/20">
            <CardHeader className="text-center space-y-4 pb-4">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl">
                Oops! Terjadi Kesalahan
              </CardTitle>
              <CardDescription className="text-base">
                Maaf, aplikasi mengalami masalah yang tidak terduga.
                Tim kami telah diberitahu dan sedang memperbaikinya.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error details (only in development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">
                    Error Details (Development Only):
                  </h4>
                  <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs font-medium text-red-900 dark:text-red-100 cursor-pointer">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto max-h-40 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset}
                  className="flex-1 gap-2 min-h-[44px]"
                  size="lg"
                  aria-label="Coba lagi untuk memuat ulang komponen"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Coba Lagi
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 gap-2 min-h-[44px]"
                  size="lg"
                  aria-label="Kembali ke halaman beranda"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Kembali ke Beranda
                </Button>
              </div>

              {/* Help text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Jika masalah terus berlanjut, silakan hubungi administrator.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for handling errors in async components
 * Usage: Wrap Suspense boundaries with this component
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle>Gagal Memuat Halaman</CardTitle>
              <CardDescription>
                Terjadi kesalahan saat memuat halaman. Silakan refresh browser Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Halaman
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
