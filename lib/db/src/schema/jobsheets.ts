import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsheetsTable = pgTable("jobsheets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  jobId: integer("job_id"),
  workOrderNumber: text("work_order_number"),
  crewLead: text("crew_lead"),
  crewMembers: text("crew_members"),
  workDate: timestamp("work_date", { withTimezone: true }),
  startTime: text("start_time"),
  endTime: text("end_time"),
  weatherConditions: text("weather_conditions"),
  temperature: integer("temperature"),
  humidity: integer("humidity"),
  surfaceMoisture: text("surface_moisture"),
  areasCompleted: text("areas_completed"),
  productsApplied: text("products_applied"),
  coatsApplied: integer("coats_applied"),
  applicationMethod: text("application_method"),
  issuesEncountered: text("issues_encountered"),
  customerPresent: boolean("customer_present"),
  customerSignature: text("customer_signature"),
  inspectionNotes: text("inspection_notes"),
  fieldNotes: text("field_notes"),
  followUpRequired: boolean("follow_up_required"),
  followUpNotes: text("follow_up_notes"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobsheetSchema = createInsertSchema(jobsheetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobsheet = z.infer<typeof insertJobsheetSchema>;
export type Jobsheet = typeof jobsheetsTable.$inferSelect;
