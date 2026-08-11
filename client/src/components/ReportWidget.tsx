import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { submitBugReport, type ReportKind } from "../lib/bugHub";

/** Dispatch on window to open the widget from anywhere: detail.kind picks the category. */
export const OPEN_REPORT_WIDGET = "report-widget:open";

type Step = "closed" | "choose" | "form" | "sending" | "done";

type Category = {
  kind: ReportKind;
  label: string;
  hint: string;
  summary: string;
  details: string;
  cta: string;
  thanks: string;
  note?: string;
};

const CATEGORIES: Category[] = [
  {
    kind: "bug",
    label: "Something is broken",
    hint: "A page, button or form is not working",
    summary: "What is broken?",
    details: "What did you do, and what happened instead?",
    cta: "Send report",
    thanks: "Thanks — the team can see this now.",
  },
  {
    kind: "feature",
    label: "I have an idea",
    hint: "Something you would like added or changed",
    summary: "Your idea in one line",
    details: "What would you like to be able to do?",
    cta: "Send idea",
    thanks: "Thanks — your idea is on the list.",
  },
  {
    kind: "training",
    label: "How do I ... ?",
    hint: "You need help using the site",
    summary: "What are you trying to do?",
    details: "Tell us what you need help with.",
    cta: "Ask support",
    thanks: "Thanks — support has your question and will reply by email.",
    note: "This goes to our support team, so please leave your email address.",
  },
  {
    kind: "feedback",
    label: "General feedback",
    hint: "Anything else you want to tell us",
    summary: "In one line",
    details: "What is on your mind?",
    cta: "Send feedback",
    thanks: "Thanks for the feedback.",
  },
];

const ACCENT = "#0f766e";

export function ReportWidget() {
  const [step, setStep] = useState<Step>("closed");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]!);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const onOpen = (event: Event) => {
      const wanted = (event as CustomEvent<{ kind?: ReportKind }>).detail?.kind;
      const match = CATEGORIES.find((c) => c.kind === wanted);
      setCategory(match ?? CATEGORIES[0]!);
      setStep(match ? "form" : "choose");
    };
    window.addEventListener(OPEN_REPORT_WIDGET, onOpen);
    return () => window.removeEventListener(OPEN_REPORT_WIDGET, onOpen);
  }, []);

  function close() {
    setStep("closed");
    setSummary("");
    setDetails("");
    setEmail("");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const title = summary.trim() || details.trim().split("\n")[0] || "";
    if (title.length < 3 || details.trim().length < 3) {
      setError("Please add a little more detail.");
      return;
    }

    setStep("sending");
    setError("");
    try {
      await submitBugReport({
        title: title.slice(0, 180),
        description: details.trim(),
        user_email: email.trim() || undefined,
        kind: category.kind,
        source: "manual",
        page_url: window.location.href,
      });
      setSummary("");
      setDetails("");
      setEmail("");
      setStep("done");
    } catch (err) {
      setStep("form");
      setError(err instanceof Error ? err.message : "Could not send. Please try again.");
    }
  }

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60, textAlign: "right" }}>
      {step === "closed" || step === "done" ? (
        <button type="button" onClick={() => setStep("choose")} style={launcher}>
          Report / Help
        </button>
      ) : null}

      {step === "choose" ? (
        <div style={panel}>
          <Header title="How can we help?" onClose={close} />
          <div style={{ display: "grid", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.kind}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setStep("form");
                }}
                style={choice}
              >
                <strong>{c.label}</strong>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{c.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "form" || step === "sending" ? (
        <form onSubmit={onSubmit} style={panel}>
          <Header title={category.label} onClose={close} />
          {category.note ? (
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>{category.note}</p>
          ) : null}
          <input
            placeholder={category.summary}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={field}
          />
          <textarea
            required
            rows={4}
            placeholder={category.details}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            style={{ ...field, resize: "vertical" }}
          />
          <input
            type="email"
            placeholder={category.kind === "training" ? "Your email" : "Email (optional)"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={field}
          />
          {error ? <p style={{ margin: 0, color: "#fecaca", fontSize: 12 }}>{error}</p> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setStep("choose")} style={secondary}>
              Back
            </button>
            <button type="submit" disabled={step === "sending"} style={primary}>
              {step === "sending" ? "Sending…" : category.cta}
            </button>
          </div>
        </form>
      ) : null}

      {step === "done" ? (
        <p style={{ marginTop: 8, color: ACCENT, fontSize: 13, maxWidth: 300 }}>{category.thanks}</p>
      ) : null}
    </div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <strong>{title}</strong>
      <button type="button" onClick={onClose} aria-label="Close" style={closeBtn}>
        Close
      </button>
    </div>
  );
}

const launcher: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.2)",
  background: ACCENT,
  color: "#fff",
  borderRadius: 999,
  padding: "0.7rem 1.1rem",
  font: "inherit",
  fontWeight: 600,
  cursor: "pointer",
};

const panel: CSSProperties = {
  width: 340,
  maxWidth: "calc(100vw - 2rem)",
  background: "#0b1220",
  color: "#f8fafc",
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: 16,
  padding: 16,
  display: "grid",
  gap: 10,
  textAlign: "left",
  font: "inherit",
  fontSize: 14,
};

const field: CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "#111827",
  color: "#f8fafc",
  padding: "0.55rem 0.7rem",
  font: "inherit",
};

const choice: CSSProperties = { ...field, display: "grid", gap: 2, cursor: "pointer" };

const primary: CSSProperties = {
  ...field,
  background: ACCENT,
  border: 0,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const secondary: CSSProperties = {
  ...field,
  width: "auto",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: 0,
  color: "#94a3b8",
  cursor: "pointer",
  font: "inherit",
};
