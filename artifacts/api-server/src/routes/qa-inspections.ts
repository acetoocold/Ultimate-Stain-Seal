import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { db, qaInspectionsTable, insertQaInspectionSchema, projectsTable } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";
import { onProjectCompleted } from "../lib/triggers";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  overallResult: z.string().optional(),
});

router.get("/qa-inspections", async (req, res): Promise<void> => {
  const q = listQuery.safeParse(req.query);
  if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
  const conditions = [];
  if (q.data.projectId) conditions.push(eq(qaInspectionsTable.projectId, q.data.projectId));
  if (q.data.overallResult) conditions.push(eq(qaInspectionsTable.overallResult, q.data.overallResult));
  let query = db.select().from(qaInspectionsTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(qaInspectionsTable.inspectedAt);
  res.json(isoMany(rows));
});

router.post("/qa-inspections", async (req, res): Promise<void> => {
  const parsed = insertQaInspectionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.inspectedAt) data.inspectedAt = new Date(data.inspectedAt as string);
  if (data.signOffAt) data.signOffAt = new Date(data.signOffAt as string);
  if (data.invoiceDeliveredAt) data.invoiceDeliveredAt = new Date(data.invoiceDeliveredAt as string);
  const [row] = await db.insert(qaInspectionsTable).values(data as typeof insertQaInspectionSchema._type).returning();
  // If inspection passed and the project isn't yet completed, advance it — this fires T1+T2.
  if (row.overallResult === "pass" && row.customerSignOff) {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, row.projectId));
    if (project && project.status !== "completed") {
      await db
        .update(projectsTable)
        .set({ status: "completed", completedDate: project.completedDate ?? new Date() })
        .where(eq(projectsTable.id, project.id));
      await onProjectCompleted(project.id).catch(() => {});
    }
  }
  res.status(201).json(iso(row));
});

router.get("/qa-inspections/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(qaInspectionsTable).where(eq(qaInspectionsTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "QA inspection not found" }); return; }
  res.json(iso(row));
});

router.patch("/qa-inspections/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertQaInspectionSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.inspectedAt) data.inspectedAt = new Date(data.inspectedAt as string);
  if (data.signOffAt) data.signOffAt = new Date(data.signOffAt as string);
  if (data.invoiceDeliveredAt) data.invoiceDeliveredAt = new Date(data.invoiceDeliveredAt as string);
  const [row] = await db.update(qaInspectionsTable).set(data).where(eq(qaInspectionsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "QA inspection not found" }); return; }
  res.json(iso(row));
});

router.delete("/qa-inspections/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(qaInspectionsTable).where(eq(qaInspectionsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "QA inspection not found" }); return; }
  res.sendStatus(204);
});

export default router;
