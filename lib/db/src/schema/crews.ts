import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon: crews are first-class — lead + technicians, with per-job pay (NOT hourly).
// A project may be assigned a crew, and individual members get per-job pay.
export const crewsTable = pgTable("crews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leadUserId: integer("lead_user_id"),
  territoryId: integer("territory_id"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Crew membership (employees on a crew)
export const crewMembersTable = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  crewId: integer("crew_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("technician"), // lead | technician | runner | apprentice
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per-job assignment with per-job pay (canon)
export const projectCrewMembersTable = pgTable("project_crew_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  jobId: integer("job_id"),
  crewId: integer("crew_id"),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("technician"),
  // pay_per_job is the CANON compensation truth
  payPerJob: numeric("pay_per_job", { precision: 10, scale: 2 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCrewSchema = createInsertSchema(crewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrew = z.infer<typeof insertCrewSchema>;
export type Crew = typeof crewsTable.$inferSelect;

export const insertCrewMemberSchema = createInsertSchema(crewMembersTable).omit({ id: true, createdAt: true });
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;
export type CrewMember = typeof crewMembersTable.$inferSelect;

export const insertProjectCrewMemberSchema = createInsertSchema(projectCrewMembersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectCrewMember = z.infer<typeof insertProjectCrewMemberSchema>;
export type ProjectCrewMember = typeof projectCrewMembersTable.$inferSelect;
