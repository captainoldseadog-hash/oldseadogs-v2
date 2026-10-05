import { NextResponse, type NextRequest } from "next/server";
import { retiredMarinaGuideRedirect } from "./lib/marina-library-redirect";
import { cacheHeadersForPolicyRequest } from "./lib/public-cache-policy";

const requestPathHeader = "x-oldseadogs-request-path";

function applyCacheHeaders(headers: Headers, request: NextRequest) {
  const cacheHeaders = cacheHeadersForPolicyRequest({
    header: (name) => request.headers.get(name),
    method: request.method,
    pathname: request.nextUrl.pathname,
    searchParams: request.nextUrl.searchParams,
  });
  if (!cacheHeaders) return;
  for (const [key, value] of Object.entries(cacheHeaders)) headers.set(key, value);
}

export function proxy(request: NextRequest) {
  const marinaLibrary = retiredMarinaGuideRedirect(request.nextUrl.pathname);
  if (marinaLibrary) {
    const headers = new Headers();
    applyCacheHeaders(headers, request);
    headers.set("Location", marinaLibrary);
    return new NextResponse(null, {
      status: 301,
      headers,
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(requestPathHeader, request.nextUrl.pathname);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  applyCacheHeaders(response.headers, request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|apple-touch-icon.png|manifest.webmanifest|ads.txt).*)"],
};
