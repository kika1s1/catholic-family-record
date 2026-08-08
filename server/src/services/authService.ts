import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, type UserRow } from "../db/index.js";
import { env } from "../utils/env.js";
import { createId } from "../utils/id.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

const COOKIE_NAME = "cfr_session";
const TOKEN_TTL = "7d";

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function ensureAdminUser(): AuthUser {
  const existing = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(env.adminEmail) as UserRow | undefined;

  if (existing) {
    return toAuthUser(existing);
  }

  const id = createId();
  const passwordHash = bcrypt.hashSync(env.adminPassword, 12);
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, env.adminEmail, "CFR Admin", passwordHash, "admin");

  return {
    id,
    email: env.adminEmail,
    name: "CFR Admin",
    role: "admin",
  };
}

export function authenticate(email: string, password: string): AuthUser | null {
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as UserRow | undefined;

  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return toAuthUser(user);
}

export function signToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(payload.sub) as UserRow | undefined;
    return user ? toAuthUser(user) : null;
  } catch {
    return null;
  }
}

export function getUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function updateUserName(id: string, name: string): AuthUser {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Name is required");
  }
  if (trimmed.length > 120) {
    throw new Error("Name must be 120 characters or fewer");
  }

  const existing = getUserById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(trimmed, id);
  return toAuthUser(getUserById(id)!);
}

export function changeUserPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
): void {
  const existing = getUserById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  if (!bcrypt.compareSync(currentPassword, existing.password_hash)) {
    throw new Error("Current password is incorrect");
  }

  if (newPassword.length < 12) {
    throw new Error("New password must be at least 12 characters");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from the current password");
  }

  const passwordHash = bcrypt.hashSync(newPassword, 12);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    passwordHash,
    id,
  );
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}
