CREATE TABLE `story_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`reason` text DEFAULT 'Published story edit' NOT NULL,
	`created_by` text DEFAULT 'Bridge editor' NOT NULL,
	`created_at` text NOT NULL
);
