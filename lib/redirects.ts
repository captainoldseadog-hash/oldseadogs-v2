import legacyStories from "../content/legacy-stories.json" with { type: "json" };
import storyTriageRedirects from "../content/story-triage/redirects.json" with { type: "json" };

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
  "boat-shows",
  "boat-reviews",
  "destinations",
  "masterclass",
  "maintenance",
  "lifestyle",
  "regatta",
  "reviews",
  "racing",
  "shows",
  "clubs",
  "ports",
  "races",
  "news",
  "gear",
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
  const normalizedOldPath = lookupPath(oldPath);
  const normalizedNewPath = normalizePath(newPath);

  if (normalizedOldPath === normalizedNewPath) return;

  redirectMap.set(normalizedOldPath, normalizedNewPath);
}

function legacySectionForStory(story: LegacyRedirectStory) {
  const category = story.category?.trim().toLowerCase() || "";
  return oldSectionByCategory.get(category) || "";
}

function stripKnownPrefix(slug: string) {
  const lower = slug.toLowerCase();
  for (const prefix of removableSlugPrefixes) {
    const marker = `${prefix}-`;
    if (lower.startsWith(marker)) return lower.slice(marker.length);
  }
  return lower;
}

function collapseRepeatedSlashes(pathname: string) {
  return pathname.replace(/\/{2,}/g, "/");
}

function decodePath(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function lookupPath(pathname: string) {
  return normalizePath(decodePath(collapseRepeatedSlashes(pathname).toLowerCase()));
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

const liveStorySlugs = new Set<string>();
for (const story of legacyStories as LegacyRedirectStory[]) {
  liveStorySlugs.add((liveSlugByLegacySlug.get(story.slug) ?? story.slug).toLowerCase());
}

const unprefixedClaims = new Map<string, Set<string>>();
function claimUnprefixedSlug(bareSlug: string, liveSlug: string) {
  if (!bareSlug || bareSlug === liveSlug || liveStorySlugs.has(bareSlug)) return;
  const claims = unprefixedClaims.get(bareSlug) ?? new Set<string>();
  claims.add(liveSlug);
  unprefixedClaims.set(bareSlug, claims);
}

for (const story of legacyStories as LegacyRedirectStory[]) {
  const liveSlug = (liveSlugByLegacySlug.get(story.slug) ?? story.slug).toLowerCase();
  claimUnprefixedSlug(stripKnownPrefix(story.slug), liveSlug);
  claimUnprefixedSlug(stripKnownPrefix(liveSlug), liveSlug);
}

const unprefixedStorySlugs = new Map<string, string>();
for (const [bareSlug, liveSlugs] of unprefixedClaims) {
  if (liveSlugs.size === 1) unprefixedStorySlugs.set(bareSlug, [...liveSlugs][0]);
}
for (const [bareSlug, liveSlug] of unprefixedStorySlugs) {
  addRedirect(`/stories/${bareSlug}`, `/stories/${liveSlug}`);
}

for (const entry of [...storyTriageRedirects.duplicates, ...storyTriageRedirects.unprefixed]) {
  addRedirect(entry.from, entry.to);
}

const flattenedRedirects = flattenRedirectMap(redirectMap);
redirectMap.clear();
for (const [from, to] of flattenedRedirects) redirectMap.set(from, to);

/**
 * Follow redirect targets until they stop (max 5 hops). A loop or a longer
 * chain throws so a bad data file cannot ship a multi-hop or circular 301.
 */
export function flattenRedirectMap(map: ReadonlyMap<string, string>, maxHops = 5) {
  const flattened = new Map<string, string>();
  for (const [from, initial] of map) {
    const seen = new Set<string>([from]);
    let current = initial;
    let hops = 1;
    while (map.has(current)) {
      if (seen.has(current)) {
        throw new Error(`Redirect loop at ${from}`);
      }
      if (hops >= maxHops) {
        throw new Error(`Redirect chain from ${from} exceeds ${maxHops} hops`);
      }
      seen.add(current);
      current = map.get(current) || current;
      hops += 1;
    }
    if (current !== from) flattened.set(from, current);
  }
  return flattened;
}

export function legacyRedirectRuleCount() {
  return redirectMap.size;
}

function hasFileExtension(pathname: string) {
  return /\.[a-z0-9]{1,8}$/i.test(pathname);
}

export function getLegacyRedirectPath(pathname: string) {
  const lookup = lookupPath(pathname);
  const requested = normalizePath(pathname);
  const mapped = redirectMap.get(lookup);
  if (mapped && mapped !== requested) return mapped;
  const rawPath = pathname.split(/(?=[?#])/)[0] || pathname;
  if (!hasFileExtension(lookup) && rawPath !== lookup) return lookup;
  return null;
}
