import { Router, type IRouter } from "express";
import { eq, and, desc, asc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, remindersTable, insertReminderSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";
import { sweepWarrantyResponses } from "../lib/triggers";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  reminderType: z.string().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  isCompleted: z.coerce.boolean().optional(),
  assignedToId: z.coerce.number().int().positive().optional(),
});

router.get("/reminders", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.reminderType) conditions.push(eq(remindersTable.reminderType, q.data.reminderType));
  if (q.data.customerId) conditions.push(eq(remindersTable.customerId, q.data.customerId));
  if (q.data.projectId) conditions.push(eq(remindersTable.projectId, q.data.projectId));
  if (q.data.isCompleted !== undefined) conditions.push(eq(remindersTable.isCompleted, q.data.isCompleted));
  if (q.data.assignedToId) conditions.push(eq(remindersTable.assignedToId, q.data.assignedToId));
  let query = db.select().from(remindersTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(asc(remindersTable.dueDate), desc(remindersTable.createdAt));
  res.json(isoMany(rows));
});

router.post("/reminders", async (req, res): Promise<void> => {
  const parsed = insertReminderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = {
    ...parsed.data,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate as unknown as string) : null,
  };
  const [row] = await db.insert(remindersTable).values(data).returning();
  res.status(201).json(iso(row));
});

router.get("/reminders/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(remindersTable).where(eq(remindersTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Reminder not found" }); return; }
  res.json(iso(row));
});

router.patch("/reminders/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertReminderSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.dueDate) data.dueDate = new Date(data.dueDate as string);
  const [row] = await db.update(remindersTable).set(data).where(eq(remindersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Reminder not found" }); return; }
  res.json(iso(row));
});

router.post("/reminders/:id/complete", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const body = z.object({ completedById: z.number().int().positive().optional(), nextStepNotes: z.string().optional() }).safeParse(req.body ?? {});
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [row] = await db
    .update(remindersTable)
    .set({
      isCompleted: true,
      completedAt: new Date(),
      completedById: body.data.completedById ?? null,
      nextStepNotes: body.data.nextStepNotes ?? null,
    })
    .where(eq(remindersTable.id, p.data.id))
    .returning();
  if (!row) { res.status(404).json({ error: "Reminder not found" }); return; }
  res.json(iso(row));
});

router.delete("/reminders/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(remindersTable).where(eq(remindersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Reminder not found" }); return; }
  res.sendStatus(204);
});

router.post("/reminders/sweep-warranty-responses", async (_req, res): Promise<void> => {
  const count = await sweepWarrantyResponses();
  res.json({ created: count });
});

export default router;
