import { Router } from "express";
import { z } from "zod";
import { forwardToBugHub } from "../services/bugHub.js";

const bodySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(20_000),
  page_url: z.string().url().optional().or(z.literal("")),
  user_email: z.string().email().optional().or(z.literal("")),
  env: z.enum(["production", "staging"]).optional(),
  source: z.enum(["manual", "auto"]).optional(),
  kind: z.enum(["bug", "feature", "training", "feedback"]).optional(),
  stack: z.string().max(50_000).optional().or(z.literal("")),
  fingerprint: z.string().max(64).optional().or(z.literal("")),
  where: z
    .object({
      file: z.string().optional(),
      line: z.number().optional(),
      column: z.number().optional(),
      function: z.string().optional(),
    })
    .optional(),
});

export const bugReportsRouter = Router();

bugReportsRouter.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  const result = await forwardToBugHub(parsed.data, req.get("user-agent") ?? undefined);
  res.status(result.status).type("json").send(result.body);
});
