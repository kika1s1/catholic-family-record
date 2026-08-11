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
        <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
          <h1>Something went wrong</h1>
          <p>The error was reported automatically. Please refresh the page.</p>
          <button type="button" onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
