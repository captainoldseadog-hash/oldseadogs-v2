import { NextResponse, type NextRequest } from "next/server";

const requestPathHeader = "x-oldseadogs-request-path";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(requestPathHeader, request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|ads.txt).*)"],
};
