import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
export { sql, eq, and, or } from 'drizzle-orm'

import * as schema from '../database/schema'

export const tables = schema

import { createClient } from "@libsql/client";
import { drizzle as drizzleLibSql, type LibSQLDatabase } from "drizzle-orm/libsql";

let _localDb: LibSQLDatabase<typeof schema> | null = null;

export function useDrizzle(event: H3Event) {
  const db = event.context.cloudflare?.env?.DB

  // Production / Wrangler Dev
  if (db) {
    return drizzle(db, { schema })
  }

  // Local Dev (pnpm dev) - Fallback to LibSQL (Works on Windows without native compile issues)
  if (process.dev) {
    if (!_localDb) {
      const client = createClient({
        url: "file:local-dev.db",
      });
      _localDb = drizzleLibSql(client, { schema });
    }
    return _localDb;
  }

  throw new Error("dei datenbank nicht gefunden")
}

export type User = typeof schema.user.$inferSelect