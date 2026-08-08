import { db, type LeadRow, type LeadStatus } from "../db/index.js";
import { createId } from "../utils/id.js";

export type CreateLeadInput = {
  name: string;
  email: string;
  organization: string;
  role: string;
  message?: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type LeadFilters = {
  status?: string;
  role?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

const VALID_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "scheduled",
  "closed",
  "archived",
];

export function createLead(input: CreateLeadInput): LeadRow {
  const id = createId();
  db.prepare(
    `INSERT INTO leads (id, name, email, organization, role, message, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name.trim(),
    input.email.trim().toLowerCase(),
    input.organization.trim(),
    input.role.trim(),
    input.message?.trim() || null,
    input.ip ?? null,
    input.userAgent ?? null,
  );

  return getLeadById(id)!;
}

export function getLeadById(id: string): LeadRow | undefined {
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined;
}

export function listLeads(filters: LeadFilters = {}): { items: LeadRow[]; total: number } {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.role) {
    where.push("role = ?");
    params.push(filters.role);
  }
  if (filters.q) {
    where.push(
      "(name LIKE ? OR email LIKE ? OR organization LIKE ? OR message LIKE ?)",
    );
    const like = `%${filters.q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM leads ${whereSql}`).get(...params) as {
      c: number;
    }
  ).c;

  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = filters.offset ?? 0;

  const items = db
    .prepare(
      `SELECT * FROM leads ${whereSql}
       ORDER BY datetime(created_at) DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as LeadRow[];

  return { items, total };
}

export function updateLeadStatus(id: string, status: string): LeadRow | undefined {
  if (!VALID_STATUSES.includes(status as LeadStatus)) {
    throw new Error("Invalid status");
  }

  db.prepare(
    `UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(status, id);

  return getLeadById(id);
}

export function getLeadStatuses(): LeadStatus[] {
  return VALID_STATUSES;
}
