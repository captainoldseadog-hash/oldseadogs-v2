export function isGalleryPublicRolloutEnabled(value) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

export function toPublicGalleryPhoto(item) {
  if (!item || item.status !== "approved") return null;
  const contentType = String(item.contentType || "");
  if (!contentType.startsWith("image/")) return null;
  const mediaId = String(item.mediaId || "").trim();
  if (!mediaId || mediaId.includes("/") || mediaId.includes("\\") || mediaId.includes("..")) return null;
  const title = String(item.title || "").trim();
  const caption = String(item.caption || "").trim();
  return {
    id: String(item.id || mediaId),
    title,
    caption: caption === title ? "" : caption,
    alt: String(item.alt || "").trim() || title || "Through the Lens photograph",
    credit: String(item.credit || "").trim(),
    location: String(item.location || "").trim(),
    imageUrl: `/api/media/${encodeURIComponent(mediaId)}`,
    updatedAt: String(item.updatedAt || item.createdAt || ""),
  };
}
