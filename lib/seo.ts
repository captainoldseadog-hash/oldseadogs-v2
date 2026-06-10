import type { Metadata } from "next";

export const siteName = "Old Sea Dogs";
export const siteUrl = "https://www.oldseadogs.com";
export const contactEmail = "captainoldseadog@gmail.com";
export const defaultDescription =
  "Boating, yachting, boat reviews, ports, clubs, races, gear, destinations, and practical sea stories from Old Sea Dogs.";

export const searchIndexingEnabled = false;

type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export const defaultOpenGraphImage: OgImage = {
  url: "/images/marina-hero.png",
  width: 1774,
  height: 887,
  alt: "Old Sea Dogs boating and yachting stories",
};

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, siteUrl).toString();
}

export function robotsMetadata(forceNoIndex = false): Metadata["robots"] {
  if (searchIndexingEnabled && !forceNoIndex) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
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
}: {
  title: string;
  description: string;
  path: string;
  image?: OgImage;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}): Metadata {
  const fullTitle = pageTitle(title);
  const imageUrl = absoluteUrl(image.url);

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
          width: image.width,
          height: image.height,
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
    robots: robotsMetadata(noIndex),
  };
}
