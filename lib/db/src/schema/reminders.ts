import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon reminder types: re-stain (5yr), annual maintenance, invoice follow-up,
// referral follow-up, employee review, tank refill, warranty response.
export const remindersTable = pgTable("reminders", {
  id: serial("id").primaryKey(),
  // reminder_type:
  //   restain | annual_maintenance | invoice_followup | referral_followup |
  //   employee_review | tank_refill | warranty_response | qa_followup | custom
  reminderType: text("reminder_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // low | medium | high | urgent

  // Optional links — the reminder may be about any object
  customerId: integer("customer_id"),
  propertyId: integer("property_id"),
  projectId: integer("project_id"),
  invoiceId: integer("invoice_id"),
  referralId: integer("referral_id"),
  tankId: integer("tank_id"),
  warrantyId: integer("warranty_id"),
  userId: integer("user_id"),

  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedById: integer("completed_by_id"),
  isCompleted: boolean("is_completed").notNull().default(false),
  nextStepNotes: text("next_step_notes"),

  // Source of the reminder — 'auto:trigger_name' or 'manual'
  source: text("source").notNull().default("manual"),
  assignedToId: integer("assigned_to_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReminderSchema = createInsertSchema(remindersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;
