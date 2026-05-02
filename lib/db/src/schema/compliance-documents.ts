import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Used by Trigger T5: when a stain service is added, the linked SDS/MSDS document
// gets pushed as a notification to the crew lead. Also used for general compliance
// artifacts (licenses, insurance, contracts, safety docs).
export const complianceDocumentsTable = pgTable("compliance_documents", {
  id: serial("id").primaryKey(),
  // doc_type: sds | msds | license | insurance | contract | safety | warranty_template | other
  docType: text("doc_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  // Scope: which service code triggers this (e.g., 'stain_seal'). Null = global.
  serviceCode: text("service_code"),
  productName: text("product_name"),    // For SDS: what product this covers
  url: text("url").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertComplianceDocumentSchema = createInsertSchema(complianceDocumentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceDocument = z.infer<typeof insertComplianceDocumentSchema>;
export type ComplianceDocument = typeof complianceDocumentsTable.$inferSelect;
