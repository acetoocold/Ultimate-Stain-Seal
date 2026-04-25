import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoiceMessageTemplatesTable = pgTable("invoice_message_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Short name for the template
  messageBody: text("message_body").notNull(), // Full message text
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvoiceMessageTemplateSchema = createInsertSchema(invoiceMessageTemplatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoiceMessageTemplate = z.infer<typeof insertInvoiceMessageTemplateSchema>;
export type InvoiceMessageTemplate = typeof invoiceMessageTemplatesTable.$inferSelect;
