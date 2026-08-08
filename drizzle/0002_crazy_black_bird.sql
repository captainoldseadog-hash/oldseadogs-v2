CREATE TABLE `press_release_blocked_senders` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`kind` text DEFAULT 'sender' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `press_release_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text DEFAULT '' NOT NULL,
	`sender_name` text DEFAULT '' NOT NULL,
	`sender_email` text DEFAULT '' NOT NULL,
	`sender_domain` text DEFAULT '' NOT NULL,
	`subject` text NOT NULL,
	`received_at` text NOT NULL,
	`preview` text DEFAULT '' NOT NULL,
	`body_text` text DEFAULT '' NOT NULL,
	`raw_email` text DEFAULT '' NOT NULL,
	`attachments_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`category` text DEFAULT 'News' NOT NULL,
	`relevance_score` integer DEFAULT 0 NOT NULL,
	`duplicate_of` text DEFAULT '' NOT NULL,
	`duplicate_score` integer DEFAULT 0 NOT NULL,
	`warnings_json` text DEFAULT '[]' NOT NULL,
	`generated_title` text DEFAULT '' NOT NULL,
	`generated_excerpt` text DEFAULT '' NOT NULL,
	`generated_body_json` text DEFAULT '[]' NOT NULL,
	`generated_word_count` integer DEFAULT 0 NOT NULL,
	`selected_attachment_id` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`image_alt` text DEFAULT '' NOT NULL,
	`image_credit` text DEFAULT '' NOT NULL,
	`image_caption` text DEFAULT '' NOT NULL,
	`rights_note` text DEFAULT '' NOT NULL,
	`story_id` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`platform` text DEFAULT '' NOT NULL,
	`target` text DEFAULT '' NOT NULL,
	`story_slug` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `ads` ADD `start_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ads` ADD `end_date` text DEFAULT '' NOT NULL;