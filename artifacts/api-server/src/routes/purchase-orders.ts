import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { db, purchaseOrdersTable, purchaseOrderLinesTable, insertPurchaseOrderSchema, insertPurchaseOrderLineSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  tankId: z.coerce.number().int().positive().optional(),
});

router.get("/purchase-orders", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.status) conditions.push(eq(purchaseOrdersTable.status, q.data.status));
  if (q.data.source) conditions.push(eq(purchaseOrdersTable.source, q.data.source));
  if (q.data.tankId) conditions.push(eq(purchaseOrdersTable.tankId, q.data.tankId));
  let query = db.select().from(purchaseOrdersTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(purchaseOrdersTable.createdAt);
  res.json(isoMany(rows));
});

router.post("/purchase-orders", async (req, res): Promise<void> => {
  const parsed = insertPurchaseOrderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.expectedDeliveryAt) data.expectedDeliveryAt = new Date(data.expectedDeliveryAt as string);
  if (data.receivedAt) data.receivedAt = new Date(data.receivedAt as string);
  const [row] = await db.insert(purchaseOrdersTable).values(data as typeof insertPurchaseOrderSchema._type).returning();
  res.status(201).json(iso(row));
});

router.get("/purchase-orders/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [po] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, p.data.id));
  if (!po) { res.status(404).json({ error: "Purchase order not found" }); return; }
  const lines = await db.select().from(purchaseOrderLinesTable).where(eq(purchaseOrderLinesTable.purchaseOrderId, p.data.id));
  res.json({ ...iso(po), lines: isoMany(lines) });
});

router.patch("/purchase-orders/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertPurchaseOrderSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.expectedDeliveryAt) data.expectedDeliveryAt = new Date(data.expectedDeliveryAt as string);
  if (data.receivedAt) data.receivedAt = new Date(data.receivedAt as string);
  const [row] = await db.update(purchaseOrdersTable).set(data).where(eq(purchaseOrdersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/purchase-orders/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/purchase-orders/:id/lines", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertPurchaseOrderLineSchema.safeParse({ ...req.body, purchaseOrderId: p.data.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(purchaseOrderLinesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/purchase-order-lines/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertPurchaseOrderLineSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(purchaseOrderLinesTable).set(parsed.data).where(eq(purchaseOrderLinesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/purchase-order-lines/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(purchaseOrderLinesTable).where(eq(purchaseOrderLinesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
