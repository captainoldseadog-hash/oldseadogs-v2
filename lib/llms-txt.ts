export type LlmsLink = {
  label: string;
  url: string;
};

export function llmsText(input: {
  summary: string;
  guidesIndex: string;
  areas: readonly LlmsLink[];
  storySections: readonly LlmsLink[];
  boatsForSale: string;
  about: string;
}) {
  const lines = [
    "# Old Sea Dogs",
    "",
    input.summary,
    "",
    "Old Sea Dogs publishes cruising guides, boating and yachting stories, and boats for sale.",
    "",
    "## Guides",
    input.guidesIndex,
    ...input.areas.map((area) => `- ${area.label}: ${area.url}`),
    "",
    "## Stories",
    "Individual stories are published at /stories/<slug> and listed in these sections:",
    ...input.storySections.map((section) => `- ${section.label}: ${section.url}`),
    "",
    "## Boats for sale",
    input.boatsForSale,
    "",
    "## About",
    input.about,
    "",
  ];
  return `${lines.join("\n")}`;
}
