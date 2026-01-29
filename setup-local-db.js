
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './server/database/schema';

// Create or open the local dev database
const sqlite = new Database('local-dev.db');
const db = drizzle(sqlite, { schema });

// Run migrations (by directly executing the SQL file)
// Note: In a real improved script we would use migrate() from drizzle-orm/better-sqlite3/migrator
// but we'll brute force the D1 migration file for now to match.
import fs from 'fs';
import path from 'path';

// Find the latest migration file
const migrationDir = './server/database/migrations';
const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
const latestMigration = files[files.length - 1];

if (latestMigration) {
    console.log(`Applying migration: ${latestMigration}`);
    const sql = fs.readFileSync(path.join(migrationDir, latestMigration), 'utf-8');
    sqlite.exec(sql);
}

// Seed basic user
try {
    const existing = sqlite.prepare("SELECT * FROM user WHERE email = ?").get("admin@example.com");
    if (!existing) {
        // Create Admin User
        const date = new Date();
        sqlite.prepare(`
      INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
            'admin-user-id',
            'Local Admin',
            'admin@example.com',
            1,
            'Admin',
            date.toISOString(),
            date.toISOString()
        );
        // Note: Password cannot be easily set here without hashing unless we use the auth library
        // We will rely on registering a new user in the UI.
        console.log("Created admin@example.com placeholder (Role: Admin)");
    }
} catch (e) {
    console.error("Seed error:", e);
}

console.log("Local SQLite DB setup complete!");
