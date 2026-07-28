function showLoadError(err: unknown) {
  const root = document.getElementById("root");
  if (!root) return;
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : "";
  root.innerHTML = `
        <div style="padding:24px;font-family:system-ui,sans-serif;background:#0a0812;color:#e2e8f0;min-height:100vh">
            <h1 style="color:#f87171;margin-bottom:8px">Load error</h1>
            <pre style="white-space:pre-wrap;font-size:12px">${msg}</pre>
            <pre style="margin-top:16px;font-size:11px;color:#94a3b8">${stack}</pre>
        </div>
    `;
}

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { logger } from "./lib/logger";

// Initialize industrialized logging
logger.init();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#0a0812",
            color: "#e2e8f0",
            minHeight: "100vh",
          }}
        >
          <h1 style={{ color: "#f87171", marginBottom: 8 }}>
            Something went wrong
          </h1>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

async function bootstrap() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  try {
    const { default: App } = await import("./App.tsx");
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  } catch (e) {
    showLoadError(e);
  }
}

bootstrap();
