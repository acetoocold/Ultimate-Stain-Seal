import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  customerId: integer("customer_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceType: text("invoice_type").notNull().default("standard"),
  status: text("status").notNull().default("draft"),
  disclaimerMode: text("disclaimer_mode").notNull().default("none"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  balanceDue: numeric("balance_due", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  notes: text("notes"),
  disclaimerText: text("disclaimer_text"),
  customerSignature: text("customer_signature"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const invoiceLineItemsTable = pgTable("invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull().default("0"),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItemsTable).omit({ id: true, createdAt: true });
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItemsTable.$inferSelect;
