import { Router } from "express";
import { z } from "zod";
import { env } from "../utils/env.js";
import {
  authenticate,
  changeUserPassword,
  getSessionCookieName,
  signToken,
  updateUserName,
  type AuthUser,
} from "../services/authService.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(200),
  confirmPassword: z.string().min(1),
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

authRouter.patch("/profile", requireAuth, (req: AuthedRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid display name (1–120 characters)." });
    return;
  }

  try {
    const user = updateUserName(req.user!.id, parsed.data.name);
    res.json({ user });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Unable to update profile",
    });
  }
});

authRouter.patch("/password", requireAuth, (req: AuthedRequest, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "New password must be at least 12 characters.",
    });
    return;
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    res.status(400).json({ error: "New password and confirmation do not match." });
    return;
  }

  try {
    changeUserPassword(
      req.user!.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    res.json({ ok: true, message: "Password updated." });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to change password";
    const status = message.includes("incorrect") ? 401 : 400;
    res.status(status).json({ error: message });
  }
});
