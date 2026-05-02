import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, territoriesTable, insertTerritorySchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });

router.get("/territories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(territoriesTable).orderBy(territoriesTable.name);
  res.json(isoMany(rows));
});

router.post("/territories", async (req, res): Promise<void> => {
  const parsed = insertTerritorySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(territoriesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.get("/territories/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(territoriesTable).where(eq(territoriesTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Territory not found" }); return; }
  res.json(iso(row));
});

router.patch("/territories/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertTerritorySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(territoriesTable).set(parsed.data).where(eq(territoriesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Territory not found" }); return; }
  res.json(iso(row));
});

router.delete("/territories/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(territoriesTable).where(eq(territoriesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Territory not found" }); return; }
  res.sendStatus(204);
});

export default router;
