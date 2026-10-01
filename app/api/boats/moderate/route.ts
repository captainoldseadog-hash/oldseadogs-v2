import { boatsErrorResponse, boatsPrivateJson, readRequestRecord, requireBoatsEditor } from "../../../../lib/classifieds-http.ts";
import { editorBoatListings, moderateBoatListing } from "../../../../lib/classifieds-service.ts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireBoatsEditor(request);
  if (denied) return denied;
  try {
    return boatsPrivateJson({ listings: await editorBoatListings() });
  } catch (error) {
    return boatsErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireBoatsEditor(request);
  if (denied) return denied;
  try {
    const record = await readRequestRecord(request);
    const listing = await moderateBoatListing(String(record.action || ""), String(record.id || ""), record);
    return boatsPrivateJson({ ok: true, listing });
  } catch (error) {
    return boatsErrorResponse(error);
  }
}
