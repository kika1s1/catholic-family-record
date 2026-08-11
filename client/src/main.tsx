import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AutoCapture } from "./components/AutoCapture";
import { BugErrorBoundary } from "./components/BugErrorBoundary";
import { ReportWidget } from "./components/ReportWidget";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BugErrorBoundary>
      <AutoCapture />
      <App />
      <ReportWidget />
    </BugErrorBoundary>
  </StrictMode>,
);
