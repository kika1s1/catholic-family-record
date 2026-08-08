import { Router } from "express";
import { z } from "zod";
import { env } from "../utils/env.js";
import {
  authenticate,
  getSessionCookieName,
  signToken,
  type AuthUser,
} from "../services/authService.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password payload" });
    return;
  }

  const user = authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user);
  res.cookie(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(getSessionCookieName(), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
  });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user as AuthUser });
});
