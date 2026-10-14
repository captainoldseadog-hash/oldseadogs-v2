import { publicMediaVariantUrl } from "./public-media.ts";

/** Widths the derivative route will encode. Keep this list small. */
export const RESPONSIVE_IMAGE_WIDTHS = [480, 768, 1200, 1600] as const;

/** Social cards and the Needles hero use this existing derivative width. */
export const SHARE_IMAGE_WIDTH = 1200;

const NEEDLES_HERO_PATH = "/images/guides/guides-solent-needles-hero-v1.png";
const DEFAULT_SOCIAL_LOGO_PATH = "/images/old-sea-dogs-logo.png";

export type ResponsiveImageWidth = (typeof RESPONSIVE_IMAGE_WIDTHS)[number];

const LOCAL_PUBLIC_IMAGE = /^\/(?:images|legacy-photos|section-heroes|ads)\/.+\.(?:png|jpe?g|webp|gif|avif)$/i;
const MEDIA_URL = /^\/api\/media\/([A-Za-z0-9_-]+)(?:[?#].*)?$/;

export function mediaIdFromPublicUrl(url: string) {
  return url.match(MEDIA_URL)?.[1] || "";
}

export function isDerivativeSource(url: string) {
  return Boolean(mediaIdFromPublicUrl(url)) || LOCAL_PUBLIC_IMAGE.test(url.split(/[?#]/, 1)[0] || "");
}

/**
 * A public image must be an http(s) URL or a root-relative path.
 * Filenames, notes and other CMS text are not requested.
 */
export function isRenderableImageReference(value: string) {
  const text = String(value || "").trim();
  if (!text || text.length > 2000 || /[\s\\<>]/.test(text) || text.includes("..")) return false;
  if (text.startsWith("/")) {
    return text.startsWith("//") ? false : /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]+$/.test(text);
  }
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  if (!isRenderableImageReference(url)) return "";
  if (!isDerivativeSource(url)) return url;
  const safeWidth = nearestResponsiveWidth(width);
  const mediaId = mediaIdFromPublicUrl(url);
  if (mediaId) return `/img/${safeWidth}/media/${mediaId}`;
  const relative = (url.split(/[?#]/, 1)[0] || "").replace(/^\/+/, "");
  return `/img/${safeWidth}/${relative}`;
}

export function derivativeSrcSet(url: string, widths: readonly number[] = RESPONSIVE_IMAGE_WIDTHS) {
  if (!isRenderableImageReference(url) || !isDerivativeSource(url)) return "";
  const unique: ResponsiveImageWidth[] = [];
  for (const width of widths) {
    const safeWidth = nearestResponsiveWidth(width);
    if (!unique.includes(safeWidth)) unique.push(safeWidth);
  }
  return unique.map((width) => `${derivativeImageUrl(url, width)} ${width}w`).join(", ");
}

function isFullWebVariantAlias(url: string) {
  return /[?&]variant=web(?:&|$)/.test(url);
}

export function mobileSourceSrcSet(url: string, dedicatedMobileUrl = "") {
  if (
    dedicatedMobileUrl
    && dedicatedMobileUrl !== url
    && !isFullWebVariantAlias(dedicatedMobileUrl)
    && isRenderableImageReference(dedicatedMobileUrl)
  ) return dedicatedMobileUrl;
  return derivativeSrcSet(url, [480, 768, 1200]) || (isRenderableImageReference(url) ? url : "");
}

/**
 * Homepage and card art. A prepared mobile/thumbnail file is used when one
 * exists; other local photos become a resized WebP derivative.
 */
export function resizedPublicImageUrl(url: string, width = 768) {
  if (!isRenderableImageReference(url)) return "";
  const dedicated = publicMediaVariantUrl(url, "mobile");
  if (dedicated && dedicated !== url && !isFullWebVariantAlias(dedicated) && isRenderableImageReference(dedicated)) return dedicated;
  const thumbnail = publicMediaVariantUrl(url, "thumbnail");
  if (thumbnail && thumbnail !== url && !/[?&]variant=/.test(thumbnail) && isRenderableImageReference(thumbnail)) return thumbnail;
  return derivativeImageUrl(url, width);
}

function pathOnly(url: string) {
  return url.split(/[?#]/, 1)[0] || "";
}

export function isNeedlesHeroImage(url: string) {
  return pathOnly(url) === NEEDLES_HERO_PATH;
}

/**
 * Open Graph and Twitter image for a public photo. Local artwork and CMS
 * media use the existing 1,200px derivative. The brand logo and remote URLs
 * stay as stored.
 */
export function shareImageUrl(url: string) {
  if (!isRenderableImageReference(url)) return "";
  if (pathOnly(url) === DEFAULT_SOCIAL_LOGO_PATH || !isDerivativeSource(url)) return url;
  return derivativeImageUrl(url, SHARE_IMAGE_WIDTH);
}

export function shareImageDimensions(width?: number, height?: number) {
  if (!width || !height || width <= SHARE_IMAGE_WIDTH) return { width, height };
  return {
    width: SHARE_IMAGE_WIDTH,
    height: Math.max(1, Math.round((height * SHARE_IMAGE_WIDTH) / width)),
  };
}

/** Desktop src for the Needles hero. Other heroes keep their existing display width. */
export function needlesHeroImageUrl(url: string) {
  if (!isRenderableImageReference(url)) return "";
  if (!isNeedlesHeroImage(url)) return url;
  return derivativeImageUrl(url, SHARE_IMAGE_WIDTH);
}
