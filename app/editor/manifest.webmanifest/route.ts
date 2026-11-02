const manifest = {
  name: "Bridge",
  short_name: "Bridge",
  description: "Old Sea Dogs Bridge CMS",
  lang: "en",
  id: "/editor",
  start_url: "/editor",
  scope: "/editor",
  display: "standalone",
  background_color: "#eef3f7",
  theme_color: "#123f6f",
  icons: [
    {
      src: "/editor/bridge-icon-180.png",
      sizes: "180x180",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/editor/bridge-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
  ],
};

export function GET() {
  return Response.json(manifest, {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}
