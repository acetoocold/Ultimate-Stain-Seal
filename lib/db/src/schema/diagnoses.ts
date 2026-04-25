import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diagnosesTable = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  customerId: integer("customer_id").notNull(),

  // ===== WOOD & STRUCTURE =====
  // woodType: fence(3mo), pergola(2mo), deck(1mo), dock(2mo), siding(1mo)
  woodType: text("wood_type").notNull().default("fence"),
  // fenceType: wood_privacy, side_by_side, post_rail, split_rail
  fenceType: text("fence_type").notNull().default("wood_privacy"),
  // Posts standalone category: excellent, good, fair, poor, needs_repair
  postsCondition: text("posts_condition").notNull().default("fair"),

  // ===== DIMENSIONS & STRUCTURE =====
  totalLinearFeet: numeric("total_linear_feet", { precision: 10, scale: 2 }),
  averageHeight: numeric("average_height", { precision: 10, scale: 2 }),
  totalSqFt: numeric("total_sq_ft", { precision: 10, scale: 2 }),
  numberOfSections: integer("number_of_sections"),
  numberOfPosts: integer("number_of_posts"),
  numberOfGates: integer("number_of_gates"),
  // Synchronization tracking: are sections at same age/condition
  synchronizationStatus: text("synchronization_status").notNull().default("needs_sync"), // 'synchronized' or 'needs_sync'

  // ===== HISTORY & TIMELINE =====
  lastStainedYear: integer("last_stained_year"),
  lastStainedYearIsExact: boolean("last_stained_year_is_exact").default(false), // true=exact, false=predicted
  nextPredictedSealingDate: timestamp("next_predicted_sealing_date", { withTimezone: true }),
  // healthStatus: ultimate_health, good, needs_attention, permanent_damage_risk
  healthStatus: text("health_status").notNull().default("ultimate_health"),

  // ===== CURRENT STATE (3 LEVELS: Healthy, Normal, Damaged) =====
  // stain_and_sealed, bare, weathered
  currentFinish: text("current_finish").notNull().default("bare"),
  // Weather Exposure: full_sun(damage), partial_shade(normal), full_shade(healthy), near_water(damage)
  weatherExposure: text("weather_exposure").notNull().default("partial_shade"),
  // Moisture: water_logged(damage), high(damage), normal(normal), dry(healthy)
  moistureLevel: text("moisture_level").notNull().default("normal"),

  // ===== CONDITION ISSUES (Boolean: Present = -3 months from sealing date) =====
  moldMildew: boolean("mold_mildew").notNull().default(false),
  cracking: boolean("cracking").notNull().default(false),
  graying: boolean("graying").notNull().default(false),
  repairNeeded: boolean("repair_needed").notNull().default(false),
  repairNotes: text("repair_notes"),

  // ===== PRODUCTS & RECOMMENDATIONS =====
  // Ultimate Liquid Gold (default) or customer choice
  recommendedBrand: text("recommended_brand").notNull().default("Ultimate Liquid Gold"),
  // stain or seal (no clear_coat)
  recommendedProductType: text("recommended_product_type").notNull().default("stain"),
  recommendedCoats: integer("recommended_coats"),
  productColor: text("product_color"),
  // Prep work required: none, light_cleaning, power_wash, sand, scrape, bleach_treat
  prepRequired: text("prep_required").notNull().default("none"),
  careNotes: text("care_notes"),

  // ===== COST ESTIMATES =====
  estimatedProductGallons: numeric("estimated_product_gallons", { precision: 10, scale: 2 }),
  estimatedLaborHours: numeric("estimated_labor_hours", { precision: 10, scale: 2 }),
  estimatedMaterialCost: numeric("estimated_material_cost", { precision: 10, scale: 2 }),
  estimatedBrandUpsell: numeric("estimated_brand_upsell", { precision: 10, scale: 2 }).default("0"), // off-brand charge
  estimatedLaborCost: numeric("estimated_labor_cost", { precision: 10, scale: 2 }),
  estimatedTotal: numeric("estimated_total", { precision: 10, scale: 2 }),

  // ===== AUDIT =====
  diagnosedById: integer("diagnosed_by_id"),
  diagnosedAt: timestamp("diagnosed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ===== DIAGNOSIS SECTIONS =====
// Track individual sections: different lengths, heights, sides stained
export const diagnosisSectionsTable = pgTable("diagnosis_sections", {
  id: serial("id").primaryKey(),
  diagnosisId: integer("diagnosis_id").notNull(),
  sectionNumber: integer("section_number").notNull(), // 1, 2, 3, etc.
  linearFeet: numeric("linear_feet", { precision: 10, scale: 2 }),
  height: numeric("height", { precision: 10, scale: 2 }),
  sqFt: numeric("sq_ft", { precision: 10, scale: 2 }), // calculated: linearFeet × height
  // Sides completed: front, back, both, or none (if not done on this visit)
  sidesCompleted: text("sides_completed").notNull().default("both"), // 'front' | 'back' | 'both' | 'none'
  sectionNotes: text("section_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDiagnosisSchema = createInsertSchema(diagnosesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type Diagnosis = typeof diagnosesTable.$inferSelect;

export const insertDiagnosisSectionSchema = createInsertSchema(diagnosisSectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiagnosisSection = z.infer<typeof insertDiagnosisSectionSchema>;
export type DiagnosisSection = typeof diagnosisSectionsTable.$inferSelect;
