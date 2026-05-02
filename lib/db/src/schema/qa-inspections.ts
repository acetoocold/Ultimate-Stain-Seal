import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon QA layer — inspection, walkthrough, sign-off, cleanup confirmation,
// photo evidence, invoice delivery, and quality exceptions.
export const qaInspectionsTable = pgTable("qa_inspections", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  jobId: integer("job_id"),

  inspectedAt: timestamp("inspected_at", { withTimezone: true }).notNull().defaultNow(),
  inspectedById: integer("inspected_by_id"),

  walkthroughCompleted: boolean("walkthrough_completed").notNull().default(false),
  cleanupCompleted: boolean("cleanup_completed").notNull().default(false),
  customerSignOff: boolean("customer_sign_off").notNull().default(false),
  signOffSignature: text("sign_off_signature"),
  signOffAt: timestamp("sign_off_at", { withTimezone: true }),

  invoiceDelivered: boolean("invoice_delivered").notNull().default(false),
  invoiceDeliveredAt: timestamp("invoice_delivered_at", { withTimezone: true }),

  // overall: pass | fail | pass_with_exceptions
  overallResult: text("overall_result").notNull().default("pass"),
  qualityScore: integer("quality_score"), // 1–10

  exceptionsNoted: text("exceptions_noted"),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpNotes: text("follow_up_notes"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQaInspectionSchema = createInsertSchema(qaInspectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQaInspection = z.infer<typeof insertQaInspectionSchema>;
export type QaInspection = typeof qaInspectionsTable.$inferSelect;
