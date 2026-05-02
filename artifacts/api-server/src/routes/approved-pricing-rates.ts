import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, approvedPricingRatesTable, insertApprovedPricingRateSchema } from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();
const idParam = z.object({ id: z.coerce.number().int().positive() });

router.get("/approved-rates", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(approvedPricingRatesTable)
    .where(eq(approvedPricingRatesTable.isActive, true))
    .orderBy(approvedPricingRatesTable.sortOrder);
  res.json(isoMany(rows));
});

router.post("/approved-rates", async (req, res): Promise<void> => {
  const parsed = insertApprovedPricingRateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(approvedPricingRatesTable).values(parsed.data).returning();
  res.status(201).json(iso(row));
});

router.patch("/approved-rates/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const parsed = insertApprovedPricingRateSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(approvedPricingRatesTable).set(parsed.data).where(eq(approvedPricingRatesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(iso(row));
});

router.delete("/approved-rates/:id", async (req, res): Promise<void> => {
  const p = idParam.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.delete(approvedPricingRatesTable).where(eq(approvedPricingRatesTable.id, p.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Seed endpoint to install the canon nine rates ($0.60 → $1.00 in $0.05 steps).
// Idempotent: skips rates that already exist.
router.post("/approved-rates/seed-canon", async (_req, res): Promise<void> => {
  const canon = [0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
  const existing = await db.select().from(approvedPricingRatesTable);
  const have = new Set(existing.map((r) => Number(r.ratePerSqFt).toFixed(2)));
  let inserted = 0;
  for (let i = 0; i < canon.length; i++) {
    const rate = canon[i];
    const key = rate.toFixed(2);
    if (have.has(key)) continue;
    const tier = rate < 0.7 ? "budget" : rate < 0.9 ? "standard" : "premium";
    await db.insert(approvedPricingRatesTable).values({
      ratePerSqFt: rate.toFixed(4),
      label: `$${rate.toFixed(2)} per sq ft`,
      tier,
      sortOrder: (i + 1).toFixed(2),
      isActive: true,
    });
    inserted++;
  }
  res.json({ inserted, total: canon.length });
});

export default router;
