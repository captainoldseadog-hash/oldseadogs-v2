/**
 * Decides which responses a shared cache may store.
 *
 * Anonymous browser document navigations are cacheable. CMS, editor, preview, API and
 * flight/prefetch responses are not. Vinext serves flight at `*.rsc` and
 * strips the RSC header before this proxy on the app handler, so flight is
 * also detected from the `.rsc` path, `Accept: text/x-component`, and the
 * Vinext render-mode header. A response is also uncacheable when the
 * request carries Old Sea Dogs consent or editor state, so a shared cache
 * never stores a response that was generated with that state present.
 * Image and media bytes do not vary with that state and are left to their
 * own handlers.
 */

export const PUBLIC_DOCUMENT_CACHE_CONTROL =
  "public, max-age=60, s-maxage=120, stale-while-revalidate=300";

/** Shared caches only. Omits s-maxage so Cloudflare can honour stale-while-revalidate. */
export const PUBLIC_SHARED_CACHE_CONTROL =
  "public, max-age=120, stale-while-revalidate=300";

export const PRIVATE_CACHE_CONTROL = "private, no-store";

const OMIT_PREFIXES = [
  "/api/media",
  "/img/",
  "/_next/",
  "/images/",
  "/legacy-photos/",
  "/section-heroes/",
  "/ads/",
  "/uploads/",
];

const STATIC_EXTENSION = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|map|woff2?)$/i;

export type CacheDisposition = "public-document" | "private" | "omit";

export type CachePolicyRequest = {
  method: string;
  pathname: string;
  searchParams: { has(name: string): boolean };
  header(name: string): string | null;
};

export function publicCacheDisposition(request: CachePolicyRequest): CacheDisposition {
  const pathname = normalizePathname(request.pathname);
  if (shouldOmitCacheOverride(pathname)) return "omit";

  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return "private";
  if (isPrivatePath(pathname)) return "private";
  if (hasPrivateRequestState(request)) return "private";
  if (!isDocumentNavigation(request)) return "private";
  return "public-document";
}

export function publicCacheHeaders(disposition: CacheDisposition): Record<string, string> | null {
  if (disposition === "omit") return null;
  if (disposition === "private") {
    return {
      "Cache-Control": PRIVATE_CACHE_CONTROL,
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
    };
  }
  return {
    "Cache-Control": PUBLIC_DOCUMENT_CACHE_CONTROL,
    "CDN-Cache-Control": PUBLIC_SHARED_CACHE_CONTROL,
    "Cloudflare-CDN-Cache-Control": PUBLIC_SHARED_CACHE_CONTROL,
  };
}

export function cacheHeadersForPolicyRequest(request: CachePolicyRequest) {
  return publicCacheHeaders(publicCacheDisposition(request));
}

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const withoutQuery = pathname.split("?")[0] || "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery;
}

function shouldOmitCacheOverride(pathname: string) {
  if (pathname === "/favicon.png" || pathname === "/ads.txt") return true;
  if (OMIT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`) || pathname.startsWith(prefix))) {
    return true;
  }
  return STATIC_EXTENSION.test(pathname);
}

function isPrivatePath(pathname: string) {
  if (pathname === "/editor" || pathname.startsWith("/editor/")) return true;
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  if (pathname === "/preview" || pathname.startsWith("/preview/") || pathname.includes("/preview/")) return true;
  if (pathname.endsWith(".rsc")) return true;
  return false;
}

function hasPrivateRequestState(request: CachePolicyRequest) {
  if (request.searchParams.has("preview") || request.searchParams.has("draft")) return true;
  if (cookieNames(request.header("cookie")).some((name) => name.startsWith("oldseadogs_"))) return true;
  const editorEmail = request.header("oai-authenticated-user-email")
    || request.header("x-openai-authenticated-user-email")
    || "";
  if (editorEmail.trim()) return true;
  if ((request.header("authorization") || "").trim()) return true;
  if ((request.header("rsc") || "").trim()) return true;
  if ((request.header("next-router-prefetch") || "").trim()) return true;
  if ((request.header("next-router-segment-prefetch") || "").trim()) return true;
  if ((request.header("x-vinext-rsc-render-mode") || "").trim()) return true;
  if ((request.header("accept") || "").toLowerCase().includes("text/x-component")) return true;
  return false;
}

/**
 * Vinext removes `.rsc` and the RSC header before this proxy runs, then
 * renders flight at that suffix. A shared cache must only store browser
 * document navigations. Anything else stays private, including a bare
 * `.rsc` fetch whose Accept is not text/html.
 */
function isDocumentNavigation(request: CachePolicyRequest) {
  const accept = (request.header("accept") || "").toLowerCase();
  if (!accept.includes("text/html")) return false;
  const dest = (request.header("sec-fetch-dest") || "").trim().toLowerCase();
  return dest === "" || dest === "document";
}

function cookieNames(header: string | null) {
  if (!header) return [];
  return header
    .split(";")
    .map((part) => part.split("=")[0]?.trim().toLowerCase() || "")
    .filter(Boolean);
}
