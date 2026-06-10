import { asc, desc, eq, sql } from "drizzle-orm";
import { getDbOrNull } from "../db";
import { ads, mediaAssets, siteSettings, stories as storyRows } from "../db/schema";
import { oldSeaDogsSocialLinks } from "../content/social-links";
import { stories as seedStories } from "../content/stories";
import legacyStories from "../content/legacy-stories.json";

export type EditableStory = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  summary: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  isFeatured: boolean;
  status: "draft" | "published";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Advert = typeof ads.$inferSelect;

export type SiteSettings = {
  brandName: string;
  kicker: string;
  footerText: string;
  siteDescription: string;
  socialFacebook: string;
  socialInstagram: string;
  socialX: string;
  socialYouTube: string;
  socialLinkedIn: string;
};

const placeholderStoryImages = new Set(["", "/images/marina-hero.png"]);

export const defaultSettings: SiteSettings = {
  brandName: "Old Sea Dogs",
  kicker: "Boating news, reviews, and sea stories",
  footerText:
    "Boating, yachting, boat reviews, and the practical business of life afloat.",
  siteDescription:
    "Boating, yachting, boat reviews, and practical sea stories from Old Sea Dogs.",
  socialFacebook: oldSeaDogsSocialLinks.facebook,
  socialInstagram: oldSeaDogsSocialLinks.instagram,
  socialX: oldSeaDogsSocialLinks.x,
  socialYouTube: "",
  socialLinkedIn: oldSeaDogsSocialLinks.linkedin,
};

function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function makeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `story-${Date.now()}`
  );
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonList(value: string, fallback: string[] = []) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

function rowToStory(row: typeof storyRows.$inferSelect): EditableStory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    date: row.date,
    author: row.author,
    sourceType: row.sourceType,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl ?? "",
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    imageCredit: row.imageCredit ?? "",
    imageCaption: row.imageCaption ?? "",
    summary: row.summary,
    body: parseJsonList(row.bodyJson),
    tags: parseJsonList(row.tagsJson),
    readMinutes: row.readMinutes,
    isFeatured: row.isFeatured,
    status: row.status === "draft" ? "draft" : "published",
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function seedToStoryRow(
  story: (typeof seedStories)[number],
  index: number
): typeof storyRows.$inferInsert {
  const stamp = nowIso();
  return {
    id: `seed_${story.slug}`,
    slug: story.slug,
    title: story.title,
    category: story.category,
    date: story.date,
    author: story.author,
    sourceType: story.sourceType,
    sourceName: story.sourceName,
    sourceUrl: story.sourceUrl ?? null,
    imageUrl: story.image,
    imageAlt: story.imageAlt,
    imageCredit: "",
    imageCaption: "",
    summary: story.summary,
    bodyJson: JSON.stringify(story.body),
    tagsJson: JSON.stringify(story.tags),
    readMinutes: story.readMinutes,
    isFeatured: Boolean(story.featured),
    status: "published",
    sortOrder: index,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

type LegacyStoryRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  summary: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  featured?: boolean;
};

const legacyStoryRecords = legacyStories as LegacyStoryRecord[];

function legacyToStory(story: LegacyStoryRecord, index: number): EditableStory {
  const stamp = `${story.date || "2025-01-01"}T00:00:00.000Z`;
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    category: story.category,
    date: story.date || "2025-01-01",
    author: story.author || "Old Sea Dogs",
    sourceType: "Original",
    sourceName: story.sourceName || "Old Sea Dogs archive",
    sourceUrl: story.sourceUrl || "",
    imageUrl: story.imageUrl || "",
    imageAlt: story.imageAlt || story.title,
    imageCredit: story.imageCredit || "",
    imageCaption: story.imageCaption || "",
    summary: story.summary || story.body[0] || "",
    body: story.body.length > 0 ? story.body : [story.summary || story.title],
    tags: story.tags,
    readMinutes: story.readMinutes || 3,
    isFeatured: Boolean(story.featured),
    status: "published",
    sortOrder: index,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function hasStoryPhoto(story: Pick<EditableStory, "imageUrl">) {
  return !placeholderStoryImages.has(story.imageUrl.trim());
}

export function isPromotedStory(story: Pick<EditableStory, "sortOrder">) {
  return story.sortOrder < 0;
}

function legacyStaticStories() {
  return legacyStoryRecords.map(legacyToStory);
}

export function getLegacyArchiveStats() {
  const photoUrls = new Set(
    legacyStoryRecords
      .map((story) => story.imageUrl)
      .filter((url) => url.startsWith("/legacy-photos/"))
  );

  return {
    storyCount: legacyStoryRecords.length,
    photoCount: photoUrls.size,
  };
}

async function ensureSeedData() {
  const db = getDbOrNull();
  if (!db) return false;

  const existing = await db.select({ id: storyRows.id }).from(storyRows).limit(1);
  if (existing.length > 0) return true;

  const stamp = nowIso();
  await db.insert(storyRows).values(seedStories.map(seedToStoryRow));
  await db.insert(siteSettings).values(
    Object.entries(defaultSettings).map(([key, value]) => ({
      key,
      value,
      updatedAt: stamp,
    }))
  );
  return true;
}

function seedStaticStories() {
  return seedStories.map((story, index) =>
    rowToStory(seedToStoryRow(story, index) as typeof storyRows.$inferSelect)
  );
}

function staticStories() {
  const legacy = legacyStaticStories();
  return legacy.length > 0 ? legacy : seedStaticStories();
}

function sortStories(stories: EditableStory[]) {
  return [...stories].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    const aPromoted = isPromotedStory(a);
    const bPromoted = isPromotedStory(b);
    if (aPromoted !== bPromoted) return aPromoted ? -1 : 1;
    if (aPromoted && bPromoted && a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.sortOrder - b.sortOrder;
  });
}

function mergeDbStoriesWithStatic(rows: Array<typeof storyRows.$inferSelect>, includeDrafts = false) {
  const legacyEnabled = legacyStoryRecords.length > 0;
  const merged = new Map(staticStories().map((story) => [story.id, story]));

  for (const row of rows) {
    if (legacyEnabled && row.id.startsWith("seed_")) continue;
    const story = rowToStory(row);
    if (!includeDrafts && story.status === "draft") {
      merged.delete(story.id);
      continue;
    }
    merged.set(story.id, story);
  }

  const stories = [...merged.values()].filter((story) => includeDrafts || story.status === "published");
  return sortStories(stories);
}

export async function getPublishedStories() {
  const db = getDbOrNull();
  if (!db) return sortStories(staticStories());

  try {
    await ensureSeedData();
    const rows = await db
      .select()
      .from(storyRows)
      .orderBy(desc(storyRows.isFeatured), desc(storyRows.date), asc(storyRows.sortOrder));
    return mergeDbStoriesWithStatic(rows);
  } catch {
    return sortStories(staticStories());
  }
}

export async function getStoryBySlug(slug: string) {
  const db = getDbOrNull();
  if (!db) return staticStories().find((story) => story.slug === slug) ?? null;

  try {
    await ensureSeedData();
    const [row] = await db
      .select()
      .from(storyRows)
      .where(eq(storyRows.slug, slug))
      .limit(1);
    if (row) {
      const story = rowToStory(row);
      return story.status === "draft" ? null : story;
    }
    return staticStories().find((story) => story.slug === slug) ?? null;
  } catch {
    return staticStories().find((story) => story.slug === slug) ?? null;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = getDbOrNull();
  if (!db) return defaultSettings;

  try {
    await ensureSeedData();
    const rows = await db.select().from(siteSettings);
    return rows.reduce(
      (settings, row) => ({ ...settings, [row.key]: row.value }),
      defaultSettings
    );
  } catch {
    return defaultSettings;
  }
}

export async function getActiveAds() {
  const db = getDbOrNull();
  if (!db) return [];

  try {
    await ensureSeedData();
    return await db
      .select()
      .from(ads)
      .where(eq(ads.isActive, true))
      .orderBy(asc(ads.placement), asc(ads.label));
  } catch {
    return [];
  }
}

export async function getEditorData() {
  const db = getDbOrNull();
  if (!db) {
    return {
      stories: sortStories(staticStories()),
      media: [] as MediaAsset[],
      ads: [] as Advert[],
      settings: defaultSettings,
    };
  }

  await ensureSeedData();
  const [storyList, media, advertList, settings] = await Promise.all([
    db.select().from(storyRows).orderBy(desc(storyRows.date), asc(storyRows.sortOrder)),
    db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)),
    db.select().from(ads).orderBy(asc(ads.placement), asc(ads.label)),
    getSiteSettings(),
  ]);

  return {
    stories: mergeDbStoriesWithStatic(storyList, true),
    media,
    ads: advertList,
    settings,
  };
}

export async function saveStory(input: Partial<EditableStory>) {
  const db = getDbOrNull();
  if (!db) throw new Error("The story database is not available yet.");

  await ensureSeedData();
  const stamp = nowIso();
  const slug = makeSlug(input.slug || input.title || "");
  const id = input.id || makeId("story");
  const record: typeof storyRows.$inferInsert = {
    id,
    slug,
    title: input.title?.trim() || "Untitled story",
    category: input.category?.trim() || "News",
    date: input.date || stamp.slice(0, 10),
    author: input.author?.trim() || "Old Sea Dogs",
    sourceType: input.sourceType?.trim() || "Original",
    sourceName: input.sourceName?.trim() || "Old Sea Dogs desk",
    sourceUrl: input.sourceUrl?.trim() || null,
    imageUrl: input.imageUrl?.trim() || "",
    imageAlt: input.imageAlt?.trim() || input.title?.trim() || "Old Sea Dogs story image",
    imageCredit: input.imageCredit?.trim() || "",
    imageCaption: input.imageCaption?.trim() || "",
    summary: input.summary?.trim() || "",
    bodyJson: JSON.stringify(
      Array.isArray(input.body)
        ? input.body.filter(Boolean)
        : String(input.body ?? "")
            .split(/\n{2,}/)
            .map((item) => item.trim())
            .filter(Boolean)
    ),
    tagsJson: JSON.stringify(
      Array.isArray(input.tags) ? input.tags.filter(Boolean) : parseList(String(input.tags ?? ""))
    ),
    readMinutes: Number(input.readMinutes || 3),
    isFeatured: Boolean(input.isFeatured),
    status: input.status === "draft" ? "draft" : "published",
    sortOrder: Number(input.sortOrder ?? 0),
    createdAt: input.createdAt || stamp,
    updatedAt: stamp,
  };

  await db
    .insert(storyRows)
    .values(record)
    .onConflictDoUpdate({
      target: storyRows.id,
      set: {
        slug: record.slug,
        title: record.title,
        category: record.category,
        date: record.date,
        author: record.author,
        sourceType: record.sourceType,
        sourceName: record.sourceName,
        sourceUrl: record.sourceUrl,
        imageUrl: record.imageUrl,
        imageAlt: record.imageAlt,
        imageCredit: record.imageCredit,
        imageCaption: record.imageCaption,
        summary: record.summary,
        bodyJson: record.bodyJson,
        tagsJson: record.tagsJson,
        readMinutes: record.readMinutes,
        isFeatured: record.isFeatured,
        status: record.status,
        sortOrder: record.sortOrder,
        updatedAt: record.updatedAt,
      },
    });

  if (record.isFeatured) {
    await db
      .update(storyRows)
      .set({ isFeatured: false })
      .where(sql`${storyRows.id} != ${record.id}`);
  }

  const [row] = await db.select().from(storyRows).where(eq(storyRows.id, id)).limit(1);
  return rowToStory(row);
}

export async function saveStoryImage(id: string, imageUrl: string, imageAlt: string) {
  const db = getDbOrNull();
  if (!db) throw new Error("The story database is not available yet.");

  const stamp = nowIso();
  await db
    .update(storyRows)
    .set({
      imageUrl,
      imageAlt: imageAlt.trim() || "Old Sea Dogs story image",
      updatedAt: stamp,
    })
    .where(eq(storyRows.id, id));

  const [row] = await db.select().from(storyRows).where(eq(storyRows.id, id)).limit(1);
  if (!row) throw new Error("I could not find that story.");
  return rowToStory(row);
}

export async function deleteStory(id: string) {
  const db = getDbOrNull();
  if (!db) throw new Error("The story database is not available yet.");
  await db.delete(storyRows).where(eq(storyRows.id, id));
}

export async function saveSettings(input: Partial<SiteSettings>) {
  const db = getDbOrNull();
  if (!db) throw new Error("The settings database is not available yet.");

  const stamp = nowIso();
  await Promise.all(
    Object.entries({ ...defaultSettings, ...input }).map(([key, value]) =>
      db
        .insert(siteSettings)
        .values({ key, value: String(value), updatedAt: stamp })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: String(value), updatedAt: stamp },
        })
    )
  );
  return getSiteSettings();
}

export async function saveAd(input: Partial<Advert>) {
  const db = getDbOrNull();
  if (!db) throw new Error("The advert database is not available yet.");

  const stamp = nowIso();
  const id = input.id || makeId("ad");
  const record: typeof ads.$inferInsert = {
    id,
    placement: input.placement || "sidebar",
    kind: input.kind || "manual",
    label: input.label || "Advert",
    title: input.title || "",
    body: input.body || "",
    imageUrl: input.imageUrl || "",
    linkUrl: input.linkUrl || "",
    code: input.code || "",
    isActive: input.isActive ?? true,
    createdAt: input.createdAt || stamp,
    updatedAt: stamp,
  };

  await db
    .insert(ads)
    .values(record)
    .onConflictDoUpdate({
      target: ads.id,
      set: {
        placement: record.placement,
        kind: record.kind,
        label: record.label,
        title: record.title,
        body: record.body,
        imageUrl: record.imageUrl,
        linkUrl: record.linkUrl,
        code: record.code,
        isActive: record.isActive,
        updatedAt: record.updatedAt,
      },
    });

  const [row] = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
  return row;
}

export async function deleteAd(id: string) {
  const db = getDbOrNull();
  if (!db) throw new Error("The advert database is not available yet.");
  await db.delete(ads).where(eq(ads.id, id));
}

export async function saveMediaAsset(input: Omit<typeof mediaAssets.$inferInsert, "createdAt">) {
  const db = getDbOrNull();
  if (!db) throw new Error("The media database is not available yet.");
  const record = { ...input, createdAt: nowIso() };
  await db.insert(mediaAssets).values(record);
  return record;
}

export async function getMediaAsset(id: string) {
  const db = getDbOrNull();
  if (!db) return null;
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  return asset ?? null;
}
