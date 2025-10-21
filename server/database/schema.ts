import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/**
 * BENUTZER- UND TEAMVERWALTUNG
 * (User and Team Management)
 */

// Mit Keycloak synchronisierte Benutzertabelle
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID von Keycloak
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'Admin|Teamlead|Agent'
  avatar: text("avatar"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  ledTeams: many(teams, { relationName: "teamLead" }), // ein teamleiter hat mehrere teams
  teamMemberships: many(teamMembers),
  assignmentsAsAgent: many(assignments, { relationName: "agent" }),
  assignmentsAsAssigner: many(assignments, { relationName: "assigner" }),
  updatedNotes: many(conversationNotes),
  activities: many(activities),
}));

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  teamleadId: text("teamlead_id")
    .notNull()
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
}));

export const conversationNotes = sqliteTable("conversation_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Annahme: Jede Firma hat nur einen Satz an Notizen (1-zu-1)
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
    status: text("status"), // 'Hinzugefügt|In Bearbeitung|Nicht erreicht|...'
    assignedAt: integer("assigned_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    assignedBy: text("assigned_by").references(() => users.id, {
      onDelete: "set null",
    }),
  }
  // ein caompany hat mehr den 1 assigment haben
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

//task und import tabellen mussen importiert werden
