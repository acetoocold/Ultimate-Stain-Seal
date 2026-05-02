import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Used by Trigger T5 (compliance push: SDS/MSDS to crew lead) and other system pushes.
// Generic notification surface — distinct from reminders (which are due-dated to-dos).
export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  // notification_type: compliance_push | sds_msds | tank_alert | variance_alert |
  //   warranty_response_due | system | info
  notificationType: text("notification_type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  severity: text("severity").notNull().default("info"), // info | warning | critical
  // Recipient role(s): "crew_lead" | "owner" | "manager" | "field" | "all"
  recipientRole: text("recipient_role"),
  recipientUserId: integer("recipient_user_id"),
  projectId: integer("project_id"),
  jobId: integer("job_id"),
  tankId: integer("tank_id"),
  // External payload links: SDS PDF URL, etc.
  linkUrl: text("link_url"),
  linkLabel: text("link_label"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
