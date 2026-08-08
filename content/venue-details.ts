import type { EditableStory } from "../lib/site-content";
import { getClubProfileForStory } from "./club-profiles";
import { getPortCountry, getPortMapLocation } from "./port-map";
import { categoryMatchesLabel } from "./sections";

export type VenuePracticalSection = {
  label: string;
  value: string;
};

export type VenueDetails = {
  name: string;
  kind: "Port / Marina" | "Club";
  country?: string;
  coordinates?: string;
  website?: {
    label: string;
    url: string;
    host?: string;
  };
  address?: string;
  email?: string;
  telephone?: string;
  vhf?: string;
  mapQuery: string;
  practicalSections: VenuePracticalSection[];
};

const venueOverrides: Record<string, Partial<VenueDetails>> = {
  "ports-brighton-marina": {
    website: {
      label: "Brighton Marina",
      url: "https://www.premiermarinas.com/marinas/brighton-marina",
      host: "premiermarinas.com",
    },
    email: "brighton@premiermarinas.com",
    telephone: "+44 (0)1273 819919",
    vhf: "80 & 37",
    mapQuery: "Brighton Marina, Brighton, East Sussex",
  },
};

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractVhf(text: string) {
  const patterns = [
    /VHF\s+Channel(?:s)?\s+(?:are|is|on)?\s*([0-9][0-9\s,&/and-]{0,32})/i,
    /VHF\s+Radio\s+(?:Channel(?:s)?\s*)?([0-9][0-9\s,&/and-]{0,32})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return compactWhitespace(match[1]).replace(/\s+and\s+/i, " & ");
    }
  }

  return "";
}

function paragraphWith(paragraphs: string[], patterns: RegExp[]) {
  return paragraphs.find((paragraph) =>
    paragraph.length > 35 && patterns.some((pattern) => pattern.test(paragraph))
  );
}

function buildPortPracticalSections(story: EditableStory): VenuePracticalSection[] {
  const paragraphs = story.body.map(compactWhitespace).filter(Boolean);
  const sections: VenuePracticalSection[] = [];
  const seenLabels = new Set<string>();

  function add(label: string, value?: string) {
    if (!value || seenLabels.has(label)) return;
    seenLabels.add(label);
    sections.push({ label, value });
  }

  add(
    "Approach and access",
    paragraphWith(paragraphs, [
      /\bapproach\b/i,
      /\bentrance\b/i,
      /\baccessible\b/i,
      /\baccess\b/i,
      /\bbreakwater\b/i,
      /\bsheltered\b/i,
      /\bprotected\b/i,
      /\bdepths?\b/i,
      /\bdraft\b/i,
      /\bchannel\b/i,
      /\ball tides\b/i,
    ])
  );
  add(
    "Visitor berths",
    paragraphWith(paragraphs, [
      /\bvisitor\b/i,
      /\btransient\b/i,
      /\bguest\b/i,
      /\bberths?\b/i,
      /\bslips?\b/i,
      /\bmoorings?\b/i,
      /\baccommodat/i,
      /\bvessels? up to\b/i,
    ])
  );
  add(
    "Marina facilities",
    paragraphWith(paragraphs, [
      /\bfacilities\b/i,
      /\bfully equipped\b/i,
      /\beach berth\b/i,
      /\bshore power\b/i,
      /\belectricity\b/i,
      /\bfresh water\b/i,
      /\bWi-?Fi\b/i,
      /\bpump-?out\b/i,
      /\bsecurity\b/i,
      /\bshowers?\b/i,
      /\blaundry\b/i,
      /\bconcierge\b/i,
    ])
  );
  add("Fuel availability", paragraphWith(paragraphs, [/\bfuel\b/i, /\bdiesel\b/i, /\bpetrol\b/i, /\bgasoline\b/i, /\bbunkering\b/i]));
  add(
    "Repair facilities",
    paragraphWith(paragraphs, [
      /\brepairs?\b/i,
      /\bmaintenance\b/i,
      /\bboatyard\b/i,
      /\bshipyard\b/i,
      /\btravelift\b/i,
      /\bhoist\b/i,
      /\bcrane\b/i,
      /\btechnical services\b/i,
      /\brefits?\b/i,
    ])
  );
  add(
    "Chandlery and provisioning",
    paragraphWith(paragraphs, [
      /\bchandlery\b/i,
      /\bprovision/i,
      /\bmarine stores?\b/i,
      /\bnautical shops?\b/i,
      /\bmini market\b/i,
      /\bsupermarket\b/i,
    ])
  );
  add(
    "Customs and immigration",
    paragraphWith(paragraphs, [/\bcustoms\b/i, /\bimmigration\b/i, /\bport of entry\b/i, /\bbiosecurity\b/i, /\bclearance\b/i])
  );
  add(
    "Local weather notes",
    paragraphWith(paragraphs, [
      /\bweather\b/i,
      /\bclimate\b/i,
      /\bseason\b/i,
      /\bwinds?\b/i,
      /\bbreeze\b/i,
      /\btemperatures?\b/i,
      /\bsailing conditions\b/i,
    ])
  );
  add(
    "Transport links",
    paragraphWith(paragraphs, [/\bairport\b/i, /\btaxi\b/i, /\btram\b/i, /\bferry\b/i, /\bshuttle\b/i, /\btransport\b/i, /\bparking\b/i, /\bcar\b/i])
  );
  add(
    "Nearby services",
    paragraphWith(paragraphs, [
      /\brestaurants?\b/i,
      /\bdining\b/i,
      /\bcaf/i,
      /\bbars?\b/i,
      /\bshopping\b/i,
      /\bboutiques?\b/i,
      /\bpharmacy\b/i,
      /\btown centre\b/i,
      /\bwaterfront\b/i,
    ])
  );

  return sections;
}

export function getVenueDetails(story: EditableStory): VenueDetails | null {
  const isPort = categoryMatchesLabel(story.category, "Ports");
  const isClub = categoryMatchesLabel(story.category, "Clubs");
  if (!isPort && !isClub) {
    return null;
  }

  const clubProfile = getClubProfileForStory(story);
  const override = venueOverrides[story.slug] ?? {};
  const articleText = compactWhitespace([story.title, ...story.body].join(" "));
  const kind = isPort ? "Port / Marina" : "Club";
  const portLocation = isPort ? getPortMapLocation(story.slug) : null;
  const country = isPort ? getPortCountry(story.slug) : clubProfile?.country;

  return {
    name: story.title,
    kind,
    country,
    coordinates: portLocation ? `${portLocation.lat.toFixed(4)}, ${portLocation.lng.toFixed(4)}` : undefined,
    website: override.website || clubProfile?.website,
    address: override.address || clubProfile?.address,
    email: override.email || clubProfile?.email,
    telephone: override.telephone || clubProfile?.telephone,
    vhf: override.vhf || extractVhf(articleText),
    mapQuery: override.mapQuery || clubProfile?.mapQuery || `${story.title} ${kind}`,
    practicalSections: isPort ? buildPortPracticalSections(story) : [],
  };
}

export function googleMapEmbedUrl(query: string, satellite = false) {
  const params = new URLSearchParams({
    q: query,
    z: "15",
    output: "embed",
  });

  if (satellite) {
    params.set("t", "k");
  }

  return `https://maps.google.com/maps?${params.toString()}`;
}

export function googleMapLinkUrl(query: string, satellite = false) {
  const params = new URLSearchParams({
    api: "1",
    query,
  });

  const baseUrl = satellite
    ? "https://www.google.com/maps/search/"
    : "https://www.google.com/maps/search/";

  return `${baseUrl}?${params.toString()}`;
}
