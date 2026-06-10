import { formatDate } from "../content/stories";
import { getPublishedStories, hasStoryPhoto, type EditableStory } from "./site-content";
import { normalizeSearchText } from "./text-search";

export type SearchResult = {
  slug: string;
  title: string;
  category: string;
  date: string;
  displayDate: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  readMinutes: number;
  score: number;
};

export { normalizeSearchText } from "./text-search";

function searchBlob(story: EditableStory) {
  return {
    title: normalizeSearchText(story.title),
    category: normalizeSearchText(story.category),
    author: normalizeSearchText(story.author),
    summary: normalizeSearchText(story.summary),
    tags: normalizeSearchText(story.tags.join(" ")),
    body: normalizeSearchText(story.body.join(" ")),
  };
}

export function searchTokens(query: string) {
  return Array.from(new Set(normalizeSearchText(query).split(/\s+/).filter(Boolean)));
}

export function scoreStoryForSearch(story: EditableStory, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const tokens = searchTokens(query);
  if (tokens.length === 0) return 0;

  const blob = searchBlob(story);
  const combinedBlob = [
    blob.title,
    blob.category,
    blob.author,
    blob.summary,
    blob.tags,
    blob.body,
  ].join(" ");
  const tokenHits = tokens.filter((token) => combinedBlob.includes(token));

  if (tokens.length > 1 && !combinedBlob.includes(normalizedQuery)) {
    const requiredHits = tokens.filter((token) => token.length > 2).length;
    if (tokenHits.length < requiredHits) return 0;
  }

  let score = 0;

  if (blob.title.includes(normalizedQuery)) score += 90;
  if (blob.tags.includes(normalizedQuery)) score += 55;
  if (blob.summary.includes(normalizedQuery)) score += 45;
  if (blob.body.includes(normalizedQuery)) score += 22;

  for (const token of tokens) {
    if (blob.title.includes(token)) score += 16;
    if (blob.tags.includes(token)) score += 12;
    if (blob.category.includes(token)) score += 8;
    if (blob.summary.includes(token)) score += 6;
    if (blob.author.includes(token)) score += 4;
    if (blob.body.includes(token)) score += 2;
  }

  if (hasStoryPhoto(story)) score += 2;
  if (story.isFeatured) score += 2;

  if (tokens.length > 2 && !combinedBlob.includes(normalizedQuery) && score < 70) {
    return 0;
  }

  if (tokens.length > 1 && score < 20) return 0;

  return score;
}

function toSearchResult(story: EditableStory, score: number): SearchResult {
  return {
    slug: story.slug,
    title: story.title,
    category: story.category,
    date: story.date,
    displayDate: formatDate(story.date),
    summary: story.summary,
    imageUrl: hasStoryPhoto(story) ? story.imageUrl : "",
    imageAlt: story.imageAlt,
    imageCredit: story.imageCredit,
    readMinutes: story.readMinutes,
    score,
  };
}

export async function searchStories(query: string, limit = 40) {
  const stories = await getPublishedStories();
  const results = stories
    .map((story) => ({ story, score: scoreStoryForSearch(story, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.story.date.localeCompare(a.story.date);
    })
    .slice(0, limit)
    .map(({ story, score }) => toSearchResult(story, score));

  return results;
}
