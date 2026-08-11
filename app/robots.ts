import type { MetadataRoute } from "next";
import { absoluteUrl, productionSiteUrl, searchIndexingEnabled, siteUrl } from "../lib/seo";

const privateRoutes = [
  "/editor",
  "/editor/",
  "/editor/preview/",
  "/api/editor",
  "/api/editor/",
  "/api/search",
  "/api/search/",
  "/api/social/track",
];

export default function robots(): MetadataRoute.Robots {
  if (!searchIndexingEnabled) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: searchIndexingEnabled
      ? `${productionSiteUrl}/sitemap.xml`
      : absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
