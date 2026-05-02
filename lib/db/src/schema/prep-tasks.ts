import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon prep categories: pressure washing, scraping, sanding, board replacement,
// post replacement, caulking, filler/epoxy, mildew treatment, masking, landscape protection.
export const prepTasksTable = pgTable("prep_tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // code: pressure_wash | scrape | sand | board_replace | post_replace | caulk | filler | mildew_treat | mask | landscape_protect | other
  code: text("code").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const projectPrepTable = pgTable("project_prep", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  prepTaskId: integer("prep_task_id").notNull(),
  // intensity: light | medium | heavy
  intensity: text("intensity").notNull().default("medium"),
  estimatedHours: numeric("estimated_hours", { precision: 6, scale: 2 }),
  actualHours: numeric("actual_hours", { precision: 6, scale: 2 }),
  quantity: integer("quantity"), // e.g., # of boards or posts replaced
  customCharge: numeric("custom_charge", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPrepTaskSchema = createInsertSchema(prepTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrepTask = z.infer<typeof insertPrepTaskSchema>;
export type PrepTask = typeof prepTasksTable.$inferSelect;

export const insertProjectPrepSchema = createInsertSchema(projectPrepTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectPrep = z.infer<typeof insertProjectPrepSchema>;
export type ProjectPrep = typeof projectPrepTable.$inferSelect;
