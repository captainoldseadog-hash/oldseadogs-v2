import type { Metadata } from "next";
import { fundingChoicesMessageSrc, isGoogleCmpEnabled } from "./google-cmp.ts";
import { isRenderableImageReference, shareImageDimensions, shareImageUrl } from "./responsive-image.ts";

export const siteName = "Old Sea Dogs";
export const contactEmail = "captainoldseadog@gmail.com";
export const defaultDescription =
  "Boating, yachting, boat reviews, ports, clubs, races, gear, destinations, and practical sea stories from Old Sea Dogs.";

const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process;

export const oldSeaDogsEnv =
  runtimeProcess?.env?.OLDSEADOGS_ENV === "production" ? "production" : "staging";
export const isProduction = oldSeaDogsEnv === "production";
export const isStaging = !isProduction;
export const productionSiteUrl = "https://oldseadogs.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, "");
}

export const siteUrl = isProduction
  ? productionSiteUrl
  : trimTrailingSlash(
      runtimeProcess?.env?.OLDSEADOGS_SITE_URL ||
        runtimeProcess?.env?.NEXT_PUBLIC_SITE_URL ||
        "http://161.35.168.184"
    );

export const searchIndexingEnabled = isProduction;

export const defaultGa4MeasurementId = "G-88HT8MHR7T";
const configuredGa4MeasurementId =
  runtimeProcess?.env?.OLDSEADOGS_GA4_ID ??
  runtimeProcess?.env?.NEXT_PUBLIC_GA4_ID ??
  defaultGa4MeasurementId;
export const ga4MeasurementId = /^G-[A-Z0-9]{4,20}$/i.test(configuredGa4MeasurementId.trim())
  ? configuredGa4MeasurementId.trim().toUpperCase()
  : "";
export const adsensePublisherId = "ca-pub-7278382533036873";
export const adsenseClientId =
  runtimeProcess?.env?.OLDSEADOGS_ADSENSE_CLIENT ||
  runtimeProcess?.env?.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
  "";
export const adsenseLoaderClientId = adsenseClientId || adsensePublisherId;
export const adsenseLoaderSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseLoaderClientId}`;
export const fundingChoicesScriptSrc = fundingChoicesMessageSrc(adsensePublisherId);
export const useGoogleCmp = isGoogleCmpEnabled(runtimeProcess?.env?.OLDSEADOGS_USE_GOOGLE_CMP);
const adsenseEnvironmentEnabled =
  isProduction &&
  (runtimeProcess?.env?.OLDSEADOGS_ENABLE_ADSENSE ||
    runtimeProcess?.env?.NEXT_PUBLIC_ENABLE_ADSENSE) === "true" &&
  Boolean(adsenseLoaderClientId);
export const adsenseEnabled = adsenseEnvironmentEnabled;
export const adsenseRecoveryMode =
  adsenseEnvironmentEnabled
    ? "Visible AdSense units are temporarily disabled during the low-value-content recovery pass."
    : "";

export const adsenseSlots = {
  homeTop: runtimeProcess?.env?.OLDSEADOGS_ADSENSE_SLOT_HOME_TOP || "",
  homeMid: runtimeProcess?.env?.OLDSEADOGS_ADSENSE_SLOT_HOME_MID || "",
  articleInline: runtimeProcess?.env?.OLDSEADOGS_ADSENSE_SLOT_ARTICLE_INLINE || "",
  articleBottom: runtimeProcess?.env?.OLDSEADOGS_ADSENSE_SLOT_ARTICLE_BOTTOM || "",
  sectionList: runtimeProcess?.env?.OLDSEADOGS_ADSENSE_SLOT_SECTION_LIST || "",
};

type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export const defaultOpenGraphImage: OgImage = {
  url: "/images/old-sea-dogs-logo.png",
  width: 1200,
  height: 630,
  alt: "Old Sea Dogs boating and yachting stories",
};

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, siteUrl).toString();
}

export function robotsMetadata(
  forceNoIndex = false,
  followWhenNoIndex = false
): Metadata["robots"] {
  if (searchIndexingEnabled && !forceNoIndex) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    };
  }

  if (searchIndexingEnabled && followWhenNoIndex) {
    return {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  };
}

const INVISIBLE_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g;
const META_DESCRIPTION_MAX = 160;
const META_TITLE_MAX = 60;
const SHORT_DESCRIPTION_MIN = 70;

/** Drop control and invisible characters, then collapse whitespace. */
export function plainPublicText(value: string) {
  return String(value || "").replace(INVISIBLE_CHARACTERS, "").replace(/\s+/g, " ").trim();
}

function trimAtWord(value: string, max: number) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace >= Math.min(80, max - 20) ? slice.slice(0, lastSpace) : value.slice(0, max);
  return cut.replace(/[\s,;:.!?–—-]+$/u, "").trim();
}

/**
 * Meta description used at render time. CMS copy is left unchanged.
 * Long text is cut on a word boundary. Very short text gains a site clause
 * so section and listing defaults are useful in search results.
 */
export function metaDescription(value: string) {
  let text = plainPublicText(value);
  if (!text) text = defaultDescription;
  if (text.length < SHORT_DESCRIPTION_MIN) {
    const note = /old sea dogs/i.test(text)
      ? "Practical boating and yachting coverage from the waterfront."
      : "Boating and yachting coverage from Old Sea Dogs.";
    text = `${text.replace(/[.!?…\s]+$/u, "")}. ${note}`;
  }
  return trimAtWord(text, META_DESCRIPTION_MAX);
}

export function pageTitle(title: string) {
  const clean = plainPublicText(title);
  if (!clean || clean === siteName) {
    return `${siteName} | Boating, Yachting & Sea Stories`;
  }
  const withSite = clean.includes(siteName) ? clean : `${clean} | ${siteName}`;
  if (withSite.length <= META_TITLE_MAX) return withSite;
  if (clean.length <= META_TITLE_MAX) return clean;
  return trimAtWord(clean, META_TITLE_MAX);
}

export function createPageMetadata({
  title,
  description,
  path,
  image = defaultOpenGraphImage,
  type = "website",
  noIndex = false,
  noIndexFollow = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: OgImage;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  noIndexFollow?: boolean;
}): Metadata {
  const fullTitle = pageTitle(title);
  const publicDescription = metaDescription(description);
  const usableImage = isRenderableImageReference(image.url) ? image : defaultOpenGraphImage;
  const sharedUrl = shareImageUrl(usableImage.url) || defaultOpenGraphImage.url;
  const sharedSize = sharedUrl === usableImage.url
    ? { width: usableImage.width, height: usableImage.height }
    : shareImageDimensions(usableImage.width, usableImage.height);
  const imageUrl = absoluteUrl(sharedUrl);

  return {
    title: fullTitle,
    description: publicDescription,
    alternates: {
      canonical: absoluteUrl(path),
    },
    openGraph: {
      type,
      title: fullTitle,
      description: publicDescription,
      url: absoluteUrl(path),
      siteName,
      images: [
        {
          url: imageUrl,
          width: sharedSize.width,
          height: sharedSize.height,
          alt: usableImage.alt ?? fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: publicDescription,
      images: [imageUrl],
    },
    robots: robotsMetadata(noIndex, noIndexFollow),
  };
}
