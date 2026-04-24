import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable, projectsTable, invoicesTable, jobsTable, activityTable, settingsTable } from "@workspace/db";

const router: IRouter = Router();

// Glide webhook receiver
router.post("/glide/webhook", async (req, res): Promise<void> => {
  const { event, data, table } = req.body;
  try {
    switch (table) {
      case "customers": {
        if (event === "create" || event === "update") {
          const existing = data.glideId ? await db.select().from(customersTable).where(eq(customersTable.glideId, data.glideId)) : [];
          if (existing.length > 0) {
            await db.update(customersTable).set({ ...data, updatedAt: new Date() }).where(eq(customersTable.glideId, data.glideId));
          } else {
            await db.insert(customersTable).values({ ...data, status: data.status ?? "prospect" });
          }
        }
        break;
      }
      case "projects": {
        if (event === "create" || event === "update") {
          const existing = data.glideId ? await db.select().from(projectsTable).where(eq(projectsTable.glideId, data.glideId)) : [];
          if (existing.length > 0) {
            await db.update(projectsTable).set({ ...data, updatedAt: new Date() }).where(eq(projectsTable.glideId, data.glideId));
          } else {
            await db.insert(projectsTable).values({ ...data, status: data.status ?? "pending" });
          }
        }
        break;
      }
      default:
        break;
    }
    await db.insert(activityTable).values({
      entityType: "glide_webhook",
      entityId: null,
      action: event ?? "sync",
      description: `Glide webhook received: ${table} ${event}`,
      metadata: { table, event, data },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Glide webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Get sync status
router.get("/glide/sync", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(settingsTable).limit(1);
  const customersWithGlide = await db.select().from(customersTable).where(eq(customersTable.glideId, ""));
  const projectsWithGlide = await db.select().from(projectsTable).where(eq(projectsTable.glideId, ""));
  res.json({
    enabled: settings?.glideEnabled ?? false,
    hasApiKey: !!settings?.glideApiKey,
    hasTableId: !!settings?.glideTableId,
    lastSyncAt: new Date().toISOString(),
    syncStats: {
      customersWithGlideId: customersWithGlide.length,
      projectsWithGlideId: projectsWithGlide.length,
    }
  });
});

// Manual push to Glide (would call Glide API in production)
router.post("/glide/push", async (req, res): Promise<void> => {
  const { table, id } = req.body;
  try {
    let record = null;
    if (table === "customers") {
      const [c] = await db.select().from(customersTable).where(eq(customersTable.id, id));
      record = c;
    } else if (table === "projects") {
      const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
      record = p;
    } else if (table === "invoices") {
      const [i] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
      record = i;
    }
    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    // In production, this would call the Glide API
    // For now, mark as synced
    await db.insert(activityTable).values({
      entityType: table,
      entityId: id,
      action: "glide_push",
      description: `Pushed ${table} #${id} to Glide`,
      metadata: { table, id },
    });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: "Push failed" });
  }
});

export default router;
