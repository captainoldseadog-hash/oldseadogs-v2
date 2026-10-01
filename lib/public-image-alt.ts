const imageFilenamePattern = /\.(?:avif|bmp|gif|heic|ico|jpe?g|png|svg|tiff?|webp)$/i;

export function isFilenameLikeAlt(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > 180) return false;
  return imageFilenamePattern.test(text);
}

/**
 * Public alt text prefers a real CMS alt, then the CMS caption, then the
 * story or guide title. Values that are only an image file name are skipped
 * so pages do not announce names such as "Monaco 1.png".
 */
export function publicImageAlt(input: {
  alt?: string | null;
  caption?: string | null;
  title?: string | null;
  fallback?: string | null;
}) {
  const candidates = [input.alt, input.caption, input.title, input.fallback];
  for (const candidate of candidates) {
    const text = String(candidate || "").replace(/\s+/g, " ").trim();
    if (text && !isFilenameLikeAlt(text)) return text;
  }
  return "";
}
