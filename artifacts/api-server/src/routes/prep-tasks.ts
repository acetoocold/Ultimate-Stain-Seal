import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, prepTasksTable, projectPrepTable, insertPrepTaskSchema, insertProjectPrepSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const projectIdParam = z.object({ projectId: z.coerce.number().int().positive() });

router.get("/prep-tasks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(prepTasksTable).orderBy(prepTasksTable.name);
  res.json(isoMany(rows));
});

router.post("/prep-tasks", async (req, res): Promise<void> => {
  const parsed = insertPrepTaskSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(prepTasksTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/prep-tasks/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertPrepTaskSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(prepTasksTable).set(parsed.data).where(eq(prepTasksTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/prep-tasks/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(prepTasksTable).where(eq(prepTasksTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.get("/projects/:projectId/prep", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db.select().from(projectPrepTable).where(eq(projectPrepTable.projectId, p.data.projectId));
  res.json(isoMany(rows));
});

router.post("/projects/:projectId/prep", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectPrepSchema.safeParse({ ...req.body, projectId: p.data.projectId });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(projectPrepTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/project-prep/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectPrepSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(projectPrepTable).set(parsed.data).where(eq(projectPrepTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/project-prep/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(projectPrepTable).where(eq(projectPrepTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
