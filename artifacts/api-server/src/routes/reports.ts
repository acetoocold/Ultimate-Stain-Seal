import { Router, type IRouter } from "express";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import { db, projectsTable, invoicesTable, paymentsTable, jobsTable, customersTable, activityTable, materialsTable, projectMaterialsTable, inventoryItemsTable } from "@workspace/db";

const router: IRouter = Router();

// GET /reports/summary — overall operations summary
router.get("/reports/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  const [projects, customers, invoices, payments, jobs, inventory] = await Promise.all([
    db.select().from(projectsTable),
    db.select().from(customersTable),
    db.select().from(invoicesTable),
    db.select().from(paymentsTable),
    db.select().from(jobsTable),
    db.select().from(inventoryItemsTable),
  ]);
  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0);
  const thisMonthRevenue = payments.filter(p => new Date(p.paymentDate) >= startOfMonth).reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0);
  const outstandingBalance = invoices.filter(i => i.status !== "paid" && i.status !== "void").reduce((sum, i) => sum + parseFloat(i.balanceDue?.toString() ?? "0"), 0);
  const overdueInvoices = invoices.filter(i => i.status !== "paid" && i.status !== "void" && i.dueDate && new Date(i.dueDate) < today).length;
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const scheduledJobsThisWeek = jobs.filter(j => j.status === "scheduled" && j.scheduledDate && new Date(j.scheduledDate) >= startOfWeek && new Date(j.scheduledDate) <= new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)).length;
  const lowStockItems = inventory.filter(i => i.reorderPoint && parseFloat(i.quantityOnHand?.toString() ?? "0") <= parseFloat(i.reorderPoint?.toString() ?? "0")).length;
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const averageJobValue = paidInvoices.length > 0 ? paidInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount?.toString() ?? "0"), 0) / paidInvoices.length : 0;
  const activeCustomers = customers.filter(c => c.status === "active").length;
  res.json({
    totalRevenue,
    outstandingBalance,
    totalProjects: projects.length,
    activeProjects,
    completedProjects,
    totalCustomers: customers.length,
    activeCustomers,
    totalInvoiced: invoices.reduce((sum, i) => sum + parseFloat(i.totalAmount?.toString() ?? "0"), 0),
    thisMonthRevenue,
    scheduledJobsThisWeek,
    overdueInvoices,
    lowStockItems,
    averageJobValue: Math.round(averageJobValue * 100) / 100,
    averageProjectValue: Math.round(averageJobValue * 100) / 100,
  });
});

// GET /reports/revenue
router.get("/reports/revenue", async (req, res): Promise<void> => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  let paymentQuery = db.select().from(paymentsTable).$dynamic();
  const conditions = [];
  if (startDate) conditions.push(gte(paymentsTable.paymentDate, new Date(startDate)));
  if (endDate) conditions.push(lte(paymentsTable.paymentDate, new Date(endDate)));
  if (conditions.length > 0) paymentQuery = paymentQuery.where(and(...conditions));
  const payments = await paymentQuery;
  const total = payments.reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0);
  // Group by month
  const byMonth: Record<string, number> = {};
  for (const p of payments) {
    const key = `${new Date(p.paymentDate).getFullYear()}-${String(new Date(p.paymentDate).getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + parseFloat(p.amount?.toString() ?? "0");
  }
  res.json({ total, byMonth, count: payments.length });
});

// GET /reports/projects-by-status
router.get("/reports/projects-by-status", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable);
  const byStatus: Record<string, number> = {};
  for (const p of projects) { byStatus[p.status] = (byStatus[p.status] ?? 0) + 1; }
  res.json(Object.entries(byStatus).map(([status, count]) => ({ status, count })));
});

// GET /reports/lead-sources
router.get("/reports/lead-sources", async (_req, res): Promise<void> => {
  const customers = await db.select().from(customersTable);
  const bySource: Record<string, number> = {};
  for (const c of customers) {
    const src = c.leadSource ?? "unknown";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }
  res.json(Object.entries(bySource).map(([source, count]) => ({ source, count })));
});

// GET /reports/materials-usage
router.get("/reports/materials-usage", async (_req, res): Promise<void> => {
  const pmRows = await db.select().from(projectMaterialsTable);
  const materials = await db.select().from(materialsTable);
  const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
  const usage: Record<string, { name: string; totalQuantity: number; totalCost: number; materialId: number }> = {};
  for (const pm of pmRows) {
    const mat = matMap[pm.materialId];
    if (!mat) continue;
    if (!usage[pm.materialId]) usage[pm.materialId] = { name: mat.name, totalQuantity: 0, totalCost: 0, materialId: pm.materialId };
    usage[pm.materialId].totalQuantity += parseFloat(pm.quantityUsed?.toString() ?? "0");
    usage[pm.materialId].totalCost += parseFloat(pm.totalCost?.toString() ?? "0");
  }
  res.json(Object.values(usage).sort((a, b) => b.totalCost - a.totalCost));
});

export default router;
