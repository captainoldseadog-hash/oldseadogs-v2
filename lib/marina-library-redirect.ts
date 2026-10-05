/** Destination already recommended by the legacy Solent Marina Guide banner. */
export const marinaLibraryPath = "/guides?type=Marina#guide-library";

const retiredMarinaGuidePaths = new Set([
  "/marina-guide",
  "/guides/solent-marina-guide",
]);

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withSlash.replace(/\/+$/g, "");
}

export function retiredMarinaGuideRedirect(pathname: string) {
  return retiredMarinaGuidePaths.has(normalizePath(pathname)) ? marinaLibraryPath : null;
}
