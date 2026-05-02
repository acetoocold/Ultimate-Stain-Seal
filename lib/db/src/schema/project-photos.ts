import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon field-evidence categories: front, back, panels, gates, hardware, problem areas,
// plus mapped panel logic for estimate precision.
export const projectPhotosTable = pgTable("project_photos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  diagnosisId: integer("diagnosis_id"),
  jobId: integer("job_id"),
  jobsheetId: integer("jobsheet_id"),

  // category: front | back | panel | gate | hardware | problem_area | before | after | other
  category: text("category").notNull().default("other"),
  panelNumber: integer("panel_number"),    // For mapped panel logic
  caption: text("caption"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  // 'before' or 'after' phase tag (orthogonal to category)
  phase: text("phase").default("during"),  // before | during | after
  takenAt: timestamp("taken_at", { withTimezone: true }),
  takenById: integer("taken_by_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectPhotoSchema = createInsertSchema(projectPhotosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProjectPhoto = z.infer<typeof insertProjectPhotoSchema>;
export type ProjectPhoto = typeof projectPhotosTable.$inferSelect;
