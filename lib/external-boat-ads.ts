import rawAds from "../content/external-boat-ads.json" with { type: "json" };

export const EXTERNAL_BOAT_AD_SOURCES = ["Gumtree", "eBay", "YachtWorld"] as const;
export const EXTERNAL_BOAT_AD_SNIPPET_LIMIT = 180;

export type ExternalBoatAdSource = (typeof EXTERNAL_BOAT_AD_SOURCES)[number];

export type ExternalBoatAd = {
  id: string;
  source: ExternalBoatAdSource;
  makeModel: string;
  year: number | null;
  price: string;
  priceNote: string | null;
  location: string;
  boatType: string;
  url: string;
  previewTitle: string;
  snippet: string;
  /** Local hover-preview image. Never used on the card face. */
  thumbnail: string | null;
};

type RawAd = {
  id?: string;
  source?: string;
  title?: string;
  make_model?: string;
  year?: number | null;
  price?: string;
  price_note?: string | null;
  location?: string;
  url?: string;
  type?: string;
  snippet?: string;
  thumbnail?: string | null;
};

const sourceSet = new Set<string>(EXTERNAL_BOAT_AD_SOURCES);

function isSource(value: string): value is ExternalBoatAdSource {
  return sourceSet.has(value);
}

function localThumbnail(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("/images/boats/external/")) return null;
  if (value.includes("..") || value.includes("\\") || value.includes("?") || value.includes("#")) return null;
  return value;
}

export function shortExternalSnippet(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= EXTERNAL_BOAT_AD_SNIPPET_LIMIT) return text;
  return `${text.slice(0, EXTERNAL_BOAT_AD_SNIPPET_LIMIT - 1).trimEnd()}…`;
}

function httpsUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function readExternalBoatAds(): ExternalBoatAd[] {
  const listings = (rawAds as { listings?: RawAd[] }).listings ?? [];
  const ads: ExternalBoatAd[] = [];
  for (const entry of listings) {
    const source = entry.source?.trim() ?? "";
    if (!isSource(source)) continue;
    const url = httpsUrl(entry.url);
    const makeModel = entry.make_model?.trim() ?? "";
    const previewTitle = entry.title?.trim() ?? "";
    const price = entry.price?.trim() ?? "";
    const location = entry.location?.trim() ?? "";
    const boatType = entry.type?.trim() ?? "";
    if (!url || !makeModel || !previewTitle || !price || !location) continue;
    const fallback = [boatType, location, price].filter(Boolean).join(" · ");
    ads.push({
      id: entry.id?.trim() || url,
      source,
      makeModel,
      year: typeof entry.year === "number" && Number.isFinite(entry.year) ? entry.year : null,
      price,
      priceNote: entry.price_note?.trim() || null,
      location,
      boatType,
      url,
      previewTitle,
      snippet: shortExternalSnippet(entry.snippet?.trim() || fallback),
      thumbnail: localThumbnail(entry.thumbnail),
    });
  }
  return ads;
}
