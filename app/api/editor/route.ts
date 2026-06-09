import { getMediaBucket } from "../../../db";
import { canEditSite, forbiddenResponse, getRequestEmail } from "../../../lib/editor-auth";
import {
  deleteAd,
  deleteStory,
  getEditorData,
  makeId,
  saveAd,
  saveMediaAsset,
  saveSettings,
  saveStory,
  saveStoryImage,
} from "../../../lib/site-content";

export async function GET(request: Request) {
  if (!canEditSite(request)) return forbiddenResponse();

  const data = await getEditorData();
  return Response.json({
    ...data,
    user: {
      email: getRequestEmail(request) || "local preview",
    },
  });
}

export async function POST(request: Request) {
  if (!canEditSite(request)) return forbiddenResponse();

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return uploadPhoto(request);
  }

  const payload = (await request.json()) as {
    action?: string;
    story?: Parameters<typeof saveStory>[0];
    settings?: Parameters<typeof saveSettings>[0];
    ad?: Parameters<typeof saveAd>[0];
    id?: string;
    imageUrl?: string;
    imageAlt?: string;
  };

  if (payload.action === "saveStory") {
    return Response.json({ story: await saveStory(payload.story ?? {}) });
  }

  if (payload.action === "saveStoryImage" && payload.id && payload.imageUrl) {
    return Response.json({
      story: await saveStoryImage(payload.id, payload.imageUrl, payload.imageAlt ?? ""),
    });
  }

  if (payload.action === "deleteStory" && payload.id) {
    await deleteStory(payload.id);
    return Response.json({ ok: true });
  }

  if (payload.action === "saveSettings") {
    return Response.json({ settings: await saveSettings(payload.settings ?? {}) });
  }

  if (payload.action === "saveAd") {
    return Response.json({ ad: await saveAd(payload.ad ?? {}) });
  }

  if (payload.action === "deleteAd" && payload.id) {
    await deleteAd(payload.id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "I could not recognise that editor action." }, { status: 400 });
}

async function uploadPhoto(request: Request) {
  const bucket = getMediaBucket();
  if (!bucket) {
    return Response.json(
      { error: "Photo storage is not available yet." },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get("photo");
  const alt = String(form.get("alt") || "");

  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a photo before uploading." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Please upload an image file." }, { status: 400 });
  }

  const id = makeId("media");
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const key = `uploads/${id}-${safeName}`;
  const bytes = await file.arrayBuffer();

  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  const asset = await saveMediaAsset({
    id,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    r2Key: key,
    url: `/api/media/${id}`,
    alt,
  });

  return Response.json({ media: asset });
}
