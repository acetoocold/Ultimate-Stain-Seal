import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dataPersonalizationLogTable = pgTable("data_personalization_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // invoice, project, diagnosis, material, job, etc.
  entityId: integer("entity_id").notNull(),
  fieldName: text("field_name"), // The specific field that was personalized
  personalizationState: text("personalization_state").notNull(), // washed, sealed, cleaned, stained, preserved
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  reason: text("reason"), // Why was it personalized?
  modifiedBy: integer("modified_by"), // User ID who made the change
  requiresConfirmation: boolean("requires_confirmation").default(false),
  confirmationStatus: text("confirmation_status"), // pending, confirmed_by_admin, confirmed_by_second
  confirmedBy: integer("confirmed_by"), // First approver (Admin EJ Overton)
  secondConfirmedBy: integer("second_confirmed_by"), // Second approver (Atrayue Cohen)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const preservationCounterTable = pgTable("preservation_counter", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(), // Customer ID, Material ID, User ID, etc.
  sourceType: text("source_type").notNull(), // customer, material, user, etc.
  invoiceCount: integer("invoice_count").notNull().default(0), // Count of fully-paid invoices
  isPreserved: boolean("is_preserved").default(false), // true when invoiceCount >= 20
  preservedAt: timestamp("preserved_at", { withTimezone: true }),
  definition: text("definition"), // Brief description of what "Preserved" means for this entity
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDataPersonalizationLogSchema = createInsertSchema(dataPersonalizationLogTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDataPersonalizationLog = z.infer<typeof insertDataPersonalizationLogSchema>;
export type DataPersonalizationLog = typeof dataPersonalizationLogTable.$inferSelect;

export const insertPreservationCounterSchema = createInsertSchema(preservationCounterTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPreservationCounter = z.infer<typeof insertPreservationCounterSchema>;
export type PreservationCounter = typeof preservationCounterTable.$inferSelect;
