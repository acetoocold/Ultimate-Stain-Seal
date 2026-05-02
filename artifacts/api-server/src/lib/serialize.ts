/**
 * ISO-serialize Date fields on row(s) returned from Drizzle so JSON output is
 * consistent across the API. Walks one level deep — we don't have nested
 * Dates anywhere in the schema.
 */
export function iso<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out as T;
}

export function isoMany<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map(iso);
}
