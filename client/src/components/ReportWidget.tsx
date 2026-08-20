"use client";

/**
 * Report / Help widget — copied from bug-hub/packages/reporter/widget.
 * Posts through this app's server-side proxy so the Bug Hub product key
 * never reaches the browser.
 *
 * Styling is self-contained (a scoped <style> tag plus inline layout) so the
 * widget looks the same in Next.js and Vite apps with no CSS setup. `accent`
 * tints the launcher, icons, and the primary button only.
 */

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { submitBugReport, type ReportKind } from "../lib/bugHub";

/** Dispatch on window to open the widget from anywhere: detail.kind picks the category. */
export const OPEN_REPORT_WIDGET = "report-widget:open";

type Step = "closed" | "choose" | "form" | "sending" | "done";

type FieldKey =
  | "summary"
  | "details"
  | "steps"
  | "expected"
  | "actual"
  | "email"
  | "phone"
  | "screenshot";

type FieldErrors = Partial<Record<FieldKey, string>>;

type Category = {
  kind: ReportKind;
  label: string;
  hint: string;
  summaryLabel: string;
  summaryPlaceholder: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  note?: string;
  cta: string;
  thanks: string;
  next: string;
};

const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const PHONE_PATTERN = /^[\d\s()+.-]{7,30}$/;
const BUSY_SELECTOR = '[role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-toast]';
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const CATEGORIES: Category[] = [
  {
    kind: "bug",
    label: "Something is broken",
    hint: "A page, button or form is not working",
    summaryLabel: "Summary",
    summaryPlaceholder: "e.g. Checkout button does nothing",
    detailsLabel: "Details",
    detailsPlaceholder: "",
    cta: "Send report",
    thanks: "We got it — the team can see this now.",
    next: "We'll look at the screenshot and this page, then reply by email.",
  },
  {
    kind: "feature",
    label: "I have an idea",
    hint: "Something you would like added or changed",
    summaryLabel: "Summary",
    summaryPlaceholder: "e.g. Bulk import for members",
    detailsLabel: "Details",
    detailsPlaceholder: "What would you like to be able to do?",
    cta: "Send idea",
    thanks: "We got it — your idea is on the list.",
    next: "We'll review it and reply by email if we need anything else.",
  },
  {
    kind: "training",
    label: "How do I …?",
    hint: "You need help using the site",
    summaryLabel: "Summary",
    summaryPlaceholder: "e.g. How do I add a second parish?",
    detailsLabel: "Details",
    detailsPlaceholder: "Tell us what you need help with.",
    note: "This goes to our support team and they will email you back.",
    cta: "Ask support",
    thanks: "We got it — support has your question.",
    next: "We'll reply by email. You can quote the reference below.",
  },
  {
    kind: "feedback",
    label: "General feedback",
    hint: "Anything else you want to tell us",
    summaryLabel: "Summary",
    summaryPlaceholder: "e.g. The new calendar is clearer",
    detailsLabel: "Details",
    detailsPlaceholder: "What is on your mind?",
    cta: "Send feedback",
    thanks: "We got it — thanks for the feedback.",
    next: "We'll read it and reply by email if a response is needed.",
  },
];

function categoryIcon(kind: ReportKind, color: string): ReactNode {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "bug":
      return (
        <svg {...common}>
          <path d="M8 6h8l1 3H7l1-3z" />
          <rect x="7" y="9" width="10" height="9" rx="3" />
          <path d="M9 13h.01M15 13h.01M12 9v9M6 12H4M20 12h-2M7 18l-2 2M17 18l2 2M7 10 5 8M17 10l2-2" />
        </svg>
      );
    case "feature":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12c.6.6 1 1.5 1 2.4V17h6v-.6c0-.9.4-1.8 1-2.4A7 7 0 0 0 12 2z" />
        </svg>
      );
    case "training":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1-1.4 1.9V14" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "feedback":
      return (
        <svg {...common}>
          <path d="M4 6h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H11l-4 3v-3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" />
        </svg>
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function Chevron({ color }: { color: string }): ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }): ReactNode {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 11 15.5 16 9.5" />
    </svg>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the screenshot"));
    reader.readAsDataURL(file);
  });
}

function screenshotError(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Please attach a PNG or JPEG screenshot.";
  if (file.size > MAX_SCREENSHOT_BYTES) return "Screenshots must be under 2 MB.";
  return null;
}

async function captureVisibleTab(): Promise<File> {
  const media = navigator.mediaDevices;
  if (!media?.getDisplayMedia) {
    throw new Error("This browser cannot capture the page. Please attach a screenshot instead.");
  }
  const stream = await media.getDisplayMedia({
    video: true,
    audio: false,
    // Chrome: offer the current tab first.
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions);
  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("No image came back from the capture.");
  }
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  await video.play();
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    track.stop();
    throw new Error("Could not capture this page.");
  }
  ctx.drawImage(video, 0, 0);
  stream.getTracks().forEach((t) => t.stop());
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("Could not capture this page."))), "image/png");
  });
  if (blob.size > MAX_SCREENSHOT_BYTES) {
    throw new Error("The capture was over 2 MB. Please attach a smaller screenshot.");
  }
  return new File([blob], "page.png", { type: "image/png" });
}

function canCapturePage(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);
}

export type ReportWidgetProps = {
  accent?: string;
  label?: string;
  /** Prefills Email when the product already knows who is signed in. */
  defaultEmail?: string;
};

export function ReportWidget({
  accent = "#0f766e",
  label = "Help",
  defaultEmail,
}: ReportWidgetProps) {
  const titleId = useId();
  const liveId = useId();
  const [step, setStep] = useState<Step>("closed");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]!);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [overlayBusy, setOverlayBusy] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const firstCategoryRef = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef(false);

  const open = step !== "closed";
  const sending = step === "sending";
  const launcherVisible = step === "closed" && !overlayBusy;

  useEffect(() => {
    if (defaultEmail) {
      setEmail((prev) => prev || defaultEmail);
    }
  }, [defaultEmail]);

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

  useEffect(() => {
    const busy = () =>
      Array.from(document.querySelectorAll(BUSY_SELECTOR)).some(
        (el) => !rootRef.current?.contains(el),
      );
    setOverlayBusy(busy());
    const observer = new MutationObserver(() => setOverlayBusy(busy()));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (step === "choose") firstCategoryRef.current?.focus();
    if (step === "form") summaryRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = true;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (sending) return;
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // close is stable enough for this listener; sending must be current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sending]);

  useEffect(() => {
    if (step !== "closed" || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    launcherRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "done") return;
    const timer = window.setTimeout(() => close(), 4000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function reset() {
    setSummary("");
    setDetails("");
    setSteps("");
    setExpected("");
    setActual("");
    setEmail(defaultEmail ?? "");
    setPhone("");
    setScreenshot(null);
    setFieldErrors({});
    setFormError("");
    setReferenceId("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function close() {
    setStep("closed");
    setCapturing(false);
    reset();
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (summary.trim().length < 3) {
      next.summary = "Please add a short summary.";
    }
    if (category.kind === "bug") {
      if (steps.trim().length < 3) next.steps = "Please tell us what you did.";
      if (expected.trim().length < 3) next.expected = "Please tell us what you expected.";
      if (actual.trim().length < 3) next.actual = "Please tell us what happened instead.";
    } else if (details.trim().length < 3) {
      next.details = "Please add a little more detail.";
    }
    const emailInput = emailRef.current;
    if (emailInput && !emailInput.validity.valid) {
      next.email = emailInput.validity.valueMissing
        ? "Please add your email address so we can reply."
        : "Please enter a valid email address.";
    } else if (!email.trim()) {
      next.email = "Please add your email address so we can reply.";
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      next.phone = "Enter a phone number we can call.";
    }
    if (screenshot) {
      const shot = screenshotError(screenshot);
      if (shot) next.screenshot = shot;
    }
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const next = validate();
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setFormError("");
    setStep("sending");

    const description =
      category.kind === "bug"
        ? [`What I did:\n${steps.trim()}`, `What I expected:\n${expected.trim()}`, `What happened instead:\n${actual.trim()}`].join(
            "\n\n",
          )
        : details.trim();

    try {
      const screenshot_base64 = screenshot ? await fileToDataUrl(screenshot) : undefined;
      const result = (await submitBugReport({
        title: summary.trim().slice(0, 180),
        description,
        user_email: email.trim(),
        user_phone: phone.trim() || undefined,
        kind: category.kind,
        source: "manual",
        page_url: typeof window === "undefined" ? undefined : window.location.href,
        screenshot_base64,
      })) as { id?: string };
      setReferenceId(typeof result?.id === "string" ? result.id : "");
      setStep("done");
    } catch (err) {
      console.error("[bug-hub] widget submit failed", err);
      setStep("form");
      setFormError("Could not send. Please try again.");
    }
  }

  function onPickFile(file: File | undefined) {
    if (!file) {
      setScreenshot(null);
      setFieldErrors((prev) => ({ ...prev, screenshot: undefined }));
      return;
    }
    const error = screenshotError(file);
    if (error) {
      setScreenshot(null);
      setFieldErrors((prev) => ({ ...prev, screenshot: error }));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setScreenshot(file);
    setFieldErrors((prev) => ({ ...prev, screenshot: undefined }));
  }

  async function onCapture() {
    setCapturing(true);
    setFieldErrors((prev) => ({ ...prev, screenshot: undefined }));
    try {
      const file = await captureVisibleTab();
      onPickFile(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not capture this page.";
      if (message.toLowerCase().includes("abort") || message.toLowerCase().includes("denied")) {
        return;
      }
      setFieldErrors((prev) => ({ ...prev, screenshot: message }));
    } finally {
      setCapturing(false);
    }
  }

  const accentVar = { ["--bh-accent" as string]: accent } as CSSProperties;
  const disabled = sending;

  return (
    <div ref={rootRef} className="bh-rw" style={accentVar}>
      <style>{WIDGET_CSS}</style>

      {launcherVisible ? (
        <button
          ref={launcherRef}
          type="button"
          className="bh-rw-launcher"
          aria-label="Report a problem or get help"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setStep("choose")}
        >
          {label}
        </button>
      ) : null}

      {open ? (
        <div
          className="bh-rw-scrim"
          onClick={() => {
            if (!sending) close();
          }}
        />
      ) : null}

      {open ? (
        <div
          ref={panelRef}
          className="bh-rw-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={sending}
        >
          {step === "choose" ? (
            <>
              <Header id={titleId} title="How can we help?" onClose={close} />
              <div className="bh-rw-list">
                {CATEGORIES.map((item, index) => (
                  <button
                    key={item.kind}
                    ref={index === 0 ? firstCategoryRef : undefined}
                    type="button"
                    className="bh-rw-row"
                    onClick={() => {
                      setCategory(item);
                      setFieldErrors({});
                      setFormError("");
                      setStep("form");
                    }}
                  >
                    <span className="bh-rw-row-icon">{categoryIcon(item.kind, accent)}</span>
                    <span className="bh-rw-row-text">
                      <strong>{item.label}</strong>
                      <span>{item.hint}</span>
                    </span>
                    <Chevron color="#94a3b8" />
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === "form" || step === "sending" ? (
            <form onSubmit={onSubmit} noValidate>
              <Header id={titleId} title={category.label} onClose={sending ? undefined : close} />
              <p className="bh-rw-note">{category.note ?? "We’ll include this page and your browser so we can reproduce it."}</p>

              <Field label={`${category.summaryLabel} *`} error={fieldErrors.summary} htmlFor="bh-rw-summary">
                <input
                  ref={summaryRef}
                  id="bh-rw-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={category.summaryPlaceholder}
                  disabled={disabled}
                  aria-invalid={Boolean(fieldErrors.summary)}
                  autoComplete="off"
                  className="bh-rw-field"
                />
              </Field>

              {category.kind === "bug" ? (
                <>
                  <Field label="What did you do? *" error={fieldErrors.steps} htmlFor="bh-rw-steps">
                    <textarea
                      id="bh-rw-steps"
                      rows={3}
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      placeholder="I clicked Save on the parish form"
                      disabled={disabled}
                      aria-invalid={Boolean(fieldErrors.steps)}
                      className="bh-rw-field"
                    />
                  </Field>
                  <Field label="What did you expect? *" error={fieldErrors.expected} htmlFor="bh-rw-expected">
                    <textarea
                      id="bh-rw-expected"
                      rows={2}
                      value={expected}
                      onChange={(e) => setExpected(e.target.value)}
                      placeholder="The parish should have been saved"
                      disabled={disabled}
                      aria-invalid={Boolean(fieldErrors.expected)}
                      className="bh-rw-field"
                    />
                  </Field>
                  <Field label="What happened instead? *" error={fieldErrors.actual} htmlFor="bh-rw-actual">
                    <textarea
                      id="bh-rw-actual"
                      rows={2}
                      value={actual}
                      onChange={(e) => setActual(e.target.value)}
                      placeholder="Nothing happened, the button stayed enabled"
                      disabled={disabled}
                      aria-invalid={Boolean(fieldErrors.actual)}
                      className="bh-rw-field"
                    />
                  </Field>
                </>
              ) : (
                <Field label={`${category.detailsLabel} *`} error={fieldErrors.details} htmlFor="bh-rw-details">
                  <textarea
                    id="bh-rw-details"
                    required
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={category.detailsPlaceholder}
                    disabled={disabled}
                    aria-invalid={Boolean(fieldErrors.details)}
                    className="bh-rw-field"
                  />
                </Field>
              )}

              <Field label="Email *" error={fieldErrors.email} htmlFor="bh-rw-email">
                <input
                  ref={emailRef}
                  id="bh-rw-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={disabled}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className="bh-rw-field"
                />
              </Field>

              <Field label="Phone (optional)" error={fieldErrors.phone} htmlFor="bh-rw-phone">
                <input
                  id="bh-rw-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 0100"
                  disabled={disabled}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className="bh-rw-field"
                />
              </Field>

              <div className="bh-rw-shot">
                <span className="bh-rw-label">Screenshot {category.kind === "bug" ? "(recommended)" : "(optional)"}</span>
                <div className="bh-rw-shot-row">
                  <label className="bh-rw-attach">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={disabled || capturing}
                      onChange={(e) => onPickFile(e.target.files?.[0])}
                    />
                    Attach
                  </label>
                  {canCapturePage() ? (
                    <button
                      type="button"
                      className="bh-rw-attach"
                      disabled={disabled || capturing}
                      onClick={() => void onCapture()}
                    >
                      {capturing ? "Capturing…" : "Capture this page"}
                    </button>
                  ) : null}
                </div>
                {screenshot ? <p className="bh-rw-file">{screenshot.name}</p> : null}
                {fieldErrors.screenshot ? <p className="bh-rw-error">{fieldErrors.screenshot}</p> : null}
              </div>

              <p className="bh-rw-disclose">We’ll include this page and your browser so we can reproduce it.</p>

              <p id={liveId} className="bh-rw-live" role="status" aria-live="polite">
                {formError}
              </p>

              <div className="bh-rw-actions">
                <button type="button" className="bh-rw-back" disabled={disabled} onClick={() => setStep("choose")}>
                  Back
                </button>
                <button type="submit" className="bh-rw-submit" disabled={disabled}>
                  {sending ? "Sending…" : category.cta}
                </button>
              </div>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="bh-rw-done">
              <Header id={titleId} title="Sent" onClose={close} />
              <div className="bh-rw-done-body">
                <CheckIcon color={accent} />
                <p className="bh-rw-done-title">We got it</p>
                <p>{category.thanks}</p>
                {referenceId ? (
                  <p className="bh-rw-ref">
                    Reference: <code>{referenceId}</code>
                  </p>
                ) : null}
                <p className="bh-rw-note">{category.next}</p>
                <button type="button" className="bh-rw-submit" onClick={close}>
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Header({
  id,
  title,
  onClose,
}: {
  id: string;
  title: string;
  onClose?: () => void;
}) {
  return (
    <div className="bh-rw-header">
      <strong id={id}>{title}</strong>
      {onClose ? (
        <button type="button" className="bh-rw-x" aria-label="Close" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M1 1l10 10M11 1 1 11" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </button>
      ) : (
        <span className="bh-rw-x bh-rw-x-spacer" />
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby": error ? errorId : undefined,
      })
    : children;
  return (
    <div className="bh-rw-field-wrap">
      <label className="bh-rw-label" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="bh-rw-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const WIDGET_CSS = `
.bh-rw { font-family: ${FONT}; color: #0f172a; }
.bh-rw *, .bh-rw *::before, .bh-rw *::after { box-sizing: border-box; font-family: inherit; }
.bh-rw-launcher {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483001;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: var(--bh-accent, #0f766e); color: #fff;
  border-radius: 999px; padding: 0.7rem 1.15rem; min-height: 44px;
  font: inherit; font-weight: 600; cursor: pointer;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
}
.bh-rw-launcher:hover { filter: brightness(1.05); }
.bh-rw-scrim {
  position: fixed; inset: 0; z-index: 2147483000;
  background: rgba(15, 23, 42, 0.18);
}
.bh-rw-panel {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483001;
  width: 400px; max-width: calc(100vw - 2rem); max-height: min(640px, calc(100vh - 32px));
  overflow: auto; text-align: left;
  background: #fff; color: #0f172a;
  border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px;
  display: grid; gap: 10px;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.18);
}
.bh-rw-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bh-rw-header strong { font-size: 16px; font-weight: 650; }
.bh-rw-x {
  width: 24px; height: 24px; min-width: 24px; min-height: 24px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 8px; background: transparent; color: #64748b; cursor: pointer;
}
.bh-rw-x:hover { background: #f1f5f9; color: #0f172a; }
.bh-rw-x-spacer { visibility: hidden; }
.bh-rw-list { display: grid; gap: 8px; }
.bh-rw-row {
  display: grid; grid-template-columns: 20px 1fr 16px; gap: 10px; align-items: center;
  width: 100%; text-align: left; min-height: 44px;
  background: #fff; color: inherit;
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px;
  font: inherit; cursor: pointer;
}
.bh-rw-row:hover { background: #f8fafc; border-color: #cbd5e1; }
.bh-rw-row-icon { display: inline-flex; }
.bh-rw-row-text { display: grid; gap: 2px; min-width: 0; }
.bh-rw-row-text strong { font-size: 14px; font-weight: 650; }
.bh-rw-row-text span { color: #64748b; font-size: 12px; }
.bh-rw-note, .bh-rw-disclose { margin: 0; color: #64748b; font-size: 12px; line-height: 1.4; }
.bh-rw-field-wrap, .bh-rw-shot { display: grid; gap: 4px; margin-top: 8px; }
.bh-rw-label { font-size: 12px; font-weight: 600; color: #334155; }
.bh-rw-field {
  width: 100%; border-radius: 10px; border: 1px solid #e2e8f0;
  background: #fff; color: #0f172a; padding: 0.55rem 0.7rem; font: inherit; font-size: 14px;
  resize: vertical;
}
.bh-rw-field[aria-invalid="true"] { border-color: #ef4444; }
.bh-rw-field:disabled { opacity: 0.65; }
.bh-rw-error { margin: 0; color: #b91c1c; font-size: 12px; }
.bh-rw-live { margin: 8px 0 0; min-height: 1.2em; color: #b91c1c; font-size: 12px; }
.bh-rw-shot-row { display: flex; flex-wrap: wrap; gap: 8px; }
.bh-rw-attach {
  display: inline-flex; align-items: center; justify-content: center; min-height: 36px;
  padding: 0 12px; border-radius: 10px; border: 1px solid #e2e8f0;
  background: #f8fafc; color: #0f172a; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
}
.bh-rw-attach input { display: none; }
.bh-rw-attach:hover { border-color: #cbd5e1; background: #f1f5f9; }
.bh-rw-file { margin: 0; font-size: 12px; color: #334155; }
.bh-rw-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; }
.bh-rw-back {
  border: 0; background: transparent; color: #64748b; font: inherit; font-size: 14px;
  min-height: 44px; padding: 0 8px; cursor: pointer;
}
.bh-rw-back:hover { color: #0f172a; }
.bh-rw-submit {
  margin-left: auto; min-height: 44px; padding: 0 16px; border: 0; border-radius: 10px;
  background: var(--bh-accent, #0f766e); color: #fff; font: inherit; font-weight: 650; cursor: pointer;
}
.bh-rw-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.bh-rw-done-body { display: grid; gap: 8px; justify-items: start; padding-top: 4px; }
.bh-rw-done-title { margin: 0; font-size: 16px; font-weight: 700; }
.bh-rw-done-body p { margin: 0; font-size: 14px; color: #334155; }
.bh-rw-ref { font-size: 13px !important; }
.bh-rw-ref code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.bh-rw-launcher:focus-visible,
.bh-rw-row:focus-visible,
.bh-rw-x:focus-visible,
.bh-rw-back:focus-visible,
.bh-rw-submit:focus-visible,
.bh-rw-attach:focus-visible,
.bh-rw-field:focus-visible {
  outline: 2px solid var(--bh-accent, #0f766e);
  outline-offset: 2px;
}
@media (max-width: 480px) {
  .bh-rw-panel {
    left: 0; right: 0; bottom: 0; width: 100%; max-width: 100%;
    border-radius: 16px 16px 0 0;
    padding: 16px 16px max(16px, env(safe-area-inset-bottom));
    max-height: min(92vh, 720px);
  }
  .bh-rw-launcher { bottom: max(16px, env(safe-area-inset-bottom)); }
  .bh-rw-row, .bh-rw-submit, .bh-rw-back, .bh-rw-attach { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .bh-rw-launcher, .bh-rw-panel, .bh-rw-scrim { transition: none; }
}
`;
