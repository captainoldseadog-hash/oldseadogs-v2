export const guideDraftContractName = "oldseadogs.guide-draft" as const;
export const guideDraftContractVersion = 1 as const;

export type GuideUnresolvedIssue = {
  field: string;
  reason: string;
  severity: "editorial" | "safety";
};

export type GuideSource = {
  label: string;
  url: string;
  accessedAt?: string;
  supports?: string[];
};

export type GuideFacilityValue = {
  available?: boolean | "unknown";
  detail?: string;
  sourceUrl?: string;
  verifiedAt?: string;
};

export type ManagedGuideFields = {
  schemaVersion?: 2;
  id?: string;
  externalId?: string;
  area?: string;
  parentGuideId?: string;
  parentGuideSlug?: string;
  editorial?: {
    standfirst?: string;
    introduction?: string;
    sections?: Array<{ id?: string; heading: string; body: string[]; links?: Array<{ label: string; guideSlug: string }> }>;
    oldSeaDogsView?: string[];
    practicalNotes?: string[];
    localKnowledge?: string[];
    warnings?: Array<{
      text: string;
      severity?: "advisory" | "important" | "safety";
      sourceUrl?: string;
      verifiedAt?: string;
      certainty?: "verified" | "uncertain";
    }>;
  };
  navigation?: {
    latitude?: number;
    longitude?: number;
    vhfChannel?: string;
    approach?: string[];
    depths?: string;
    tidalInformation?: string;
    hazards?: string[];
  };
  marina?: {
    berths?: string;
    visitorBerths?: string;
    fuel?: GuideFacilityValue;
    water?: GuideFacilityValue;
    electricity?: GuideFacilityValue;
    showers?: GuideFacilityValue;
    toilets?: GuideFacilityValue;
    laundry?: GuideFacilityValue;
    wifi?: GuideFacilityValue;
    repairs?: GuideFacilityValue;
    chandlery?: GuideFacilityValue;
    craneOrLift?: GuideFacilityValue;
    restaurants?: GuideFacilityValue;
    bars?: GuideFacilityValue;
    shops?: GuideFacilityValue;
    transport?: GuideFacilityValue;
  };
  contacts?: {
    officialWebsite?: string;
    telephone?: string;
    email?: string;
    harbourMasterOffice?: string;
  };
  media?: {
    heroImage?: {
      mediaId?: string;
      url: string;
      alt: string;
      caption?: string;
      credit?: string;
      focalPoint?: string;
    };
    gallery?: Array<{
      mediaId?: string;
      url: string;
      alt: string;
      caption?: string;
      credit?: string;
      order?: number;
    }>;
  };
  seo?: {
    seoTitle?: string;
    metaDescription?: string;
    canonicalSlug?: string;
    noindex?: boolean;
  };
  publication?: {
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    scheduledAt?: string | null;
  };
  verification?: {
    sources?: GuideSource[];
    notes?: string;
    verifiedAt?: string;
    unresolved?: GuideUnresolvedIssue[];
  };
};

export type GuideDraftContractRecord = ManagedGuideFields & {
  slug: string;
  title: string;
  guideType: string;
  updatedAt?: string;
  region?: {
    key?: string;
    name?: string;
    area?: string;
    parentGuideId?: string;
    parentGuideSlug?: string;
  };
};

export type GuideDraftContractEnvelope = {
  contract: typeof guideDraftContractName;
  version: typeof guideDraftContractVersion;
  mode?: "create-draft" | "update-draft";
  guides: GuideDraftContractRecord[];
};

export class GuideContractValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "GuideContractValidationError";
    this.issues = issues;
  }
}

function cleanString(value: unknown, limit = 10_000) {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, limit) : "";
}

function cleanStrings(value: unknown, limit = 10_000) {
  return Array.isArray(value) ? value.map((item) => cleanString(item, limit)).filter(Boolean) : [];
}

function cleanFacility(value: unknown): GuideFacilityValue | undefined {
  if (!isObject(value)) return undefined;
  const available = value.available === true || value.available === false || value.available === "unknown" ? value.available : undefined;
  return {
    available,
    detail: cleanString(value.detail),
    sourceUrl: validHttpUrl(value.sourceUrl) ? cleanString(value.sourceUrl, 2_000) : "",
    verifiedAt: validIsoDate(value.verifiedAt) ? cleanString(value.verifiedAt, 50) : "",
  };
}

export function normalizeManagedGuideFields(value: Partial<ManagedGuideFields>): ManagedGuideFields {
  const editorial = isObject(value.editorial) ? value.editorial : undefined;
  const navigation = isObject(value.navigation) ? value.navigation : undefined;
  const marina = isObject(value.marina) ? value.marina : undefined;
  const contacts = isObject(value.contacts) ? value.contacts : undefined;
  const media = isObject(value.media) ? value.media : undefined;
  const seo = isObject(value.seo) ? value.seo : undefined;
  const publication = isObject(value.publication) ? value.publication : undefined;
  const verification = isObject(value.verification) ? value.verification : undefined;
  const managed: ManagedGuideFields = {
    schemaVersion: value.schemaVersion === 2 ? 2 : undefined,
    id: cleanString(value.id, 200) || undefined,
    externalId: cleanString(value.externalId, 200) || undefined,
    area: cleanString(value.area, 500) || undefined,
    parentGuideId: cleanString(value.parentGuideId, 200) || undefined,
    parentGuideSlug: cleanString(value.parentGuideSlug, 200) || undefined,
    editorial: editorial ? {
      standfirst: cleanString(editorial.standfirst) || undefined,
      introduction: cleanString(editorial.introduction) || undefined,
      sections: Array.isArray(editorial.sections) ? editorial.sections.flatMap((section) => isObject(section) && cleanString(section.heading, 500)
        ? [{
            id: cleanString(section.id, 200) || undefined,
            heading: cleanString(section.heading, 500),
            body: cleanStrings(section.body),
            links: Array.isArray(section.links) ? section.links.flatMap((link) => isObject(link) && cleanString(link.label, 300) && cleanString(link.guideSlug, 200)
              ? [{ label: cleanString(link.label, 300), guideSlug: cleanString(link.guideSlug, 200) }]
              : []) : undefined,
          }]
        : []) : undefined,
      oldSeaDogsView: cleanStrings(editorial.oldSeaDogsView),
      practicalNotes: cleanStrings(editorial.practicalNotes),
      localKnowledge: cleanStrings(editorial.localKnowledge),
      warnings: Array.isArray(editorial.warnings) ? editorial.warnings.flatMap((warning) => isObject(warning) && cleanString(warning.text)
        ? [{
            text: cleanString(warning.text),
            severity: ["advisory", "important", "safety"].includes(String(warning.severity)) ? warning.severity as "advisory" | "important" | "safety" : undefined,
            sourceUrl: validHttpUrl(warning.sourceUrl) ? cleanString(warning.sourceUrl, 2_000) : undefined,
            verifiedAt: validIsoDate(warning.verifiedAt) ? cleanString(warning.verifiedAt, 50) : undefined,
            certainty: warning.certainty === "verified" || warning.certainty === "uncertain" ? warning.certainty : undefined,
          }]
        : []) : undefined,
    } : undefined,
    navigation: navigation ? {
      latitude: Number.isFinite(navigation.latitude) ? Number(navigation.latitude) : undefined,
      longitude: Number.isFinite(navigation.longitude) ? Number(navigation.longitude) : undefined,
      vhfChannel: cleanString(navigation.vhfChannel, 200) || undefined,
      approach: cleanStrings(navigation.approach),
      depths: cleanString(navigation.depths, 1_000) || undefined,
      tidalInformation: cleanString(navigation.tidalInformation, 2_000) || undefined,
      hazards: cleanStrings(navigation.hazards, 2_000),
    } : undefined,
    marina: marina ? {
      berths: cleanString(marina.berths, 500) || undefined,
      visitorBerths: cleanString(marina.visitorBerths, 1_000) || undefined,
      fuel: cleanFacility(marina.fuel), water: cleanFacility(marina.water), electricity: cleanFacility(marina.electricity),
      showers: cleanFacility(marina.showers), toilets: cleanFacility(marina.toilets), laundry: cleanFacility(marina.laundry),
      wifi: cleanFacility(marina.wifi), repairs: cleanFacility(marina.repairs), chandlery: cleanFacility(marina.chandlery),
      craneOrLift: cleanFacility(marina.craneOrLift), restaurants: cleanFacility(marina.restaurants), bars: cleanFacility(marina.bars),
      shops: cleanFacility(marina.shops), transport: cleanFacility(marina.transport),
    } : undefined,
    contacts: contacts ? {
      officialWebsite: validHttpUrl(contacts.officialWebsite) ? cleanString(contacts.officialWebsite, 2_000) : undefined,
      telephone: cleanString(contacts.telephone, 200) || undefined,
      email: cleanString(contacts.email, 320) || undefined,
      harbourMasterOffice: cleanString(contacts.harbourMasterOffice, 1_000) || undefined,
    } : undefined,
    media: media ? {
      heroImage: isObject(media.heroImage) && cleanString(media.heroImage.url, 2_000) ? {
        mediaId: cleanString(media.heroImage.mediaId, 200) || undefined,
        url: cleanString(media.heroImage.url, 2_000),
        alt: cleanString(media.heroImage.alt, 500),
        caption: cleanString(media.heroImage.caption) || undefined,
        credit: cleanString(media.heroImage.credit, 500) || undefined,
        focalPoint: cleanString(media.heroImage.focalPoint, 100) || undefined,
      } : undefined,
      gallery: Array.isArray(media.gallery) ? media.gallery.flatMap((image) => isObject(image) && cleanString(image.url, 2_000)
        ? [{ mediaId: cleanString(image.mediaId, 200) || undefined, url: cleanString(image.url, 2_000), alt: cleanString(image.alt, 500), caption: cleanString(image.caption) || undefined, credit: cleanString(image.credit, 500) || undefined, order: Number.isFinite(image.order) ? Number(image.order) : undefined }]
        : []) : undefined,
    } : undefined,
    seo: seo ? {
      seoTitle: cleanString(seo.seoTitle, 500) || undefined,
      metaDescription: cleanString(seo.metaDescription, 1_000) || undefined,
      canonicalSlug: cleanString(seo.canonicalSlug, 500) || undefined,
      noindex: typeof seo.noindex === "boolean" ? seo.noindex : undefined,
    } : undefined,
    publication: publication ? {
      createdAt: validIsoDate(publication.createdAt) ? cleanString(publication.createdAt, 50) : undefined,
      updatedAt: validIsoDate(publication.updatedAt) ? cleanString(publication.updatedAt, 50) : undefined,
      publishedAt: publication.publishedAt === null ? null : validIsoDate(publication.publishedAt) ? cleanString(publication.publishedAt, 50) : undefined,
      scheduledAt: publication.scheduledAt === null ? null : validIsoDate(publication.scheduledAt) ? cleanString(publication.scheduledAt, 50) : undefined,
    } : undefined,
    verification: verification ? {
      sources: Array.isArray(verification.sources) ? verification.sources.flatMap((source) => isObject(source) && cleanString(source.label, 500) && validHttpUrl(source.url)
        ? [{ label: cleanString(source.label, 500), url: cleanString(source.url, 2_000), accessedAt: validIsoDate(source.accessedAt) ? cleanString(source.accessedAt, 50) : undefined, supports: cleanStrings(source.supports, 500) }]
        : []) : undefined,
      notes: cleanString(verification.notes) || undefined,
      verifiedAt: validIsoDate(verification.verifiedAt) ? cleanString(verification.verifiedAt, 50) : undefined,
      unresolved: Array.isArray(verification.unresolved) ? verification.unresolved.flatMap((issue) => isObject(issue) && cleanString(issue.field, 500) && cleanString(issue.reason) && (issue.severity === "editorial" || issue.severity === "safety")
        ? [{ field: cleanString(issue.field, 500), reason: cleanString(issue.reason), severity: issue.severity }]
        : []) : undefined,
    } : undefined,
  };
  return managed;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validIsoDate(value: unknown) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function validHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateGuideDraftEnvelope(value: unknown): GuideDraftContractEnvelope {
  const issues: string[] = [];
  if (!isObject(value)) throw new GuideContractValidationError(["The Guide Draft envelope must be an object."]);
  if (value.contract !== guideDraftContractName) issues.push(`contract must be ${guideDraftContractName}.`);
  if (value.version !== guideDraftContractVersion) issues.push(`version must be ${guideDraftContractVersion}.`);
  if (value.mode !== undefined && value.mode !== "create-draft" && value.mode !== "update-draft") {
    issues.push("mode must be create-draft or update-draft; publishing is not supported by this contract.");
  }
  if (!Array.isArray(value.guides) || value.guides.length === 0) {
    issues.push("guides must contain at least one Draft record.");
  } else {
    value.guides.forEach((guide, index) => {
      const prefix = `guides[${index}]`;
      if (!isObject(guide)) {
        issues.push(`${prefix} must be an object.`);
        return;
      }
      if (typeof guide.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug)) issues.push(`${prefix}.slug must be a lowercase URL slug.`);
      if (typeof guide.title !== "string" || !guide.title.trim()) issues.push(`${prefix}.title is required.`);
      if (typeof guide.guideType !== "string" || !guide.guideType.trim()) issues.push(`${prefix}.guideType is required.`);
      if ("status" in guide) issues.push(`${prefix}.status is not accepted; the contract always creates or updates Drafts.`);
      const verification = isObject(guide.verification) ? guide.verification : null;
      if (verification?.sources !== undefined) {
        if (!Array.isArray(verification.sources)) issues.push(`${prefix}.verification.sources must be an array.`);
        else verification.sources.forEach((source, sourceIndex) => {
          if (!isObject(source) || typeof source.label !== "string" || !source.label.trim() || !validHttpUrl(source.url)) {
            issues.push(`${prefix}.verification.sources[${sourceIndex}] requires a label and HTTP(S) URL.`);
          }
          if (isObject(source) && source.accessedAt !== undefined && !validIsoDate(source.accessedAt)) {
            issues.push(`${prefix}.verification.sources[${sourceIndex}].accessedAt must be an ISO date.`);
          }
        });
      }
      if (verification?.unresolved !== undefined) {
        if (!Array.isArray(verification.unresolved)) issues.push(`${prefix}.verification.unresolved must be an array.`);
        else verification.unresolved.forEach((issue, issueIndex) => {
          if (!isObject(issue) || typeof issue.field !== "string" || typeof issue.reason !== "string" || !["editorial", "safety"].includes(String(issue.severity))) {
            issues.push(`${prefix}.verification.unresolved[${issueIndex}] requires field, reason and editorial|safety severity.`);
          }
        });
      }
    });
  }
  if (issues.length) throw new GuideContractValidationError(issues);
  return value as GuideDraftContractEnvelope;
}
