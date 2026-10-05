import type { MetadataRoute } from "next";
import { defaultDescription, siteName } from "../lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: defaultDescription,
    lang: "en",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#f6f7f3",
    theme_color: "#123944",
    icons: [
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
