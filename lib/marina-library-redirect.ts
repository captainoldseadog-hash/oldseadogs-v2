/** Public hub for the Solent Marina Guide. `/marina-guide` is the old address. */
export const solentMarinaGuidePath = "/guides/solent-marina-guide";

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withSlash.replace(/\/+$/g, "");
}

export function retiredMarinaGuideRedirect(pathname: string) {
  return normalizePath(pathname) === "/marina-guide" ? solentMarinaGuidePath : null;
}
