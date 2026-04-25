import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const materialsTable = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category").notNull().default("equipment"),
  trackingType: text("tracking_type").notNull().default("status"),
  liquidGoldColor: text("liquid_gold_color"), // dark_brown, medium_brown, light_brown
  purchaseLocationId: integer("purchase_location_id"),
  containerCapacity: numeric("container_capacity", { precision: 10, scale: 2 }),
  brand: text("brand"),
  description: text("description"),
  productImage: text("product_image"), // URL to product image for Liquid Gold and other items
  unitType: text("unit_type").notNull().default("each"),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  coveragePerUnit: numeric("coverage_per_unit", { precision: 10, scale: 2 }),
  coverageUnit: text("coverage_unit"),
  notes: text("notes"),
  activeStatus: text("active_status").notNull().default("active"), // active, needs_attention, inactive
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull(),
  quantityOnHand: numeric("quantity_on_hand", { precision: 10, scale: 2 }).default("0"),
  reorderPoint: numeric("reorder_point", { precision: 10, scale: 2 }),
  reorderQuantity: numeric("reorder_quantity", { precision: 10, scale: 2 }),
  status: text("status"),
  statusNotes: text("status_notes"),
  colorContent: text("color_content"),
  contentDescription: text("content_description"),
  location: text("location"),
  lastRestockedAt: timestamp("last_restocked_at", { withTimezone: true }),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const projectMaterialsTable = pgTable("project_materials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  materialId: integer("material_id").notNull(),
  quantityEstimated: numeric("quantity_estimated", { precision: 10, scale: 2 }),
  quantityUsed: numeric("quantity_used", { precision: 10, scale: 2 }),
  unitCostAtTime: numeric("unit_cost_at_time", { precision: 10, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  sprayRatioPredicted: numeric("spray_ratio_predicted", { precision: 6, scale: 2 }), // Based on total_area / spray_ratio
  totalAreaSqFt: numeric("total_area_sq_ft", { precision: 10, scale: 2 }), // For spray calculations
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMaterialSchema = createInsertSchema(materialsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materialsTable.$inferSelect;

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

export const insertProjectMaterialSchema = createInsertSchema(projectMaterialsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectMaterial = z.infer<typeof insertProjectMaterialSchema>;
export type ProjectMaterial = typeof projectMaterialsTable.$inferSelect;
