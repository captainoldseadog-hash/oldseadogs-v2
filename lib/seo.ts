import type { Metadata } from "next";
import { shareImageDimensions, shareImageUrl } from "./responsive-image.ts";

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
export const adsenseClientId =
  runtimeProcess?.env?.OLDSEADOGS_ADSENSE_CLIENT ||
  runtimeProcess?.env?.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
  "";
const adsenseEnvironmentEnabled =
  isProduction &&
  (runtimeProcess?.env?.OLDSEADOGS_ENABLE_ADSENSE ||
    runtimeProcess?.env?.NEXT_PUBLIC_ENABLE_ADSENSE) === "true" &&
  Boolean(adsenseClientId);
export const adsenseEnabled = false;
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

export function pageTitle(title: string) {
  if (title === siteName) {
    return `${siteName} | Boating, Yachting & Sea Stories`;
  }
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
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
  const sharedUrl = shareImageUrl(image.url);
  const sharedSize = sharedUrl === image.url
    ? { width: image.width, height: image.height }
    : shareImageDimensions(image.width, image.height);
  const imageUrl = absoluteUrl(sharedUrl);

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: absoluteUrl(path),
    },
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      siteName,
      images: [
        {
          url: imageUrl,
          width: sharedSize.width,
          height: sharedSize.height,
          alt: image.alt ?? fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    robots: robotsMetadata(noIndex, noIndexFollow),
  };
}
