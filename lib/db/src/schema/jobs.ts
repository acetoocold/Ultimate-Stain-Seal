import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  customerId: integer("customer_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  jobName: text("job_name").notNull(),
  status: text("status").notNull().default("scheduled"),
  jobType: text("job_type").notNull().default("application"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  scheduledTimeStart: text("scheduled_time_start"),
  scheduledTimeEnd: text("scheduled_time_end"),
  actualStartTime: timestamp("actual_start_time", { withTimezone: true }),
  actualEndTime: timestamp("actual_end_time", { withTimezone: true }),
  estimatedHours: numeric("estimated_hours", { precision: 6, scale: 2 }),
  actualHours: numeric("actual_hours", { precision: 6, scale: 2 }),
  extraHelpers: integer("extra_helpers").default(0),
  notes: text("notes"),
  completionNotes: text("completion_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
