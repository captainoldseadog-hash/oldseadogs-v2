import {
  consentCookieAttributes,
  consentCookieName,
  createConsentChoice,
} from "../../../lib/cookie-consent.ts";

export const dynamic = "force-dynamic";

function requestLocation(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return {
    hostname: (forwardedHost || url.hostname).split(":")[0],
    protocol: `${forwardedProtocol || url.protocol.replace(":", "")}:`,
  } as Pick<Location, "hostname" | "protocol">;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { analytics?: unknown; ads?: unknown } | null;
  if (typeof payload?.analytics !== "boolean" || typeof payload.ads !== "boolean") {
    return Response.json({ ok: false, error: "A complete consent choice is required." }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const choice = createConsentChoice({ analytics: payload.analytics, ads: payload.ads });
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.set(
    "Set-Cookie",
    `${consentCookieName}=${encodeURIComponent(JSON.stringify(choice))}; ${consentCookieAttributes(requestLocation(request))}; HttpOnly`,
  );
  return Response.json({ ok: true, choice }, { headers });
}
