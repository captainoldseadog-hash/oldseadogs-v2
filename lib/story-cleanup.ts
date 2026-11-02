import type { StoryListRecord } from "./story-list";
import {
  storyDeletionEligibility,
  storyManagementRecord,
  type StoryManagementRecord,
} from "./story-management.ts";

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
  management?: Record<string, StoryManagementRecord>;
}) {
  const wanted = new Set(input.ids);
  const selected = input.stories.filter((story) => wanted.has(story.id));
  const found = new Set(selected.map((story) => story.id));
  const homepageIds = new Set(input.homepageIds || []);
  const homepageSlugs = new Set(input.homepageSlugs || []);
  const referenced = new Set(input.referencedStoryIds || []);
  const errors: string[] = [];

  for (const id of wanted) {
    if (!found.has(id)) errors.push(`Story ${id} is no longer in the current CMS list. Refresh before trying again.`);
  }
  for (const story of selected) {
    const management = input.management?.[story.id] ?? storyManagementRecord(story, new Set([story.id]));
    errors.push(...storyDeletionEligibility({
      story,
      management,
      homepageIds,
      homepageSlugs,
      referencedStoryIds: referenced,
    }).reasons);
  }

  return { ok: errors.length === 0, selected, errors, refreshRequired: found.size !== wanted.size };
}
