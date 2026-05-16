import { Component, ReactNode } from "react";

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[ErrorBoundary] render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-2xl w-full space-y-4">
            <h1 className="text-2xl font-semibold text-destructive">Something went wrong rendering this page</h1>
            <p className="text-muted-foreground text-sm">
              An error was caught while rendering. Please share this message with your developer:
            </p>
            <pre className="text-xs bg-muted/50 border rounded p-4 overflow-auto whitespace-pre-wrap">
              {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.history.back(); }}
              className="text-sm text-primary underline"
            >
              Go back
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
