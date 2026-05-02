import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { db, complianceDocumentsTable, insertComplianceDocumentSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  docType: z.string().optional(),
  serviceCode: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

router.get("/compliance-documents", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.docType) conditions.push(eq(complianceDocumentsTable.docType, q.data.docType));
  if (q.data.serviceCode) conditions.push(eq(complianceDocumentsTable.serviceCode, q.data.serviceCode));
  if (q.data.isActive !== undefined) conditions.push(eq(complianceDocumentsTable.isActive, q.data.isActive));
  let query = db.select().from(complianceDocumentsTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(complianceDocumentsTable.title);
  res.json(isoMany(rows));
});

router.post("/compliance-documents", async (req, res): Promise<void> => {
  const parsed = insertComplianceDocumentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.effectiveAt) data.effectiveAt = new Date(data.effectiveAt as string);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt as string);
  const [row] = await db.insert(complianceDocumentsTable).values(data as typeof insertComplianceDocumentSchema._type).returning();
  res.status(201).json(iso(row));
});

router.patch("/compliance-documents/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertComplianceDocumentSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.effectiveAt) data.effectiveAt = new Date(data.effectiveAt as string);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt as string);
  const [row] = await db.update(complianceDocumentsTable).set(data).where(eq(complianceDocumentsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/compliance-documents/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(complianceDocumentsTable).where(eq(complianceDocumentsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
