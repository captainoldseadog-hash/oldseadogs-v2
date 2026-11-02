/**
 * Public "Open source" links. Missing values stay hidden, and so does any
 * address that is already this story or redirects back to it.
 */

const legacyLiveSlug = new Map<string, string>([
  [
    "racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026",
    "racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northe",
  ],
  [
    "boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-performance",
    "boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-perfo",
  ],
]);

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

function decodePath(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

export function publicOpenSourceUrl(
  sourceUrl: string | null | undefined,
  storyPath: string,
  legacyRedirect: (pathname: string) => string | null = () => null,
) {
  const raw = String(sourceUrl || "").trim();
  if (!raw || raw.startsWith("//")) return "";
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith("/")) return "";
  let url: URL;
  try {
    url = new URL(raw, "https://oldseadogs.com");
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";

  const current = normalizePath(storyPath);
  if (!current || current === "/") return raw;
  const sourcePath = normalizePath(decodePath(url.pathname));
  const pointsHere = (pathname: string) => normalizePath(pathname) === current;
  if (pointsHere(sourcePath)) return "";
  const redirected = legacyRedirect(sourcePath);
  if (redirected && pointsHere(redirected)) return "";

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const onSite = !raw.includes("://") || host === "oldseadogs.com" || host === "localhost" || host === "127.0.0.1";
  if (!onSite) return raw;
  const last = sourcePath.split("/").filter(Boolean).pop()?.toLowerCase() || "";
  const slug = current.split("/").filter(Boolean).pop()?.toLowerCase() || "";
  if (last && (last === slug || legacyLiveSlug.get(last) === slug)) return "";
  return raw;
}
