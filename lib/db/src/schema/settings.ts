import { pgTable, text, serial, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
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

  // ===== BATCH & PRODUCT COSTS =====
  batchOilGallons: numeric("batch_oil_gallons", { precision: 6, scale: 2 }).default("20"),
  batchConcentrateGallons: numeric("batch_concentrate_gallons", { precision: 6, scale: 2 }).default("5"),
  oilCostPerGallon: numeric("oil_cost_per_gallon", { precision: 10, scale: 2 }),
  concentrateCostPerGallon: numeric("concentrate_cost_per_gallon", { precision: 10, scale: 2 }),

  // ===== PRODUCT PRICING & BRANDING =====
  defaultBrand: text("default_brand").notNull().default("Ultimate Liquid Gold"),
  ultimateLiquidGoldUpsell: numeric("ultimate_liquid_gold_upsell", { precision: 10, scale: 2 }).default("0"), // Upcharge for ULG brand
  offBrandProductCharge: numeric("off_brand_product_charge", { precision: 10, scale: 2 }).default("50"), // Upcharge for non-ULG brands

  // ===== SPRAY & COVERAGE RATIOS =====
  sprayRatio: numeric("spray_ratio", { precision: 6, scale: 2 }).default("0.75"), // sq ft per gallon

  // ===== LIQUID GOLD BUNDLE CONFIGURATION =====
  liquidGoldBundleSize: numeric("liquid_gold_bundle_size", { precision: 6, scale: 2 }).default("25"), // 25 gallons total
  liquidGoldClearOilGallons: numeric("liquid_gold_clear_oil_gallons", { precision: 6, scale: 2 }).default("20"), // 4×5gal = 20 gallons
  liquidGoldConcentrateGallons: numeric("liquid_gold_concentrate_gallons", { precision: 6, scale: 2 }).default("5"), // 1×1gal = 5 gallons
  liquidGoldBundleCostPerBundle: numeric("liquid_gold_bundle_cost_per_bundle", { precision: 10, scale: 2 }),
  liquidGoldBundlePrice: numeric("liquid_gold_bundle_price", { precision: 10, scale: 2 }), // Selling price

  // ===== EQUIPMENT TRACKING =====
  tankCapacity: numeric("tank_capacity", { precision: 6, scale: 2 }).default("100"), // 100-gallon spray rig
  gasStorageVolume: numeric("gas_storage_volume", { precision: 6, scale: 2 }), // 5 gallons total (two 2.5 gal jugs)

  // ===== WINDOW SCHEDULING =====
  windowSchedulingEnabled: boolean("window_scheduling_enabled").notNull().default(true),
  minimumWindowDays: integer("minimum_window_days").default(2), // Minimum 2-day window for customers

  // ===== WEATHER INTEGRATION =====
  weatherApiKey: text("weather_api_key"),
  weatherApiProvider: text("weather_api_provider").default("openweather"), // openweather, etc.

  // ===== DISCLAIMER CONFIGURATION =====
  paymentDueDisclaimer: text("payment_due_disclaimer").default("Payment due at end of job on same date as job completion unless washed information present."),
  materialCostDisclaimer: text("material_cost_disclaimer").default("New work outside current estimate: labor and material costs subject to change."),

  // ===== SERVICE TYPES =====
  serviceTypes: text("service_types").default("stain,seal,clean,estimate/diagnosis"), // comma-separated

  // ===== FEATURE FLAGS =====
  autoActivityLog: boolean("auto_activity_log").notNull().default(true),
  dataPersonalizationEnabled: boolean("data_personalization_enabled").notNull().default(true),
  digitalSignatureRequired: boolean("digital_signature_required").notNull().default(true),

  // ===== INTEGRATION LINKS =====
  externalApiLinks: text("external_api_links"), // JSON object for future API integrations

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
