import {
  categoryMatchesLabel,
  oldSeaDogsSections,
  storyMatchesSection,
  type OldSeaDogsSection,
} from "../content/sections";
import { analyzeHeadlineQuality } from "./editorial-quality";
import { getFeaturedPortClubItem } from "./featured-port-club";
import {
  findHomepageLeadStory,
  hasStoryPhoto,
  isEditoriallyApprovedStory,
  isHomepageEligibleStory,
  isHomepageLeadSelectable,
  isStaticArchiveStory,
  isWeakEditorialStory,
  storyHomepageTime,
  sortStoriesByHomepageRecency,
  type EditableStory,
  type SiteSettings,
} from "./site-content";

export type HomepageSectionCard = OldSeaDogsSection & {
  photo: EditableStory | null;
};

export type HomepageContent = {
  featuredStory: EditableStory;
  latestReviewedOrFallback: EditableStory[];
  editorPicks: EditableStory[];
  reviewStories: EditableStory[];
  practicalStories: EditableStory[];
  featuredPortClub: ReturnType<typeof getFeaturedPortClubItem>;
  sectionCards: HomepageSectionCard[];
};

function getSectionPreviewPhoto(
  stories: EditableStory[],
  section: OldSeaDogsSection,
  usedStories?: HomepageStoryUseTracker
) {
  const photos = stories
    .filter((story) => storyMatchesSection(story, section))
    .filter((story) => hasStoryPhoto(story));

  if (photos.length === 0) return null;
  return photos.find((story) => !usedStories?.has(story)) ?? photos[0];
}

function isReviewedHomepageStory(story: EditableStory) {
  const status = story.editorialStatus.trim().toLowerCase();
  const hasSource = Boolean(story.sourceNotes.trim() || story.sourceName.trim());
  const hasView = Boolean(story.oldSeaDogsView.trim());
  const imageOk = !hasStoryPhoto(story) || Boolean(story.imageCredit.trim());
  return !story.noindex && imageOk && hasSource && (hasView || status === "ready" || status === "keep live");
}

function normalizeStoryTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|and|for|from|in|into|of|on|to|with)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string) {
  return normalizeStoryTitle(value).split(" ").filter((token) => token.length > 2);
}

function titleSimilarity(a: string, b: string) {
  const left = new Set(titleTokens(a));
  const right = new Set(titleTokens(b));
  const smallest = Math.min(left.size, right.size);
  if (smallest < 4) return 0;
  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }
  return shared / smallest;
}

function isQueueOrImportedStory(story: EditableStory) {
  const sourceText = [
    story.sourceType,
    story.sourceName,
    story.contentBasis,
    story.methodNotes,
  ].join(" ");
  return /\b(automatic watch|press release|generated|scrape|scraped|source watch|source detail|newsroom email|imported)\b/i.test(sourceText);
}

const weakLegacyFrontPagePattern =
  /\b(dive into|high seas with style|yacht enthusiasts unite|under one sail|gains momentum|gear up|get ready|a new chapter awaits|unveiled|innovation reborn|revolutioni[sz](?:e|ing)|dazzles?|dominates?|ultimate guide|commodious odyssey|joins forces|renowned|showcases?|adventures on the horizon|riveting peek|final countdown|exciting|groundbreaking|historic venture|new dimension of ocean luxury|unveils tensions|from high seas|battling trials|graces the coastline|majestic|luxur(?:y|ious)|astounding|record-breaking|embarking|revealing|hidden dimensions|economic dominance|foiling fury|catapults|navigating|assortment|optimum|ventures|unlocking|technological aspects|takes final voyage|elevate|embarks? on global ventures|discover how|discover why|unleashing|awe-inspiring|unrivalled|trusted leader|pinnacle|novel offering|saga|thrilling|intense competitions?|tragedy|mysteriously|unprecedented|prestigious|unfurling|new horizons|steering into|amidst|price slashed|surviving the waves|art of managing|captures? the hearts?)\b/i;

function isHighQualityLegacyStory(story: EditableStory) {
  const titleWordCount = story.title.split(/\s+/).filter(Boolean).length;
  const headlineReport = analyzeHeadlineQuality({
    title: story.title,
    category: story.category,
    sourceName: story.sourceName,
    sourceType: story.sourceType,
  });
  const publicText = `${story.title} ${story.summary}`;
  return (
    isStaticArchiveStory(story) &&
    Boolean(story.slug.trim()) &&
    Boolean(story.title.trim()) &&
    Boolean(story.sourceName.trim()) &&
    Boolean(story.summary.trim() || story.body.some((paragraph) => paragraph.trim())) &&
    titleWordCount <= 14 &&
    !headlineReport.isGeneric &&
    !weakLegacyFrontPagePattern.test(publicText)
  );
}

function isSafeHomepageStory(story: EditableStory) {
  if (!isHomepageEligibleStory(story) || story.noindex) return false;
  if (isEditoriallyApprovedStory(story)) return true;
  if (isHighQualityLegacyStory(story)) return true;
  if (isQueueOrImportedStory(story)) return false;
  return !isWeakEditorialStory(story);
}

function storyValue(story: EditableStory, key: string) {
  return (story as unknown as Record<string, unknown>)[key];
}

export function isExplicitlyHiddenFromHomepage(story: EditableStory) {
  const hiddenFlags = ["hideFromHomepage", "hiddenFromHomepage", "homepageHidden"];
  if (hiddenFlags.some((key) => storyValue(story, key) === true || storyValue(story, key) === "true" || storyValue(story, key) === 1)) {
    return true;
  }
  return Object.prototype.hasOwnProperty.call(story, "showOnHomepage") && storyValue(story, "showOnHomepage") === false;
}

function settingStoryIds(value = "") {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function storiesInSettingOrder(stories: EditableStory[], ids: string[]) {
  const byId = new Map(stories.map((story) => [story.id, story]));
  return ids.map((id) => byId.get(id)).filter((story): story is EditableStory => Boolean(story));
}

function hasFutureHomepageSchedule(story: EditableStory) {
  if (!story.scheduledPublishAt.trim()) return false;
  const time = Date.parse(story.scheduledPublishAt);
  return Number.isFinite(time) && time > Date.now();
}

export function getHomepageLatestBlockers(story: EditableStory) {
  return [
    story.status !== "published" ? `Status is ${story.status}.` : "",
    !story.slug.trim() ? "Story has no public slug." : "",
    !story.title.trim() ? "Story has no headline." : "",
    hasFutureHomepageSchedule(story) ? "Story is scheduled for the future." : "",
    isExplicitlyHiddenFromHomepage(story) ? "Story is explicitly hidden from the homepage." : "",
  ].filter(Boolean);
}

export function isHomepageLatestStory(story: EditableStory) {
  return getHomepageLatestBlockers(story).length === 0;
}

function uniqueStories(stories: EditableStory[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const titles = new Set<string>();
  return stories.filter((story) => {
    const id = story.id.trim().toLowerCase();
    const slug = story.slug.trim().toLowerCase();
    const title = normalizeStoryTitle(story.title);
    if (
      Boolean(id && ids.has(id)) ||
      Boolean(slug && slugs.has(slug)) ||
      Boolean(title && titles.has(title))
    ) {
      return false;
    }
    if (id) ids.add(id);
    if (slug) slugs.add(slug);
    if (title) titles.add(title);
    return true;
  });
}

function rankStories(storyGroups: EditableStory[][]) {
  return uniqueStories(storyGroups.flatMap((stories) => sortStoriesByHomepageRecency(stories)));
}

function sortStoriesByLatestFeed(stories: EditableStory[]) {
  return [...stories].sort((a, b) => {
    const timeCompare = storyHomepageTime(b) - storyHomepageTime(a);
    if (timeCompare !== 0) return timeCompare;
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    const updateCompare = b.updatedAt.localeCompare(a.updatedAt);
    if (updateCompare !== 0) return updateCompare;
    return a.sortOrder - b.sortOrder;
  });
}

function rankLatestStories(storyGroups: EditableStory[][]) {
  return uniqueStories(storyGroups.flatMap((stories) => sortStoriesByLatestFeed(stories)));
}

class HomepageStoryUseTracker {
  private readonly ids = new Set<string>();
  private readonly slugs = new Set<string>();
  private readonly titles: string[] = [];

  has(story: EditableStory) {
    const id = story.id.trim().toLowerCase();
    const slug = story.slug.trim().toLowerCase();
    const title = normalizeStoryTitle(story.title);
    return (
      Boolean(id && this.ids.has(id)) ||
      Boolean(slug && this.slugs.has(slug)) ||
      Boolean(title && this.titles.some((usedTitle) =>
        usedTitle === title ||
        (usedTitle.length > 24 && title.length > 24 && (usedTitle.includes(title) || title.includes(usedTitle))) ||
        titleSimilarity(usedTitle, title) >= 0.86
      ))
    );
  }

  mark(story: EditableStory) {
    const id = story.id.trim().toLowerCase();
    const slug = story.slug.trim().toLowerCase();
    const title = normalizeStoryTitle(story.title);
    if (id) this.ids.add(id);
    if (slug) this.slugs.add(slug);
    if (title) this.titles.push(title);
  }

  take(stories: EditableStory[], limit: number) {
    const selected: EditableStory[] = [];
    for (const story of stories) {
      if (selected.length >= limit) break;
      if (this.has(story)) continue;
      this.mark(story);
      selected.push(story);
    }
    return selected;
  }

  available(stories: EditableStory[]) {
    return stories.filter((story) => !this.has(story));
  }
}

export class HomepageContentProvider {
  constructor(
    private readonly stories: EditableStory[],
    private readonly settings?: Pick<SiteSettings, "homepageLeadStoryId" | "homepageLeadStorySlug" | "homepageLatestStoryIds" | "homepageEditorsChoiceStoryIds" | "homepageHiddenStoryIds">
  ) {}

  getContent(): HomepageContent {
    const hiddenIds = new Set(settingStoryIds(this.settings?.homepageHiddenStoryIds));
    const visibleStories = this.stories.filter((story) => !hiddenIds.has(story.id));
    const safeStories = sortStoriesByHomepageRecency(visibleStories.filter(isSafeHomepageStory));
    const homepageStories = safeStories;
    const homepageLeadStories = visibleStories.filter(isHomepageLeadSelectable);
    const latestFeedStories = visibleStories.filter(isHomepageLatestStory);
    const approvedStories = homepageStories.filter(isEditoriallyApprovedStory);
    const reviewedStories = homepageStories.filter(isReviewedHomepageStory);
    const legacyStories = homepageStories.filter(isHighQualityLegacyStory);
    const recentImageStories = homepageStories.filter((story) => hasStoryPhoto(story));
    const allRankedStories = rankStories([
      approvedStories,
      reviewedStories,
      legacyStories,
      recentImageStories,
      homepageStories,
    ]);
    const selectedLeadStory = this.settings ? findHomepageLeadStory(homepageLeadStories, this.settings) : null;
    const featuredStory =
      selectedLeadStory ??
      homepageLeadStories.find((story) => story.isFeatured) ??
      allRankedStories[0] ??
      homepageStories[0];

    if (!featuredStory) {
      throw new Error("Old Sea Dogs homepage needs at least one published story.");
    }

    const usedStories = new HomepageStoryUseTracker();
    usedStories.mark(featuredStory);

    const manualLatest = storiesInSettingOrder(latestFeedStories, settingStoryIds(this.settings?.homepageLatestStoryIds));
    const manualEditorsChoice = storiesInSettingOrder(homepageStories, settingStoryIds(this.settings?.homepageEditorsChoiceStoryIds));
    const manualStoryPicks = homepageStories.filter((story) => story.isFeatured);
    const oldSeaDogsViewStories = homepageStories.filter((story) => story.oldSeaDogsView.trim());
    // Reserve the explicitly ordered latest feed before selecting secondary
    // editorial picks so the same story cannot be consumed by a lower-priority
    // homepage module.
    const selectedManualLatest = usedStories.take(manualLatest, 4);
    const selectedManualEditorsChoice = usedStories.take(manualEditorsChoice, 4);
    const editorPicks = [...selectedManualEditorsChoice, ...usedStories.take(rankStories([
      manualStoryPicks,
      approvedStories,
      oldSeaDogsViewStories,
      legacyStories,
      recentImageStories,
      homepageStories,
    ]), 4 - selectedManualEditorsChoice.length)];

    const latestReviewedOrFallback = [...selectedManualLatest, ...usedStories.take(rankLatestStories([
      latestFeedStories,
      approvedStories,
      reviewedStories,
      legacyStories,
      recentImageStories,
    ]), 4 - selectedManualLatest.length)];

    const reviewFeatureCandidates = homepageStories.filter((story) =>
      categoryMatchesLabel(story.category, "Reviews") ||
      categoryMatchesLabel(story.category, "Masterclass") ||
      categoryMatchesLabel(story.category, "Gear")
    );
    const reviewAndPracticalStories = usedStories.take(rankStories([
      reviewFeatureCandidates.filter(isEditoriallyApprovedStory),
      reviewFeatureCandidates.filter(isHighQualityLegacyStory),
      reviewFeatureCandidates.filter((story) => hasStoryPhoto(story)),
      reviewFeatureCandidates,
      legacyStories,
      recentImageStories,
      homepageStories,
    ]), 2);
    const reviewStories = reviewAndPracticalStories.filter((story) => categoryMatchesLabel(story.category, "Reviews"));
    const practicalStories = reviewAndPracticalStories.filter((story) => !categoryMatchesLabel(story.category, "Reviews"));
    const featuredPortClub = getFeaturedPortClubItem(usedStories.available(homepageStories));
    const sectionCards = oldSeaDogsSections.map((section) => ({
      ...section,
      photo: getSectionPreviewPhoto(homepageStories, section, usedStories),
    }));

    return {
      featuredStory,
      latestReviewedOrFallback,
      editorPicks,
      reviewStories,
      practicalStories,
      featuredPortClub,
      sectionCards,
    };
  }
}
