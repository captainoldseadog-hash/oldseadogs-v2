ALTER TABLE `stories` ADD `section_slugs_json` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `stories` ADD `original_source_type` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `stories` ADD `original_source_ref` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `stories` ADD `original_source_content` text DEFAULT '' NOT NULL;
