import { useDrizzle } from "../../utils/drizzle";
import { sql } from "drizzle-orm";

/**
 * Development endpoint: Reset ALL tables (drop and recreate)
 * WARNING: This completely wipes the database structure!
 * URL: http://127.0.0.1:8787/api/dev/reset-all-tables
 */
export default eventHandler(async (event) => {
  // Production environment check for safety
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      statusMessage: "This endpoint is disabled in production"
    });
  }

  const db = useDrizzle(event);

  try {
    console.log("🗑️ Dropping ALL tables...");

    // Get all user tables (excluding sqlite internal tables)
    const tables = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_cf_%'
    `);

    // Drop each table
    for (const table of tables) {
      const tableName = (table as any).name;
      console.log(`  Dropping table: ${tableName}`);
      await db.run(sql.raw(`DROP TABLE IF EXISTS ${tableName}`));
    }

    console.log("✅ All tables dropped!");
    console.log("⚠️ You need to run migrations to recreate tables:");
    console.log("   pnpm wrangler d1 execute crm-final --local --file=server/database/migrations/0004_slimy_lorna_dane.sql");

    return {
      success: true,
      message: "All tables have been dropped! Run migrations to recreate them.",
      droppedTables: tables.map((t: any) => t.name),
    };
  } catch (error: any) {
    console.error("❌ Error dropping tables:", error);
    return {
      success: false,
      message: "Failed to drop tables.",
      error: error.message,
    };
  }
});
