import { boatsErrorResponse, boatsPrivateJson, readRequestRecord, requestIp } from "../../../../lib/classifieds-http.ts";
import { submitBoatAdvertisement } from "../../../../lib/classifieds-service.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const record = await readRequestRecord(request);
    const result = await submitBoatAdvertisement(record, {
      token: String(record.draftToken || ""),
      ip: requestIp(request),
    });
    return boatsPrivateJson(result, result.accepted ? 200 : 202);
  } catch (error) {
    return boatsErrorResponse(error);
  }
}
