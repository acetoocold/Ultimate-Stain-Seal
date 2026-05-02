import { eq, and, sql } from "drizzle-orm";
import {
  db,
  remindersTable,
  notificationsTable,
  varianceEventsTable,
  materialCoverageProfilesTable,
  tanksTable,
  tankEventsTable,
  purchaseOrdersTable,
  purchaseOrderLinesTable,
  warrantiesTable,
  complianceDocumentsTable,
  projectsTable,
  customersTable,
  projectServicesTable,
  projectMaterialsTable,
  type Reminder,
  type Notification,
  type VarianceEvent,
  type Tank,
  type PurchaseOrder,
  type Warranty,
} from "@workspace/db";
import { logger } from "./logger";

/** ======================================================================
 *  ACTION ENGINE — five canonical triggers from the blueprint Gemini brief.
 *  Each trigger function is idempotent enough to call from a route handler;
 *  callers don't need to know whether the trigger fired or skipped.
 *  ====================================================================== */

const RESTAIN_YEARS = 5;
const VARIANCE_THRESHOLD = 0.15; // 15%
const TANK_REFILL_FALLBACK = 25;
const WARRANTY_RESPONSE_TARGET_HOURS = 48;

/**
 * T1 — Re-stain trigger.
 * When a project transitions to "completed" with a completedDate, schedule a
 * 5-year re-stain reminder for the customer. Also create the workmanship + product
 * warranty records (5yr / 10yr) since these all attach at project close.
 */
export async function onProjectCompleted(projectId: number): Promise<{
  reminder: Reminder | null;
  workmanshipWarranty: Warranty | null;
  productWarranty: Warranty | null;
}> {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) return { reminder: null, workmanshipWarranty: null, productWarranty: null };
  if (project.status !== "completed" || !project.completedDate) {
    return { reminder: null, workmanshipWarranty: null, productWarranty: null };
  }

  const completedAt = project.completedDate;
  const restainAt = new Date(completedAt);
  restainAt.setFullYear(restainAt.getFullYear() + RESTAIN_YEARS);

  // Idempotency: skip if a restain reminder for this project already exists.
  const [existing] = await db
    .select()
    .from(remindersTable)
    .where(and(eq(remindersTable.projectId, projectId), eq(remindersTable.reminderType, "restain")));

  let reminder: Reminder | null = null;
  if (!existing) {
    const [r] = await db
      .insert(remindersTable)
      .values({
        reminderType: "restain",
        title: `5-year re-stain check for project #${project.id}`,
        description: `Auto-scheduled on project completion. Reach out to confirm condition and offer the re-stain.`,
        priority: "high",
        customerId: project.customerId,
        propertyId: project.propertyId ?? null,
        projectId: project.id,
        dueDate: restainAt,
        source: "auto:project_completed",
      })
      .returning();
    reminder = r;
  } else {
    reminder = existing;
  }

  // Warranties — 5yr workmanship, 10yr product. Skip if already present.
  const existingWarranties = await db
    .select()
    .from(warrantiesTable)
    .where(eq(warrantiesTable.projectId, projectId));
  const has = (t: string) => existingWarranties.some((w) => w.warrantyType === t);

  let workmanshipWarranty: Warranty | null = existingWarranties.find((w) => w.warrantyType === "workmanship") ?? null;
  let productWarranty: Warranty | null = existingWarranties.find((w) => w.warrantyType === "product") ?? null;

  if (!has("workmanship")) {
    const wmExpires = new Date(completedAt);
    wmExpires.setFullYear(wmExpires.getFullYear() + 5);
    const [w] = await db
      .insert(warrantiesTable)
      .values({
        projectId: project.id,
        customerId: project.customerId,
        propertyId: project.propertyId ?? null,
        warrantyType: "workmanship",
        startDate: completedAt,
        expiresAt: wmExpires,
        status: "active",
      })
      .returning();
    workmanshipWarranty = w;
  }
  if (!has("product")) {
    const pExpires = new Date(completedAt);
    pExpires.setFullYear(pExpires.getFullYear() + 10);
    const [w] = await db
      .insert(warrantiesTable)
      .values({
        projectId: project.id,
        customerId: project.customerId,
        propertyId: project.propertyId ?? null,
        warrantyType: "product",
        startDate: completedAt,
        expiresAt: pExpires,
        status: "active",
      })
      .returning();
    productWarranty = w;
  }

  logger.info({ projectId, reminderId: reminder?.id }, "T1 onProjectCompleted fired");
  return { reminder, workmanshipWarranty, productWarranty };
}

/**
 * T2 — Variance learning.
 * On project close (or post-job material reconciliation), compare predicted
 * vs actual gallons. If actual exceeds predicted by >15%, write a variance event,
 * raise a system notification, and update the rolling coverage profile for the
 * crew + wood type.
 */
export async function recordProjectVariance(projectId: number, opts?: { crewId?: number | null; woodType?: string | null }): Promise<VarianceEvent[]> {
  const projectMats = await db
    .select()
    .from(projectMaterialsTable)
    .where(eq(projectMaterialsTable.projectId, projectId));

  const events: VarianceEvent[] = [];
  for (const pm of projectMats) {
    const predicted = pm.quantityEstimated ? Number(pm.quantityEstimated) : null;
    const actual = pm.quantityUsed ? Number(pm.quantityUsed) : null;
    if (predicted == null || actual == null || predicted <= 0) continue;

    const delta = actual - predicted;
    const deltaPercent = delta / predicted;
    const thresholdExceeded = Math.abs(deltaPercent) > VARIANCE_THRESHOLD;
    let status: "exact" | "extra" | "waste" | "none" = "none";
    if (Math.abs(deltaPercent) < 0.01) status = "exact";
    else if (delta > 0) status = "waste";
    else status = "extra";

    const [event] = await db
      .insert(varianceEventsTable)
      .values({
        projectId,
        materialId: pm.materialId,
        measurementType: "gallons",
        predicted: predicted.toFixed(2),
        actual: actual.toFixed(2),
        delta: delta.toFixed(2),
        deltaPercent: deltaPercent.toFixed(4),
        status,
        thresholdExceeded,
        notes: thresholdExceeded ? `Variance exceeded ${(VARIANCE_THRESHOLD * 100).toFixed(0)}% threshold` : null,
      })
      .returning();
    events.push(event);

    if (thresholdExceeded) {
      await db.insert(notificationsTable).values({
        notificationType: "variance_alert",
        title: `Variance > ${(VARIANCE_THRESHOLD * 100).toFixed(0)}% on project #${projectId}`,
        body: `Predicted ${predicted.toFixed(2)} gal, actual ${actual.toFixed(2)} gal (${(deltaPercent * 100).toFixed(1)}%). Coverage profile updated.`,
        severity: "warning",
        recipientRole: "owner",
        projectId,
        source: "auto:variance",
      });
    }

    // Update rolling coverage profile (crew + woodType + material)
    if (pm.totalAreaSqFt && actual > 0) {
      const coverage = Number(pm.totalAreaSqFt) / actual;
      const [existing] = await db
        .select()
        .from(materialCoverageProfilesTable)
        .where(
          and(
            opts?.crewId != null ? eq(materialCoverageProfilesTable.crewId, opts.crewId) : sql`crew_id IS NULL`,
            opts?.woodType ? eq(materialCoverageProfilesTable.woodType, opts.woodType) : sql`wood_type IS NULL`,
            eq(materialCoverageProfilesTable.materialId, pm.materialId),
          ),
        );

      if (existing) {
        const n = existing.sampleSize + 1;
        const prevAvg = Number(existing.avgCoverageSqFtPerGallon ?? 0);
        const nextAvg = (prevAvg * existing.sampleSize + coverage) / n;
        await db
          .update(materialCoverageProfilesTable)
          .set({
            avgCoverageSqFtPerGallon: nextAvg.toFixed(2),
            sampleSize: n,
            lastVarianceEventId: event.id,
          })
          .where(eq(materialCoverageProfilesTable.id, existing.id));
      } else {
        await db.insert(materialCoverageProfilesTable).values({
          crewId: opts?.crewId ?? null,
          woodType: opts?.woodType ?? null,
          materialId: pm.materialId,
          avgCoverageSqFtPerGallon: coverage.toFixed(2),
          sampleSize: 1,
          lastVarianceEventId: event.id,
        });
      }
    }
  }

  logger.info({ projectId, count: events.length }, "T2 recordProjectVariance fired");
  return events;
}

/**
 * T3 — Tank intelligence.
 * After any tank update or tank_event that changes gallons_available, check
 * whether the tank is below its refill threshold (default 25 gal). If so,
 * create a tank-refill reminder and auto-draft a purchase order.
 *
 * Returns the reminder + PO if created. Idempotent: an open draft PO on the
 * same tank suppresses re-creation.
 */
export async function checkTankRefill(tankId: number): Promise<{ reminder: Reminder | null; purchaseOrder: PurchaseOrder | null }> {
  const [tank] = await db.select().from(tanksTable).where(eq(tanksTable.id, tankId));
  if (!tank) return { reminder: null, purchaseOrder: null };

  const available = Number(tank.gallonsAvailable);
  const threshold = tank.refillThreshold ? Number(tank.refillThreshold) : TANK_REFILL_FALLBACK;
  if (available > threshold) return { reminder: null, purchaseOrder: null };

  // Suppress duplicate auto reminders/POs if one is already open for this tank.
  const [openReminder] = await db
    .select()
    .from(remindersTable)
    .where(
      and(
        eq(remindersTable.tankId, tankId),
        eq(remindersTable.reminderType, "tank_refill"),
        eq(remindersTable.isCompleted, false),
      ),
    );

  let reminder: Reminder | null = openReminder ?? null;
  if (!reminder) {
    const [r] = await db
      .insert(remindersTable)
      .values({
        reminderType: "tank_refill",
        title: `Refill ${tank.label} — ${available.toFixed(1)} gal remaining`,
        description: `Tank dropped below ${threshold} gal threshold. Auto-draft PO created.`,
        priority: "urgent",
        tankId: tank.id,
        dueDate: new Date(),
        source: "auto:tank_refill",
      })
      .returning();
    reminder = r;
  }

  const [openPo] = await db
    .select()
    .from(purchaseOrdersTable)
    .where(
      and(
        eq(purchaseOrdersTable.tankId, tankId),
        eq(purchaseOrdersTable.status, "draft"),
        eq(purchaseOrdersTable.isAutoGenerated, true),
      ),
    );

  let po: PurchaseOrder | null = openPo ?? null;
  if (!po) {
    const [draft] = await db
      .insert(purchaseOrdersTable)
      .values({
        status: "draft",
        source: "auto:tank_refill",
        tankId: tank.id,
        triggeredByReminderId: reminder.id,
        isAutoGenerated: true,
        notes: `Auto-generated for tank ${tank.label}. Verify quantities before submitting.`,
      })
      .returning();
    // Add a single descriptive line; vendor + qty can be filled in.
    await db.insert(purchaseOrderLinesTable).values({
      purchaseOrderId: draft.id,
      description: `Refill ${tank.label} (${tank.tankType}) — recommend ${Math.max(threshold * 2, 50).toFixed(0)} gal`,
      quantity: Math.max(threshold * 2, 50).toFixed(2),
    });
    po = draft;
  }

  logger.info({ tankId, reminderId: reminder.id, poId: po.id }, "T3 checkTankRefill fired");
  return { reminder, purchaseOrder: po };
}

/**
 * T5 — Compliance push.
 * When a stain (or stain_seal) service is added to an active project, push
 * the linked SDS/MSDS notifications to the crew lead.
 */
export async function pushComplianceForService(projectId: number, serviceCode: string): Promise<Notification[]> {
  if (serviceCode !== "stain_seal" && serviceCode !== "stain") return [];

  const docs = await db
    .select()
    .from(complianceDocumentsTable)
    .where(
      and(
        eq(complianceDocumentsTable.docType, "sds"),
        eq(complianceDocumentsTable.isActive, true),
      ),
    );

  const out: Notification[] = [];
  for (const doc of docs) {
    // If the doc is service-scoped, only push when scope matches.
    if (doc.serviceCode && doc.serviceCode !== serviceCode) continue;
    const [n] = await db
      .insert(notificationsTable)
      .values({
        notificationType: "compliance_push",
        title: `SDS: ${doc.title}`,
        body: doc.description ?? `Safety data sheet pushed for project #${projectId}.`,
        severity: "info",
        recipientRole: "crew_lead",
        projectId,
        linkUrl: doc.url,
        linkLabel: "Open SDS",
        source: "auto:stain_service_added",
      })
      .returning();
    out.push(n);
  }

  logger.info({ projectId, serviceCode, pushed: out.length }, "T5 pushComplianceForService fired");
  return out;
}

/**
 * Aggregate helper: warranty-response watchdog. Looks for active warranties with
 * recent claim_filed events older than the response target and raises a reminder.
 * Intended to be called from a cron, but exposed via the routes module as a
 * manual sweep endpoint as well.
 */
export async function sweepWarrantyResponses(): Promise<number> {
  const cutoff = new Date(Date.now() - WARRANTY_RESPONSE_TARGET_HOURS * 60 * 60 * 1000);
  const overdue = await db.execute(sql`
    SELECT we.id, we.warranty_id, we.reported_at, w.project_id, w.customer_id
    FROM warranty_events we
    JOIN warranties w ON w.id = we.warranty_id
    WHERE we.event_type = 'claim_filed'
      AND we.responded_at IS NULL
      AND we.reported_at < ${cutoff}
  `);

  let count = 0;
  for (const row of overdue.rows as Array<{ id: number; warranty_id: number; project_id: number; customer_id: number }>) {
    const [existing] = await db
      .select()
      .from(remindersTable)
      .where(
        and(
          eq(remindersTable.warrantyId, row.warranty_id),
          eq(remindersTable.reminderType, "warranty_response"),
          eq(remindersTable.isCompleted, false),
        ),
      );
    if (existing) continue;
    await db.insert(remindersTable).values({
      reminderType: "warranty_response",
      title: `Warranty response overdue (>${WARRANTY_RESPONSE_TARGET_HOURS}h)`,
      description: `Claim event #${row.id} on warranty #${row.warranty_id} has not been responded to.`,
      priority: "urgent",
      warrantyId: row.warranty_id,
      customerId: row.customer_id,
      projectId: row.project_id,
      dueDate: new Date(),
      source: "auto:warranty_sweep",
    });
    count++;
  }
  return count;
}

/** Convenience: log a tank event AND apply T3 if relevant. */
export async function recordTankEvent(input: {
  tankId: number;
  eventType: string;
  gallonsBefore?: number | null;
  gallonsAfter?: number | null;
  colorBefore?: string | null;
  colorAfter?: string | null;
  gasBefore?: string | null;
  gasAfter?: string | null;
  projectId?: number | null;
  recordedById?: number | null;
  notes?: string | null;
}): Promise<{ event: typeof tankEventsTable.$inferSelect; refill: Awaited<ReturnType<typeof checkTankRefill>> }> {
  const delta =
    input.gallonsBefore != null && input.gallonsAfter != null
      ? input.gallonsAfter - input.gallonsBefore
      : null;
  const [event] = await db
    .insert(tankEventsTable)
    .values({
      tankId: input.tankId,
      eventType: input.eventType,
      gallonsBefore: input.gallonsBefore?.toFixed(2) ?? null,
      gallonsAfter: input.gallonsAfter?.toFixed(2) ?? null,
      gallonsDelta: delta != null ? delta.toFixed(2) : null,
      colorBefore: input.colorBefore ?? null,
      colorAfter: input.colorAfter ?? null,
      gasBefore: input.gasBefore ?? null,
      gasAfter: input.gasAfter ?? null,
      projectId: input.projectId ?? null,
      recordedById: input.recordedById ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  // Sync the tank's current gallons + state.
  const updates: Partial<Tank> = {};
  if (input.gallonsAfter != null) updates.gallonsAvailable = input.gallonsAfter.toFixed(2) as unknown as Tank["gallonsAvailable"];
  if (input.colorAfter) updates.colorState = input.colorAfter;
  if (input.gasAfter) updates.gasLevel = input.gasAfter;
  if (input.eventType === "refill") updates.lastRefillAt = new Date();
  if (Object.keys(updates).length > 0) {
    await db.update(tanksTable).set(updates).where(eq(tanksTable.id, input.tankId));
  }

  const refill = await checkTankRefill(input.tankId);
  return { event, refill };
}
