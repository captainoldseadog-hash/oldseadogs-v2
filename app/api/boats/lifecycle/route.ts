import { boatsErrorResponse, boatsPrivateJson, requireBoatsEditor } from "../../../../lib/classifieds-http.ts";
import { runClassifiedsLifecycle } from "../../../../lib/classifieds-service.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireBoatsEditor(request);
  if (denied) return denied;
  try {
    const result = await runClassifiedsLifecycle();
    return boatsPrivateJson({ ok: true, result });
  } catch (error) {
    return boatsErrorResponse(error);
  }
}
