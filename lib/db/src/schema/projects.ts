import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  propertyId: integer("property_id"),
  assignedToId: integer("assigned_to_id"),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("inquiry"),
  serviceType: text("service_type").notNull().default("stain"),
  priority: text("priority").notNull().default("medium"),
  leadSource: text("lead_source"),
  notes: text("notes"),
  totalAmount: real("total_amount"),
  paidAmount: real("paid_amount").default(0),
  balanceDue: real("balance_due").default(0),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  glideId: text("glide_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
