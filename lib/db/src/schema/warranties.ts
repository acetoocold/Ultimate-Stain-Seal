import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon: workmanship warranty (5yr), product protection (10yr), claim events,
// response timing (target 48 hours), linkage back to project + survey.
export const warrantiesTable = pgTable("warranties", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  customerId: integer("customer_id").notNull(),
  propertyId: integer("property_id"),

  // workmanship | product
  warrantyType: text("warranty_type").notNull().default("workmanship"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  // active | expired | voided | claimed
  status: text("status").notNull().default("active"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const warrantyEventsTable = pgTable("warranty_events", {
  id: serial("id").primaryKey(),
  warrantyId: integer("warranty_id").notNull(),
  // event_type: claim_filed | response | inspection | resolution | voided
  eventType: text("event_type").notNull(),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  responseHours: integer("response_hours"),
  reportedById: integer("reported_by_id"),
  handledById: integer("handled_by_id"),
  description: text("description"),
  resolutionNotes: text("resolution_notes"),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWarrantySchema = createInsertSchema(warrantiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWarranty = z.infer<typeof insertWarrantySchema>;
export type Warranty = typeof warrantiesTable.$inferSelect;

export const insertWarrantyEventSchema = createInsertSchema(warrantyEventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWarrantyEvent = z.infer<typeof insertWarrantyEventSchema>;
export type WarrantyEvent = typeof warrantyEventsTable.$inferSelect;
