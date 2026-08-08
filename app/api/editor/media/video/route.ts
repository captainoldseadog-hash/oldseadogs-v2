import { canEditSite, forbiddenResponse, privateEditorHeaders } from "../../../../../lib/editor-auth";
import { EditorMediaUploadError, maxVideoUploadMb, saveEditorVideoAsset } from "../../../../../lib/editor-media-upload";

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(privateEditorHeaders())) headers.set(key, value);
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  if (!await canEditSite(request)) return forbiddenResponse();
  try {
    const form = await request.formData();
    const file = form.get("video");
    if (!(file instanceof File)) throw new EditorMediaUploadError("Choose a video file.");
    const media = await saveEditorVideoAsset({ bytes: await file.arrayBuffer(), contentType: file.type.toLowerCase(), fileName: file.name, size: file.size });
    return privateJson({ ok: true, media, maxVideoUploadMb });
  } catch (error) {
    return privateJson({ ok: false, error: error instanceof Error ? error.message : "Video upload failed." }, { status: error instanceof EditorMediaUploadError ? error.status : 500 });
  }
}
