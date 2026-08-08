import { getMediaBucket } from "../db";
import { saveLocalMediaUpload, saveLocalVideoUpload } from "./local-media-storage";
import { makeId, saveMediaAsset, type MediaAsset } from "./site-content";

export const editorMediaUploadRoute = "/api/editor/media/upload";
export const editorMediaUploadAction = "uploadMedia";
export const maxPhotoUploadMb = 25;
export const maxPhotoUploadBytes = maxPhotoUploadMb * 1024 * 1024;
export const maxVideoUploadMb = Math.max(25, Math.min(500, Number((globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.OLDSEADOGS_MAX_VIDEO_UPLOAD_MB || 150)));
export const maxVideoUploadBytes = maxVideoUploadMb * 1024 * 1024;
export const allowedVideoTypes = new Map([["video/mp4", "mp4"], ["video/webm", "webm"], ["video/quicktime", "mov"]]);
export const allowedPhotoTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type EditorMediaUploadLogContext = {
  route: string;
  uploadId: string;
  startedAt: number;
};

type EditorMediaUploadLogFields = Record<string, string | number | boolean | null | undefined>;

type ParsedEditorMediaUpload = {
  action: string;
  asset: MediaAsset & { thumbnailUrl: string };
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

type ParseEditorMediaUploadOptions = {
  expectedAction?: string;
  allowMissingAction?: boolean;
};

export class EditorMediaUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EditorMediaUploadError";
    this.status = status;
  }
}

export function makeEditorMediaUploadLogContext(route: string): EditorMediaUploadLogContext {
  return {
    route,
    uploadId: makeId("upload"),
    startedAt: Date.now(),
  };
}

export function logEditorMediaUpload(
  context: EditorMediaUploadLogContext,
  event: string,
  fields: EditorMediaUploadLogFields = {}
) {
  console.info("[OldSeaDogs editor media upload]", {
    uploadId: context.uploadId,
    route: context.route,
    event,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - context.startedAt,
    ...fields,
  });
}

export function logEditorMediaUploadError(
  context: EditorMediaUploadLogContext,
  event: string,
  error: unknown,
  fields: EditorMediaUploadLogFields = {}
) {
  console.error("[OldSeaDogs editor media upload]", {
    uploadId: context.uploadId,
    route: context.route,
    event,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - context.startedAt,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : String(error),
    ...fields,
  });
}

export function editorMediaUploadResponseBody(upload: ParsedEditorMediaUpload) {
  return {
    ok: true,
    mediaId: upload.asset.id,
    mediaUrl: upload.asset.url,
    filename: upload.filename,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
    thumbnailUrl: upload.asset.thumbnailUrl,
    media: upload.asset,
  };
}

export function contentTypeForPhoto(file: File) {
  const declaredType = file.type.toLowerCase();
  if (allowedPhotoTypes.has(declaredType)) return declaredType;

  const fileName = file.name.toLowerCase();
  if (/\.(jpe?g)$/.test(fileName)) return "image/jpeg";
  if (/\.png$/.test(fileName)) return "image/png";
  if (/\.webp$/.test(fileName)) return "image/webp";

  return "";
}

function safeUploadName(fileName: string, contentType: string) {
  const fallbackExtension = allowedPhotoTypes.get(contentType) || "jpg";
  const baseName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  const safeName = baseName || `old-sea-dogs-photo.${fallbackExtension}`;
  return /\.[a-z0-9]+$/.test(safeName) ? safeName : `${safeName}.${fallbackExtension}`;
}

export async function saveEditorImageAsset({
  bytes,
  contentType,
  fileName,
  size,
  alt,
  logContext,
}: {
  request: Request;
  bytes: ArrayBuffer;
  contentType: string;
  fileName: string;
  size: number;
  alt: string;
  logContext: EditorMediaUploadLogContext;
}) {
  const id = makeId("media");
  const safeName = safeUploadName(fileName, contentType);
  const key = `uploads/${id}-${safeName}`;
  // Vinext's local preview runs inside a Cloudflare-compatible worker where
  // filesystem writes are unavailable, so use its R2 binding when present.
  // DigitalOcean has no R2 binding and continues to use backed-up local files.
  const bucket = getMediaBucket();
  let storageKey = key;
  let url = `/api/media/${id}`;
  let originalKey = key;
  let webKey = key;
  let width = 0;
  let height = 0;

  logEditorMediaUpload(logContext, "media write started", {
    mediaId: id,
    filename: fileName,
    mimeType: contentType,
    sizeBytes: size,
    storage: bucket ? "r2" : "local-file",
  });

  if (bucket) {
    try {
      await bucket.put(key, bytes, {
        httpMetadata: {
          contentType,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown storage error";
      throw new Error(`Photo storage error: ${message}`);
    }
  } else {
    const localUpload = await saveLocalMediaUpload({
      bytes,
      contentType,
      fileName: safeName,
      id,
    });
    if (!localUpload) {
      throw new Error("Storage error. The editor could not create a persistent media file.");
    }
    storageKey = localUpload.key;
    url = localUpload.url;
    originalKey = localUpload.originalKey;
    webKey = localUpload.webKey;
    width = localUpload.width;
    height = localUpload.height;
  }

  logEditorMediaUpload(logContext, "media write completed", {
    mediaId: id,
    mediaUrl: url,
    storageKey,
  });
  logEditorMediaUpload(logContext, "editor-store update started", {
    mediaId: id,
  });

  const asset = await saveMediaAsset({
    id,
    filename: fileName,
    contentType,
    size,
    r2Key: storageKey,
    url,
    alt,
    originalKey,
    webKey,
    width,
    height,
  });

  logEditorMediaUpload(logContext, "editor-store update completed", {
    mediaId: asset.id,
    mediaUrl: asset.url,
  });

  return {
    ...asset,
    thumbnailUrl: `/api/media/${asset.id}?variant=thumbnail`,
  };
}

export async function saveEditorVideoAsset({ bytes, contentType, fileName, size }: {
  bytes: ArrayBuffer; contentType: string; fileName: string; size: number;
}) {
  const allowMov = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.OLDSEADOGS_ALLOW_MOV_UPLOAD === "true";
  if (!allowedVideoTypes.has(contentType) || (contentType === "video/quicktime" && !allowMov)) {
    throw new EditorMediaUploadError("Choose an MP4 or WebM video. MOV is available only when explicitly enabled on the server.", 415);
  }
  if (size > maxVideoUploadBytes) throw new EditorMediaUploadError(`Video is larger than the configured ${maxVideoUploadMb} MB limit. Use YouTube or Vimeo for large files.`, 413);
  const id = makeId("video");
  const safeName = safeUploadName(fileName, contentType);
  const key = `videos/${id}-${safeName}`;
  const bucket = getMediaBucket();
  let storageKey = key;
  if (bucket) {
    await bucket.put(key, bytes, { httpMetadata: { contentType } });
  } else {
    const local = await saveLocalVideoUpload({ bytes, contentType, fileName: safeName, id });
    if (!local) throw new Error("Storage error. The editor could not create a persistent video file.");
    storageKey = local.key;
  }
  return saveMediaAsset({
    id, filename: fileName, originalFilename: fileName, displayName: fileName.replace(/\.[^.]+$/, ""),
    contentType, size, r2Key: storageKey, url: `/api/media/${id}`, originalKey: bucket ? key : `local:${id}:original`,
    sourceType: "video-upload", description: fileName.replace(/\.[^.]+$/, ""), copyrightOwnership: "unknown",
  });
}

export async function parseAndSaveEditorMediaUpload(
  request: Request,
  logContext: EditorMediaUploadLogContext,
  options: ParseEditorMediaUploadOptions = {}
): Promise<ParsedEditorMediaUpload> {
  let form: FormData;
  logEditorMediaUpload(logContext, "formData parse started");
  try {
    form = await request.formData();
  } catch (error) {
    logEditorMediaUploadError(logContext, "formData parse failed", error);
    throw new EditorMediaUploadError(
      "The photo upload did not reach the editor correctly. Please choose the image again.",
      400
    );
  }

  const action = String(form.get("action") || "").trim();
  const file = form.get("photo") ?? form.get("file");
  const fileFieldName = form.has("photo") ? "photo" : form.has("file") ? "file" : "";
  const filename = file instanceof File ? file.name : "";
  const mimeType = file instanceof File ? file.type || "" : "";
  const sizeBytes = file instanceof File ? file.size : 0;

  logEditorMediaUpload(logContext, "formData parsed", {
    action,
    fileFieldName,
    filename,
    mimeType,
    sizeBytes,
  });

  if (options.expectedAction) {
    const missingActionAllowed = options.allowMissingAction && !action;
    if (!missingActionAllowed && action !== options.expectedAction) {
      throw new EditorMediaUploadError(
        `Unexpected upload action. Expected ${options.expectedAction}.`,
        400
      );
    }
  }

  if (!(file instanceof File)) {
    throw new EditorMediaUploadError("Choose a photo before uploading.", 400);
  }

  const contentType = contentTypeForPhoto(file);
  if (!contentType) {
    throw new EditorMediaUploadError(
      "Unsupported file type. Please upload a JPG, JPEG, PNG or WebP image.",
      415
    );
  }

  if (file.size <= 0) {
    throw new EditorMediaUploadError("That image file is empty. Please choose another photo.", 400);
  }

  if (file.size > maxPhotoUploadBytes) {
    throw new EditorMediaUploadError(
      `File too large. Please upload an image under ${maxPhotoUploadMb} MB.`,
      413
    );
  }

  const bytes = await file.arrayBuffer();
  const asset = await saveEditorImageAsset({
    request,
    bytes,
    contentType,
    fileName: file.name,
    size: file.size,
    alt: String(form.get("alt") || ""),
    logContext,
  });

  return {
    action,
    asset,
    filename: file.name,
    mimeType: contentType,
    sizeBytes: file.size,
  };
}
