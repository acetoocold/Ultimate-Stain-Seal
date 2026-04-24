import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, invoicesTable, invoiceLineItemsTable, paymentsTable } from "@workspace/db";
import {
  CreateInvoiceBody, UpdateInvoiceBody, GetInvoiceParams, UpdateInvoiceParams, DeleteInvoiceParams,
  UpdateInvoiceDisclaimerParams, UpdateInvoiceDisclaimerBody, ListInvoicesQueryParams,
  CreatePaymentBody, GetPaymentParams, UpdatePaymentParams, UpdatePaymentBody, ListPaymentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

let invoiceCounter = 1000;

function serializeInvoice(i: typeof invoicesTable.$inferSelect) {
  return { ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
    dueDate: i.dueDate?.toISOString() ?? null, signedAt: i.signedAt?.toISOString() ?? null };
}
function serializePayment(p: typeof paymentsTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
    paymentDate: p.paymentDate.toISOString() };
}

async function recalcInvoice(invoiceId: number) {
  const lineItems = await db.select().from(invoiceLineItemsTable).where(eq(invoiceLineItemsTable.invoiceId, invoiceId));
  const subtotal = lineItems.reduce((sum, li) => sum + parseFloat(li.lineTotal?.toString() ?? "0"), 0);
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
  if (!invoice) return;
  const taxRate = parseFloat(invoice.taxRate?.toString() ?? "0");
  const taxAmount = subtotal * taxRate;
  const discount = parseFloat(invoice.discountAmount?.toString() ?? "0");
  const totalAmount = subtotal + taxAmount - discount;
  const paidAmount = parseFloat(invoice.paidAmount?.toString() ?? "0");
  await db.update(invoicesTable).set({
    subtotal: subtotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    balanceDue: (totalAmount - paidAmount).toFixed(2),
  }).where(eq(invoicesTable.id, invoiceId));
}

router.get("/invoices", async (req, res): Promise<void> => {
  const params = ListInvoicesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(invoicesTable).$dynamic();
  const conditions = [];
  if (params.data.projectId) conditions.push(eq(invoicesTable.projectId, params.data.projectId));
  if (params.data.customerId) conditions.push(eq(invoicesTable.customerId, params.data.customerId));
  if (params.data.status) conditions.push(eq(invoicesTable.status, params.data.status));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const invoices = await query.orderBy(invoicesTable.createdAt);
  res.json(invoices.map(serializeInvoice));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { lineItems, ...invoiceData } = parsed.data;

  const [settings] = await db.select().from(invoicesTable).limit(1);
  invoiceCounter++;
  const invoiceNumber = `USS-${String(invoiceCounter).padStart(4, "0")}`;
  const taxRate = invoiceData.taxRate ?? 0;
  const discount = invoiceData.discountAmount ?? 0;
  const subtotal = parseFloat(invoiceData.subtotal.toString());
  const taxAmount = subtotal * parseFloat(taxRate.toString());
  const totalAmount = subtotal + taxAmount - parseFloat(discount.toString());

  const [invoice] = await db.insert(invoicesTable).values({
    ...invoiceData,
    invoiceNumber,
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    balanceDue: totalAmount.toFixed(2),
    paidAmount: "0",
    dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
  }).returning();

  if (lineItems && lineItems.length > 0) {
    for (const li of lineItems) {
      await db.insert(invoiceLineItemsTable).values({
        invoiceId: invoice.id,
        description: li.description,
        quantity: li.quantity.toString(),
        unitPrice: li.unitPrice.toString(),
        lineTotal: (li.quantity * li.unitPrice).toFixed(2),
        category: li.category ?? null,
      });
    }
    await recalcInvoice(invoice.id);
  }

  const [fresh] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoice.id));
  res.status(201).json(serializeInvoice(fresh));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  const lineItems = await db.select().from(invoiceLineItemsTable).where(eq(invoiceLineItemsTable.invoiceId, params.data.id));
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.invoiceId, params.data.id));
  res.json({
    ...serializeInvoice(invoice),
    lineItems: lineItems.map(li => ({ ...li, createdAt: li.createdAt.toISOString() })),
    payments: payments.map(serializePayment),
  });
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.dueDate) data.dueDate = new Date(data.dueDate as string);
  const [invoice] = await db.update(invoicesTable).set(data).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(serializeInvoice(invoice));
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [i] = await db.delete(invoicesTable).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!i) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.sendStatus(204);
});

router.patch("/invoices/:id/disclaimer", async (req, res): Promise<void> => {
  const params = UpdateInvoiceDisclaimerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateInvoiceDisclaimerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [invoice] = await db.update(invoicesTable).set({
    disclaimerMode: parsed.data.disclaimerMode,
    disclaimerText: parsed.data.disclaimerText ?? null,
  }).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(serializeInvoice(invoice));
});

// Payments
router.get("/payments", async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(paymentsTable).$dynamic();
  const conditions = [];
  if (params.data.invoiceId) conditions.push(eq(paymentsTable.invoiceId, params.data.invoiceId));
  if (params.data.customerId) conditions.push(eq(paymentsTable.customerId, params.data.customerId));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const payments = await query.orderBy(paymentsTable.paymentDate);
  res.json(payments.map(serializePayment));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [payment] = await db.insert(paymentsTable).values({ ...parsed.data, paymentDate: new Date(parsed.data.paymentDate) }).returning();
  // Update invoice paid amount
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.invoiceId, parsed.data.invoiceId));
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0);
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, parsed.data.invoiceId));
  if (invoice) {
    const balanceDue = parseFloat(invoice.totalAmount?.toString() ?? "0") - totalPaid;
    const status = balanceDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : invoice.status;
    await db.update(invoicesTable).set({ paidAmount: totalPaid.toFixed(2), balanceDue: Math.max(0, balanceDue).toFixed(2), status }).where(eq(invoicesTable.id, parsed.data.invoiceId));
  }
  res.status(201).json(serializePayment(payment));
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(serializePayment(payment));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const params = UpdatePaymentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.paymentDate) data.paymentDate = new Date(data.paymentDate as string);
  const [payment] = await db.update(paymentsTable).set(data).where(eq(paymentsTable.id, params.data.id)).returning();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(serializePayment(payment));
});

export default router;
