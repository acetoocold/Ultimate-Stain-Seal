import { pgTable, text, serial, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchaseLocationsTable = pgTable("purchase_locations", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  notes: text("notes"), // Hours, special notes about inventory, etc.
  isPreferred: boolean("is_preferred").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPurchaseLocationSchema = createInsertSchema(purchaseLocationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPurchaseLocation = z.infer<typeof insertPurchaseLocationSchema>;
export type PurchaseLocation = typeof purchaseLocationsTable.$inferSelect;
