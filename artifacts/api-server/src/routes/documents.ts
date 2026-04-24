import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  CreateDocumentBody, UpdateDocumentBody, GetDocumentParams, UpdateDocumentParams, DeleteDocumentParams, ListDocumentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDoc(d: typeof documentsTable.$inferSelect) {
  return { ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() };
}

router.get("/documents", async (req, res): Promise<void> => {
  const params = ListDocumentsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(documentsTable).$dynamic();
  const conditions = [];
  if (params.data.projectId) conditions.push(eq(documentsTable.projectId, params.data.projectId));
  if (params.data.type) conditions.push(eq(documentsTable.documentType, params.data.type));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const docs = await query.orderBy(documentsTable.createdAt);
  res.json(docs.map(serializeDoc));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [doc] = await db.insert(documentsTable).values(parsed.data).returning();
  res.status(201).json(serializeDoc(doc));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  res.json(serializeDoc(doc));
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [doc] = await db.update(documentsTable).set(data).where(eq(documentsTable.id, params.data.id)).returning();
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  res.json(serializeDoc(doc));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [d] = await db.delete(documentsTable).where(eq(documentsTable.id, params.data.id)).returning();
  if (!d) { res.status(404).json({ error: "Document not found" }); return; }
  res.sendStatus(204);
});

export default router;
