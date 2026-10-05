import legacyStories from "../content/legacy-stories.json" with { type: "json" };

type LegacyRedirectStory = {
  slug: string;
  category?: string;
  sourceUrl?: string;
};

const sectionRedirects = [
  ["/boat-shows", "/shows"],
  ["/racing", "/races"],
  ["/boat-reviews", "/reviews"],
] as const;

const oldSectionByCategory = new Map<string, string>([
  ["news", "news"],
  ["shows", "boat-shows"],
  ["racing", "racing"],
  ["races", "racing"],
  ["regatta", "racing"],
  ["boat reviews", "boat-reviews"],
  ["reviews", "boat-reviews"],
  ["gear", "gear"],
  ["destinations", "destinations"],
  ["masterclass", "masterclass"],
  ["maintenance", "masterclass"],
  ["lifestyle", "lifestyle"],
  ["clubs", "clubs"],
  ["ports", "ports"],
]);

const removableSlugPrefixes = [
  "news",
  "shows",
  "boat-shows",
  "racing",
  "races",
  "regatta",
  "boat-reviews",
  "reviews",
  "gear",
  "destinations",
  "masterclass",
  "maintenance",
  "lifestyle",
  "clubs",
  "ports",
];

const redirectMap = new Map<string, string>();

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withSlash.replace(/\/+$/g, "");
}

function pathFromUrl(value: string) {
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function addRedirect(oldPath: string, newPath: string) {
  const normalizedOldPath = normalizePath(oldPath);
  const normalizedNewPath = normalizePath(newPath);

  if (normalizedOldPath === normalizedNewPath) return;

  redirectMap.set(normalizedOldPath, normalizedNewPath);

  try {
    redirectMap.set(normalizePath(decodeURIComponent(normalizedOldPath)), normalizedNewPath);
  } catch {
    // Leave the encoded path in place if the source path cannot be decoded.
  }
}

function legacySectionForStory(story: LegacyRedirectStory) {
  const category = story.category?.trim().toLowerCase() || "";
  return oldSectionByCategory.get(category) || "";
}

function stripKnownPrefix(slug: string) {
  for (const prefix of removableSlugPrefixes) {
    const marker = `${prefix}-`;
    if (slug.startsWith(marker)) return slug.slice(marker.length);
  }
  return slug;
}

// These two archive stories were saved through the editor, which truncates
// slugs to 80 characters. Their live pages use that shorter slug (verified
// 5 Oct 2026). Other long archive slugs still resolve in full, so this is
// not a general truncation rule.
const liveSlugByLegacySlug = new Map<string, string>([
  [
    "racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026",
    "racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northe",
  ],
  [
    "boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-performance",
    "boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-perfo",
  ],
]);

function storyRedirectPath(slug: string) {
  return `/stories/${liveSlugByLegacySlug.get(slug) ?? slug}`;
}

for (const [oldPath, newPath] of sectionRedirects) {
  addRedirect(oldPath, newPath);
}

for (const story of legacyStories as LegacyRedirectStory[]) {
  const storyPath = storyRedirectPath(story.slug);

  if (story.sourceUrl) {
    addRedirect(pathFromUrl(story.sourceUrl), storyPath);
  }

  const legacySection = legacySectionForStory(story);
  if (legacySection) {
    addRedirect(`/${legacySection}/${story.slug}`, storyPath);
    addRedirect(`/${legacySection}/${stripKnownPrefix(story.slug)}`, storyPath);
  }
}

for (const [legacySlug, liveSlug] of liveSlugByLegacySlug) {
  addRedirect(`/stories/${legacySlug}`, `/stories/${liveSlug}`);
}

export function getLegacyRedirectPath(pathname: string) {
  return redirectMap.get(normalizePath(pathname)) ?? null;
}
