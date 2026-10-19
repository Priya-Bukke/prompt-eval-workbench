import { readFileSync } from "node:fs";
import path from "node:path";

/** The small part of a database client the app needs. Both `pg` and PGlite satisfy it. */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

const schemaPath = path.join(process.cwd(), "db", "schema.sql");

async function applySchema(exec: (sql: string) => Promise<unknown>) {
  await exec(readFileSync(schemaPath, "utf8"));
}

/**
 * Real PostgreSQL when DATABASE_URL is set, otherwise an embedded PGlite database
 * (PostgreSQL compiled to WebAssembly). PGlite keeps local development and CI free of setup.
 */
export async function createDb(options: { url?: string; dataDir?: string } = {}): Promise<Db> {
  const url = options.url ?? process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    await applySchema((sql) => pool.query(sql));
    return {
      query: async <T,>(sql: string, params?: unknown[]) => {
        const res = await pool.query(sql, params);
        return { rows: res.rows as T[] };
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const lite = new PGlite(options.dataDir ?? process.env.PGLITE_DIR);
  await applySchema((sql) => lite.exec(sql));
  return {
    query: async <T,>(sql: string, params?: unknown[]) => {
      const res = await lite.query<T>(sql, params);
      return { rows: res.rows };
    },
  };
}

const globalForDb = globalThis as unknown as { dbPromise?: Promise<Db> };

/** Shared instance for the Next.js server; survives hot reloads in development. */
export function getDb(): Promise<Db> {
  globalForDb.dbPromise ??= createDb({ dataDir: process.env.PGLITE_DIR ?? "./.pglite" });
  return globalForDb.dbPromise;
}
