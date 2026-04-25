import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, diagnosesTable, settingsTable, customersTable, projectsTable } from "@workspace/db";
import {
  CreateDiagnosisBody, UpdateDiagnosisBody, GetDiagnosisParams, UpdateDiagnosisParams,
  CalculateDiagnosisParams, ListDiagnosesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDiagnosis(d: typeof diagnosesTable.$inferSelect) {
  return { ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(), diagnosedAt: d.diagnosedAt?.toISOString() ?? null };
}

router.get("/diagnoses", async (req, res): Promise<void> => {
  const params = ListDiagnosesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(diagnosesTable).$dynamic();
  const conditions = [];
  if (params.data.projectId) conditions.push(eq(diagnosesTable.projectId, params.data.projectId));
  if (params.data.customerId) conditions.push(eq(diagnosesTable.customerId, params.data.customerId));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const diagnoses = await query.orderBy(diagnosesTable.createdAt);
  res.json(diagnoses.map(serializeDiagnosis));
});

router.post("/diagnoses", async (req, res): Promise<void> => {
  const parsed = CreateDiagnosisBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [diagnosis] = await db.insert(diagnosesTable).values(parsed.data).returning();
  res.status(201).json(serializeDiagnosis(diagnosis));
});

router.get("/diagnoses/:id", async (req, res): Promise<void> => {
  const params = GetDiagnosisParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [diagnosis] = await db.select().from(diagnosesTable).where(eq(diagnosesTable.id, params.data.id));
  if (!diagnosis) { res.status(404).json({ error: "Diagnosis not found" }); return; }
  const [customer] = diagnosis.customerId
    ? await db.select().from(customersTable).where(eq(customersTable.id, diagnosis.customerId))
    : [undefined];
  const [project] = diagnosis.projectId
    ? await db.select().from(projectsTable).where(eq(projectsTable.id, diagnosis.projectId))
    : [undefined];
  res.json({
    ...serializeDiagnosis(diagnosis),
    customer: customer ? { ...customer, createdAt: customer.createdAt.toISOString(), updatedAt: customer.updatedAt.toISOString() } : null,
    project: project ? { ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString(),
      scheduledDate: project.scheduledDate?.toISOString() ?? null, completedDate: project.completedDate?.toISOString() ?? null } : null,
  });
});

router.patch("/diagnoses/:id", async (req, res): Promise<void> => {
  const params = UpdateDiagnosisParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateDiagnosisBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.diagnosedAt) data.diagnosedAt = new Date(data.diagnosedAt as string);
  const [diagnosis] = await db.update(diagnosesTable).set(data).where(eq(diagnosesTable.id, params.data.id)).returning();
  if (!diagnosis) { res.status(404).json({ error: "Diagnosis not found" }); return; }
  res.json(serializeDiagnosis(diagnosis));
});

router.post("/diagnoses/:id/calculate", async (req, res): Promise<void> => {
  const params = CalculateDiagnosisParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [diagnosis] = await db.select().from(diagnosesTable).where(eq(diagnosesTable.id, params.data.id));
  if (!diagnosis) { res.status(404).json({ error: "Diagnosis not found" }); return; }

  const [settings] = await db.select().from(settingsTable).limit(1);
  const laborRate = parseFloat(settings?.defaultLaborRate?.toString() ?? "45");
  const coverageRate = parseFloat(settings?.defaultCoverageRate?.toString() ?? "100");

  const linearFeet = parseFloat(diagnosis.totalLinearFeet?.toString() ?? "0");
  const height = parseFloat(diagnosis.averageHeight?.toString() ?? "6");
  const coats = diagnosis.recommendedCoats ?? 2;
  const gates = diagnosis.numberOfGates ?? 0;
  const posts = diagnosis.numberOfPosts ?? 0;

  // Calculate fence area: both sides of fence panels + posts + gates
  const fenceArea = linearFeet * height * 2 + (posts * height * 0.5) + (gates * 4 * 7 * 2);
  const gallonsNeeded = (fenceArea * coats) / coverageRate;
  const laborHours = (fenceArea / 150) * coats + (linearFeet / 100) * 0.5; // prep time
  const materialCost = gallonsNeeded * 50; // default $50/gallon
  const laborCost = laborHours * laborRate;
  const total = materialCost + laborCost;

  // Save calculated values
  await db.update(diagnosesTable).set({
    totalSqFt: fenceArea.toFixed(2),
    estimatedProductGallons: gallonsNeeded.toFixed(2),
    estimatedLaborHours: laborHours.toFixed(2),
    estimatedMaterialCost: materialCost.toFixed(2),
    estimatedLaborCost: laborCost.toFixed(2),
    estimatedTotal: total.toFixed(2),
  }).where(eq(diagnosesTable.id, params.data.id));

  res.json({
    diagnosisId: params.data.id,
    totalSqFt: parseFloat(fenceArea.toFixed(2)),
    estimatedProductGallons: parseFloat(gallonsNeeded.toFixed(2)),
    estimatedLaborHours: parseFloat(laborHours.toFixed(2)),
    estimatedMaterialCost: parseFloat(materialCost.toFixed(2)),
    estimatedLaborCost: parseFloat(laborCost.toFixed(2)),
    estimatedTotal: parseFloat(total.toFixed(2)),
    breakdown: {
      fenceArea: parseFloat(fenceArea.toFixed(2)),
      coatMultiplier: coats,
      coverageRate,
      laborRate,
      productPrice: 50,
    },
  });
});

export default router;
