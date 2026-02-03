-- Performance indexes for CRM scalability
-- This migration adds indexes to optimize queries at scale (100K+ customers)

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_project ON companies(project);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Assignments table indexes (critical for role-based filtering)
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_team_id ON assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_assignments_company_id ON assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at ON assignments(assigned_at);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Activities table indexes
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);

-- Company change log indexes (for audit trail queries)
CREATE INDEX IF NOT EXISTS idx_company_change_log_company_id ON company_change_log(company_id);
CREATE INDEX IF NOT EXISTS idx_company_change_log_created_at ON company_change_log(created_at);
