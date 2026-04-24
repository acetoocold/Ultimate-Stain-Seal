import { Router, type IRouter } from "express";
import { eq, gte, desc, lt } from "drizzle-orm";
import { db, projectsTable, customersTable, invoicesTable, jobsTable, activityTable, paymentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [projects, customers, invoices, allPayments] = await Promise.all([
    db.select().from(projectsTable),
    db.select().from(customersTable),
    db.select().from(invoicesTable),
    db.select().from(paymentsTable),
  ]);

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const pendingProjects = projects.filter(p => p.status === "pending").length;
  const completedThisMonth = projects.filter(p => p.status === "completed" && p.completedDate && new Date(p.completedDate) >= startOfMonth).length;

  const outstandingInvoices = invoices.filter(i => i.status !== "paid" && i.status !== "void");
  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + parseFloat(i.balanceDue?.toString() ?? "0"), 0);
  const overdueInvoices = outstandingInvoices.filter(i => i.dueDate && new Date(i.dueDate) < today);
  const pendingDiagnoses = projects.filter(p => p.status === "pending").length;

  const ytdPayments = allPayments.filter(p => new Date(p.paymentDate) >= startOfYear);
  const ytdRevenue = ytdPayments.reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0);
  const monthRevenue = allPayments.filter(p => new Date(p.paymentDate) >= startOfMonth).reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0);

  res.json({
    activeProjects,
    pendingProjects,
    completedThisMonth,
    totalCustomers: customers.length,
    totalOutstanding,
    overdueCount: overdueInvoices.length,
    ytdRevenue,
    monthRevenue,
    pendingDiagnoses,
    upcomingJobsCount: 0,
  });
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const entries = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(limit);
  res.json(entries.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.get("/dashboard/upcoming-jobs", async (req, res): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const today = new Date();
  const jobs = await db.select().from(jobsTable).where(gte(jobsTable.scheduledDate, today)).orderBy(jobsTable.scheduledDate).limit(limit);
  res.json(jobs.map(j => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(),
    scheduledDate: j.scheduledDate?.toISOString() ?? null, actualStartTime: j.actualStartTime?.toISOString() ?? null, actualEndTime: j.actualEndTime?.toISOString() ?? null })));
});

router.get("/dashboard/overdue-invoices", async (_req, res): Promise<void> => {
  const today = new Date();
  const invoices = await db.select().from(invoicesTable);
  const overdue = invoices.filter(i => i.status !== "paid" && i.status !== "void" && i.dueDate && new Date(i.dueDate) < today);
  res.json(overdue.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
    dueDate: i.dueDate?.toISOString() ?? null, signedAt: i.signedAt?.toISOString() ?? null })));
});

export default router;
