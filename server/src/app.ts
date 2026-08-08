import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./utils/env.js";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { analyticsRouter } from "./routes/analytics.js";
import { ensureAdminUser } from "./services/authService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  ensureAdminUser();

  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(morgan(env.isProd ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "cfr-api", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/leads", leadsRouter);
  app.use("/api/analytics", analyticsRouter);

  if (env.isProd) {
    const clientDist = path.resolve(__dirname, "../../client/dist");
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (req, res, next) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
