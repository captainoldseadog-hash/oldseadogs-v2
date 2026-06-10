import type { MetadataRoute } from "next";
import { absoluteUrl, searchIndexingEnabled, siteUrl } from "../lib/seo";

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
        disallow: ["/editor"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
