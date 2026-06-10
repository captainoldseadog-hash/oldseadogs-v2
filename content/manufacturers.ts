import { normalizeSearchText } from "../lib/text-search";

export type Manufacturer = {
  name: string;
  slug: string;
};

export const manufacturers: Manufacturer[] = [
  { name: "Sunseeker", slug: "sunseeker" },
  { name: "Princess", slug: "princess" },
  { name: "Fairline", slug: "fairline" },
  { name: "Bering", slug: "bering" },
  { name: "Benetti", slug: "benetti" },
  { name: "Feadship", slug: "feadship" },
  { name: "Lurssen", slug: "lurssen" },
  { name: "Lürssen", slug: "lurssen" },
  { name: "Oceanco", slug: "oceanco" },
  { name: "Heesen", slug: "heesen" },
  { name: "Baglietto", slug: "baglietto" },
  { name: "Sirena", slug: "sirena" },
  { name: "Azimut", slug: "azimut" },
  { name: "Ferretti", slug: "ferretti" },
  { name: "Pearl", slug: "pearl" },
  { name: "Windy", slug: "windy" },
  { name: "Ribeye", slug: "ribeye" },
  { name: "Jeanneau", slug: "jeanneau" },
  { name: "Beneteau", slug: "beneteau" },
  { name: "Bénéteau", slug: "beneteau" },
  { name: "Nautor Swan", slug: "nautor-swan" },
  { name: "X-Yachts", slug: "x-yachts" },
  { name: "Hanse", slug: "hanse" },
  { name: "Dufour", slug: "dufour" },
  { name: "Lagoon", slug: "lagoon" },
  { name: "Nautitech", slug: "nautitech" },
  { name: "Ocean Alexander", slug: "ocean-alexander" },
  { name: "Alpha Custom Yachts", slug: "alpha-custom-yachts" },
];

export function canonicalManufacturer(manufacturer: Manufacturer) {
  return manufacturers.find((item) => item.slug === manufacturer.slug) ?? manufacturer;
}

export function getManufacturerBySlug(slug: string) {
  return manufacturers.find((manufacturer) => manufacturer.slug === slug) ?? null;
}

export function detectManufacturer(text: string) {
  const haystack = normalizeSearchText(text);
  const match = manufacturers.find((manufacturer) =>
    haystack.includes(normalizeSearchText(manufacturer.name))
  );
  return match ? canonicalManufacturer(match) : null;
}

export function storyMatchesManufacturer(
  story: {
    title: string;
    summary: string;
    tags: string[];
    body: string[];
  },
  manufacturer: Manufacturer
) {
  const haystack = normalizeSearchText(
    [
      story.title,
      story.summary,
      story.tags.join(" "),
      story.body.slice(0, 5).join(" "),
    ].join(" ")
  );

  return manufacturers
    .filter((item) => item.slug === manufacturer.slug)
    .some((item) => haystack.includes(normalizeSearchText(item.name)));
}
