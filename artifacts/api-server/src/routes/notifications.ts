import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, notificationsTable, insertNotificationSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  recipientRole: z.string().optional(),
  recipientUserId: z.coerce.number().int().positive().optional(),
  isRead: z.coerce.boolean().optional(),
  notificationType: z.string().optional(),
  projectId: z.coerce.number().int().positive().optional(),
});

router.get("/notifications", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.recipientRole) conditions.push(eq(notificationsTable.recipientRole, q.data.recipientRole));
  if (q.data.recipientUserId) conditions.push(eq(notificationsTable.recipientUserId, q.data.recipientUserId));
  if (q.data.isRead !== undefined) conditions.push(eq(notificationsTable.isRead, q.data.isRead));
  if (q.data.notificationType) conditions.push(eq(notificationsTable.notificationType, q.data.notificationType));
  if (q.data.projectId) conditions.push(eq(notificationsTable.projectId, q.data.projectId));
  let query = db.select().from(notificationsTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(desc(notificationsTable.createdAt));
  res.json(isoMany(rows));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = insertNotificationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(notificationsTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db
    .update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notificationsTable.id, p.data.id))
    .returning();
  if (!row) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(iso(row));
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(notificationsTable).where(eq(notificationsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Notification not found" }); return; }
  res.sendStatus(204);
});

export default router;
