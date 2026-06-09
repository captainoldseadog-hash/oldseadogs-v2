import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  author: text("author").notNull(),
  sourceType: text("source_type").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url"),
  imageUrl: text("image_url").notNull(),
  imageAlt: text("image_alt").notNull(),
  summary: text("summary").notNull(),
  bodyJson: text("body_json").notNull(),
  tagsJson: text("tags_json").notNull(),
  readMinutes: integer("read_minutes").notNull(),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  r2Key: text("r2_key").notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const ads = sqliteTable("ads", {
  id: text("id").primaryKey(),
  placement: text("placement").notNull(),
  kind: text("kind").notNull().default("manual"),
  label: text("label").notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  linkUrl: text("link_url").notNull().default(""),
  code: text("code").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
