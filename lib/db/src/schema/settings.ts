import { pgTable, text, serial, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Ultimate Stain & Seal"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  companyAddress: text("company_address"),
  companyLogoUrl: text("company_logo_url"),
  defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 4 }),
  defaultLaborRate: numeric("default_labor_rate", { precision: 10, scale: 2 }),
  defaultCoverageRate: numeric("default_coverage_rate", { precision: 10, scale: 2 }),
  softDisclaimerText: text("soft_disclaimer_text"),
  hardDisclaimerText: text("hard_disclaimer_text"),
  invoicePrefix: text("invoice_prefix").default("USS"),
  batchOilGallons: numeric("batch_oil_gallons", { precision: 6, scale: 2 }).default("20"),
  batchConcentrateGallons: numeric("batch_concentrate_gallons", { precision: 6, scale: 2 }).default("5"),
  oilCostPerGallon: numeric("oil_cost_per_gallon", { precision: 10, scale: 2 }),
  concentrateCostPerGallon: numeric("concentrate_cost_per_gallon", { precision: 10, scale: 2 }),
  glideApiKey: text("glide_api_key"),
  glideTableId: text("glide_table_id"),
  glideEnabled: boolean("glide_enabled").notNull().default(false),
  autoActivityLog: boolean("auto_activity_log").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pricingRulesTable = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(),
  fenceType: text("fence_type"),
  pricePerSqFt: numeric("price_per_sq_ft", { precision: 10, scale: 4 }),
  pricePerLinearFoot: numeric("price_per_linear_foot", { precision: 10, scale: 4 }),
  minimumCharge: numeric("minimum_charge", { precision: 10, scale: 2 }),
  laborRatePerHour: numeric("labor_rate_per_hour", { precision: 10, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;

export const insertPricingRuleSchema = createInsertSchema(pricingRulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRulesTable.$inferSelect;
