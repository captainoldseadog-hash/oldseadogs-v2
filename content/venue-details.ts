import type { EditableStory } from "../lib/site-content";

export type VenueDetails = {
  name: string;
  kind: "Port / Marina" | "Club";
  website?: {
    label: string;
    url: string;
    host?: string;
  };
  email?: string;
  telephone?: string;
  vhf?: string;
  mapQuery: string;
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

export function getVenueDetails(story: EditableStory): VenueDetails | null {
  if (story.category !== "Ports" && story.category !== "Clubs") {
    return null;
  }

  const override = venueOverrides[story.slug] ?? {};
  const articleText = compactWhitespace([story.title, ...story.body].join(" "));
  const kind = story.category === "Ports" ? "Port / Marina" : "Club";

  return {
    name: story.title,
    kind,
    website: override.website,
    email: override.email,
    telephone: override.telephone,
    vhf: override.vhf || extractVhf(articleText),
    mapQuery: override.mapQuery || `${story.title} ${kind}`,
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
