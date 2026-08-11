export type BugReportPayload = {
  title: string;
  description: string;
  user_email?: string;
  page_url?: string;
  env?: "production" | "staging";
  source?: "manual" | "auto";
  stack?: string;
  fingerprint?: string;
  where?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
};

export type BugReportResult = {
  id: string;
  deduped?: boolean;
};

function simpleFingerprint(message: string, stack?: string): string {
  const top = (stack ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("|");
  let hash = 0;
  const input = `${message}\n${top}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `c${Math.abs(hash)}`;
}

function parseWhere(stack?: string): BugReportPayload["where"] {
  if (!stack) return {};
  for (const line of stack.split("\n").map((l) => l.trim())) {
    const withFn = /at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/.exec(line);
    if (withFn) {
      return {
        function: withFn[1],
        file: withFn[2],
        line: Number(withFn[3]),
        column: Number(withFn[4]),
      };
    }
    const bare = /at\s+(.+):(\d+):(\d+)/.exec(line);
    if (bare) {
      return { file: bare[1], line: Number(bare[2]), column: Number(bare[3]) };
    }
  }
  return {};
}

export async function submitBugReport(payload: BugReportPayload): Promise<BugReportResult> {
  const res = await fetch("/api/bug-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      page_url: payload.page_url ?? window.location.href,
      source: payload.source ?? "manual",
    }),
    keepalive: true,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<BugReportResult>;
}

const recent = new Map<string, number>();

export function installAutoCapture(env: "production" | "staging" = "production"): () => void {
  const dedupeMs = 60_000;

  async function reportAuto(message: string, stack?: string) {
    const fingerprint = simpleFingerprint(message, stack);
    const now = Date.now();
    if (now - (recent.get(fingerprint) ?? 0) < dedupeMs) return;
    recent.set(fingerprint, now);

    const where = parseWhere(stack);
    try {
      await submitBugReport({
        title: (message || "Unhandled error").slice(0, 180),
        description: [
          message,
          where?.file
            ? `Where: ${where.function ? `${where.function} @ ` : ""}${where.file}:${where.line ?? "?"}:${where.column ?? "?"}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        stack,
        fingerprint,
        where,
        source: "auto",
        env,
        page_url: window.location.href,
      });
    } catch {
      // ignore reporter failures
    }
  }

  const onError = (event: ErrorEvent) => {
    const msg = event.message || String(event.error ?? "window.onerror");
    const stack =
      event.error instanceof Error
        ? event.error.stack
        : event.filename
          ? `at ${event.filename}:${event.lineno}:${event.colno}`
          : undefined;
    void reportAuto(msg, stack);
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      void reportAuto(reason.message || "Unhandled rejection", reason.stack);
      return;
    }
    void reportAuto(`Unhandled rejection: ${String(reason)}`);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
