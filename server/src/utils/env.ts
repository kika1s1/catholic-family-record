import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnv() {
  const jwtSecret = required(
    "JWT_SECRET",
    isProd ? undefined : "dev-only-jwt-secret-change-me",
  );
  const adminPassword = required(
    "ADMIN_PASSWORD",
    isProd ? undefined : "change-me-locally",
  );

  if (isProd) {
    if (jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }
    if (adminPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters in production");
    }
    if (
      jwtSecret.includes("dev") ||
      jwtSecret.includes("change-me") ||
      adminPassword.includes("change-me")
    ) {
      throw new Error("Replace placeholder JWT_SECRET / ADMIN_PASSWORD before production");
    }
  }

  const cookieSecureEnv = process.env.COOKIE_SECURE;
  const cookieSecure =
    cookieSecureEnv === "true"
      ? true
      : cookieSecureEnv === "false"
        ? false
        : isProd;

  const clientOriginRaw = required(
    "CLIENT_ORIGIN",
    isProd ? undefined : "http://localhost:5173",
  );
  const clientOrigins = clientOriginRaw
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (!clientOrigins.length) {
    throw new Error("CLIENT_ORIGIN must include at least one origin");
  }

  return {
    port: Number(process.env.PORT ?? 4000),
    /** Primary origin (first entry) */
    clientOrigin: clientOrigins[0],
    /** All allowed CORS origins (comma-separated CLIENT_ORIGIN) */
    clientOrigins,
    jwtSecret,
    adminEmail: required("ADMIN_EMAIL", "admin@example.com"),
    adminPassword,
    nodeEnv: process.env.NODE_ENV ?? "development",
    isProd,
    /** Set COOKIE_SECURE=false for plain HTTP; true behind HTTPS */
    cookieSecure,
  };
}

export const env = loadEnv();
