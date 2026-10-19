import { portStoryGuideLink } from "../content/port-story-guides.ts";
import { getLegacyRedirectPath } from "./redirects.ts";

/**
 * Public href for a story slug. Guide-canonical port stories and renamed
 * duplicates resolve to the final URL so listings do not link through a redirect.
 */
export function publicStoryHref(slug: string) {
  const trimmed = String(slug || "").trim();
  if (!trimmed) return "/stories";
  const guide = portStoryGuideLink(trimmed);
  if (guide?.href) return guide.href;
  const path = `/stories/${trimmed}`;
  return getLegacyRedirectPath(path) || path;
}

export function guideLatestStoryLinks<T extends { slug: string; title: string; summary: string }>(
  guidePath: string,
  stories: readonly T[],
) {
  return stories.flatMap((story) => {
    const href = publicStoryHref(story.slug);
    if (href.split("#")[0] === guidePath) return [];
    return [{
      slug: story.slug,
      title: story.title,
      summary: story.summary,
      href,
    }];
  });
}
