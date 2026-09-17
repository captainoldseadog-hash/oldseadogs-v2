import type { StoryListRecord } from "./story-list.ts";

export type StoryManagementSource = "cms" | "legacy";
export type StoryManagementOrigin = "cms" | "story-watch" | "newsroom-import" | "legacy";

export type StoryManagementRecord = {
  source: StoryManagementSource;
  origin: StoryManagementOrigin;
  label: string;
  writable: boolean;
  editable: boolean;
};

export type ManagedStoryRecord = StoryListRecord & {
  title: string;
  sourceType?: string;
  isFeatured?: boolean;
};

export function storyHasPriorPublication(story: StoryListRecord) {
  if (story.publishedAt?.trim()) return true;
  return (story.statusHistory || []).some((entry) =>
    [entry.fromStatus, entry.toStatus].some((status) => status?.trim().toLowerCase() === "published")
  );
}

export function storyManagementRecord(story: ManagedStoryRecord, managedIds: ReadonlySet<string>): StoryManagementRecord {
  if (!managedIds.has(story.id)) {
    return {
      source: "legacy",
      origin: "legacy",
      label: "Archive · read-only",
      writable: false,
      editable: false,
    };
  }

  const sourceType = story.sourceType?.trim().toLowerCase() || "";
  if (story.id.startsWith("watch_") || /automatic watch|source watch|scrape/.test(sourceType)) {
    return {
      source: "cms",
      origin: "story-watch",
      label: "Story Watch · managed",
      writable: true,
      editable: true,
    };
  }
  if (/press release|newsroom email/.test(sourceType)) {
    return {
      source: "cms",
      origin: "newsroom-import",
      label: "Newsroom import · managed",
      writable: true,
      editable: true,
    };
  }
  return {
    source: "cms",
    origin: "cms",
    label: "CMS-managed",
    writable: true,
    editable: true,
  };
}

export function makeStoryManagementIndex(stories: ManagedStoryRecord[], managedIds: Iterable<string>) {
  const ids = new Set(managedIds);
  return Object.fromEntries(stories.map((story) => [story.id, storyManagementRecord(story, ids)]));
}

export function storyDeletionEligibility(input: {
  story: ManagedStoryRecord;
  management: StoryManagementRecord;
  homepageIds?: ReadonlySet<string>;
  homepageSlugs?: ReadonlySet<string>;
  referencedStoryIds?: ReadonlySet<string>;
}) {
  const { story, management } = input;
  const reasons: string[] = [];
  if (!management.writable) reasons.push("This is a read-only archive Story.");
  if (story.status !== "draft") reasons.push(`${story.title} is ${story.status}, not a Draft.`);
  if (storyHasPriorPublication(story)) reasons.push(`${story.title} has prior publication evidence.`);
  if (
    story.isFeatured ||
    input.homepageIds?.has(story.id) ||
    input.homepageSlugs?.has(story.slug || "")
  ) {
    reasons.push(`${story.title} is selected in Homepage Manager.`);
  }
  if (input.referencedStoryIds?.has(story.id)) {
    reasons.push(`${story.title} is referenced by a press-release record.`);
  }
  return { eligible: reasons.length === 0, reasons };
}

export function storySourceCounts(management: Record<string, StoryManagementRecord>) {
  const records = Object.values(management);
  return {
    cmsManaged: records.filter((item) => item.source === "cms").length,
    legacyReadOnly: records.filter((item) => item.source === "legacy").length,
    storyWatch: records.filter((item) => item.origin === "story-watch").length,
    newsroomImports: records.filter((item) => item.origin === "newsroom-import").length,
  };
}
