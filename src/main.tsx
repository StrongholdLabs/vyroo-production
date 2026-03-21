import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import { initPlugins } from "./lib/plugins/init";
import "./index.css";

// Initialize Sentry error monitoring (only if DSN is configured)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  const hostname = window.location.hostname;
  const environment = hostname === "vyroo.ai" ? "production" : hostname === "localhost" ? "development" : "staging";

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: environment === "production" ? 1.0 : 0,
  });
}

// Initialize plugin system before rendering
initPlugins();

createRoot(document.getElementById("root")!).render(<App />);
