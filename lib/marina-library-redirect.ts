/** The Solent guides hub. Retired overview addresses send people here. */
export const solentGuidesHubPath = "/guides/solent";

const retiredMarinaGuidePaths = new Set([
  "/marina-guide",
  "/guides/solent-marina-guide",
]);

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withSlash.replace(/\/+$/g, "");
}

/** Public overview that is no longer linked or listed. The CMS record stays. */
export function isRetiredMarinaGuideHub(guide: { slug?: string } | null | undefined) {
  return guide?.slug === "solent-marina-guide";
}

export function retiredMarinaGuideRedirect(pathname: string) {
  return retiredMarinaGuidePaths.has(normalizePath(pathname)) ? solentGuidesHubPath : null;
}
