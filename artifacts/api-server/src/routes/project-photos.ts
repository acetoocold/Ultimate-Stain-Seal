import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, projectPhotosTable, insertProjectPhotoSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const projectIdParam = z.object({ projectId: z.coerce.number().int().positive() });

router.get("/projects/:projectId/photos", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const rows = await db.select().from(projectPhotosTable).where(eq(projectPhotosTable.projectId, p.data.projectId));
  res.json(isoMany(rows));
});

router.post("/projects/:projectId/photos", async (req, res): Promise<void> => {
  const p = projectIdParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectPhotoSchema.safeParse({ ...req.body, projectId: p.data.projectId });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.takenAt) data.takenAt = new Date(data.takenAt as string);
  const [row] = await db.insert(projectPhotosTable).values(data as typeof insertProjectPhotoSchema._type).returning();
  res.status(201).json(iso(row));
});

router.patch("/project-photos/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertProjectPhotoSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.takenAt) data.takenAt = new Date(data.takenAt as string);
  const [row] = await db.update(projectPhotosTable).set(data).where(eq(projectPhotosTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/project-photos/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(projectPhotosTable).where(eq(projectPhotosTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
