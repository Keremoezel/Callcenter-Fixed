/**
 * One-off: Create company_change_log table in local-dev.db
 * Run: node scripts/create-change-log-table.js
 */
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, '..', 'local-dev.db');
const client = createClient({ url: `file:${dbPath}` });

const sql = `
CREATE TABLE IF NOT EXISTS company_change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  label TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

client.execute(sql)
  .then(() => {
    console.log('company_change_log table created or already exists.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
