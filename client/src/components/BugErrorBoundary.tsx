import { Component, type ErrorInfo, type ReactNode } from "react";
import { submitBugReport } from "../lib/bugHub";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class BugErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void submitBugReport({
      title: error.message.slice(0, 180) || "React render error",
      description: [
        error.message,
        info.componentStack ? `Component stack:${info.componentStack}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      stack: error.stack,
      source: "auto",
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      env: import.meta.env.PROD ? "production" : "staging",
    }).catch(() => undefined);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 font-sans text-slate-800">
          <h1 className="font-serif text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-slate-600">The error was reported automatically. Please refresh the page.</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 font-semibold text-white"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
