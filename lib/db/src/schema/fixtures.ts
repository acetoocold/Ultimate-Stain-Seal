import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Fixtures — non-fence items that can be priced individually on a project
// (gates, pergolas, decks, posts, custom features). Canon: optional 'None' default.
export const fixturesTable = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // category: gate | pergola | deck | post | bench | trim | other
  category: text("category").notNull().default("other"),
  defaultPrice: numeric("default_price", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const projectFixturesTable = pgTable("project_fixtures", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  fixtureId: integer("fixture_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  customPrice: numeric("custom_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFixtureSchema = createInsertSchema(fixturesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type Fixture = typeof fixturesTable.$inferSelect;

export const insertProjectFixtureSchema = createInsertSchema(projectFixturesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectFixture = z.infer<typeof insertProjectFixtureSchema>;
export type ProjectFixture = typeof projectFixturesTable.$inferSelect;
