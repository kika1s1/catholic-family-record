export type BugHubKind = "bug" | "feature" | "training" | "feedback";

export type BugHubPayload = {
  title: string;
  description: string;
  page_url?: string;
  user_email?: string;
  env?: "production" | "staging";
  source?: "manual" | "auto";
  kind?: BugHubKind;
  stack?: string;
  fingerprint?: string;
  where?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
};

export async function forwardToBugHub(
  payload: BugHubPayload,
  userAgent?: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const bugHubUrl = process.env.BUG_HUB_URL;
  const bugHubKey = process.env.BUG_HUB_PRODUCT_KEY;

  if (!bugHubUrl || !bugHubKey) {
    return { ok: false, status: 503, body: JSON.stringify({ error: "Bug Hub is not configured" }) };
  }

  const upstream = await fetch(`${bugHubUrl.replace(/\/$/, "")}/api/bugs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bugHubKey}`,
      "Content-Type": "application/json",
      "User-Agent": userAgent ?? "cfr-bug-proxy",
    },
    body: JSON.stringify({
      ...payload,
      env:
        payload.env ??
        (process.env.NODE_ENV === "production" ? "production" : "staging"),
      source: payload.source ?? "manual",
      kind: payload.kind ?? "bug",
    }),
  });

  const body = await upstream.text();
  return { ok: upstream.ok, status: upstream.status, body: body || "{}" };
}

export function reportServerError(
  err: unknown,
  req?: { originalUrl?: string; method?: string; headers?: { "user-agent"?: string } },
): void {
  const error = err instanceof Error ? err : new Error(String(err));
  void forwardToBugHub(
    {
      title: error.message.slice(0, 180) || "Server error",
      description: [
        error.message,
        req?.method && req?.originalUrl ? `Route: ${req.method} ${req.originalUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      page_url: req?.originalUrl
        ? `${process.env.PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.catholicfamilyrecord.com"}${req.originalUrl}`
        : undefined,
      source: "auto",
      stack: error.stack,
    },
    req?.headers?.["user-agent"],
  ).catch(() => undefined);
}
