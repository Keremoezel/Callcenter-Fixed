PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE _hub_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS "user" (
    `id` text PRIMARY KEY NOT NULL,
    `email` text NOT NULL,
    `name` text NOT NULL,
    `email_verified` integer DEFAULT false NOT NULL,
    `image` text,
    `role` text DEFAULT 'Agent' NOT NULL,
    `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `updated_at` integer
);
INSERT INTO "user" VALUES('admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','keremsinan1905@gmail.com','kerem test',0,NULL,'Admin',1769700257,1769700257);
INSERT INTO "user" VALUES('pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','agent@test.com','Agent Test',0,NULL,'Agent',1769700985,1769700985);
CREATE TABLE companies (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    project text,
    legal_form text,
    industry text,
    employee_count integer,
    website text,
    phone text,
    email text,
    description text,
    revenue_size text,
    opening_hours text,
    street text,
    postal_code text,
    city text,
    state text,
    founding_date text,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at integer
);
INSERT INTO "companies" VALUES(3,'Muster GmbH','Kaltakquise Q4','GmbH','IT-Dienstleistungen',50,'https://muster-gmbh.de','+49 30 12345678','info@muster-gmbh.de','Ein führendes IT-Unternehmen.','5 Mio. € - 10 Mio. €','Mo-Fr 09:00 - 17:00','Musterstraße 1','10115','Berlin','Berlin','2010-01-01','2026-01-29 15:36:57',NULL);
INSERT INTO "companies" VALUES(4,'Beispiel AG','Messe Leads','AG','Maschinenbau',250,'https://beispiel-ag.de','+49 89 98765432','kontakt@beispiel-ag.de','Spezialist für Präzisionsmaschinen.','10 Mio. € - 50 Mio. €','Mo-Fr 08:00 - 16:30','Industrieweg 10','80331','München','Bayern','1995-09-20','2026-01-29 15:36:57',NULL);
CREATE TABLE contacts (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    company_id integer NOT NULL,
    first_name text NOT NULL,
    last_name text,
    email text,
    phone text,
    is_primary integer DEFAULT false NOT NULL,
    position text,
    birth_date text,
    linkedin text,
    xing text,
    facebook text,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE cascade
);
INSERT INTO "contacts" VALUES(3,3,'Max','Mustermann','max.mustermann@muster-gmbh.de','+49 170 12345678',1,'Geschäftsführer','1980-05-15','https://linkedin.com/in/maxmustermann','https://xing.com/profile/Max_Mustermann',NULL,'2026-01-29 15:36:57',NULL);
INSERT INTO "contacts" VALUES(4,4,'Erika','Musterfrau','erika.musterfrau@beispiel-ag.de','+49 160 98765432',1,'Vertriebsleiterin','1975-11-30','https://linkedin.com/in/erikamusterfrau',NULL,'https://facebook.com/erikamusterfrau','2026-01-29 15:36:57',NULL);
CREATE TABLE account (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    access_token_expires_at integer,
    refresh_token_expires_at integer,
    scope text,
    password text,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at integer,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE cascade
);
INSERT INTO "account" VALUES('eb4Mjw6Gn7srPi2cl9WFDEfOVIiO86CB','admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','credential',NULL,NULL,NULL,NULL,NULL,'3ccb5739e4c620ca461ac31934225cc5:967cdc708602a08613233db8e89e9a73604f0fe6cf202a481863af02f27dcafc531cd02428fcc54eacf0cec172ea6a865d60ab5a9f75d241a0b8a5d0e6d85474',1769700257,1769700257);
INSERT INTO "account" VALUES('17bEHvPLHQVor2aBnDPScBec3aWZDwU3','pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','credential',NULL,NULL,NULL,NULL,NULL,'b5155860e9bd810e12c35fb88885e778:8e7106e3c214720d22197f6bb56ccd7413e5fb87f3e674a3c908b36dbffc6381b6c094767c3b2f4a00aa6da82bd457642746e5021d011eadebc82fa007511047',1769700985,1769700985);
CREATE TABLE session (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at integer NOT NULL,
    ip_address text,
    user_agent text,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at integer,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE cascade
);
INSERT INTO "session" VALUES('sgWP4MQRWecWPFjOKs03Ha8xJsX14QMU','admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','oFeYgbHRIjWn9iDWNIKVrSe3bM3hgGjg',1770369389,'','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',1769764589,1769764589);
INSERT INTO "session" VALUES('qhgGBDqwaq5eLnmTauJgcadFlvJU0rrJ','admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','ieGY3FYHV423ebLmOs4ZZO9oBoHWHfQA',1770370842,'','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',1769766042,1769766042);
CREATE TABLE verification (
    id text PRIMARY KEY NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at integer NOT NULL,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at integer
);
CREATE TABLE activities (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    company_id integer NOT NULL,
    contact_id integer,
    user_id text NOT NULL,
    type text NOT NULL,
    subject text,
    content text,
    started_at integer,
    ended_at integer,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE cascade,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE set null,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE set null
);
CREATE TABLE assignments (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    company_id integer NOT NULL,
    team_id integer,
    agent_id text,
    status text,
    assigned_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by text,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE cascade,
    FOREIGN KEY (agent_id) REFERENCES "user"(id) ON DELETE set null,
    FOREIGN KEY (assigned_by) REFERENCES "user"(id) ON DELETE set null
);
INSERT INTO "assignments" VALUES(3,3,NULL,'pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','Neu Importiert',1769701017,'admUENRI4pSrDtHhLhJyUo6c9IT0SzTW');
INSERT INTO "assignments" VALUES(4,4,NULL,'pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','Neu Importiert',1769701017,'admUENRI4pSrDtHhLhJyUo6c9IT0SzTW');
CREATE TABLE conversation_notes (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    company_id integer NOT NULL,
    conversation_hook text,
    research_result text,
    updated_by text,
    updated_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE cascade,
    FOREIGN KEY (updated_by) REFERENCES "user"(id) ON DELETE set null
);
INSERT INTO "conversation_notes" VALUES(3,3,'','',NULL,'2026-01-29 15:36:57');
INSERT INTO "conversation_notes" VALUES(4,4,'','',NULL,'2026-01-29 15:36:57');
CREATE TABLE tasks (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    title text NOT NULL,
    company_id integer NOT NULL,
    status text NOT NULL,
    priority text NOT NULL,
    due_date integer,
    follow_up_date integer,
    assigned_by text,
    assigned_to text,
    description text,
    completed_at integer,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at integer,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE cascade,
    FOREIGN KEY (assigned_by) REFERENCES "user"(id) ON DELETE set null,
    FOREIGN KEY (assigned_to) REFERENCES "user"(id) ON DELETE set null
);
INSERT INTO "tasks" VALUES(2,'Erstkontakt: Muster GmbH',3,'Nicht angefasst','Mittel',NULL,NULL,'admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','Automatisch erstellt bei Kundenzuweisung',NULL,1769701017,1769701017);
INSERT INTO "tasks" VALUES(3,'Erstkontakt: Beispiel AG',4,'Nicht angefasst','Mittel',NULL,NULL,'admUENRI4pSrDtHhLhJyUo6c9IT0SzTW','pGDeQ3jXPThPBzSRYbKhRqJjVMMunsjh','Automatisch erstellt bei Kundenzuweisung',NULL,1769701017,1769701017);
CREATE TABLE teams (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    teamlead_id text,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (teamlead_id) REFERENCES "user"(id) ON DELETE set null
);
CREATE TABLE team_members (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    team_id integer NOT NULL,
    user_id text NOT NULL,
    created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE cascade,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE cascade
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('companies',4);
INSERT INTO "sqlite_sequence" VALUES('contacts',4);
INSERT INTO "sqlite_sequence" VALUES('activities',0);
INSERT INTO "sqlite_sequence" VALUES('assignments',4);
INSERT INTO "sqlite_sequence" VALUES('conversation_notes',4);
INSERT INTO "sqlite_sequence" VALUES('tasks',3);
INSERT INTO "sqlite_sequence" VALUES('team_members',0);
INSERT INTO "sqlite_sequence" VALUES('teams',0);
CREATE UNIQUE INDEX session_token_unique ON session(token);
CREATE UNIQUE INDEX user_email_unique ON "user"(email);
CREATE UNIQUE INDEX conversation_notes_company_id_unique ON conversation_notes(company_id);
CREATE UNIQUE INDEX team_user_unique ON team_members(team_id, user_id);
CREATE UNIQUE INDEX teams_name_unique ON teams(name);
