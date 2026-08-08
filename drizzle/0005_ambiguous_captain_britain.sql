CREATE TABLE `story_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`from_status` text DEFAULT '' NOT NULL,
	`to_status` text NOT NULL,
	`from_workflow` text DEFAULT '' NOT NULL,
	`to_workflow` text DEFAULT '' NOT NULL,
	`changed_by` text DEFAULT 'Bridge editor' NOT NULL,
	`changed_at` text NOT NULL
);
