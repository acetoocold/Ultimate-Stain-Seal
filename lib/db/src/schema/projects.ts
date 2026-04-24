import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  propertyId: integer("property_id"),
  assignedToId: integer("assigned_to_id"),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("inquiry"),
  serviceType: text("service_type").notNull().default("stain"),
  priority: text("priority").notNull().default("medium"),
  leadSource: text("lead_source"),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0"),
  balanceDue: numeric("balance_due", { precision: 10, scale: 2 }).default("0"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  completedDate: timestamp("completed_date", { withTimezone: true }),
  glideId: text("glide_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
