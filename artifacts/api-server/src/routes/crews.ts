import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, crewsTable, crewMembersTable, projectCrewMembersTable, insertCrewSchema, insertCrewMemberSchema, insertProjectCrewMemberSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const projectIdParam = z.object({ projectId: z.coerce.number().int().positive() });

// ====== Crews ======
router.get("/crews", async (_req, res): Promise<void> => {
  const rows = await db.select().from(crewsTable).orderBy(crewsTable.name);
  res.json(isoMany(rows));
});

router.post("/crews", async (req, res): Promise<void> => {
  const parsed = insertCrewSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(crewsTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.get("/crews/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [crew] = await db.select().from(crewsTable).where(eq(crewsTable.id, p.data.id));
  if (!crew) { res.status(404).json({ error: "Crew not found" }); return; }
  const members = await db.select().from(crewMembersTable).where(eq(crewMembersTable.crewId, p.data.id));
  res.json({ ...iso(crew), members: isoMany(members) });
});

router.patch("/crews/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertCrewSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(crewsTable).set(parsed.data).where(eq(crewsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Crew not found" }); return; }
  res.json(iso(row));
});

router.delete("/crews/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(crewsTable).where(eq(crewsTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Crew not found" }); return; }
  res.sendStatus(204);
});

// ====== Crew membership ======
router.post("/crews/:id/members", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertCrewMemberSchema.safeParse({ ...req.body, crewId: p.data.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(crewMembersTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.delete("/crew-members/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(crewMembersTable).where(eq(crewMembersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// ====== Project crew assignment with per-job pay ======
router.get("/projects/:projectId/crew", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db.select().from(projectCrewMembersTable).where(eq(projectCrewMembersTable.projectId, p.data.projectId));
  res.json(isoMany(rows));
});

router.post("/projects/:projectId/crew", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectCrewMemberSchema.safeParse({ ...req.body, projectId: p.data.projectId });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(projectCrewMembersTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/project-crew-members/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectCrewMemberSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.paidAt) data.paidAt = new Date(data.paidAt as string);
  const [row] = await db.update(projectCrewMembersTable).set(data).where(eq(projectCrewMembersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/project-crew-members/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(projectCrewMembersTable).where(eq(projectCrewMembersTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
