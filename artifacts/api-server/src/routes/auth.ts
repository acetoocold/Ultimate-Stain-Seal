import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, CreateUserBody, UpdateUserBody, GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import { createHash } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "uss-ops-salt").digest("hex");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const { passwordHash: _, ...userOut } = user;
  res.json({ user: { ...userOut, createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() }, token: `uss-token-${user.id}` });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.sendStatus(204);
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = parseInt(authHeader.replace("Bearer uss-token-", ""), 10);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...userOut } = user;
  res.json({ ...userOut, createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() });
});

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(({ passwordHash: _, ...u }) => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...rest } = parsed.data;
  const [user] = await db.insert(usersTable).values({ ...rest, passwordHash: hashPassword(password) }).returning();
  const { passwordHash: _, ...userOut } = user;
  res.status(201).json({ ...userOut, createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...userOut } = user;
  res.json({ ...userOut, createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() });
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== null && v !== undefined) data[k] = v; }
  const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...userOut } = user;
  res.json({ ...userOut, createdAt: userOut.createdAt.toISOString(), updatedAt: userOut.updatedAt.toISOString() });
});

export default router;
