import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, liabilitiesTable, projectLiabilitiesTable, insertLiabilitySchema, insertProjectLiabilitySchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const projectIdParam = z.object({ projectId: z.coerce.number().int().positive() });

router.get("/liabilities", async (_req, res): Promise<void> => {
  const rows = await db.select().from(liabilitiesTable).orderBy(liabilitiesTable.name);
  res.json(isoMany(rows));
});

router.post("/liabilities", async (req, res): Promise<void> => {
  const parsed = insertLiabilitySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(liabilitiesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.get("/liabilities/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(liabilitiesTable).where(eq(liabilitiesTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Liability not found" }); return; }
  res.json(iso(row));
});

router.patch("/liabilities/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertLiabilitySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(liabilitiesTable).set(parsed.data).where(eq(liabilitiesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Liability not found" }); return; }
  res.json(iso(row));
});

router.delete("/liabilities/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(liabilitiesTable).where(eq(liabilitiesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Liability not found" }); return; }
  res.sendStatus(204);
});

// Project ↔ liability assignments
router.get("/projects/:projectId/liabilities", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db.select().from(projectLiabilitiesTable).where(eq(projectLiabilitiesTable.projectId, p.data.projectId));
  res.json(isoMany(rows));
});

router.post("/projects/:projectId/liabilities", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectLiabilitySchema.safeParse({ ...req.body, projectId: p.data.projectId });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(projectLiabilitiesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/project-liabilities/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectLiabilitySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(projectLiabilitiesTable).set(parsed.data).where(eq(projectLiabilitiesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/project-liabilities/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(projectLiabilitiesTable).where(eq(projectLiabilitiesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
