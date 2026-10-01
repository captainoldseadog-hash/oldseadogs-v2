import { boatsErrorResponse, boatsPrivateJson, boatsRedirect, readRequestRecord, wantsJson } from "../../../../lib/classifieds-http.ts";
import { applySellerAction } from "../../../../lib/classifieds-service.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const record = await readRequestRecord(request).catch(() => ({} as Record<string, unknown>));
  const token = String(record.token || "");
  const action = String(record.action || "");
  try {
    await applySellerAction(token, action, record);
    if (!wantsJson(request)) {
      if (action === "delete") return boatsRedirect(request, "/boats-for-sale?removed=1");
      const page = action === "keep" ? "keep" : action === "relist" ? "relist" : "manage";
      return boatsRedirect(request, `/boats-for-sale/${page}/${encodeURIComponent(token)}?done=${encodeURIComponent(action)}`);
    }
    return boatsPrivateJson({ ok: true });
  } catch (error) {
    if (!wantsJson(request)) {
      const page = action === "keep" ? "keep" : action === "relist" ? "relist" : "manage";
      return boatsRedirect(request, `/boats-for-sale/${page}/${encodeURIComponent(token)}?error=1`);
    }
    return boatsErrorResponse(error);
  }
}
