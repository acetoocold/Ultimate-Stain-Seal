import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { db, warrantiesTable, warrantyEventsTable, insertWarrantySchema, insertWarrantyEventSchema, remindersTable } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  warrantyType: z.string().optional(),
});

router.get("/warranties", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.customerId) conditions.push(eq(warrantiesTable.customerId, q.data.customerId));
  if (q.data.projectId) conditions.push(eq(warrantiesTable.projectId, q.data.projectId));
  if (q.data.status) conditions.push(eq(warrantiesTable.status, q.data.status));
  if (q.data.warrantyType) conditions.push(eq(warrantiesTable.warrantyType, q.data.warrantyType));
  let query = db.select().from(warrantiesTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(warrantiesTable.startDate);
  res.json(isoMany(rows));
});

router.post("/warranties", async (req, res): Promise<void> => {
  const parsed = insertWarrantySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  data.startDate = new Date(data.startDate as string);
  data.expiresAt = new Date(data.expiresAt as string);
  const [row] = await db.insert(warrantiesTable).values(data as typeof insertWarrantySchema._type).returning();
  res.status(201).json(iso(row));
});

router.get("/warranties/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [warranty] = await db.select().from(warrantiesTable).where(eq(warrantiesTable.id, p.data.id));
  if (!warranty) { res.status(404).json({ error: "Warranty not found" }); return; }
  const events = await db.select().from(warrantyEventsTable).where(eq(warrantyEventsTable.warrantyId, p.data.id)).orderBy(warrantyEventsTable.reportedAt);
  res.json({ ...iso(warranty), events: isoMany(events) });
});

router.patch("/warranties/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertWarrantySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.startDate) data.startDate = new Date(data.startDate as string);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt as string);
  const [row] = await db.update(warrantiesTable).set(data).where(eq(warrantiesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Warranty not found" }); return; }
  res.json(iso(row));
});

router.delete("/warranties/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(warrantiesTable).where(eq(warrantiesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Warranty not found" }); return; }
  res.sendStatus(204);
});

// Warranty events
router.post("/warranties/:id/events", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertWarrantyEventSchema.safeParse({ ...req.body, warrantyId: p.data.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.reportedAt) data.reportedAt = new Date(data.reportedAt as string);
  if (data.respondedAt) data.respondedAt = new Date(data.respondedAt as string);
  if (data.resolvedAt) data.resolvedAt = new Date(data.resolvedAt as string);
  const [row] = await db.insert(warrantyEventsTable).values(data as typeof insertWarrantyEventSchema._type).returning();
  // Auto-create a 48h response reminder when a claim is filed without a response.
  if (row.eventType === "claim_filed" && !row.respondedAt) {
    const due = new Date(row.reportedAt.getTime() + 48 * 60 * 60 * 1000);
    await db.insert(remindersTable).values({
      reminderType: "warranty_response",
      title: `Respond to warranty claim within 48h`,
      description: row.description ?? null,
      priority: "urgent",
      warrantyId: row.warrantyId,
      dueDate: due,
      source: "auto:warranty_claim_filed",
    });
  }
  res.status(201).json(iso(row));
});

router.get("/warranties/:id/events", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const events = await db.select().from(warrantyEventsTable).where(eq(warrantyEventsTable.warrantyId, p.data.id)).orderBy(warrantyEventsTable.reportedAt);
  res.json(isoMany(events));
});

router.patch("/warranty-events/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertWarrantyEventSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.reportedAt) data.reportedAt = new Date(data.reportedAt as string);
  if (data.respondedAt) data.respondedAt = new Date(data.respondedAt as string);
  if (data.resolvedAt) data.resolvedAt = new Date(data.resolvedAt as string);
  const [row] = await db.update(warrantyEventsTable).set(data).where(eq(warrantyEventsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  // If responded_at was just set, mark the response_hours and close any pending reminder.
  if (row.respondedAt && !row.responseHours) {
    const hours = Math.round((row.respondedAt.getTime() - row.reportedAt.getTime()) / (1000 * 60 * 60));
    await db.update(warrantyEventsTable).set({ responseHours: hours }).where(eq(warrantyEventsTable.id, row.id));
  }
  res.json(iso(row));
});

export default router;
