import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/**
 * BETTER AUTH TABLES
 * These tables are required by Better Auth for authentication
 */

// Better Auth user table - replaces old users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("Agent"), // 'Admin|Teamlead|Agent'
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(account),
  ledTeams: many(teams, { relationName: "teamLead" }),
  teamMemberships: many(teamMembers),
  assignmentsAsAgent: many(assignments, { relationName: "agent" }),
  assignmentsAsAssigner: many(assignments, { relationName: "assigner" }),
  updatedNotes: many(conversationNotes),
  activities: many(activities),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  createdTasks: many(tasks, { relationName: "taskAssigner" }),
}));

// Better Auth session table
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Better Auth account table (for OAuth providers)
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

// Better Auth verification table
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

/**
 * TEAMVERWALTUNG
 * (Team Management)
 */

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  teamleadId: text("teamlead_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  teamlead: one(users, {
    fields: [teams.teamleadId],
    references: [users.id],
    relationName: "teamLead",
  }),
  members: many(teamMembers),
  assignments: many(assignments),
}));

// Brückentabelle für die Many-to-Many-Beziehung zwischen Users und Teams
export const teamMembers = sqliteTable(
  "team_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    teamUserUnique: unique("team_user_unique").on(table.teamId, table.userId),
  })
);

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

/**
 * KUNDENVERWALTUNG
 * (Company and Contact Management)
 */

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  project: text("project"),
  legalForm: text("legal_form"),
  industry: text("industry"),
  employeeCount: integer("employee_count"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  description: text("description"),
  revenueSize: text("revenue_size"),
  openingHours: text("opening_hours"),
  street: text("street"),
  postalCode: text("postal_code"),
  city: text("city"),
  state: text("state"),
  foundingDate: text("founding_date"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
  conversationNotes: one(conversationNotes, {
    fields: [companies.id],
    references: [conversationNotes.companyId],
  }),
  contacts: many(contacts),
  assignments: many(assignments),
  activities: many(activities),
  tasks: many(tasks),
}));

export const conversationNotes = sqliteTable("conversation_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: "cascade" }),
  conversationHook: text("conversation_hook"),
  researchResult: text("research_result"),
  updatedBy: text("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const conversationNotesRelations = relations(
  conversationNotes,
  ({ one }) => ({
    company: one(companies, {
      fields: [conversationNotes.companyId],
      references: [companies.id],
    }),
    updater: one(users, {
      fields: [conversationNotes.updatedBy],
      references: [users.id],
    }),
  })
);

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  isPrimary: integer("is_primary", { mode: "boolean" })
    .notNull()
    .default(false),
  position: text("position"),
  birthDate: text("birth_date"),
  linkedin: text("linkedin"),
  xing: text("xing"),
  facebook: text("facebook"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  activities: many(activities),
}));

/**
 * OPERATIONALE TABELLEN
 * (Operations: Assignments, Activities, Tasks)
 */

export const assignments = sqliteTable(
  "assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    teamId: integer("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    agentId: text("agent_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status"),
    assignedAt: integer("assigned_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    assignedBy: text("assigned_by").references(() => users.id, {
      onDelete: "set null",
    }),
  }
);

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  company: one(companies, {
    fields: [assignments.companyId],
    references: [companies.id],
  }),
  team: one(teams, {
    fields: [assignments.teamId],
    references: [teams.id],
  }),
  agent: one(users, {
    fields: [assignments.agentId],
    references: [users.id],
    relationName: "agent",
  }),
  assigner: one(users, {
    fields: [assignments.assignedBy],
    references: [users.id],
    relationName: "assigner",
  }),
}));

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(), // 'CALL|EMAIL|MEETING|NOTE'
  subject: text("subject"),
  content: text("content"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  company: one(companies, {
    fields: [activities.companyId],
    references: [companies.id],
  }),
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));


export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // 'Open', 'In Progress', 'Done'
  priority: text("priority").notNull(), // 'High', 'Medium', 'Low'
  dueDate: integer("due_date", { mode: "timestamp" }),
  followUpDate: integer("follow_up_date", { mode: "timestamp" }),
  assignedBy: text("assigned_by").references(() => users.id, {
    onDelete: "set null",
  }),
  assignedTo: text("assigned_to").references(() => users.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  company: one(companies, {
    fields: [tasks.companyId],
    references: [companies.id],
  }),
  assigner: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
    relationName: "taskAssigner",
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "taskAssignee",
  }),
}));
