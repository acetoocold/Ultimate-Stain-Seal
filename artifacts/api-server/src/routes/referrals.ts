import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { db, referralsTable, partnerSourcesTable, insertReferralSchema, insertPartnerSourceSchema, remindersTable } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  contactStatus: z.string().optional(),
  interestStatus: z.string().optional(),
  source: z.string().optional(),
});

// ====== Referrals ======
router.get("/referrals", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.contactStatus) conditions.push(eq(referralsTable.contactStatus, q.data.contactStatus));
  if (q.data.interestStatus) conditions.push(eq(referralsTable.interestStatus, q.data.interestStatus));
  if (q.data.source) conditions.push(eq(referralsTable.source, q.data.source));
  let query = db.select().from(referralsTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(referralsTable.createdAt);
  res.json(isoMany(rows));
});

router.post("/referrals", async (req, res): Promise<void> => {
  const parsed = insertReferralSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.contactedAt) data.contactedAt = new Date(data.contactedAt as string);
  if (data.nextCallAt) data.nextCallAt = new Date(data.nextCallAt as string);
  const [row] = await db.insert(referralsTable).values(data).returning();
  // Auto-create a follow-up reminder if next-call is set
  if (row.nextCallAt && row.nextCallNeeded) {
    await db.insert(remindersTable).values({
      reminderType: "referral_followup",
      title: `Follow up on referral lead ${row.leadFirstName ?? ""} ${row.leadLastName ?? ""}`.trim(),
      description: row.notes ?? null,
      priority: "medium",
      referralId: row.id,
      assignedToId: row.contactedById ?? null,
      dueDate: row.nextCallAt,
      source: "auto:referral_created",
    });
  }
  res.status(201).json(iso(row));
});

router.get("/referrals/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(referralsTable).where(eq(referralsTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Referral not found" }); return; }
  res.json(iso(row));
});

router.patch("/referrals/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertReferralSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.contactedAt) data.contactedAt = new Date(data.contactedAt as string);
  if (data.nextCallAt) data.nextCallAt = new Date(data.nextCallAt as string);
  const [row] = await db.update(referralsTable).set(data).where(eq(referralsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Referral not found" }); return; }
  res.json(iso(row));
});

router.delete("/referrals/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(referralsTable).where(eq(referralsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Referral not found" }); return; }
  res.sendStatus(204);
});

// ====== Partner Sources ======
router.get("/partner-sources", async (_req, res): Promise<void> => {
  const rows = await db.select().from(partnerSourcesTable).orderBy(partnerSourcesTable.name);
  res.json(isoMany(rows));
});

router.post("/partner-sources", async (req, res): Promise<void> => {
  const parsed = insertPartnerSourceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(partnerSourcesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/partner-sources/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertPartnerSourceSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(partnerSourcesTable).set(parsed.data).where(eq(partnerSourcesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/partner-sources/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(partnerSourcesTable).where(eq(partnerSourcesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
