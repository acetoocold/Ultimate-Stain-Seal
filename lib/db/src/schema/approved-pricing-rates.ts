import { pgTable, text, serial, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon: customer-facing fence pricing uses ONLY this approved menu of $/sqft rates.
// Material cost per gallon is internal-only and must NEVER be the client price engine.
// Fixed rate options: $0.60, $0.65, $0.70, $0.75, $0.80, $0.85, $0.90, $0.95, $1.00.
export const approvedPricingRatesTable = pgTable("approved_pricing_rates", {
  id: serial("id").primaryKey(),
  ratePerSqFt: numeric("rate_per_sq_ft", { precision: 6, scale: 4 }).notNull(),
  label: text("label").notNull(),                 // e.g., "Standard $0.85"
  tier: text("tier").notNull().default("standard"), // budget | standard | premium
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: numeric("sort_order", { precision: 6, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApprovedPricingRateSchema = createInsertSchema(approvedPricingRatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApprovedPricingRate = z.infer<typeof insertApprovedPricingRateSchema>;
export type ApprovedPricingRate = typeof approvedPricingRatesTable.$inferSelect;
