ALTER TABLE `media_assets` ADD `original_filename` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `display_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `internal_title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `copyright_ownership` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `copyright_owner` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `photographer` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `source` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `licence` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `permission_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `usage_restrictions` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `credit_line` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `permission_received_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `collections_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `poster_media_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `external_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `story_association_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `gallery_association_id` text DEFAULT '' NOT NULL;