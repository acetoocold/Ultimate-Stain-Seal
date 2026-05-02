import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { createHash } from "crypto";
import {
  db,
  customersTable,
  usersTable,
  projectsTable,
  invoicesTable,
  jobsTable,
  documentsTable,
  diagnosesTable,
  remindersTable,
  warrantiesTable,
  paymentsTable,
} from "@workspace/db";
import { iso, isoMany } from "../lib/serialize";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "uss-ops-salt").digest("hex");
}

function customerToken(userId: number, customerId: number): string {
  return `uss-customer-${userId}-${customerId}`;
}

function parseCustomerToken(authHeader: string | undefined): { userId: number; customerId: number } | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+uss-customer-(\d+)-(\d+)$/);
  if (!m) return null;
  return { userId: parseInt(m[1], 10), customerId: parseInt(m[2], 10) };
}

// ====== Register ======
const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

router.post("/customer/auth/register", async (req, res): Promise<void> => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { email, password, firstName, lastName, phone } = parsed.data;

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingUser) { res.status(409).json({ error: "Email already registered" }); return; }

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
      role: "customer",
      phone: phone ?? null,
      isActive: true,
    })
    .returning();

  // Try to attach to an existing customer record by email; otherwise create one.
  const [existingCustomer] = await db.select().from(customersTable).where(eq(customersTable.email, email));
  let customer = existingCustomer;
  if (customer) {
    const [updated] = await db
      .update(customersTable)
      .set({ userId: user.id, portalEnabled: true, firstName, lastName, phone: phone ?? customer.phone })
      .where(eq(customersTable.id, customer.id))
      .returning();
    customer = updated;
  } else {
    const [created] = await db
      .insert(customersTable)
      .values({
        userId: user.id,
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        status: "lead",
        leadSource: "portal_signup",
        portalEnabled: true,
      })
      .returning();
    customer = created;
  }

  const { passwordHash: _ph, ...userOut } = user;
  res.status(201).json({
    user: { ...iso(userOut), createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() },
    customer: iso(customer),
    token: customerToken(user.id, customer.id),
  });
});

// ====== Login ======
const loginBody = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/customer/auth/login", async (req, res): Promise<void> => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.role !== "customer") { res.status(403).json({ error: "Use the employee login for staff accounts" }); return; }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.userId, user.id));
  if (!customer) { res.status(404).json({ error: "Customer profile not found" }); return; }
  if (!customer.portalEnabled) { res.status(403).json({ error: "Portal access disabled. Contact support." }); return; }
  const { passwordHash: _ph, ...userOut } = user;
  res.json({
    user: { ...userOut, createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() },
    customer: iso(customer),
    token: customerToken(user.id, customer.id),
  });
});

router.post("/customer/auth/logout", async (_req, res): Promise<void> => {
  res.sendStatus(204);
});

// ====== Auth helper ======
async function requireCustomer(req: import("express").Request, res: import("express").Response) {
  const token = parseCustomerToken(req.headers.authorization);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, token.customerId));
  if (!customer || customer.userId !== token.userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return customer;
}

// ====== Profile ======
router.get("/customer/portal/me", async (req, res): Promise<void> => {
  const customer = await requireCustomer(req, res);
  if (!customer) return;
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.customerId, customer.id));
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.customerId, customer.id));
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.customerId, customer.id));
  const documents = await db.select().from(documentsTable).where(eq(documentsTable.customerId, customer.id));
  const diagnoses = await db.select().from(diagnosesTable).where(eq(diagnosesTable.customerId, customer.id));
  const reminders = await db.select().from(remindersTable).where(eq(remindersTable.customerId, customer.id));
  const warranties = await db.select().from(warrantiesTable).where(eq(warrantiesTable.customerId, customer.id));

  const totalDue = invoices.reduce((sum, i) => sum + Number(i.balanceDue ?? 0), 0);
  const upcomingJobs = jobs.filter((j) => j.scheduledDate && j.scheduledDate.getTime() > Date.now());

  res.json({
    customer: iso(customer),
    projects: isoMany(projects),
    invoices: isoMany(invoices),
    jobs: isoMany(jobs),
    documents: isoMany(documents),
    diagnoses: isoMany(diagnoses),
    reminders: isoMany(reminders),
    warranties: isoMany(warranties),
    summary: {
      totalDue,
      openInvoiceCount: invoices.filter((i) => Number(i.balanceDue ?? 0) > 0).length,
      upcomingJobCount: upcomingJobs.length,
      activeWarrantyCount: warranties.filter((w) => w.status === "active").length,
    },
  });
});

const profileUpdateBody = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.patch("/customer/portal/profile", async (req, res): Promise<void> => {
  const customer = await requireCustomer(req, res);
  if (!customer) return;
  const parsed = profileUpdateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) if (v !== undefined) data[k] = v;
  const [row] = await db.update(customersTable).set(data).where(eq(customersTable.id, customer.id)).returning();
  res.json(iso(row));
});

// ====== Pay invoice (placeholder — real Stripe integration would replace this) ======
const payBody = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(["card", "ach", "manual_other"]).default("card"),
  cardLast4: z.string().length(4).optional(),
  saveCard: z.boolean().optional(),
});

router.post("/customer/portal/invoices/:id/pay", async (req, res): Promise<void> => {
  const customer = await requireCustomer(req, res);
  if (!customer) return;
  const idParam = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params);
  if (!idParam.success) { res.status(400).json({ error: idParam.error.message }); return; }
  const parsed = payBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, idParam.data.id));
  if (!invoice || invoice.customerId !== customer.id) { res.status(404).json({ error: "Invoice not found" }); return; }

  // Record the payment
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      customerId: customer.id,
      invoiceId: invoice.id,
      projectId: invoice.projectId ?? null,
      amount: parsed.data.amount.toFixed(2),
      paymentMethod: parsed.data.paymentMethod,
      paymentReference: parsed.data.cardLast4 ? `card_****${parsed.data.cardLast4}` : null,
      status: "completed",
      paymentDate: new Date(),
      notes: "Customer self-pay via portal",
    } as Parameters<typeof db.insert<typeof paymentsTable>>[0]["$inferInsert"])
    .returning();

  // Reduce invoice balance + status
  const newBalance = Math.max(Number(invoice.balanceDue ?? invoice.totalAmount ?? 0) - parsed.data.amount, 0);
  const newStatus = newBalance === 0 ? "paid" : invoice.status;
  await db
    .update(invoicesTable)
    .set({
      balanceDue: newBalance.toFixed(2),
      status: newStatus,
    })
    .where(eq(invoicesTable.id, invoice.id));

  res.json({ payment: iso(payment), invoiceBalance: newBalance, invoiceStatus: newStatus });
});

// ====== Subscriptions placeholder (canon: customer portal includes subscription option) ======
router.get("/customer/portal/subscription", async (req, res): Promise<void> => {
  const customer = await requireCustomer(req, res);
  if (!customer) return;
  // Subscriptions schema isn't in canon; return a placeholder shape so the UI can render.
  res.json({
    customerId: customer.id,
    plan: null,
    status: "none",
    options: [
      { id: "annual_maintenance", name: "Annual maintenance check", priceMonthly: 0, perVisit: 95 },
      { id: "fence_protect_plus", name: "Fence Protect Plus", priceMonthly: 19, perVisit: 0 },
    ],
  });
});

export default router;
