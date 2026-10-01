import { boatsErrorResponse, boatsPrivateJson } from "../../../../lib/classifieds-http.ts";
import { createBoatDraft, saveBoatPhoto } from "../../../../lib/classifieds-service.ts";
import { publicPhoto } from "../../../../lib/classifieds-public.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    let token = String(form.get("draftToken") || "");
    if (!token) {
      const draft = await createBoatDraft();
      token = draft.draftToken;
    }
    if (!(file instanceof File)) {
      return boatsPrivateJson({ error: "Choose a photograph to upload.", draftToken: token }, 400);
    }
    const photo = await saveBoatPhoto({
      token,
      bytes: new Uint8Array(await file.arrayBuffer()),
      declaredType: file.type || file.name,
    });
    return boatsPrivateJson({ draftToken: token, photo: publicPhoto(photo) });
  } catch (error) {
    return boatsErrorResponse(error);
  }
}
