import { boatsErrorResponse, boatsPrivateJson, boatsRedirect, readRequestRecord, requestIp, wantsJson } from "../../../../lib/classifieds-http.ts";
import { relayBoatEnquiry } from "../../../../lib/classifieds-service.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const record = await readRequestRecord(request).catch(() => ({} as Record<string, unknown>));
  const slug = String(record.slug || "");
  try {
    await relayBoatEnquiry(record, { ip: requestIp(request) });
    if (!wantsJson(request)) return boatsRedirect(request, `/boats-for-sale/${encodeURIComponent(slug)}?sent=1`);
    return boatsPrivateJson({ ok: true });
  } catch (error) {
    if (!wantsJson(request)) {
      const message = error instanceof Error ? error.message : "Please try again.";
      return boatsRedirect(request, `/boats-for-sale/${encodeURIComponent(slug)}?error=${encodeURIComponent(message)}`);
    }
    return boatsErrorResponse(error);
  }
}
