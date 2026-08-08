ALTER TABLE `media_assets` ADD `category` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `tags_json` text DEFAULT '[]' NOT NULL;