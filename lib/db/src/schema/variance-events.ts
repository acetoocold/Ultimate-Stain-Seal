import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon: variance is what upgrades the database from storage to forecasting.
// Captures predicted vs actual material usage events for the variance learning engine (T2).
export const varianceEventsTable = pgTable("variance_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  jobId: integer("job_id"),
  materialId: integer("material_id"),

  // measurement_type: gallons | hours | dollars
  measurementType: text("measurement_type").notNull().default("gallons"),
  predicted: numeric("predicted", { precision: 12, scale: 2 }).notNull(),
  actual: numeric("actual", { precision: 12, scale: 2 }).notNull(),
  delta: numeric("delta", { precision: 12, scale: 2 }).notNull(),
  // Difference as proportion: (actual - predicted) / predicted
  deltaPercent: numeric("delta_percent", { precision: 6, scale: 4 }).notNull(),
  // status: exact | extra | waste | none
  status: text("status").notNull().default("none"),
  // Whether this event tripped the >15% T2 threshold
  thresholdExceeded: boolean("threshold_exceeded").notNull().default(false),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per crew/wood-type rolling coverage profile updated by T2
export const materialCoverageProfilesTable = pgTable("material_coverage_profiles", {
  id: serial("id").primaryKey(),
  crewId: integer("crew_id"),
  woodType: text("wood_type"),
  materialId: integer("material_id"),
  // Rolling avg sq ft per gallon based on actual jobs
  avgCoverageSqFtPerGallon: numeric("avg_coverage_sq_ft_per_gallon", { precision: 8, scale: 2 }),
  sampleSize: integer("sample_size").notNull().default(0),
  lastVarianceEventId: integer("last_variance_event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVarianceEventSchema = createInsertSchema(varianceEventsTable).omit({ id: true, createdAt: true });
export type InsertVarianceEvent = z.infer<typeof insertVarianceEventSchema>;
export type VarianceEvent = typeof varianceEventsTable.$inferSelect;

export const insertMaterialCoverageProfileSchema = createInsertSchema(materialCoverageProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaterialCoverageProfile = z.infer<typeof insertMaterialCoverageProfileSchema>;
export type MaterialCoverageProfile = typeof materialCoverageProfilesTable.$inferSelect;
