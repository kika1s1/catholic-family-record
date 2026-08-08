import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  createLead,
  getLeadById,
  getLeadStatuses,
  listLeads,
  updateLeadStatus,
} from "../services/leadService.js";
import { recordPageEvent } from "../services/analyticsService.js";

const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(120),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
});

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "scheduled", "closed", "archived"]),
});

export const leadsRouter = Router();

/** Public: landing page discovery form */
leadsRouter.post("/", (req, res) => {
  const parsed = createLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Please complete name, email, organization, and role.",
      details: parsed.error.flatten(),
    });
    return;
  }

  const lead = createLead({
    ...parsed.data,
    message: parsed.data.message || undefined,
    ip: req.ip,
    userAgent: req.get("user-agent") ?? null,
  });

  recordPageEvent("form_submit", "/#talk", {
    leadId: lead.id,
    role: lead.role,
  });

  res.status(201).json({
    ok: true,
    message: "Thank you. We will be in touch to arrange a session.",
    id: lead.id,
  });
});

/** Protected dashboard routes */
leadsRouter.get("/", requireAuth, (req, res) => {
  const result = listLeads({
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    role: typeof req.query.role === "string" ? req.query.role : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    limit: req.query.limit ? Number(req.query.limit) : 50,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  res.json(result);
});

leadsRouter.get("/statuses", requireAuth, (_req, res) => {
  res.json({ statuses: getLeadStatuses() });
});

leadsRouter.get("/:id", requireAuth, (req, res) => {
  const id = String(req.params.id);
  const lead = getLeadById(id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json({ lead });
});

leadsRouter.patch("/:id/status", requireAuth, (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  try {
    const lead = updateLeadStatus(String(req.params.id), parsed.data.status);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json({ lead });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Unable to update status",
    });
  }
});
