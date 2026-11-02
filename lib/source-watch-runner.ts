import { getDbOrNull } from "../db";
import { stories as storyRows } from "../db/schema";
import { sourceWatchSites, type SourceWatchSite } from "../content/source-watch";
import { ensureContentSchema, getEditorData, makeSlug, saveStory } from "./site-content";
import { analyzeOldSeaDogsStyle, type OldSeaDogsStyleReport } from "./editorial-quality";
import { fetchSourceText } from "./safe-source-fetch";

export type SourceWatchResult = {
  checkedAt: string;
  created: number;
  previewed: number;
  needsDetail: number;
  skipped: number;
  failed: number;
  previews: SourcePreviewArticle[];
  sources: Array<{
    id: string;
    name: string;
    group: string;
    checked: number;
    found: number;
    created: number;
    previewed: number;
    needsDetail: number;
    rejected: number;
    skipped: number;
    duplicates: number;
    failed: boolean;
    message: string;
    errors: string[];
  }>;
};

export type SourcePreviewArticle = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  headline: string;
  category: string;
  standfirst: string;
  body: string[];
  wordCount: number;
  sourceWordCount: number;
  generatedWordCount: number;
  oldSeaDogsStyleScore: number;
  prLanguageScore: number;
  storytellingScore: number;
  humanInterestScore: number;
  styleReport: OldSeaDogsStyleReport;
  status: "ready" | "needsMoreDetail";
  qualityWarnings: string[];
};

type FeedEntry = {
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  articleText?: string;
  scrapeError?: string;
};

const maxEntriesPerSource = 24;
const defaultMaxDraftsPerSource = 6;

type SourceWatchOptions = {
  maxSources?: number;
  maxDraftsPerSource?: number;
  previewOnly?: boolean;
};

const sourceReferencePatterns = [
  /\bBoat International\b/gi,
  /\bBOAT International\b/g,
  /\bSail-World\b/gi,
  /\bSail World\b/gi,
  /\bMotor Boat & Yachting\b/gi,
  /\bMBY\b/g,
  /\bSuperyachtNews\b/gi,
  /\bSuperyacht News\b/gi,
  /\bBOAT\b/g,
];

const bannedFillerPatterns = [
  /\bthe main facts are straightforward\b/i,
  /\bthe supporting detail gives the story\b/i,
  /\bthe detail worth keeping on the chart\b/i,
  /\bthe story highlights\b/i,
  /\bthe story reveals\b/i,
  /\bthe value of the story lies in\b/i,
  /\breaders will note\b/i,
  /\bsailors may wonder\b/i,
  /\bowners should consider\b/i,
  /\bthe facts suggest\b/i,
  /\bthe article shows\b/i,
  /\bthe significance of this development\b/i,
  /\bfor ordinary sailors and owners\b/i,
  /\breaders are used to\b/i,
  /\bmore than a headline\b/i,
  /\bsmall marker in the larger chart\b/i,
  /\bthe facts may still be developing\b/i,
  /\bthe course is clear enough\b/i,
  /\bwhat it says about\b/i,
  /\blarger story of modern boating\b/i,
  /\bdeserves attention\b/i,
  /\bworth watching\b/i,
  /\bwhat matters here\b/i,
  /\bthe bigger picture\b/i,
  /\bthis tells us\b/i,
  /\bthe key takeaway\b/i,
  /\bthe story centres on\b/i,
  /\bthe story centers on\b/i,
  /\bthe following details emerge\b/i,
  /\btaken together\b/i,
  /\bthe news comes as\b/i,
  /\bit is another reminder\b/i,
  /\bthe supporting detail\b/i,
  /\bthe facts are still developing\b/i,
  /\bquiet labour behind\b/i,
  /\btradition, money, weather/i,
  /\bwatch the detail\b/i,
  /\bnever mistake a press line\b/i,
  /\bthe wider meaning\b/i,
  /\bthe value of\b/i,
  /\bthe importance of\b/i,
  /\bthe structure of\b/i,
  /\bwhat readers\b/i,
  /\bwhat sailors\b/i,
  /\bwhat owners\b/i,
  /\bwhat the article\b/i,
  /\bwhat the news means\b/i,
  /\bwhat is worth noting\b/i,
  /\bwhat the facts reveal\b/i,
  /\bthe reporting process\b/i,
  /\bsource material\b/i,
  /\barticle structure\b/i,
  /\bjournalism\b/i,
];

const sourceAttributionPatterns = [
  /\baccording to\b/i,
  /\breported by\b/i,
  /\bpicked up from\b/i,
  /\bthe source says\b/i,
  /\bsource article\b/i,
  /\bscraped from\b/i,
  /\bpress release\b/i,
  /\bthe Old Sea Dogs desk\b/i,
  /\bSail World\b/i,
  /\bSail-World\b/i,
  /\bBoat International\b/i,
  /\bBOAT International\b/i,
  /\bBOAT\b/i,
  /\bMotor Boat & Yachting\b/i,
  /\bSuperyachtNews\b/i,
  /\bSuperyacht News\b/i,
];

function removeSourceReferences(value: string) {
  return sourceReferencePatterns
    .reduce((text, pattern) => text.replace(pattern, ""), value)
    .replace(/\baccording to\s+[^,.]+[,.\s]*/gi, "")
    .replace(/\breported by\s+[^,.]+[,.\s]*/gi, "")
    .replace(/\bpicked up from\s+[^,.]+[,.\s]*/gi, "")
    .replace(/\bthe source says\s*/gi, "")
    .replace(/\bthe source article says\s*/gi, "")
    .replace(/\bsource article\b/gi, "material")
    .replace(/\bthe source\b/gi, "the material")
    .replace(/\bscraped from\b/gi, "")
    .replace(/\bpress release\b/gi, "material")
    .replace(/\bTo give you a better idea,\s*/gi, "")
    .replace(/\brounds up\b/gi, "lists")
    .replace(/\bannouncement\b/gi, "news")
    .replace(/\bannouncements\b/gi, "news")
    .replace(/\bthe Old Sea Dogs desk\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function plainText(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&euro;/g, "EUR")
    .replace(/&colon;/g, ":")
    .replace(/&comma;/g, ",")
    .replace(/&period;/g, ".")
    .replace(/&quest;/g, "?")
    .replace(/&sol;/g, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function simpleHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function pickTag(block: string, tag: string) {
  const pattern = "<(?:[a-z]+:)?" + tag + "[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?" + tag + ">";
  const match = block.match(new RegExp(pattern, "i"));
  return plainText(match?.[1] ?? "");
}

function pickLink(block: string) {
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return plainText(atomLink || pickTag(block, "link"));
}

function pickAttribute(tag: string, attribute: string) {
  const pattern = "\\s" + attribute + "\\s*=\\s*([\"'])(.*?)\\1";
  const match = tag.match(new RegExp(pattern, "i"));
  return plainText(match?.[2] ?? "");
}

function pickMetaContent(html: string, names: string[]) {
  const wanted = names.map((name) => name.toLowerCase());
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const key = (
      pickAttribute(tag, "property") ||
      pickAttribute(tag, "name") ||
      pickAttribute(tag, "itemprop")
    ).toLowerCase();

    if (wanted.includes(key)) {
      const content = pickAttribute(tag, "content");
      if (content) return content;
    }
  }

  return "";
}

function pickLinkHref(html: string, relName: string) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const rel = pickAttribute(tag, "rel").toLowerCase();
    if (rel.split(/\s+/).includes(relName.toLowerCase())) {
      const href = pickAttribute(tag, "href");
      if (href) return href;
    }
  }

  return "";
}

function normaliseSourceUrl(value: string, baseUrl?: string) {
  try {
    const url = new URL(value, baseUrl);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function removeSiteSuffix(source: SourceWatchSite, title: string) {
  const siteNames = [
    source.name,
    "BOAT International",
    "Boat International",
    "Sail-World",
    "Sail World",
    "Motor Boat & Yachting",
    "MBY",
    "SuperyachtNews",
    "Superyacht News",
  ];
  let cleaned = plainText(title);

  for (const siteName of siteNames) {
    const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp("\\s+[|\\-–—]\\s+" + escaped + "\\s*$", "i"), "");
  }

  return removeSourceReferences(cleaned.trim());
}

function titleFromUrl(value: string) {
  try {
    const url = new URL(value);
    const slug = url.pathname.split("/").filter(Boolean).at(-1) || url.hostname;
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return value;
  }
}

function jsonLdBlocks(html: string) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const blocks: unknown[] = [];

  for (const script of scripts) {
    try {
      blocks.push(JSON.parse(script[1].trim()));
    } catch {
      // Some publisher pages include malformed or dynamically filled JSON-LD.
    }
  }

  return blocks;
}

function findJsonValue(value: unknown, keys: string[]): string {
  const wanted = keys.map((key) => key.toLowerCase());

  if (typeof value === "string") return "";
  if (!value || typeof value !== "object") return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonValue(item, keys);
      if (found) return found;
    }
    return "";
  }

  const object = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(object)) {
    if (wanted.includes(key.toLowerCase())) {
      if (typeof item === "string") return plainText(item);
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const id = (item as Record<string, unknown>)["@id"];
        if (typeof id === "string") return plainText(id);
      }
    }
  }

  for (const item of Object.values(object)) {
    const found = findJsonValue(item, keys);
    if (found) return found;
  }

  return "";
}

function isUsefulArticleLink(source: SourceWatchSite, link: string) {
  try {
    const sourceHost = new URL(source.url).hostname.replace(/^www\./, "");
    const url = new URL(link, source.url);
    const linkHost = url.hostname.replace(/^www\./, "");
    const path = url.pathname.toLowerCase();

    if (linkHost !== sourceHost) return false;

    if (source.id === "boat-international") {
      return (
        /^\/yachts\/news\/[^/]+/.test(path) ||
        /^\/yacht-market-intelligence\/[^/]+\/[^/]+/.test(path) ||
        /^\/features-reviews\/[^/]+/.test(path)
      );
    }

    if (source.id === "superyacht-news") {
      return /^\/(business|crew|design|fleet|operations|opinion|owner|technology)\/[^/]+/.test(path);
    }

    return path.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function parseFeed(xml: string, baseUrl: string) {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const entryBlocks = itemBlocks.length > 0
    ? itemBlocks
    : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);

  return entryBlocks
    .map((block): FeedEntry => ({
      title: pickTag(block, "title"),
      link: normaliseSourceUrl(pickLink(block), baseUrl),
      description: pickTag(block, "description") || pickTag(block, "summary") || pickTag(block, "content"),
      publishedAt: pickTag(block, "pubDate") || pickTag(block, "published") || pickTag(block, "updated"),
      articleText: "",
    }))
    .filter((entry) => entry.title && entry.link);
}

function parseSitemap(xml: string, baseUrl: string) {
  const urlBlocks = [...xml.matchAll(/<url\b[\s\S]*?<\/url>/gi)].map((match) => match[0]);

  return urlBlocks
    .map((block): FeedEntry => {
      const link = normaliseSourceUrl(pickTag(block, "loc"), baseUrl);
      const title = pickTag(block, "title") || titleFromUrl(link);

      return {
        title,
        link,
        description: "",
        publishedAt: pickTag(block, "publication_date") || pickTag(block, "lastmod"),
        articleText: "",
      };
    })
    .filter((entry) => entry.title && entry.link);
}

function parseArticleList(source: SourceWatchSite, html: string, baseUrl: string) {
  const linksByUrl = new Map<string, FeedEntry>();
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  for (const anchor of anchors) {
    const link = normaliseSourceUrl(anchor[1], baseUrl);
    if (!isUsefulArticleLink(source, link) || linksByUrl.has(link)) continue;

    const title = plainText(anchor[2]) || titleFromUrl(link);
    if (!title || title.length < 12) continue;

    linksByUrl.set(link, {
      title,
      link,
      description: "",
      publishedAt: "",
      articleText: "",
    });
  }

  return [...linksByUrl.values()];
}

function scrapeHeadline(html: string, source: SourceWatchSite, fallback: string, fallbackUrl: string) {
  const json = jsonLdBlocks(html);
  const title =
    findJsonValue(json, ["headline", "name"]) ||
    pickMetaContent(html, ["og:title", "twitter:title"]) ||
    pickTag(html, "h1") ||
    pickTag(html, "title") ||
    fallback;
  const cleaned = removeSiteSuffix(source, title);
  const fallbackTitle = removeSiteSuffix(source, fallback) || titleFromUrl(fallbackUrl);

  if (
    !cleaned ||
    cleaned.length < 10 ||
    cleaned.toLowerCase() === source.name.toLowerCase() ||
    cleaned.toLowerCase() === "the waterfront"
  ) {
    return fallbackTitle;
  }

  return cleaned;
}

function scrapeDescription(html: string) {
  const json = jsonLdBlocks(html);
  return (
    findJsonValue(json, ["description"]) ||
    pickMetaContent(html, ["description", "og:description", "twitter:description"]) ||
    ""
  );
}

function scrapeArticleText(html: string) {
  const paragraphBlocks = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => plainText(match[1]));
  const seen = new Set<string>();
  const paragraphs: string[] = [];

  for (const paragraph of paragraphBlocks) {
    const normalised = paragraph.toLowerCase();
    if (
      paragraph.length < 45 ||
      normalised.includes("subscribe") ||
      normalised.includes("cookie") ||
      normalised.includes("advertisement") ||
      normalised.includes("newsletter") ||
      normalised.includes("sign up") ||
      seen.has(normalised)
    ) {
      continue;
    }

    seen.add(normalised);
    paragraphs.push(paragraph);
    if (paragraphs.length >= 8) break;
  }

  return paragraphs.join(" ");
}

function scrapeDate(html: string, fallback: string) {
  const json = jsonLdBlocks(html);
  const timeTag = html.match(/<time\b[^>]*>/i)?.[0] ?? "";
  return (
    findJsonValue(json, ["datePublished", "dateModified", "uploadDate"]) ||
    pickMetaContent(html, ["article:published_time", "article:modified_time", "date", "pubdate"]) ||
    pickAttribute(timeTag, "datetime") ||
    fallback
  );
}

function scrapeCanonicalUrl(html: string, baseUrl: string) {
  return normaliseSourceUrl(
    pickLinkHref(html, "canonical") ||
      pickMetaContent(html, ["og:url"]) ||
      baseUrl,
    baseUrl
  );
}

async function scrapeArticlePage(source: SourceWatchSite, entry: FeedEntry): Promise<FeedEntry> {
  try {
    const { text: html } = await fetchSourceText(entry.link, {
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
    });
    const canonicalUrl = scrapeCanonicalUrl(html, entry.link);
    const link = isUsefulArticleLink(source, canonicalUrl) ? canonicalUrl : entry.link;
    const title = scrapeHeadline(html, source, entry.title, entry.link);
    const description = scrapeDescription(html) || entry.description;
    const publishedAt = scrapeDate(html, entry.publishedAt);

    return {
      title: title || entry.title,
      link,
      description,
      publishedAt,
      articleText: scrapeArticleText(html),
    };
  } catch (error) {
    return { ...entry, scrapeError: error instanceof Error ? `${entry.link}: ${error.message}` : `${entry.link}: article extraction failed` };
  }
}

function categoryForEntry(source: SourceWatchSite, entry: FeedEntry) {
  const haystack = (entry.title + " " + entry.description).toLowerCase();
  if (/race|regatta|fastnet|cowes|cup|championship|grand prix|sailgp/.test(haystack)) return "Races";
  if (/review|sea trial|test|first look|walkaround/.test(haystack)) return "Boat Reviews";
  if (/show|festival|expo|cannes|monaco|southampton|boot dusseldorf/.test(haystack)) return "Shows";
  if (/gear|electronics|kit|clothing|jacket|safety|anchor|engine/.test(haystack)) return "Gear";
  if (/club|yacht club|sailing club/.test(haystack)) return "Clubs";
  if (/port|marina|harbour|harbor|berth|destination|cruising/.test(haystack)) return "Destinations";
  if (/maintenance|how to|guide|masterclass|repair|practical/.test(haystack)) return "Masterclass";
  if (/lifestyle|owner|crew|charter|design|interior/.test(haystack)) return "Lifestyle";

  const firstSection = source.sections[0] || "News";
  if (firstSection === "Reviews") return "Boat Reviews";
  return firstSection;
}

function safeDate(value: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function wordCount(paragraphs: string[]) {
  return paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
}

function compactList(values: string[], limit = 5) {
  const seen = new Set<string>();
  const clean = values
    .map((value) => plainText(value).replace(/\s+/g, " ").trim())
    .filter((value) => value.length > 2 && value.length < 80)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  if (clean.length <= 1) return clean.join("");
  return clean.slice(0, -1).join(", ") + " and " + clean.at(-1);
}

function sourceFactText(entry: FeedEntry) {
  return removeSourceReferences([entry.title, entry.description, entry.articleText].filter(Boolean).join(" "));
}

function sourceDetailText(entry: FeedEntry) {
  return removeSourceReferences([entry.description, entry.articleText].filter(Boolean).join(" "));
}

function storyFactSentences(entry: FeedEntry) {
  const seen = new Set<string>();
  const text = sourceDetailText(entry) || sourceFactText(entry);
  return text
    .replace(/([.!?])\s+(?=[A-Z0-9])/g, "$1\n")
    .split(/\n+/)
    .map((sentence) => removeSourceReferences(sentence).replace(/\s+/g, " ").trim())
    .map((sentence) => sentence.replace(/^[•*-]\s*/, ""))
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 320)
    .filter((sentence) => !isMetaSentence(sentence))
    .filter(sentenceHasConcreteInfo)
    .filter((sentence) => {
      const key = sentence.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 16);
}

function containsSourceAttribution(value: string) {
  return sourceAttributionPatterns.some((pattern) => pattern.test(value));
}

function containsBannedFiller(value: string) {
  return bannedFillerPatterns.some((pattern) => pattern.test(value));
}

function isMetaSentence(value: string) {
  return (
    containsBannedFiller(value) ||
    containsSourceAttribution(value) ||
    /(cookie|newsletter|subscribe|sign in|log in|privacy policy|terms and conditions|advertisement|sponsored|all rights reserved|copyright|read more|click here|share this|follow us|bookmark this page|live updates throughout|exclusive photography|a list of|listing covers|luxury watch|for sale now|rounds up|to give you a better idea|this page|this article|this story|the story|the article|the source|the material|the report|the reports)/i.test(value)
  );
}

function sentenceHasConcreteInfo(value: string) {
  return (
    /\b\d+(?:\.\d+)?\b/.test(value) ||
    /\b(?:won|wins|victory|took|takes|crossed|finished|opened|opens|launched|launches|returns|returned|confirmed|revealed|built|delivered|sold|charter|race|racing|regatta|marina|harbour|harbor|club|fleet|crew|yacht|boat|shipyard|builder|designer|class|award|ceremony|refit|sale|brokerage|metre|meter|feet|ft|knots?|north|south|east|west)\b/i.test(value) ||
    /\b[A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){1,5}\b/.test(value)
  );
}

function cleanGeneratedParagraph(value: string) {
  return removeSourceReferences(value)
    .replace(/\bthe material material\b/gi, "the material")
    .replace(/\bmaterial material\b/gi, "material")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanGeneratedParagraphs(paragraphs: string[]) {
  const seen = new Set<string>();
  return paragraphs
    .map(cleanGeneratedParagraph)
    .filter((paragraph) => paragraph.length > 0)
    .filter((paragraph) => !isMetaSentence(paragraph))
    .filter((paragraph) => !containsBannedFiller(paragraph))
    .filter((paragraph) => !containsSourceAttribution(paragraph))
    .filter(sentenceHasConcreteInfo)
    .filter((paragraph) => {
      const key = paragraph.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function extractSignals(entry: FeedEntry) {
  const text = sourceFactText(entry);
  const properNames = [...text.matchAll(/\b(?:[A-Z][A-Za-z0-9&'.-]+|[A-Z]{2,})(?:\s+(?:[A-Z][A-Za-z0-9&'.-]+|[A-Z]{2,})){1,6}/g)]
    .map((match) => match[0])
    .filter((value) => !/^(Old Sea Dogs|Boat International|Motor Boat|Motor Boat & Yachting|Sail World|Sail-World|SuperyachtNews|Superyacht News|The Old|Source Watch)$/i.test(value));
  const dates = [
    ...text.matchAll(/\b(?:\d{1,2}\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi),
    ...text.matchAll(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/gi),
    ...text.matchAll(/\b20\d{2}\b/g),
  ].map((match) => match[0]);
  const measurements = [...text.matchAll(/\b\d+(?:\.\d+)?\s?(?:m|metres?|meters?|ft|feet|knots?|hp|GT|nautical miles|nm)\b/gi)]
    .map((match) => match[0]);

  return {
    names: compactList(properNames, 5),
    dates: compactList(dates, 4),
    measurements: compactList(measurements, 4),
  };
}

function sourceDetailWordCount(entry: FeedEntry) {
  return sourceDetailText(entry).split(/\s+/).filter(Boolean).length;
}

function hasHardDetail(entry: FeedEntry, signals: ReturnType<typeof extractSignals>) {
  const text = sourceFactText(entry);
  return Boolean(
    signals.names ||
      signals.dates ||
      signals.measurements ||
      /\b\d+(?:\.\d+)?\b/.test(text) ||
      /\b(?:won|wins|victory|launched|opens|opened|returns|confirmed|revealed|built|delivered|sold|charter|race|regatta|marina|harbour|club)\b/i.test(text)
  );
}

function needsMoreSourceDetail(entry: FeedEntry) {
  const facts = storyFactSentences(entry);
  const signals = extractSignals(entry);
  return sourceDetailWordCount(entry) < 90 || facts.length < 3 || !hasHardDetail(entry, signals);
}

function standfirstForEntry(entry: FeedEntry, facts: string[]) {
  const candidate =
    facts.find((fact) => fact.toLowerCase() !== entry.title.toLowerCase()) ||
    sourceDetailText(entry) ||
    entry.title;
  const clean = cleanGeneratedParagraph(candidate);
  if (clean.length <= 190) return clean;
  return clean.slice(0, 187).replace(/\s+\S*$/, "") + "...";
}

function factParagraphs(facts: string[]) {
  const paragraphs: string[] = [];
  for (let index = 0; index < facts.length; index += 2) {
    paragraphs.push(facts.slice(index, index + 2).join(" "));
  }
  return paragraphs;
}

function oldSeaDogsSourceContext(category: string, headline: string, entry: FeedEntry, facts: string[]) {
  const anchor = cleanGeneratedParagraph(
    facts.find((fact) => fact.toLowerCase() !== headline.toLowerCase()) ||
      sourceDetailText(entry) ||
      headline
  );
  const subject = cleanGeneratedParagraph(headline || entry.title);
  const haystack = `${category} ${subject} ${anchor}`.toLowerCase();
  const paragraphs: string[] = [];

  if (/\b(races|race|regatta|fleet|championship|trophy|line honours)\b/.test(haystack)) {
    paragraphs.push(
      `${subject} lands in the racing notebook because the real work will be done in breeze, tide, crew calls and the short moments when a fleet either holds its nerve or starts blaming the sky. ${anchor}`
    );
    paragraphs.push(
      "For the crews, the interest sits in the class form, the weather window and the tactical choices that turn a clean start into a result worth carrying back to the clubhouse."
    );
  } else if (/\b(boat reviews|review|launch|builder|engine|yacht|boat|metre|meter|ft|feet)\b/.test(haystack)) {
    paragraphs.push(
      `${subject} deserves the owner-minded treatment: not just the polish, but the hull, cockpit, side decks, machinery and whether the boat makes sense when the breeze pipes up and the sandwiches have gone damp. ${anchor}`
    );
  } else if (/\b(ports|destinations|marina|harbour|harbor|port|berth|anchorage)\b/.test(haystack)) {
    paragraphs.push(
      `${subject} is practical waterline intelligence, because a harbour is never just scenery. Shelter, approach, fuel, berths, repairs and the welcome on the quay can decide whether a passage ends neatly or turns into a long argument with a mooring line. ${anchor}`
    );
  } else if (/\b(clubs|club|commodore|members|burgee|clubhouse)\b/.test(haystack)) {
    paragraphs.push(
      `${subject} belongs to club sailing, where the useful details are often found in the start line, the launch timetable, the volunteers, the burgee and the old hands who know exactly when the tide starts cheating. ${anchor}`
    );
  } else if (/\b(shows|show|festival|exhibition|metstrade|cannes|monaco|southampton)\b/.test(haystack)) {
    paragraphs.push(
      `${subject} brings the usual waterfront mixture of polished hulls, hopeful claims and useful kit, with the real test waiting beyond the stand lights and out in the weather. ${anchor}`
    );
  } else {
    paragraphs.push(
      `${subject} touches the practical business of boats, sailors, clubs, ports and the people who keep the waterfront moving. ${anchor}`
    );
  }

  paragraphs.push(
    "Once the lines are slipped, the value will show in the choices made on deck, at the harbour office, in the club launch and among the crews trying to turn news into something useful afloat."
  );

  return cleanGeneratedParagraphs(paragraphs);
}

function buildNewsArticle(source: SourceWatchSite, entry: FeedEntry, category: string) {
  const headline = removeSiteSuffix(source, entry.title);
  const facts = storyFactSentences(entry);
  const signals = extractSignals(entry);
  const qualityWarnings: string[] = [];

  if (needsMoreSourceDetail(entry)) {
    return {
      headline,
      category,
      standfirst: "Insufficient source detail for publication.",
      body: [
        "Insufficient source detail for publication.",
      ],
      tags: generatedTags(category),
      readMinutes: 1,
      status: "needsMoreDetail" as const,
      qualityWarnings: ["insufficient source detail for publication"],
      styleReport: analyzeOldSeaDogsStyle({
        sourceText: sourceDetailText(entry),
        headline,
        excerpt: "Insufficient source detail for publication.",
        body: [],
        category,
      }),
    };
  }

  let paragraphs = cleanGeneratedParagraphs([
    ...oldSeaDogsSourceContext(category, headline, entry, facts),
    ...factParagraphs(facts),
  ]);

  if (paragraphs.length === 0 || containsBannedFiller(paragraphs.join(" ")) || containsSourceAttribution(paragraphs.join(" "))) {
    qualityWarnings.push("article contained banned filler or attribution wording");
    paragraphs = cleanGeneratedParagraphs(paragraphs);
  }

  if (wordCount([paragraphs[0] || ""]) < 18 || !hasHardDetail(entry, signals)) {
    qualityWarnings.push("opening paragraph needs harder facts");
  }

  if (wordCount(paragraphs) < 300) {
    qualityWarnings.push("insufficient source detail for publication");
    return {
      headline,
      category,
      standfirst: "Insufficient source detail for publication.",
      body: [
        "Insufficient source detail for publication.",
      ],
      tags: generatedTags(category),
      readMinutes: 1,
      status: "needsMoreDetail" as const,
      qualityWarnings,
      styleReport: analyzeOldSeaDogsStyle({
        sourceText: sourceDetailText(entry),
        headline,
        excerpt: "Insufficient source detail for publication.",
        body: paragraphs,
        category,
      }),
    };
  }

  const styleReport = analyzeOldSeaDogsStyle({
    sourceText: sourceDetailText(entry),
    headline,
    excerpt: standfirstForEntry(entry, facts),
    body: paragraphs,
    category,
  });
  qualityWarnings.push(...styleReport.warnings);

  return {
    headline,
    category,
    standfirst: standfirstForEntry(entry, facts),
    body: paragraphs,
    tags: generatedTags(category),
    readMinutes: Math.max(3, Math.ceil(wordCount(paragraphs) / 220)),
    status: "ready" as const,
    qualityWarnings: [...new Set(qualityWarnings)],
    styleReport,
  };
}

function previewArticle(source: SourceWatchSite, entry: FeedEntry): SourcePreviewArticle {
  const category = categoryForEntry(source, entry);
  const article = buildNewsArticle(source, entry, category);

  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: entry.link,
    headline: article.headline,
    category: article.category,
    standfirst: article.standfirst,
    body: article.body,
    wordCount: wordCount(article.body),
    sourceWordCount: article.styleReport.sourceWordCount,
    generatedWordCount: article.styleReport.generatedWordCount,
    oldSeaDogsStyleScore: article.styleReport.oldSeaDogsStyleScore,
    prLanguageScore: article.styleReport.prLanguageRemaining,
    storytellingScore: article.styleReport.maritimeStorytelling,
    humanInterestScore: article.styleReport.humanInterest,
    styleReport: article.styleReport,
    status: article.status,
    qualityWarnings: article.qualityWarnings,
  };
}

function storyInputFromPreview(source: SourceWatchSite, preview: SourcePreviewArticle, hash: string) {
  const needsRewrite = preview.status === "needsMoreDetail";
  return {
    id: "watch_" + source.id + "_" + hash,
    slug: makeSlug(preview.headline + "-" + source.id + "-" + hash),
    title: preview.headline,
    category: preview.category,
    date: safeDate(new Date().toISOString()),
    author: "Michael Hodges",
    sourceType: needsRewrite ? "Insufficient source detail for publication" : "Automatic watch",
    sourceName: source.name,
    sourceUrl: preview.sourceUrl,
    imageUrl: "",
    imageAlt: "",
    imageCredit: "",
    imageCaption: "",
    oldSeaDogsView: needsRewrite
      ? "This scraped item needs a human rewrite before it can become an Old Sea Dogs story. Keep only the hard maritime detail: named boats, dates, places, race notices, club decisions, weather, safety issues, prices or practical changes. Bin the soft language, verify the source, and do not publish until the story has a clear use for sailors, owners, clubs or marina visitors."
      : "This scraped item is a starting draft, not a finished article. Old Sea Dogs should keep the facts that help readers make decisions afloat or ashore, check the original source for names, dates and claims, and add practical judgement before publication. The editor should remove any borrowed rhythm, vague hype or source-attribution wording before the story goes public.",
    sourceNotes: `Scraped from ${source.name}: ${preview.sourceUrl}`,
    methodNotes: "Imported by the manual source-watch scraper, rewritten into an Old Sea Dogs review draft, and held for editor review. No automatic publishing.",
    contentBasis: "Scraped source review",
    editorialStatus: needsRewrite ? "Needs Rewrite" : "Needs Review",
    noindex: false,
    summary: preview.standfirst,
    body: preview.body,
    tags: generatedTags(preview.category),
    readMinutes: Math.max(1, Math.ceil(preview.wordCount / 220)),
    isFeatured: false,
    status: "draft" as const,
    sortOrder: 0,
  };
}

function storyInputFromGeneratedArticle(source: SourceWatchSite, entry: FeedEntry, hash: string) {
  const preview = previewArticle(source, entry);
  return {
    preview,
    story: {
      ...storyInputFromPreview(source, preview, hash),
      date: safeDate(entry.publishedAt),
    },
  };
}

function generatedTags(category: string) {
  if (category === "Races" || category === "Racing") return ["Races", "Regattas", "Sailing"];
  if (category === "Boat Reviews") return ["Boat Reviews", "Yachts", "Sea Trials"];
  if (category === "Shows") return ["Boat Shows", "Yachts", "Marine Industry"];
  if (category === "Gear") return ["Gear", "Boating", "Seamanship"];
  if (category === "Destinations" || category === "Ports") return [category, "Cruising", "Marinas"];
  if (category === "Clubs") return ["Clubs", "Sailing", "Yacht Clubs"];
  if (category === "Masterclass") return ["Masterclass", "Seamanship", "Boating"];
  if (category === "Lifestyle") return ["Lifestyle", "Yachting", "Waterfront"];
  return [category, "Boating", "Yachting"];
}

type FetchEntriesResult = {
  entries: FeedEntry[];
  errors: string[];
};

async function fetchEntries(source: SourceWatchSite): Promise<FetchEntriesResult> {
  const errors: string[] = [];
  const entriesByLink = new Map<string, FeedEntry>();

  for (const feedUrl of source.feedUrls) {
    try {
      const { text } = await fetchSourceText(feedUrl, {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
      });
      const feedEntries = parseFeed(text, feedUrl);
      const sitemapEntries = feedEntries.length > 0
        ? []
        : parseSitemap(text, feedUrl).filter((entry) => isUsefulArticleLink(source, entry.link));
      const articleListEntries = feedEntries.length > 0 || sitemapEntries.length > 0
        ? []
        : parseArticleList(source, text, feedUrl);
      const entries = [...feedEntries, ...sitemapEntries, ...articleListEntries];
      for (const entry of entries) {
        if (!entriesByLink.has(entry.link)) {
          entriesByLink.set(entry.link, entry);
        }
      }

      if (entries.length > 0) continue;
      errors.push(feedUrl + " did not contain feed items");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Could not read " + feedUrl);
    }
  }

  if (entriesByLink.size > 0) {
    const scrapedEntriesByLink = new Map<string, FeedEntry>();
    const candidates = [...entriesByLink.values()].slice(0, maxEntriesPerSource);

    for (const candidate of candidates) {
      const scraped = await scrapeArticlePage(source, candidate);
      if (scraped.scrapeError) errors.push(scraped.scrapeError);
      if (!scrapedEntriesByLink.has(scraped.link)) {
        scrapedEntriesByLink.set(scraped.link, scraped);
      }
    }

    return {
      entries: [...scrapedEntriesByLink.values()].slice(0, maxEntriesPerSource),
      errors,
    };
  }

  return {
    entries: [],
    errors: errors.length > 0 ? errors : ["No usable feed was found."],
  };
}

function duplicateTitleKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(the|a|an|and|of|for|to|in|on)\b/g, " ").replace(/\s+/g, " ").trim();
}

function nearDuplicateTitle(value: string, existing: Set<string>) {
  const candidate = new Set(duplicateTitleKey(value).split(" ").filter((token) => token.length > 2));
  if (candidate.size < 4) return false;
  return [...existing].some((title) => {
    const other = new Set(title.split(" ").filter(Boolean));
    const shared = [...candidate].filter((token) => other.has(token)).length;
    return shared / Math.min(candidate.size, other.size) >= 0.82;
  });
}

async function readExistingSourceFingerprints(db: ReturnType<typeof getDbOrNull>) {
  const fingerprints = { urls: new Set<string>(), titles: new Set<string>(), slugs: new Set<string>(), ids: new Set<string>() };

  if (db) {
    const rows = await db.select({ id: storyRows.id, slug: storyRows.slug, title: storyRows.title, sourceUrl: storyRows.sourceUrl }).from(storyRows);
    for (const row of rows) {
      if (row.sourceUrl) fingerprints.urls.add(row.sourceUrl);
      fingerprints.ids.add(row.id);
      fingerprints.slugs.add(row.slug);
      fingerprints.titles.add(duplicateTitleKey(row.title));
    }
    return fingerprints;
  }

  const editorData = await getEditorData();
  for (const story of editorData.stories) {
    if (story.sourceUrl) fingerprints.urls.add(story.sourceUrl);
    fingerprints.ids.add(story.id);
    fingerprints.slugs.add(story.slug);
    fingerprints.titles.add(duplicateTitleKey(story.title));
  }

  return fingerprints;
}

function sourceMessage({
  checked,
  created,
  previewed,
  needsDetail,
  skipped,
  errors,
  previewOnly,
}: {
  checked: number;
  created: number;
  previewed: number;
  needsDetail: number;
  skipped: number;
  errors: string[];
  previewOnly: boolean;
}) {
  const pieces: string[] = [];
  if (checked > 0) pieces.push(`${checked} stor${checked === 1 ? "y" : "ies"} found`);
  if (previewed > 0) pieces.push(`${previewed} preview${previewed === 1 ? "" : "s"} generated`);
  if (created > 0) pieces.push(`${created} review draft${created === 1 ? "" : "s"} created`);
  if (needsDetail > 0) pieces.push(`${needsDetail} need more source detail`);
  if (skipped > 0) pieces.push(`${skipped} duplicate${skipped === 1 ? "" : "s"} skipped`);

  if (pieces.length === 0 && errors.length > 0) {
    return `No usable stories found. ${errors.slice(0, 2).join(" ")}`;
  }

  if (pieces.length === 0) {
    return "No usable stories found. The source returned no article links that passed the filters.";
  }

  const suffix = errors.length > 0 ? ` Feed notes: ${errors.slice(0, 2).join(" ")}` : "";
  return pieces.join("; ") + (previewOnly ? "; nothing saved." : ".") + suffix;
}

export async function runSourceWatch(options: SourceWatchOptions = {}) {
  const checkedAt = new Date().toISOString();
  const db = getDbOrNull();
  const previewOnly = Boolean(options.previewOnly);
  const configuredActiveSources = sourceWatchSites.filter((source) => source.status === "active");
  const maxSources = Math.max(1, Number(options.maxSources || configuredActiveSources.length));
  const maxDraftsPerRunSource = Math.max(1, Number(options.maxDraftsPerSource || defaultMaxDraftsPerSource));
  const activeSources = configuredActiveSources.slice(0, maxSources);
  const result: SourceWatchResult = {
    checkedAt,
    created: 0,
    previewed: 0,
    needsDetail: 0,
    skipped: 0,
    failed: 0,
    previews: [],
    sources: [],
  };

  if (!previewOnly) {
    await ensureContentSchema();
  }

  const existing = await readExistingSourceFingerprints(db);

  for (const source of activeSources) {
    let created = 0;
    let previewed = 0;
    let needsDetail = 0;
    let skipped = 0;
    let checked = 0;
    let errors: string[] = [];

    try {
      const fetched = await fetchEntries(source);
      const entries = fetched.entries;
      errors = fetched.errors;
      checked = entries.length;
      const sourceFailed = checked === 0 && errors.length > 0;

      for (const entry of entries) {
        if (created + previewed >= maxDraftsPerRunSource) {
          continue;
        }

        const hash = simpleHash(source.id + ":" + entry.link);
        const generated = storyInputFromGeneratedArticle(source, entry, hash);
        if (
          existing.urls.has(entry.link) ||
          existing.ids.has(generated.story.id) ||
          existing.slugs.has(generated.story.slug) ||
          existing.titles.has(duplicateTitleKey(generated.story.title)) ||
          nearDuplicateTitle(generated.story.title, existing.titles)
        ) {
          skipped += 1;
          continue;
        }
        if (generated.preview.status === "needsMoreDetail") {
          needsDetail += 1;
        }

        if (previewOnly) {
          result.previews.push(generated.preview);
          previewed += 1;
        } else {
          await saveStory(generated.story);
          existing.urls.add(entry.link);
          existing.ids.add(generated.story.id);
          existing.slugs.add(generated.story.slug);
          existing.titles.add(duplicateTitleKey(generated.story.title));
          created += 1;
        }
      }

      result.created += created;
      result.previewed += previewed;
      result.needsDetail += needsDetail;
      result.skipped += skipped;
      if (sourceFailed) result.failed += 1;
      result.sources.push({
        id: source.id,
        name: source.name,
        group: source.group,
        checked,
        found: checked,
        created,
        previewed,
        needsDetail,
        rejected: needsDetail,
        skipped,
        duplicates: skipped,
        failed: sourceFailed,
        message: sourceMessage({ checked, created, previewed, needsDetail, skipped, errors, previewOnly }),
        errors,
      });
    } catch (error) {
      result.failed += 1;
      result.sources.push({
        id: source.id,
        name: source.name,
        group: source.group,
        checked,
        found: checked,
        created,
        previewed,
        needsDetail,
        rejected: needsDetail,
        skipped,
        duplicates: skipped,
        failed: true,
        message: error instanceof Error ? error.message : "Could not check this source.",
        errors,
      });
    }
  }

  return result;
}

export async function scrapeStoryUrl(value: string, options: { saveDraft?: boolean } = {}) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid HTTP or HTTPS article URL.");
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP and HTTPS article URLs are supported.");

  const source: SourceWatchSite = {
    id: `manual-${simpleHash(url.hostname)}`,
    name: url.hostname.replace(/^www\./, ""),
    url: url.origin,
    group: "Manual story scrape",
    focus: "Editor-supplied article URL",
    sections: ["News"],
    storyStyle: "Create a private editorial review draft without copying publisher wording.",
    photoRule: "Do not import third-party imagery without explicit rights.",
    approvalRule: "Editor approval is required before publication.",
    feedUrls: [],
    checkEveryHours: 0,
    status: "active",
  };
  const entry = await scrapeArticlePage(source, {
    title: titleFromUrl(url.toString()),
    link: normaliseSourceUrl(url.toString()),
    description: "",
    publishedAt: "",
  });
  if (entry.scrapeError) throw new Error(entry.scrapeError);
  if (!entry.articleText && !entry.description) throw new Error("The page loaded, but no usable article text or metadata could be extracted.");

  const hash = simpleHash(`${source.id}:${entry.link}`);
  const generated = storyInputFromGeneratedArticle(source, entry, hash);
  if (!options.saveDraft) return { preview: generated.preview, story: null, saved: false };

  await ensureContentSchema();
  const existing = await readExistingSourceFingerprints(getDbOrNull());
  if (existing.urls.has(entry.link) || existing.ids.has(generated.story.id) || existing.slugs.has(generated.story.slug)) {
    throw new Error("This source URL is already represented by an existing Story.");
  }
  const story = await saveStory({ ...generated.story, status: "draft", editorialStatus: "Needs Review" });
  return { preview: generated.preview, story, saved: true };
}
