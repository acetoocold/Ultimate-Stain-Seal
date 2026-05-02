import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, fixturesTable, projectFixturesTable, insertFixtureSchema, insertProjectFixtureSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const projectIdParam = z.object({ projectId: z.coerce.number().int().positive() });

router.get("/fixtures", async (_req, res): Promise<void> => {
  const rows = await db.select().from(fixturesTable).orderBy(fixturesTable.name);
  res.json(isoMany(rows));
});

router.post("/fixtures", async (req, res): Promise<void> => {
  const parsed = insertFixtureSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(fixturesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.get("/fixtures/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(fixturesTable).where(eq(fixturesTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Fixture not found" }); return; }
  res.json(iso(row));
});

router.patch("/fixtures/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertFixtureSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(fixturesTable).set(parsed.data).where(eq(fixturesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Fixture not found" }); return; }
  res.json(iso(row));
});

router.delete("/fixtures/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(fixturesTable).where(eq(fixturesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Fixture not found" }); return; }
  res.sendStatus(204);
});

router.get("/projects/:projectId/fixtures", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db.select().from(projectFixturesTable).where(eq(projectFixturesTable.projectId, p.data.projectId));
  res.json(isoMany(rows));
});

router.post("/projects/:projectId/fixtures", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectFixtureSchema.safeParse({ ...req.body, projectId: p.data.projectId });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(projectFixturesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/project-fixtures/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectFixtureSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(projectFixturesTable).set(parsed.data).where(eq(projectFixturesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/project-fixtures/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(projectFixturesTable).where(eq(projectFixturesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
