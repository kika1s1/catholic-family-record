import type { NextFunction, Request, Response } from "express";
import {
  getSessionCookieName,
  verifyToken,
  type AuthUser,
} from "../services/authService.js";

export type AuthedRequest = Request & { user?: AuthUser };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[getSessionCookieName()] as string | undefined;
  const header = req.headers.authorization;
  const bearer =
    header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  const token = cookieToken || bearer;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  req.user = user;
  next();
}
