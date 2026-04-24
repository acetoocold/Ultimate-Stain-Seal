import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, activityTable } from "@workspace/db";
import {
  CreateActivityBody, ListActivityQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const params = ListActivityQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(activityTable).$dynamic();
  const conditions = [];
  if (params.data.projectId) conditions.push(eq(activityTable.projectId, params.data.projectId));
  if (params.data.customerId) conditions.push(eq(activityTable.customerId, params.data.customerId));
  if (params.data.userId) conditions.push(eq(activityTable.userId, params.data.userId));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const limit = params.data.limit ? parseInt(params.data.limit.toString(), 10) : 50;
  const entries = await query.orderBy(desc(activityTable.createdAt)).limit(limit);
  res.json(entries.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/activity", async (req, res): Promise<void> => {
  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [entry] = await db.insert(activityTable).values(parsed.data).returning();
  res.status(201).json({ ...entry, createdAt: entry.createdAt.toISOString() });
});

export default router;
