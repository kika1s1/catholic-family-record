import { db } from "../db/index.js";
import { createId } from "../utils/id.js";

export function recordPageEvent(
  eventType: string,
  path: string,
  meta?: Record<string, unknown>,
): void {
  db.prepare(
    `INSERT INTO page_events (id, event_type, path, meta) VALUES (?, ?, ?, ?)`,
  ).run(createId(), eventType, path, meta ? JSON.stringify(meta) : null);
}

export function getDashboardAnalytics() {
  const totals = db
    .prepare(
      `SELECT
         COUNT(*) as totalLeads,
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newLeads,
         SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
         SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
         SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
         SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as last7Days,
         SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as last30Days
       FROM leads`,
    )
    .get() as Record<string, number>;

  const byRole = db
    .prepare(
      `SELECT role as name, COUNT(*) as value
       FROM leads
       GROUP BY role
       ORDER BY value DESC`,
    )
    .all() as Array<{ name: string; value: number }>;

  const byStatus = db
    .prepare(
      `SELECT status as name, COUNT(*) as value
       FROM leads
       GROUP BY status
       ORDER BY value DESC`,
    )
    .all() as Array<{ name: string; value: number }>;

  const byDay = db
    .prepare(
      `SELECT date(created_at) as date, COUNT(*) as count
       FROM leads
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY date(created_at)
       ORDER BY date ASC`,
    )
    .all() as Array<{ date: string; count: number }>;

  const byOrganization = db
    .prepare(
      `SELECT organization as name, COUNT(*) as value
       FROM leads
       GROUP BY organization
       ORDER BY value DESC
       LIMIT 10`,
    )
    .all() as Array<{ name: string; value: number }>;

  const recentLeads = db
    .prepare(
      `SELECT id, name, email, organization, role, status, message, created_at
       FROM leads
       ORDER BY datetime(created_at) DESC
       LIMIT 8`,
    )
    .all();

  const funnel = [
    { stage: "New", count: totals.newLeads ?? 0 },
    { stage: "Contacted", count: totals.contacted ?? 0 },
    { stage: "Qualified", count: totals.qualified ?? 0 },
    { stage: "Scheduled", count: totals.scheduled ?? 0 },
    { stage: "Closed", count: totals.closed ?? 0 },
  ];

  const pageViews = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM page_events WHERE event_type = 'page_view'`,
      )
      .get() as { c: number }
  ).c;

  const formStarts = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM page_events WHERE event_type = 'form_start'`,
      )
      .get() as { c: number }
  ).c;

  const conversionRate =
    pageViews > 0 ? Number((((totals.totalLeads ?? 0) / pageViews) * 100).toFixed(1)) : 0;

  return {
    kpis: {
      totalLeads: totals.totalLeads ?? 0,
      newLeads: totals.newLeads ?? 0,
      last7Days: totals.last7Days ?? 0,
      last30Days: totals.last30Days ?? 0,
      pageViews,
      formStarts,
      conversionRate,
      scheduled: totals.scheduled ?? 0,
    },
    byRole,
    byStatus,
    byDay,
    byOrganization,
    funnel,
    recentLeads,
  };
}
