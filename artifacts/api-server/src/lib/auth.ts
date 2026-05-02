import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

export type AuthedUser = Omit<User, "passwordHash">;

export interface AuthedRequest extends Request {
  authUser?: AuthedUser;
}

/**
 * Resolve a Bearer token in the format `uss-token-<id>` to a user record.
 * Returns null if header is missing/invalid or user not found.
 */
export async function resolveBearerUser(authHeader: string | undefined): Promise<AuthedUser | null> {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+uss-token-(\d+)$/);
  if (!match) return null;
  const userId = parseInt(match[1], 10);
  if (Number.isNaN(userId)) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;
  const { passwordHash: _, ...rest } = user;
  return rest as AuthedUser;
}

/**
 * Optional-auth middleware: populates req.authUser if a valid token is present,
 * but does not reject the request when one is absent. Routes that require auth
 * should call requireUser() at the top of the handler.
 */
export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> {
  req.authUser = (await resolveBearerUser(req.headers.authorization)) ?? undefined;
  next();
}

export function requireUser(req: AuthedRequest, res: Response): AuthedUser | null {
  if (!req.authUser) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.authUser;
}

export function requireRole(req: AuthedRequest, res: Response, roles: string[]): AuthedUser | null {
  const user = requireUser(req, res);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

/**
 * Trigger T4: Role-based security filter.
 * Strips cost/payroll/profit fields from any payload unless the caller is owner/admin.
 * Pass either an object or array of objects.
 */
const SENSITIVE_FIELDS = [
  "unitCost",
  "totalCost",
  "actualCost",
  "costActual",
  "profitMargin",
  "payPerJob",
  "paidAmount",
  "passwordHash",
  "oilCostPerGallon",
  "concentrateCostPerGallon",
  "liquidGoldBundleCostPerBundle",
  "unitCostAtTime",
] as const;

const PRIVILEGED_ROLES = new Set(["owner", "admin"]);

export function canSeeSensitive(role: string | undefined | null): boolean {
  return role !== undefined && role !== null && PRIVILEGED_ROLES.has(role);
}

export function filterSensitive<T>(value: T, role: string | undefined | null): T {
  if (canSeeSensitive(role)) return value;
  if (Array.isArray(value)) return value.map((v) => filterSensitive(v, role)) as T;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.includes(k as typeof SENSITIVE_FIELDS[number])) continue;
      out[k] = v !== null && typeof v === "object" ? filterSensitive(v, role) : v;
    }
    return out as T;
  }
  return value;
}
