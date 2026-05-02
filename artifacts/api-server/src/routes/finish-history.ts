import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, finishHistoryTable, insertFinishHistorySchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const propertyIdParam = z.object({ propertyId: z.coerce.number().int().positive() });

router.get("/properties/:propertyId/finish-history", async (req, res): Promise<void> => {
  const p = propertyIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db
    .select()
    .from(finishHistoryTable)
    .where(eq(finishHistoryTable.propertyId, p.data.propertyId))
    .orderBy(desc(finishHistoryTable.appliedAt));
  res.json(isoMany(rows));
});

router.post("/properties/:propertyId/finish-history", async (req, res): Promise<void> => {
  const p = propertyIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertFinishHistorySchema.safeParse({ ...req.body, propertyId: p.data.propertyId });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.appliedAt) data.appliedAt = new Date(data.appliedAt as string);
  const [row] = await db.insert(finishHistoryTable).values(data as typeof insertFinishHistorySchema._type).returning();
  res.status(201).json(iso(row));
});

router.patch("/finish-history/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertFinishHistorySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.appliedAt) data.appliedAt = new Date(data.appliedAt as string);
  const [row] = await db.update(finishHistoryTable).set(data).where(eq(finishHistoryTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/finish-history/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(finishHistoryTable).where(eq(finishHistoryTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
