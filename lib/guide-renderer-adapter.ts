import type { GuideType } from "../content/flagship-guides.ts";
import type { ManagedGuideFields, GuideFacilityValue } from "./guide-contract.ts";
import type { EditableGuide } from "./site-content.ts";

export type ManagedGuideInput = Partial<EditableGuide> & ManagedGuideFields;

const facilityLabels: Array<[keyof NonNullable<ManagedGuideFields["marina"]>, string]> = [
  ["fuel", "Fuel"], ["water", "Water"], ["electricity", "Electricity"], ["showers", "Showers"],
  ["toilets", "Toilets"], ["laundry", "Laundry"], ["wifi", "Wi-Fi"], ["repairs", "Repairs"],
  ["chandlery", "Chandlery"], ["craneOrLift", "Crane / lift"], ["restaurants", "Restaurants"],
  ["bars", "Bars"], ["shops", "Shops"], ["transport", "Transport"],
];

function facilityText(value: GuideFacilityValue | undefined) {
  if (!value) return "";
  if (value.detail?.trim()) return value.detail.trim();
  if (value.available === true) return "Available";
  if (value.available === false) return "Not available";
  if (value.available === "unknown") return "Confirm directly";
  return "";
}

function uniqueFacts(facts: Array<{ label: string; value: string }>) {
  const byLabel = new Map<string, { label: string; value: string }>();
  for (const fact of facts) if (fact.label && fact.value) byLabel.set(fact.label.toLowerCase(), fact);
  return [...byLabel.values()];
}

function structuredSections(input: ManagedGuideInput) {
  if (!input.editorial && !input.navigation) return input.sections;
  const sections = (input.editorial?.sections || input.sections || []).map(({ heading, body }) => ({ heading, body }));
  const additions: Array<[string, string[] | undefined]> = [
    ["Approach and arrival", input.navigation?.approach],
    ["Tidal information", input.navigation?.tidalInformation ? [input.navigation.tidalInformation] : undefined],
    ["Hazards and cautions", input.navigation?.hazards],
    ["Practical notes", input.editorial?.practicalNotes],
    ["Local knowledge", input.editorial?.localKnowledge],
    ["Old Sea Dogs View", input.editorial?.oldSeaDogsView],
  ];
  for (const [heading, body] of additions) {
    if (body?.length && !sections.some((section) => section.heading.toLowerCase() === heading.toLowerCase())) sections.push({ heading, body });
  }
  if (input.editorial?.warnings?.length && !sections.some((section) => section.heading.toLowerCase() === "warnings")) {
    sections.push({ heading: "Warnings", body: input.editorial.warnings.map((warning) => warning.text) });
  }
  return sections.length ? sections : input.sections;
}

function rendererInlineImages(input: ManagedGuideInput) {
  const existing = input.inlineImages || [];
  const gallery = (input.media?.gallery || []).map((image, index) => ({
    id: `guide-gallery-${index + 1}`,
    mediaId: image.mediaId || "",
    url: image.url,
    alt: image.alt,
    caption: image.caption || "",
    credit: image.credit || "",
    sectionIndex: 0,
    paragraphIndex: 0,
    order: image.order ?? existing.length + index,
  }));
  const seen = new Set<string>();
  return [...existing, ...gallery].filter((image) => {
    const key = image.mediaId || image.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((image, order) => ({ ...image, order }));
}

export function adaptManagedGuideForRenderer(input: ManagedGuideInput): Partial<EditableGuide> {
  const navigationFacts = [
    input.navigation?.vhfChannel ? { label: "VHF channel", value: input.navigation.vhfChannel } : null,
    input.navigation?.depths ? { label: "Depths and draught", value: input.navigation.depths } : null,
    input.navigation?.tidalInformation ? { label: "Tidal information", value: input.navigation.tidalInformation } : null,
    input.marina?.berths ? { label: "Berths", value: input.marina.berths } : null,
    input.marina?.visitorBerths ? { label: "Visitor berths", value: input.marina.visitorBerths } : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));
  const facilityFacts = facilityLabels.flatMap(([key, label]) => {
    const value = facilityText(input.marina?.[key] as GuideFacilityValue | undefined);
    return value ? [{ label, value }] : [];
  });
  const verifiedFacilities = facilityLabels.flatMap(([key, label]) => {
    const facility = input.marina?.[key] as GuideFacilityValue | undefined;
    const detail = facilityText(facility);
    return facility?.sourceUrl && detail ? [{ label, detail, sourceUrl: facility.sourceUrl, verifiedOn: facility.verifiedAt || "" }] : [];
  });
  const sourceLinks = input.verification?.sources?.map((source) => ({ label: source.label, href: source.url })) || [];
  if (input.contacts?.officialWebsite && !sourceLinks.some((source) => source.href === input.contacts?.officialWebsite)) {
    sourceLinks.push({ label: "Official website", href: input.contacts.officialWebsite });
  }
  const hero = input.media?.heroImage;
  const canonicalSlug = input.seo?.canonicalSlug?.trim();
  const canonicalPath = canonicalSlug
    ? `/guides/${input.regionKey ? `${input.regionKey}/` : ""}${canonicalSlug}`
    : input.canonicalPath;

  return {
    ...input,
    schemaVersion: input.schemaVersion,
    id: input.id,
    area: input.area,
    parentGuideId: input.parentGuideId,
    editorial: input.editorial,
    navigation: input.navigation,
    marina: input.marina,
    contacts: input.contacts,
    media: input.media,
    seo: input.seo,
    publication: input.publication,
    verification: input.verification,
    guideType: input.guideType as GuideType | undefined,
    summary: input.editorial?.standfirst || input.summary,
    introduction: input.editorial?.introduction || input.introduction,
    sections: structuredSections(input),
    quickFacts: uniqueFacts([...(input.quickFacts || []), ...navigationFacts, ...facilityFacts]),
    verifiedFacilities: verifiedFacilities.length ? verifiedFacilities : input.verifiedFacilities,
    sourceLinks: sourceLinks.length ? sourceLinks : input.sourceLinks,
    location: {
      ...input.location,
      latitude: input.navigation?.latitude ?? input.location?.latitude,
      longitude: input.navigation?.longitude ?? input.location?.longitude,
    },
    imageUrl: hero?.url || input.imageUrl,
    imageAlt: hero?.alt || input.imageAlt,
    imageCaption: hero?.caption ?? input.imageCaption,
    imageCredit: hero?.credit ?? input.imageCredit,
    imageFocalPoint: hero?.focalPoint ?? input.imageFocalPoint,
    featuredMediaId: hero?.mediaId ?? input.featuredMediaId,
    inlineImages: rendererInlineImages(input),
    seoTitle: input.seo?.seoTitle || input.seoTitle,
    seoDescription: input.seo?.metaDescription || input.seoDescription,
    canonicalPath,
    noindex: input.seo?.noindex ?? input.noindex,
  };
}
