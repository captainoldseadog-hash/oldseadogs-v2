import legacyStories from "../content/legacy-stories.json";

type LegacyRedirectStory = {
  slug: string;
  sourceUrl?: string;
};

const sectionRedirects = [
  ["/boat-shows", "/shows"],
  ["/racing", "/races"],
  ["/boat-reviews", "/reviews"],
] as const;

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

for (const [oldPath, newPath] of sectionRedirects) {
  addRedirect(oldPath, newPath);
}

for (const story of legacyStories as LegacyRedirectStory[]) {
  if (story.sourceUrl) {
    addRedirect(pathFromUrl(story.sourceUrl), `/stories/${story.slug}`);
  }
}

export function getLegacyRedirectPath(pathname: string) {
  return redirectMap.get(normalizePath(pathname)) ?? null;
}

