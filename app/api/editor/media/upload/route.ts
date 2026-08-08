import {
  canEditSite,
  forbiddenResponse,
  privateEditorHeaders,
} from "../../../../../lib/editor-auth";
import {
  EditorMediaUploadError,
  editorMediaUploadAction,
  editorMediaUploadResponseBody,
  editorMediaUploadRoute,
  logEditorMediaUpload,
  logEditorMediaUploadError,
  makeEditorMediaUploadLogContext,
  parseAndSaveEditorMediaUpload,
} from "../../../../../lib/editor-media-upload";

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(privateEditorHeaders())) {
    headers.set(key, value);
  }
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  const logContext = makeEditorMediaUploadLogContext(editorMediaUploadRoute);
  const contentType = request.headers.get("content-type") || "";
  const contentLength = request.headers.get("content-length") || "";

  logEditorMediaUpload(logContext, "request received", {
    contentType,
    contentLength,
  });

  try {
    const authenticated = await canEditSite(request);
    logEditorMediaUpload(logContext, "auth result", { authenticated });
    if (!authenticated) {
      logEditorMediaUpload(logContext, "response sent", { status: 403 });
      return forbiddenResponse();
    }

    if (!contentType.includes("multipart/form-data")) {
      throw new EditorMediaUploadError("Upload must use multipart/form-data.", 415);
    }

    const upload = await parseAndSaveEditorMediaUpload(request, logContext, {
      expectedAction: editorMediaUploadAction,
    });
    const body = editorMediaUploadResponseBody(upload);

    logEditorMediaUpload(logContext, "response sent", {
      status: 200,
      mediaId: body.mediaId,
      mediaUrl: body.mediaUrl,
    });
    return privateJson(body);
  } catch (error) {
    const status = error instanceof EditorMediaUploadError ? error.status : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "The editor could not create a persistent media record.";
    logEditorMediaUploadError(logContext, "request failed", error, { status });
    logEditorMediaUpload(logContext, "response sent", { status });
    return privateJson({ ok: false, error: message }, { status });
  }
}
