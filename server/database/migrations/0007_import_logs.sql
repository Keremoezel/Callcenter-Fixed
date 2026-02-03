CREATE TABLE `import_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imported_by` text NOT NULL,
	`project_name` text,
	`target_team_id` integer,
	`target_agent_id` text,
	`total_rows` integer NOT NULL,
	`success_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`created_count` integer DEFAULT 0 NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	`assigned_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
