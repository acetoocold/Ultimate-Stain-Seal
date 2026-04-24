import { Router, type IRouter } from "express";
import { eq, and, ilike, lte } from "drizzle-orm";
import { db, materialsTable, inventoryItemsTable, projectMaterialsTable } from "@workspace/db";
import {
  CreateMaterialBody, UpdateMaterialBody, GetMaterialParams, UpdateMaterialParams, DeleteMaterialParams, ListMaterialsQueryParams,
  CreateInventoryItemBody, UpdateInventoryItemBody, UpdateInventoryItemParams, ListInventoryQueryParams,
  UpdateProjectMaterialBody, UpdateProjectMaterialParams, DeleteProjectMaterialParams, ListProjectMaterialsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeMaterial(m: typeof materialsTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() };
}
function serializeInventory(i: typeof inventoryItemsTable.$inferSelect, material: typeof materialsTable.$inferSelect) {
  return { ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(), lastRestockedAt: i.lastRestockedAt?.toISOString() ?? null, material: serializeMaterial(material) };
}

router.get("/materials", async (req, res): Promise<void> => {
  const params = ListMaterialsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(materialsTable).$dynamic();
  const conditions = [];
  if (params.data.category) conditions.push(eq(materialsTable.category, params.data.category));
  if (params.data.search) conditions.push(ilike(materialsTable.name, `%${params.data.search}%`));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const materials = await query.orderBy(materialsTable.name);
  res.json(materials.map(serializeMaterial));
});

router.post("/materials", async (req, res): Promise<void> => {
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [material] = await db.insert(materialsTable).values(parsed.data).returning();
  res.status(201).json(serializeMaterial(material));
});

router.get("/materials/:id", async (req, res): Promise<void> => {
  const params = GetMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) { res.status(404).json({ error: "Material not found" }); return; }
  res.json(serializeMaterial(material));
});

router.patch("/materials/:id", async (req, res): Promise<void> => {
  const params = UpdateMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [material] = await db.update(materialsTable).set(data).where(eq(materialsTable.id, params.data.id)).returning();
  if (!material) { res.status(404).json({ error: "Material not found" }); return; }
  res.json(serializeMaterial(material));
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  const params = DeleteMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [m] = await db.delete(materialsTable).where(eq(materialsTable.id, params.data.id)).returning();
  if (!m) { res.status(404).json({ error: "Material not found" }); return; }
  res.sendStatus(204);
});

// Inventory
router.get("/inventory", async (req, res): Promise<void> => {
  const params = ListInventoryQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const items = await db.select().from(inventoryItemsTable).orderBy(inventoryItemsTable.id);
  const materialIds = items.map(i => i.materialId);
  const materials = materialIds.length > 0 ? await db.select().from(materialsTable) : [];
  const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
  let result = items.filter(i => matMap[i.materialId]).map(i => serializeInventory(i, matMap[i.materialId]));
  if (params.data.lowStock === true || params.data.lowStock === "true" as unknown) {
    result = result.filter(i => i.reorderPoint !== null && parseFloat(i.quantityOnHand?.toString() ?? "0") <= parseFloat(i.reorderPoint?.toString() ?? "0"));
  }
  res.json(result);
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.insert(inventoryItemsTable).values(parsed.data).returning();
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, item.materialId));
  res.status(201).json(serializeInventory(item, material));
});

router.patch("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  if (data.lastRestockedAt) data.lastRestockedAt = new Date(data.lastRestockedAt as string);
  const [item] = await db.update(inventoryItemsTable).set(data).where(eq(inventoryItemsTable.id, params.data.id)).returning();
  if (!item) { res.status(404).json({ error: "Inventory item not found" }); return; }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, item.materialId));
  res.json(serializeInventory(item, material));
});

// Project materials
router.get("/project-materials", async (req, res): Promise<void> => {
  const params = ListProjectMaterialsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const items = await db.select().from(projectMaterialsTable).where(eq(projectMaterialsTable.projectId, params.data.projectId)).orderBy(projectMaterialsTable.createdAt);
  const materialIds = items.map(i => i.materialId);
  const materials = materialIds.length > 0 ? await db.select().from(materialsTable) : [];
  const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
  res.json(items.map(pm => ({ ...pm, material: matMap[pm.materialId] ? serializeMaterial(matMap[pm.materialId]) : null, createdAt: pm.createdAt.toISOString(), updatedAt: pm.updatedAt.toISOString() })));
});

router.post("/project-materials", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.projectId || !body.materialId) {
    res.status(400).json({ error: "projectId and materialId are required" });
    return;
  }
  const [item] = await db.insert(projectMaterialsTable).values({
    projectId: parseInt(body.projectId, 10),
    materialId: parseInt(body.materialId, 10),
    quantityEstimated: body.quantityEstimated ?? null,
    quantityUsed: body.quantityUsed ?? null,
    unitCostAtTime: body.unitCostAtTime ?? null,
    totalCost: body.totalCost ?? null,
    notes: body.notes ?? null,
  }).returning();
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, item.materialId));
  res.status(201).json({ ...item, material: material ? serializeMaterial(material) : null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.patch("/project-materials/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateProjectMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [item] = await db.update(projectMaterialsTable).set(data).where(eq(projectMaterialsTable.id, params.data.id)).returning();
  if (!item) { res.status(404).json({ error: "Project material not found" }); return; }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, item.materialId));
  res.json({ ...item, material: material ? serializeMaterial(material) : null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.delete("/project-materials/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [pm] = await db.delete(projectMaterialsTable).where(eq(projectMaterialsTable.id, params.data.id)).returning();
  if (!pm) { res.status(404).json({ error: "Project material not found" }); return; }
  res.sendStatus(204);
});

export default router;
