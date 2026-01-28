import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
export { sql, eq, and, or } from 'drizzle-orm'

import * as schema from '../database/schema'

export const tables = schema

// Fonksiyon artık 'event' parametresi istiyor
export function useDrizzle(event: H3Event) {
  const db = event.context.cloudflare?.env?.DB
  
  if (!db) {
    throw new Error("dei datenbank nicht gefunden")
  }

  return drizzle(db, { schema })
}

export type User = typeof schema.users.$inferSelect