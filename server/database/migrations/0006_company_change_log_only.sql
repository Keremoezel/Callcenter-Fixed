-- Add company_change_log table only (safe to run on production + preview).
-- Run: pnpm wrangler d1 execute <DB_NAME> --remote --file=server/database/migrations/0006_company_change_log_only.sql
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
