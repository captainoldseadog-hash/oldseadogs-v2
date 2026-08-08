import { categoryMatchesLabel } from "./sections";

export const featuredPortClubExcludedTag = "Exclude featured Port/Club rotation";

export function isPortOrClubCategory(category: string) {
  return categoryMatchesLabel(category, "Ports") || categoryMatchesLabel(category, "Clubs");
}

export function isIncludedInFeaturedPortClubRotation(tags: string[]) {
  return !tags.some(
    (tag) => tag.trim().toLowerCase() === featuredPortClubExcludedTag.toLowerCase()
  );
}
