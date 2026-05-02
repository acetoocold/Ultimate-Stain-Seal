import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Catalog of liabilities — pools, plants, vehicles, sheds, runoff, etc.
// Canon: each project may attach many liabilities, and a single liability item
// (e.g., "swimming pool") is reusable across projects.
export const liabilitiesTable = pgTable("liabilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("hazard"),
  // hazard | landscape | structure | vehicle | runoff | other
  description: text("description"),
  defaultMaskingNotes: text("default_masking_notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// project ↔ liability with per-project context
export const projectLiabilitiesTable = pgTable("project_liabilities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  liabilityId: integer("liability_id").notNull(),
  severity: text("severity").notNull().default("medium"), // low | medium | high
  maskingRequired: boolean("masking_required").notNull().default(false),
  notes: text("notes"),
  customCharge: numeric("custom_charge", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLiabilitySchema = createInsertSchema(liabilitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLiability = z.infer<typeof insertLiabilitySchema>;
export type Liability = typeof liabilitiesTable.$inferSelect;

export const insertProjectLiabilitySchema = createInsertSchema(projectLiabilitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectLiability = z.infer<typeof insertProjectLiabilitySchema>;
export type ProjectLiability = typeof projectLiabilitiesTable.$inferSelect;
