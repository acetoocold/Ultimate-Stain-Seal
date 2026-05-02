import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon service options: Cleaning/Bleach, Power Wash, Stain & Seal, Small Repairs.
// A project may include one, multiple, or all. Each can carry its own custom price.
// 'serviceCode' values: 'cleaning_bleach' | 'power_wash' | 'stain_seal' | 'small_repairs'
export const projectServicesTable = pgTable("project_services", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  serviceCode: text("service_code").notNull(),
  serviceName: text("service_name").notNull(),
  customPrice: numeric("custom_price", { precision: 10, scale: 2 }),
  // Optional approved $/sqft rate selection for stain_seal services
  approvedRate: numeric("approved_rate", { precision: 6, scale: 4 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectServiceSchema = createInsertSchema(projectServicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectService = z.infer<typeof insertProjectServiceSchema>;
export type ProjectService = typeof projectServicesTable.$inferSelect;
