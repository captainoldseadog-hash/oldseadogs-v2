export type LlmsLink = {
  label: string;
  url: string;
};

export function llmsText(input: {
  summary: string;
  guidesIndex: string;
  areas: readonly LlmsLink[];
  standoutGuides?: readonly LlmsLink[];
  eventGuides?: readonly LlmsLink[];
  eventsCalendar?: string;
  contact?: string;
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
    "",
    "### Area hubs",
    ...input.areas.map((area) => `- ${area.label}: ${area.url}`),
    "",
    ...(input.standoutGuides?.length ? ["### Standout harbour & marina guides", ...input.standoutGuides.map((g) => `- ${g.label}: ${g.url}`), ""] : []),
    ...(input.eventGuides?.length ? ["### Event / race guides", ...input.eventGuides.map((g) => `- ${g.label}: ${g.url}`), ""] : []),
    ...(input.eventsCalendar ? ["## Events calendar", input.eventsCalendar, ""] : []),
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
    ...(input.contact ? ["## Contact", input.contact, ""] : []),
  ];
  return `${lines.join("\n")}`;
}
