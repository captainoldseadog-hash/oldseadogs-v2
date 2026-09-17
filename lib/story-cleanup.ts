import type { StoryListRecord } from "./story-list";

export type DraftCleanupStory = StoryListRecord & { title: string; isFeatured?: boolean };

export function parseCmsIdList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function validateDraftCleanup(input: {
  ids: string[];
  stories: DraftCleanupStory[];
  homepageIds?: string[];
  homepageSlugs?: string[];
  referencedStoryIds?: string[];
}) {
  const wanted = new Set(input.ids);
  const selected = input.stories.filter((story) => wanted.has(story.id));
  const found = new Set(selected.map((story) => story.id));
  const homepageIds = new Set(input.homepageIds || []);
  const homepageSlugs = new Set(input.homepageSlugs || []);
  const referenced = new Set(input.referencedStoryIds || []);
  const errors: string[] = [];

  for (const id of wanted) if (!found.has(id)) errors.push(`Story ${id} was not found.`);
  for (const story of selected) {
    if (story.status !== "draft") errors.push(`${story.title} is ${story.status}, not a Draft.`);
    if (story.isFeatured || homepageIds.has(story.id) || homepageSlugs.has(story.slug || "")) {
      errors.push(`${story.title} is selected in Homepage Manager.`);
    }
    if (referenced.has(story.id)) errors.push(`${story.title} is referenced by a press-release record.`);
  }

  return { ok: errors.length === 0, selected, errors };
}
