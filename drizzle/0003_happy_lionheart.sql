CREATE TABLE `gallery_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gallery_categories_slug_unique` ON `gallery_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` text PRIMARY KEY NOT NULL,
	`media_id` text NOT NULL,
	`source_type` text DEFAULT 'upload' NOT NULL,
	`source_id` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`credit` text DEFAULT '' NOT NULL,
	`copyright` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`date_taken` text DEFAULT '' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`category_ids_json` text DEFAULT '[]' NOT NULL,
	`story_ids_json` text DEFAULT '[]' NOT NULL,
	`boat_id` text DEFAULT '' NOT NULL,
	`marina_id` text DEFAULT '' NOT NULL,
	`yacht_club_id` text DEFAULT '' NOT NULL,
	`event_id` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `instagram_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`instagram_media_id` text NOT NULL,
	`permalink` text DEFAULT '' NOT NULL,
	`media_type` text DEFAULT 'IMAGE' NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`timestamp` text DEFAULT '' NOT NULL,
	`media_id` text DEFAULT '' NOT NULL,
	`gallery_item_id` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`imported_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instagram_imports_instagram_media_id_unique` ON `instagram_imports` (`instagram_media_id`);--> statement-breakpoint
ALTER TABLE `media_assets` ADD `caption` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `credit` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `copyright` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `date_taken` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `source_type` text DEFAULT 'upload' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `story_ids_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `gallery_item_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `original_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `web_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `width` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `height` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `old_sea_dogs_view` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `source_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `method_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `content_basis` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `editorial_status` text DEFAULT 'Needs improvement' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `noindex` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `published_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `scheduled_publish_at` text DEFAULT '' NOT NULL;