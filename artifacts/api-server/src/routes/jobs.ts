import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, jobsTable, jobsheetsTable } from "@workspace/db";
import {
  CreateJobBody, UpdateJobBody, GetJobParams, UpdateJobParams, DeleteJobParams,
  UpdateJobStatusParams, UpdateJobStatusBody, ListJobsQueryParams,
  CreateJobsheetBody, UpdateJobsheetBody, GetJobsheetParams, UpdateJobsheetParams, DeleteJobsheetParams, ListJobsheetsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeJob(j: typeof jobsTable.$inferSelect) {
  return { ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(),
    scheduledDate: j.scheduledDate?.toISOString() ?? null, actualStartTime: j.actualStartTime?.toISOString() ?? null, actualEndTime: j.actualEndTime?.toISOString() ?? null };
}
function serializeJobsheet(j: typeof jobsheetsTable.$inferSelect) {
  return { ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(), workDate: j.workDate?.toISOString() ?? null };
}

router.get("/jobs", async (req, res): Promise<void> => {
  const params = ListJobsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(jobsTable).$dynamic();
  const conditions = [];
  if (params.data.projectId) conditions.push(eq(jobsTable.projectId, params.data.projectId));
  if (params.data.assignedTo) conditions.push(eq(jobsTable.assignedToId, params.data.assignedTo));
  if (params.data.status) conditions.push(eq(jobsTable.status, params.data.status));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const jobs = await query.orderBy(jobsTable.scheduledDate);
  res.json(jobs.map(serializeJob));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = { ...parsed.data, scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null };
  const [job] = await db.insert(jobsTable).values(data).returning();
  res.status(201).json(serializeJob(job));
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  const jobsheets = await db.select().from(jobsheetsTable).where(eq(jobsheetsTable.jobId, params.data.id));
  res.json({ ...serializeJob(job), jobsheets: jobsheets.map(serializeJobsheet) });
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const params = UpdateJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate as string);
  if (data.actualStartTime) data.actualStartTime = new Date(data.actualStartTime as string);
  if (data.actualEndTime) data.actualEndTime = new Date(data.actualEndTime as string);
  const [job] = await db.update(jobsTable).set(data).where(eq(jobsTable.id, params.data.id)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(serializeJob(job));
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [j] = await db.delete(jobsTable).where(eq(jobsTable.id, params.data.id)).returning();
  if (!j) { res.status(404).json({ error: "Job not found" }); return; }
  res.sendStatus(204);
});

router.patch("/jobs/:id/status", async (req, res): Promise<void> => {
  const params = UpdateJobStatusParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateJobStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [job] = await db.update(jobsTable).set({ status: parsed.data.status }).where(eq(jobsTable.id, params.data.id)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(serializeJob(job));
});

// Jobsheets
router.get("/jobsheets", async (req, res): Promise<void> => {
  const params = ListJobsheetsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(jobsheetsTable).$dynamic();
  const conditions = [];
  if (params.data.projectId) conditions.push(eq(jobsheetsTable.projectId, params.data.projectId));
  if (params.data.jobId) conditions.push(eq(jobsheetsTable.jobId, params.data.jobId));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const sheets = await query.orderBy(jobsheetsTable.createdAt);
  res.json(sheets.map(serializeJobsheet));
});

router.post("/jobsheets", async (req, res): Promise<void> => {
  const parsed = CreateJobsheetBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = { ...parsed.data, workDate: parsed.data.workDate ? new Date(parsed.data.workDate) : null };
  const workOrderNumber = `WO-${Date.now().toString().slice(-6)}`;
  const [sheet] = await db.insert(jobsheetsTable).values({ ...data, workOrderNumber }).returning();
  res.status(201).json(serializeJobsheet(sheet));
});

router.get("/jobsheets/:id", async (req, res): Promise<void> => {
  const params = GetJobsheetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [sheet] = await db.select().from(jobsheetsTable).where(eq(jobsheetsTable.id, params.data.id));
  if (!sheet) { res.status(404).json({ error: "Jobsheet not found" }); return; }
  res.json(serializeJobsheet(sheet));
});

router.patch("/jobsheets/:id", async (req, res): Promise<void> => {
  const params = UpdateJobsheetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateJobsheetBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.workDate) data.workDate = new Date(data.workDate as string);
  const [sheet] = await db.update(jobsheetsTable).set(data).where(eq(jobsheetsTable.id, params.data.id)).returning();
  if (!sheet) { res.status(404).json({ error: "Jobsheet not found" }); return; }
  res.json(serializeJobsheet(sheet));
});

router.delete("/jobsheets/:id", async (req, res): Promise<void> => {
  const params = DeleteJobsheetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [s] = await db.delete(jobsheetsTable).where(eq(jobsheetsTable.id, params.data.id)).returning();
  if (!s) { res.status(404).json({ error: "Jobsheet not found" }); return; }
  res.sendStatus(204);
});

export default router;
