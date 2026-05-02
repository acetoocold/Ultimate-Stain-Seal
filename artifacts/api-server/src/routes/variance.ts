import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, varianceEventsTable, materialCoverageProfilesTable } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";
import { recordProjectVariance } from "../lib/triggers";

const router: IRouter = Router();
const projectIdParam = z.object({ projectId: z.coerce.number().int().positive() });
const listQuery = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  thresholdExceeded: z.coerce.boolean().optional(),
});

router.get("/variance-events", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.projectId) conditions.push(eq(varianceEventsTable.projectId, q.data.projectId));
  if (q.data.thresholdExceeded !== undefined) conditions.push(eq(varianceEventsTable.thresholdExceeded, q.data.thresholdExceeded));
  let query = db.select().from(varianceEventsTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(desc(varianceEventsTable.occurredAt));
  res.json(isoMany(rows));
});

// Manual reconciliation: run T2 for a project (after the crew has logged actuals).
router.post("/projects/:projectId/run-variance", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const opts = z.object({ crewId: z.number().int().positive().optional(), woodType: z.string().optional() }).safeParse(req.body ?? {});
  const events = await recordProjectVariance(p.data.projectId, opts.success ? opts.data : {});
  res.json({ created: events.length, events: isoMany(events) });
});

router.get("/material-coverage-profiles", async (_req, res): Promise<void> => {
  const rows = await db.select().from(materialCoverageProfilesTable);
  res.json(isoMany(rows));
});

export default router;
