import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, customersTable, propertiesTable, projectsTable, invoicesTable, jobsTable, documentsTable } from "@workspace/db";
import {
  CreateCustomerBody, UpdateCustomerBody, GetCustomerParams, UpdateCustomerParams, DeleteCustomerParams,
  GetCustomerPortalParams, CreatePropertyBody, GetPropertyParams, UpdatePropertyParams, UpdatePropertyBody,
  ListCustomersQueryParams, ListPropertiesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeCustomer(c: typeof customersTable.$inferSelect) {
  return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}

router.get("/customers", async (req, res): Promise<void> => {
  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(customersTable).$dynamic();
  const conditions = [];
  if (params.data.status) conditions.push(eq(customersTable.status, params.data.status));
  if (params.data.leadSource) conditions.push(eq(customersTable.leadSource, params.data.leadSource));
  if (params.data.search) {
    conditions.push(ilike(customersTable.firstName, `%${params.data.search}%`));
  }
  if (conditions.length > 0) query = query.where(and(...conditions));
  const customers = await query.orderBy(customersTable.createdAt);
  res.json(customers.map(serializeCustomer));
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [customer] = await db.insert(customersTable).values(parsed.data).returning();
  res.status(201).json(serializeCustomer(customer));
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  const properties = await db.select().from(propertiesTable).where(eq(propertiesTable.customerId, params.data.id));
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.customerId, params.data.id));
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, params.data.id));
  res.json({
    ...serializeCustomer(customer),
    properties: properties.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })),
    projects: projects.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
      scheduledDate: p.scheduledDate?.toISOString() ?? null, completedDate: p.completedDate?.toISOString() ?? null })),
    invoices: invoices.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
      dueDate: i.dueDate?.toISOString() ?? null, signedAt: i.signedAt?.toISOString() ?? null })),
  });
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [customer] = await db.update(customersTable).set(data).where(eq(customersTable.id, params.data.id)).returning();
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json(serializeCustomer(customer));
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.delete(customersTable).where(eq(customersTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Customer not found" }); return; }
  res.sendStatus(204);
});

router.get("/customers/:id/portal", async (req, res): Promise<void> => {
  const params = GetCustomerPortalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.customerId, params.data.id));
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, params.data.id));
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.customerId, params.data.id));
  const documents = await db.select().from(documentsTable).where(eq(documentsTable.customerId, params.data.id));
  res.json({
    customer: serializeCustomer(customer),
    projects: projects.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
      scheduledDate: p.scheduledDate?.toISOString() ?? null, completedDate: p.completedDate?.toISOString() ?? null })),
    invoices: invoices.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
      dueDate: i.dueDate?.toISOString() ?? null, signedAt: i.signedAt?.toISOString() ?? null })),
    jobs: jobs.map(j => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(),
      scheduledDate: j.scheduledDate?.toISOString() ?? null, actualStartTime: j.actualStartTime?.toISOString() ?? null, actualEndTime: j.actualEndTime?.toISOString() ?? null })),
    documents: documents.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })),
  });
});

// Properties
router.get("/properties", async (req, res): Promise<void> => {
  const params = ListPropertiesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(propertiesTable).$dynamic();
  if (params.data.customerId) query = query.where(eq(propertiesTable.customerId, params.data.customerId));
  const properties = await query.orderBy(propertiesTable.createdAt);
  res.json(properties.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })));
});

router.post("/properties", async (req, res): Promise<void> => {
  const parsed = CreatePropertyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [property] = await db.insert(propertiesTable).values(parsed.data).returning();
  res.status(201).json({ ...property, createdAt: property.createdAt.toISOString(), updatedAt: property.updatedAt.toISOString() });
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  const params = GetPropertyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, params.data.id));
  if (!property) { res.status(404).json({ error: "Property not found" }); return; }
  res.json({ ...property, createdAt: property.createdAt.toISOString(), updatedAt: property.updatedAt.toISOString() });
});

router.patch("/properties/:id", async (req, res): Promise<void> => {
  const params = UpdatePropertyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePropertyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [property] = await db.update(propertiesTable).set(data).where(eq(propertiesTable.id, params.data.id)).returning();
  if (!property) { res.status(404).json({ error: "Property not found" }); return; }
  res.json({ ...property, createdAt: property.createdAt.toISOString(), updatedAt: property.updatedAt.toISOString() });
});

export default router;
