/** Widths the derivative route will encode. Keep this list small. */
export const RESPONSIVE_IMAGE_WIDTHS = [480, 768, 1200, 1600] as const;

export type ResponsiveImageWidth = (typeof RESPONSIVE_IMAGE_WIDTHS)[number];

const LOCAL_PUBLIC_IMAGE = /^\/(?:images|legacy-photos|section-heroes|ads)\/.+\.(?:png|jpe?g|webp|gif|avif)$/i;
const MEDIA_URL = /^\/api\/media\/([A-Za-z0-9_-]+)(?:[?#].*)?$/;

export function mediaIdFromPublicUrl(url: string) {
  return url.match(MEDIA_URL)?.[1] || "";
}

export function isDerivativeSource(url: string) {
  return Boolean(mediaIdFromPublicUrl(url)) || LOCAL_PUBLIC_IMAGE.test(url.split(/[?#]/, 1)[0] || "");
}

export function nearestResponsiveWidth(width: number): ResponsiveImageWidth {
  const numeric = RESPONSIVE_IMAGE_WIDTHS.find((candidate) => candidate >= width);
  return numeric || RESPONSIVE_IMAGE_WIDTHS[RESPONSIVE_IMAGE_WIDTHS.length - 1];
}

/**
 * URL of a resized WebP derivative. Original uploaded and committed files are
 * never the target of this URL.
 */
export function derivativeImageUrl(url: string, width: number) {
  if (!url || !isDerivativeSource(url)) return url;
  const safeWidth = nearestResponsiveWidth(width);
  const mediaId = mediaIdFromPublicUrl(url);
  if (mediaId) {
    if (safeWidth <= 480) return `/api/media/${mediaId}?variant=thumbnail`;
    if (safeWidth >= 1600) return `/api/media/${mediaId}?variant=web`;
    return `/img/${safeWidth}/media/${mediaId}`;
  }
  const relative = (url.split(/[?#]/, 1)[0] || "").replace(/^\/+/, "");
  return `/img/${safeWidth}/${relative}`;
}

export function derivativeSrcSet(url: string, widths: readonly number[] = RESPONSIVE_IMAGE_WIDTHS) {
  if (!isDerivativeSource(url)) return "";
  const unique: ResponsiveImageWidth[] = [];
  for (const width of widths) {
    const safeWidth = nearestResponsiveWidth(width);
    if (!unique.includes(safeWidth)) unique.push(safeWidth);
  }
  return unique.map((width) => `${derivativeImageUrl(url, width)} ${width}w`).join(", ");
}

export function mobileSourceSrcSet(url: string, dedicatedMobileUrl = "") {
  if (dedicatedMobileUrl && dedicatedMobileUrl !== url) return dedicatedMobileUrl;
  return derivativeSrcSet(url, [480, 768, 1200]) || url;
}
