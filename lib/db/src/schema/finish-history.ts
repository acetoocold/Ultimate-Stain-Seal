import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon: prior finish truth must distinguish OIL-based vs WATER-based,
// not collapse into yes/no. Property memory outlasts a single customer relationship.
export const finishHistoryTable = pgTable("finish_history", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  projectId: integer("project_id"),
  diagnosisId: integer("diagnosis_id"),

  // finish_type: oil_based | water_based | unknown | none | mixed
  finishType: text("finish_type").notNull().default("unknown"),
  brand: text("brand"),
  productName: text("product_name"),
  // color_family: light_brown | medium_brown | dark_brown | mixed | other
  colorFamily: text("color_family"),
  colorMix: text("color_mix"),
  numCoats: integer("num_coats"),

  appliedAt: timestamp("applied_at", { withTimezone: true }),
  appliedYearApprox: integer("applied_year_approx"),
  appliedByUss: boolean("applied_by_uss").notNull().default(false),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFinishHistorySchema = createInsertSchema(finishHistoryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFinishHistory = z.infer<typeof insertFinishHistorySchema>;
export type FinishHistory = typeof finishHistoryTable.$inferSelect;
