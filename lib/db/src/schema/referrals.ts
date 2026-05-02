import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canon: referral intelligence preserves source, contact status, interest status,
// who called, when, and next-step date. This converts word-of-mouth into a pipeline.
export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),

  // Who referred whom
  referrerCustomerId: integer("referrer_customer_id"),    // Existing customer who referred
  referrerName: text("referrer_name"),                    // Free-text name if not a customer
  partnerSourceId: integer("partner_source_id"),          // HOA, landscaper, lumber yard, etc.

  // Lead identity
  leadFirstName: text("lead_first_name"),
  leadLastName: text("lead_last_name"),
  leadEmail: text("lead_email"),
  leadPhone: text("lead_phone"),
  leadAddress: text("lead_address"),
  leadCity: text("lead_city"),
  leadState: text("lead_state"),
  leadZip: text("lead_zip"),

  // Optional conversion: when the lead became a customer
  convertedCustomerId: integer("converted_customer_id"),

  // Follow-up state
  contactStatus: text("contact_status").notNull().default("not_contacted"), // not_contacted | contacted | unreachable
  interestStatus: text("interest_status").notNull().default("unknown"),     // unknown | interested | not_interested | converted
  contactedById: integer("contacted_by_id"),
  contactedAt: timestamp("contacted_at", { withTimezone: true }),
  nextCallNeeded: boolean("next_call_needed").notNull().default(true),
  nextCallAt: timestamp("next_call_at", { withTimezone: true }),

  source: text("source").notNull().default("customer_referral"), // customer_referral | partner | review | website | google | local_seo | ads | other
  channel: text("channel"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Partner sources — HOAs, landscapers, lumber yards, pest companies, etc.
export const partnerSourcesTable = pgTable("partner_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  partnerType: text("partner_type").notNull().default("other"), // hoa | landscaper | lumber_yard | pest | realtor | other
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReferralSchema = createInsertSchema(referralsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;

export const insertPartnerSourceSchema = createInsertSchema(partnerSourcesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartnerSource = z.infer<typeof insertPartnerSourceSchema>;
export type PartnerSource = typeof partnerSourcesTable.$inferSelect;
