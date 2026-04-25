# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## USS OPS Application

Production-grade operations platform for Ultimate Stain & Seal.

### Architecture
- **Frontend**: `artifacts/uss-ops` — React + Vite, routes at `/ops/*`
- **API**: `artifacts/api-server` — Express 5, serves at `/api/*`
- **DB schema**: `lib/db/src/schema/` — Drizzle ORM
- **Zod validation**: `lib/api-zod/src/generated/api.ts` — manually maintained (no OpenAPI spec)

### Schema Notes (manually edited — no codegen)
- `diagnoses.projectId` — nullable (standalone diagnoses allowed, not attached to a project)
- `diagnoses` — has `woodType`, `productColor`, `recommendedProductType` fields
- `materials` — categories include `liquid`, `fuel`, `chemical`, `consumable`, `container`, `equipment`
- `materials` — has `trackingType` (quantity/status/both), `oilType`, `containerCapacity`
- `inventory_items` — has `status`, `statusNotes`, `colorContent`, `contentDescription`, `lastCheckedAt`
- `materials.retailPrice` and `homeDepotPrice` columns removed from schema (still in DB but not in Zod)

### Verification Status (6-pass system)
- Pass 1 ✅ — 12/12 API endpoints return 200
- Pass 2 ✅ — All new schema fields present in API responses
- Pass 3 ✅ — Zero FK violations, balance math correct
- Pass 4 ✅ — 11/11 frontend routes return 200
- Pass 5 ✅ — All joins working (customers/:id includes jobs; diagnoses/:id includes customer+project)
- Pass 6 ✅ — Full CRUD verified with all new fields (diagnoses, inventory, materials)

### Seed Data
Run: `node node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs artifacts/api-server/src/seed.ts`
- 33 materials: 2 liquids (oil/concentrate tanks), 1 fuel, 1 chemical, 3 containers, 23 equipment, 3 consumables
- All equipment has `trackingType=status`, all liquids have `trackingType=quantity`
