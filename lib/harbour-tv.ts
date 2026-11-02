import fs from "node:fs";
import path from "node:path";

export type HarbourVideo = {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  published: string;
  duration: number;
  views?: number;
  short?: boolean;
  thumb: string;
  description?: string;
};

export type HarbourBucket = {
  title: string;
  full: HarbourVideo[];
  shorts: HarbourVideo[];
};

type HarbourCatalog = {
  generated: string;
  sections: Record<string, HarbourBucket>;
  brands: Record<string, HarbourBucket>;
};

type SeoCopy = Record<string, string>;

function readJson<T>(relativePath: string): T {
  const file = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

let catalogCache: HarbourCatalog | null = null;
let copyCache: SeoCopy | null = null;

export function harbourCatalog() {
  catalogCache ??= readJson<HarbourCatalog>("content/harbour-tv/videos.json");
  return catalogCache;
}

export function harbourSeoCopy() {
  copyCache ??= readJson<SeoCopy>("content/harbour-tv/seo-copy.json");
  return copyCache;
}

export function harbourHasVideos(bucket: HarbourBucket) {
  return bucket.full.length + bucket.shorts.length > 0;
}

export function harbourSections() {
  return Object.entries(harbourCatalog().sections).filter(([, bucket]) => harbourHasVideos(bucket));
}

export function harbourBrands() {
  return Object.entries(harbourCatalog().brands).filter(([, bucket]) => harbourHasVideos(bucket));
}

export function harbourSection(slug: string) {
  const bucket = harbourCatalog().sections[slug];
  return bucket && harbourHasVideos(bucket) ? bucket : null;
}

export function harbourBrand(slug: string) {
  const bucket = harbourCatalog().brands[slug];
  return bucket && harbourHasVideos(bucket) ? bucket : null;
}

export function harbourUpdatedLabel(generated = harbourCatalog().generated) {
  return new Date(generated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function harbourFaqs(name: string, lower: string): Array<[string, string]> {
  return [
    [`How often are the ${name} videos updated?`, `Every other day. Harbour TV checks trusted channels and YouTube search for new ${lower} videos and refreshes this page automatically; the date at the top shows the last update.`],
    [`How are ${lower} videos chosen?`, `We start from a hand-picked list of reputable ${lower} channels, add recent English-language search results with a minimum view count, and remove clickbait, reposts, made-for-kids and blocked content. No more than three videos per channel appear in a section.`],
    [`What is the difference between full-length videos and Shorts?`, `Full-length videos are reviews, tours and films of a few minutes or more. Shorts are vertical clips of up to about a minute (or up to three minutes when tagged #shorts), shown in their own row.`],
    [`Do the videos set cookies?`, `No video loads until you press play, and then it uses YouTube's privacy-enhanced youtube-nocookie.com player.`],
  ];
}

export function harbourIntroParagraphs(key: string) {
  const copy = harbourSeoCopy();
  return [copy[key] || "", copy[`${key}_more`] || ""].filter(Boolean);
}

export function harbourPagePaths() {
  return [
    "/videos",
    ...harbourSections().map(([slug]) => `/videos/${slug}`),
    ...harbourBrands().map(([slug]) => `/videos/brands/${slug}`),
  ];
}

function isoDuration(seconds: number) {
  return `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
}

export function harbourVideoObject(video: HarbourVideo) {
  return {
    "@type": "VideoObject",
    name: video.title,
    description: (video.description || video.title).slice(0, 300),
    thumbnailUrl: video.thumb,
    uploadDate: video.published,
    duration: isoDuration(video.duration),
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
    author: { "@type": "Organization", name: video.channel },
  };
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function harbourVideoSitemapXml(siteUrl: string) {
  const catalog = harbourCatalog();
  const pages: Array<[string, HarbourVideo[]]> = [
    ["/videos", harbourSections().flatMap(([, bucket]) => [...bucket.full.slice(0, 3), ...bucket.shorts.slice(0, 6)])],
    ...harbourSections().map(([slug, bucket]) => [`/videos/${slug}`, [...bucket.full, ...bucket.shorts]] as [string, HarbourVideo[]]),
    ...harbourBrands().map(([slug, bucket]) => [`/videos/brands/${slug}`, [...bucket.full, ...bucket.shorts]] as [string, HarbourVideo[]]),
  ];
  const urls = pages.map(([pagePath, videos]) => {
    const tags = videos.slice(0, 30).map((video) => (
      `<video:video><video:thumbnail_loc>${xmlEscape(video.thumb)}</video:thumbnail_loc><video:title>${xmlEscape(video.title)}</video:title><video:description>${xmlEscape((video.description || video.title).slice(0, 300))}</video:description><video:player_loc>https://www.youtube-nocookie.com/embed/${video.id}</video:player_loc><video:duration>${video.duration}</video:duration><video:publication_date>${xmlEscape(video.published)}</video:publication_date></video:video>`
    )).join("");
    return `<url><loc>${xmlEscape(siteUrl + pagePath)}</loc><lastmod>${xmlEscape(catalog.generated)}</lastmod>${tags}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls.join("\n")}\n</urlset>\n`;
}

export function harbourLlmsBlock(siteUrl: string) {
  const updated = harbourUpdatedLabel();
  const lines = [
    "## Harbour TV (boating videos)",
    `- [Harbour TV](${siteUrl}/videos): hub of the best new boating videos from YouTube, refreshed every other day; full-length videos and Shorts kept separate. Updated ${updated}.`,
    ...harbourSections().map(([slug, bucket]) => `- [${bucket.title}](${siteUrl}/videos/${slug}): curated ${bucket.title.toLowerCase()} videos with intro and FAQ.`),
    ...harbourBrands().map(([slug, bucket]) => `- [${bucket.title}](${siteUrl}/videos/brands/${slug}): curated ${bucket.title.toLowerCase()} videos with intro and FAQ.`),
  ];
  return lines.join("\n");
}
