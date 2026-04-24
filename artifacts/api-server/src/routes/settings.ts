import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable, pricingRulesTable } from "@workspace/db";
import {
  UpdateSettingsBody, CreatePricingRuleBody, UpdatePricingRuleBody, UpdatePricingRuleParams, DeletePricingRuleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeSettings(s: typeof settingsTable.$inferSelect) {
  return { ...s, updatedAt: s.updatedAt.toISOString() };
}
function serializePricingRule(p: typeof pricingRulesTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

async function getOrCreateSettings() {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(settingsTable).values({
    companyName: "Ultimate Stain & Seal",
    softDisclaimerText: "Note: Weather conditions may affect drying time. USS is not responsible for re-staining needs due to extreme weather within 30 days of service.",
    hardDisclaimerText: "DISCLAIMER: Customer acknowledges that wood surfaces expand and contract with temperature changes. USS provides no warranty for color matching on previously stained wood. Customer signature required before work begins.",
    defaultLaborRate: "45.00",
    defaultCoverageRate: "100",
    defaultTaxRate: "0.0825",
    invoicePrefix: "USS",
  }).returning();
  return created;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(serializeSettings(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const settings = await getOrCreateSettings();
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [updated] = await db.update(settingsTable).set(data).where(eq(settingsTable.id, settings.id)).returning();
  res.json(serializeSettings(updated));
});

router.get("/pricing-rules", async (_req, res): Promise<void> => {
  const rules = await db.select().from(pricingRulesTable).orderBy(pricingRulesTable.name);
  res.json(rules.map(serializePricingRule));
});

router.post("/pricing-rules", async (req, res): Promise<void> => {
  const parsed = CreatePricingRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [rule] = await db.insert(pricingRulesTable).values(parsed.data).returning();
  res.status(201).json(serializePricingRule(rule));
});

router.patch("/pricing-rules/:id", async (req, res): Promise<void> => {
  const params = UpdatePricingRuleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePricingRuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [rule] = await db.update(pricingRulesTable).set(data).where(eq(pricingRulesTable.id, params.data.id)).returning();
  if (!rule) { res.status(404).json({ error: "Pricing rule not found" }); return; }
  res.json(serializePricingRule(rule));
});

router.delete("/pricing-rules/:id", async (req, res): Promise<void> => {
  const params = DeletePricingRuleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [r] = await db.delete(pricingRulesTable).where(eq(pricingRulesTable.id, params.data.id)).returning();
  if (!r) { res.status(404).json({ error: "Pricing rule not found" }); return; }
  res.sendStatus(204);
});

export default router;
