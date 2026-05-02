import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon Dallas-area zones: North, South, East, West Dallas, Plano, Irving,
// Garland, Richardson, plus expansion-ready territories.
export const territoriesTable = pgTable("territories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region"), // e.g., "DFW Metro"
  // ZIP coverage stored as comma-separated list (kept simple; can split later if needed)
  zipCodes: text("zip_codes"),
  cities: text("cities"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTerritorySchema = createInsertSchema(territoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerritory = z.infer<typeof insertTerritorySchema>;
export type Territory = typeof territoriesTable.$inferSelect;
