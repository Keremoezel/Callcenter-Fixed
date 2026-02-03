import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get migration file path from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("Usage: node scripts/run-migration.js <migration-file>");
  console.error("Example: node scripts/run-migration.js server/database/migrations/0007_import_logs.sql");
  process.exit(1);
}

const migrationPath = path.resolve(__dirname, "..", migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read migration SQL
const sql = fs.readFileSync(migrationPath, "utf-8");

// Connect to local SQLite database
const client = createClient({
  url: "file:local-dev.db",
});

console.log(`Applying migration: ${migrationFile}`);

try {
  // Split SQL by semicolons and execute each statement
  // Remove comments and empty statements
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    if (statement.trim()) {
      client.execute(statement);
    }
  }
  
  console.log("✅ Migration applied successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  client.close();
}
