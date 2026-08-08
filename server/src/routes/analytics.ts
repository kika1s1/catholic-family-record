import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  getDashboardAnalytics,
  recordPageEvent,
} from "../services/analyticsService.js";

const eventSchema = z.object({
  eventType: z.enum(["page_view", "form_start", "section_view", "cta_click"]),
  path: z.string().min(1).max(300),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const analyticsRouter = Router();

/** Public lightweight telemetry from landing page */
analyticsRouter.post("/events", (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid event" });
    return;
  }

  recordPageEvent(parsed.data.eventType, parsed.data.path, parsed.data.meta);
  res.status(201).json({ ok: true });
});

analyticsRouter.get("/dashboard", requireAuth, (_req, res) => {
  res.json(getDashboardAnalytics());
});
