import {
  isIncludedInFeaturedPortClubRotation as tagsAllowFeaturedRotation,
  isPortOrClubCategory,
} from "../content/featured-port-club";
import { getClubProfileExcerpt } from "../content/club-profiles";
import { categoryMatchesLabel, displayCategoryLabel } from "../content/sections";
import { hasStoryPhoto, type EditableStory } from "./site-content";

const fallbackFeatureImage = "/images/marina-hero.png";

export type FeaturedPortClubItem = {
  story: EditableStory;
  label: "Featured Port" | "Featured Club";
  href: string;
  imageUrl: string;
  imageAlt: string;
  excerpt: string;
};

export function isPortOrClubStory(story: Pick<EditableStory, "category">) {
  return isPortOrClubCategory(story.category);
}

export function isIncludedInFeaturedPortClubRotation(
  story: Pick<EditableStory, "tags">
) {
  return tagsAllowFeaturedRotation(story.tags);
}

function dayNumber(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000
  );
}

function stablePortClubSort(a: EditableStory, b: EditableStory) {
  const categoryCompare = displayCategoryLabel(a.category).localeCompare(displayCategoryLabel(b.category));
  if (categoryCompare !== 0) return categoryCompare;
  const titleCompare = a.title.localeCompare(b.title);
  if (titleCompare !== 0) return titleCompare;
  return a.slug.localeCompare(b.slug);
}

export function getFeaturedPortClubItem(
  stories: EditableStory[],
  date = new Date()
): FeaturedPortClubItem | null {
  const candidates = stories
    .filter(isPortOrClubStory)
    .filter((story) => story.status === "published")
    .filter(isIncludedInFeaturedPortClubRotation)
    .sort(stablePortClubSort);

  if (candidates.length === 0) return null;

  const story = candidates[dayNumber(date) % candidates.length];
  const label = categoryMatchesLabel(story.category, "Ports") ? "Featured Port" : "Featured Club";
  const imageUrl = hasStoryPhoto(story) ? story.imageUrl : fallbackFeatureImage;

  return {
    story,
    label,
    href: `/stories/${story.slug}`,
    imageUrl,
    imageAlt: story.imageAlt || story.title,
    excerpt:
      categoryMatchesLabel(story.category, "Clubs")
        ? getClubProfileExcerpt(story)
        : story.summary || story.body[0] || "Open the full entry for details.",
  };
}
