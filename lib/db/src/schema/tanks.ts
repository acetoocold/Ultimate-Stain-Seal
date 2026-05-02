import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon tank intelligence — gallons available, additions, usage, color state,
// color-change history, gas-tank state. The variance/learning engine reads from here.
export const tanksTable = pgTable("tanks", {
  id: serial("id").primaryKey(),
  // tank_type: oil_stain | bleach_concentrate | water | gas | other
  tankType: text("tank_type").notNull().default("oil_stain"),
  label: text("label").notNull(),
  capacityGallons: numeric("capacity_gallons", { precision: 8, scale: 2 }).notNull().default("100"),
  gallonsAvailable: numeric("gallons_available", { precision: 8, scale: 2 }).notNull().default("0"),
  // For oil tanks — light_brown | medium_brown | dark_brown | mixed | other
  colorState: text("color_state"),
  // For gas tanks: full | half | empty
  gasLevel: text("gas_level"),
  // 25 gallons by default (matches T3 trigger threshold)
  refillThreshold: numeric("refill_threshold", { precision: 8, scale: 2 }).default("25"),
  lastRefillAt: timestamp("last_refill_at", { withTimezone: true }),
  lastUpdatedById: integer("last_updated_by_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tankEventsTable = pgTable("tank_events", {
  id: serial("id").primaryKey(),
  tankId: integer("tank_id").notNull(),
  // event_type: refill | usage | color_change | mix_adjusted | gas_level_change | inspection
  eventType: text("event_type").notNull(),
  gallonsBefore: numeric("gallons_before", { precision: 8, scale: 2 }),
  gallonsAfter: numeric("gallons_after", { precision: 8, scale: 2 }),
  gallonsDelta: numeric("gallons_delta", { precision: 8, scale: 2 }),
  colorBefore: text("color_before"),
  colorAfter: text("color_after"),
  gasBefore: text("gas_before"),
  gasAfter: text("gas_after"),
  projectId: integer("project_id"),
  recordedById: integer("recorded_by_id"),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTankSchema = createInsertSchema(tanksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTank = z.infer<typeof insertTankSchema>;
export type Tank = typeof tanksTable.$inferSelect;

export const insertTankEventSchema = createInsertSchema(tankEventsTable).omit({ id: true, createdAt: true });
export type InsertTankEvent = z.infer<typeof insertTankEventSchema>;
export type TankEvent = typeof tankEventsTable.$inferSelect;
