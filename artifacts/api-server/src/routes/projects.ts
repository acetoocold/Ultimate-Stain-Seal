import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, projectsTable, customersTable, propertiesTable, diagnosesTable, invoicesTable, jobsTable, projectMaterialsTable, materialsTable, documentsTable, jobsheetsTable, activityTable } from "@workspace/db";
import {
  CreateProjectBody, UpdateProjectBody, GetProjectParams, UpdateProjectParams, DeleteProjectParams,
  UpdateProjectStatusParams, UpdateProjectStatusBody, ListProjectsQueryParams,
} from "@workspace/api-zod";
import { onProjectCompleted, recordProjectVariance } from "../lib/triggers";

const router: IRouter = Router();

// Trigger T1+T2 hook: fires when a project transitions into 'completed'.
// Idempotent — onProjectCompleted skips if reminders/warranties already exist.
async function fireCompletionTriggers(projectId: number): Promise<void> {
  await Promise.all([
    onProjectCompleted(projectId),
    recordProjectVariance(projectId),
  ]).catch(() => {/* Triggers are best-effort; don't fail the main response */});
}

function serializeProject(p: typeof projectsTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
    scheduledDate: p.scheduledDate?.toISOString() ?? null, completedDate: p.completedDate?.toISOString() ?? null };
}

router.get("/projects", async (req, res): Promise<void> => {
  const params = ListProjectsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(projectsTable).$dynamic();
  const conditions = [];
  if (params.data.customerId) conditions.push(eq(projectsTable.customerId, params.data.customerId));
  if (params.data.status) conditions.push(eq(projectsTable.status, params.data.status));
  if (params.data.assignedTo) conditions.push(eq(projectsTable.assignedToId, params.data.assignedTo));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const projects = await query.orderBy(projectsTable.createdAt);
  res.json(projects.map(serializeProject));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = { ...parsed.data, scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null };
  const [project] = await db.insert(projectsTable).values(data).returning();
  res.status(201).json(serializeProject(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, project.customerId));
  const [property] = project.propertyId ? await db.select().from(propertiesTable).where(eq(propertiesTable.id, project.propertyId)) : [null];
  const [diagnosis] = await db.select().from(diagnosesTable).where(eq(diagnosesTable.projectId, params.data.id));
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.projectId, params.data.id));
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.projectId, params.data.id));
  const pmRows = await db.select().from(projectMaterialsTable).where(eq(projectMaterialsTable.projectId, params.data.id));
  const materialIds = pmRows.map(r => r.materialId);
  const mats = materialIds.length > 0 ? await db.select().from(materialsTable) : [];
  const matMap = Object.fromEntries(mats.map(m => [m.id, m]));
  const documents = await db.select().from(documentsTable).where(eq(documentsTable.projectId, params.data.id));
  const jobsheets = await db.select().from(jobsheetsTable).where(eq(jobsheetsTable.projectId, params.data.id));
  const activity = await db.select().from(activityTable).where(eq(activityTable.projectId, params.data.id));
  const serializeCustomer = (c: typeof customersTable.$inferSelect) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() });
  res.json({
    ...serializeProject(project),
    customer: customer ? serializeCustomer(customer) : null,
    property: property ? { ...property, createdAt: property.createdAt.toISOString(), updatedAt: property.updatedAt.toISOString() } : null,
    diagnosis: diagnosis ? { ...diagnosis, createdAt: diagnosis.createdAt.toISOString(), updatedAt: diagnosis.updatedAt.toISOString(), diagnosedAt: diagnosis.diagnosedAt?.toISOString() ?? null } : null,
    invoices: invoices.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(), dueDate: i.dueDate?.toISOString() ?? null, signedAt: i.signedAt?.toISOString() ?? null })),
    jobs: jobs.map(j => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(), scheduledDate: j.scheduledDate?.toISOString() ?? null, actualStartTime: j.actualStartTime?.toISOString() ?? null, actualEndTime: j.actualEndTime?.toISOString() ?? null })),
    materials: pmRows.map(pm => ({ ...pm, material: matMap[pm.materialId] ? { ...matMap[pm.materialId], createdAt: matMap[pm.materialId].createdAt.toISOString(), updatedAt: matMap[pm.materialId].updatedAt.toISOString() } : null, createdAt: pm.createdAt.toISOString(), updatedAt: pm.updatedAt.toISOString() })),
    documents: documents.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })),
    jobsheets: jobsheets.map(j => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(), workDate: j.workDate?.toISOString() ?? null })),
    activity: activity.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
  });
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [before] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate as string);
  if (data.completedDate) data.completedDate = new Date(data.completedDate as string);
  // Auto-stamp completedDate when transitioning to 'completed' if caller omitted it.
  if (data.status === "completed" && !data.completedDate && !before?.completedDate) {
    data.completedDate = new Date();
  }
  const [project] = await db.update(projectsTable).set(data).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.status === "completed" && before?.status !== "completed") {
    await fireCompletionTriggers(project.id);
  }
  res.json(serializeProject(project));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [p] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }
  res.sendStatus(204);
});

router.patch("/projects/:id/status", async (req, res): Promise<void> => {
  const params = UpdateProjectStatusParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateProjectStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [before] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  const update: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "completed" && !before?.completedDate) {
    update.completedDate = new Date();
  }
  const [project] = await db.update(projectsTable).set(update).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.status === "completed" && before?.status !== "completed") {
    await fireCompletionTriggers(project.id);
  }
  res.json(serializeProject(project));
});

export default router;
