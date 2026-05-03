import * as schema from "./schema";

export * from "./schema";

async function createDb() {
	try {
		const { drizzle } = await import("drizzle-orm/better-sqlite3");
		// Use runtime require for the native sqlite driver when available to avoid static imports
		// that cause module resolution errors during startup when the package isn't installed.
		let Database: any;
		if (typeof (globalThis as any).require === "function") {
			Database = (globalThis as any).require("better-sqlite3");
			Database = Database && Database.default ? Database.default : Database;
		} else {
			Database = (await import("better-sqlite3")).default;
		}
		const sqlite = new Database(process.env.DB_FILE ?? "./uss_demo.db");
		// Return the real drizzle instance when available
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return drizzle(sqlite, { schema } as any);
	} catch (err) {
		// Fallback stub for environments where native sqlite driver isn't installed
		// Exporting a proxy that throws useful errors if used at runtime.
		// This lets the server start so frontend and other non-DB tasks can be developed.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const stub: any = new Proxy({}, {
			get() {
				return () => {
					throw new Error(
						"Database driver not available. Install better-sqlite3 or run in an environment with DB support."
					);
				};
			}
		});
		return stub;
	}
}

// Initialize DB (real or stub) before exporting
// eslint-disable-next-line import/no-default-export
export const db = await createDb();
