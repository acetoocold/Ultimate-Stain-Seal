import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, tanksTable, tankEventsTable, insertTankSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";
import { recordTankEvent, checkTankRefill } from "../lib/triggers";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });

router.get("/tanks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tanksTable).orderBy(tanksTable.label);
  res.json(isoMany(rows));
});

router.post("/tanks", async (req, res): Promise<void> => {
  const parsed = insertTankSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(tanksTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.get("/tanks/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [tank] = await db.select().from(tanksTable).where(eq(tanksTable.id, p.data.id));
  if (!tank) { res.status(404).json({ error: "Tank not found" }); return; }
  const events = await db.select().from(tankEventsTable).where(eq(tankEventsTable.tankId, p.data.id)).orderBy(tankEventsTable.occurredAt);
  res.json({ ...iso(tank), events: isoMany(events) });
});

router.patch("/tanks/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertTankSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(tanksTable).set(parsed.data).where(eq(tanksTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Tank not found" }); return; }
  // T3: re-check refill threshold whenever a tank is touched.
  await checkTankRefill(p.data.id).catch(() => {});
  res.json(iso(row));
});

router.delete("/tanks/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(tanksTable).where(eq(tanksTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Tank not found" }); return; }
  res.sendStatus(204);
});

const tankEventBody = z.object({
  eventType: z.enum(["refill", "usage", "color_change", "mix_adjusted", "gas_level_change", "inspection"]),
  gallonsBefore: z.number().nullish(),
  gallonsAfter: z.number().nullish(),
  colorBefore: z.string().nullish(),
  colorAfter: z.string().nullish(),
  gasBefore: z.string().nullish(),
  gasAfter: z.string().nullish(),
  projectId: z.number().int().positive().nullish(),
  recordedById: z.number().int().positive().nullish(),
  notes: z.string().nullish(),
});

router.post("/tanks/:id/events", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = tankEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const result = await recordTankEvent({ tankId: p.data.id, ...parsed.data });
  res.status(201).json({
    event: iso(result.event),
    refillTriggered: !!result.refill.reminder || !!result.refill.purchaseOrder,
    reminder: result.refill.reminder ? iso(result.refill.reminder) : null,
    purchaseOrder: result.refill.purchaseOrder ? iso(result.refill.purchaseOrder) : null,
  });
});

router.get("/tanks/:id/events", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db.select().from(tankEventsTable).where(eq(tankEventsTable.tankId, p.data.id)).orderBy(tankEventsTable.occurredAt);
  res.json(isoMany(rows));
});

export default router;
