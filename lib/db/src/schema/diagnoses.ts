import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diagnosesTable = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  customerId: integer("customer_id").notNull(),
  woodType: text("wood_type").notNull().default("fence"),
  fenceType: text("fence_type").notNull().default("wood_privacy"),
  fenceCondition: text("fence_condition").notNull().default("fair"),
  totalLinearFeet: numeric("total_linear_feet", { precision: 10, scale: 2 }),
  averageHeight: numeric("average_height", { precision: 10, scale: 2 }),
  totalSqFt: numeric("total_sq_ft", { precision: 10, scale: 2 }),
  numberOfSections: integer("number_of_sections"),
  numberOfPosts: integer("number_of_posts"),
  numberOfGates: integer("number_of_gates"),
  lastStainedYear: integer("last_stained_year"),
  currentFinish: text("current_finish"),
  weatherExposure: text("weather_exposure"),
  moistureLevel: text("moisture_level"),
  moldMildew: boolean("mold_mildew"),
  cracking: boolean("cracking"),
  graying: boolean("graying"),
  repairNeeded: boolean("repair_needed"),
  repairNotes: text("repair_notes"),
  recommendedProduct: text("recommended_product"),
  recommendedProductType: text("recommended_product_type"),
  recommendedCoats: integer("recommended_coats"),
  productColor: text("product_color"),
  prepRequired: text("prep_required"),
  careNotes: text("care_notes"),
  estimatedProductGallons: numeric("estimated_product_gallons", { precision: 10, scale: 2 }),
  estimatedLaborHours: numeric("estimated_labor_hours", { precision: 10, scale: 2 }),
  estimatedMaterialCost: numeric("estimated_material_cost", { precision: 10, scale: 2 }),
  estimatedLaborCost: numeric("estimated_labor_cost", { precision: 10, scale: 2 }),
  estimatedTotal: numeric("estimated_total", { precision: 10, scale: 2 }),
  diagnosedById: integer("diagnosed_by_id"),
  diagnosedAt: timestamp("diagnosed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDiagnosisSchema = createInsertSchema(diagnosesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type Diagnosis = typeof diagnosesTable.$inferSelect;
