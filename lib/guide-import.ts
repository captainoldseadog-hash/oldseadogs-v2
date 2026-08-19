import { GUIDE_TYPES, type GuideType } from "../content/flagship-guides.ts";
export { safeCsvCell } from "./csv-safety.ts";
import {
  GuideContractValidationError,
  guideDraftContractName,
  guideDraftContractVersion,
  normalizeManagedGuideFields,
  validateGuideDraftEnvelope,
  type GuideDraftContractEnvelope,
  type GuideDraftContractRecord,
} from "./guide-contract.ts";
import { adaptManagedGuideForRenderer } from "./guide-renderer-adapter.ts";
import { GuideManagementError, validateForDraft } from "./guide-management.ts";
import {
  getAllGuides,
  getEditorData,
  makeId,
  mergeLocalGuidesWithStatic,
  normalizeStoredGuide,
  updateLocalEditorStore,
  type EditableGuide,
  type GuideRevision,
  type LocalEditorStore,
  type MediaAsset,
} from "./site-content.ts";

export const guideImportCsvColumns = [
  "externalId", "updatedAt", "slug", "title", "guideType", "regionKey", "regionName", "area", "parentGuideId", "parentGuideSlug",
  "standfirst", "introduction", "latitude", "longitude", "vhfChannel", "depths", "tidalInformation",
  "officialWebsite", "telephone", "email", "seoTitle", "metaDescription", "heroMediaId", "heroUrl", "heroAlt",
  "sections", "oldSeaDogsView", "practicalNotes", "localKnowledge", "warnings", "approach", "hazards",
  "marinaFacilities", "gallery", "sources", "unresolved",
] as const;

export type GuideImportItem = {
  externalId: string;
  slug: string;
  title: string;
  action: "create" | "update" | "duplicate" | "blocked";
  valid: boolean;
  warnings: string[];
  errors: string[];
  unresolved: Array<{ field: string; reason: string; severity: "editorial" | "safety" }>;
  existingMatch: { id: string; slug: string; status: string; updatedAt: string } | null;
  mediaStatus: "valid" | "missing-hero" | "invalid";
  verificationStatus: "verified" | "unresolved-editorial" | "unresolved-safety" | "unverified";
};

export type GuideImportPlan = {
  planToken: string;
  contract: typeof guideDraftContractName;
  version: typeof guideDraftContractVersion;
  mode: "create-draft" | "update-draft";
  createdAt: string;
  expiresAt: string;
  summary: { total: number; valid: number; warnings: number; blocked: number; creates: number; updates: number; duplicates: number };
  items: GuideImportItem[];
};

type StoredPlan = GuideImportPlan & {
  records: GuideDraftContractRecord[];
  fingerprint: string;
  source: "bulk-import" | "skill-import";
};

const plans = new Map<string, StoredPlan>();
const planLifetimeMs = 15 * 60 * 1000;
const topKeys = new Set(["externalId", "updatedAt", "slug", "title", "guideType", "region", "schemaVersion", "id", "area", "parentGuideId", "parentGuideSlug", "editorial", "navigation", "marina", "contacts", "media", "seo", "publication", "verification"]);
const nestedKeys: Record<string, Set<string>> = {
  region: new Set(["key", "name", "area", "parentGuideId", "parentGuideSlug"]),
  editorial: new Set(["standfirst", "introduction", "sections", "oldSeaDogsView", "practicalNotes", "localKnowledge", "warnings"]),
  navigation: new Set(["latitude", "longitude", "vhfChannel", "approach", "depths", "tidalInformation", "hazards"]),
  marina: new Set(["berths", "visitorBerths", "fuel", "water", "electricity", "showers", "toilets", "laundry", "wifi", "repairs", "chandlery", "craneOrLift", "restaurants", "bars", "shops", "transport"]),
  contacts: new Set(["officialWebsite", "telephone", "email", "harbourMasterOffice"]),
  media: new Set(["heroImage", "gallery"]),
  seo: new Set(["seoTitle", "metaDescription", "canonicalSlug", "noindex"]),
  publication: new Set(["createdAt", "updatedAt", "publishedAt", "scheduledAt"]),
  verification: new Set(["sources", "notes", "verifiedAt", "unresolved"]),
};
const deepKeys: Record<string, Set<string>> = {
  "editorial.sections": new Set(["id", "heading", "body"]),
  "editorial.warnings": new Set(["text", "severity", "sourceUrl", "verifiedAt", "certainty"]),
  "media.heroImage": new Set(["mediaId", "url", "alt", "caption", "credit", "focalPoint"]),
  "media.gallery": new Set(["mediaId", "url", "alt", "caption", "credit", "order"]),
  "verification.sources": new Set(["label", "url", "accessedAt", "supports"]),
  "verification.unresolved": new Set(["field", "reason", "severity"]),
};

function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function nowIso() { return new Date().toISOString(); }
function identity(guide: EditableGuide) { return guide.id || guide.internalId || guide.slug; }
function publicPath(slug: string, regionKey: string) { return regionKey ? `/guides/${regionKey}/${slug}` : `/guides/${slug}`; }
function nextTimestamp(current?: string) { const now = Date.now(); const old = current ? Date.parse(current) : 0; return new Date(Math.max(now, Number.isFinite(old) ? old + 1 : 0)).toISOString(); }
function nextInternalId(guides: EditableGuide[]) { const high = guides.reduce((value, guide) => Math.max(value, Number(guide.internalId.match(/^OSD-G(\d+)$/i)?.[1] || 0)), 0); return `OSD-G${String(high + 1).padStart(3, "0")}`; }

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (quoted) throw new GuideManagementError("Malformed CSV: an quoted cell was not closed.");
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((item) => item.some((value) => value.trim()));
}

function jsonCell(value: string, column: string, row: number) {
  if (!value.trim()) return undefined;
  try { return JSON.parse(value); } catch { throw new GuideManagementError(`CSV row ${row}, ${column}: expected valid JSON.`); }
}

export function csvToGuideEnvelope(text: string, mode: "create-draft" | "update-draft" = "create-draft"): GuideDraftContractEnvelope {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new GuideManagementError("CSV must contain a header and at least one Guide row.");
  const headers = rows[0].map((value) => value.trim());
  const unknown = headers.filter((value) => !guideImportCsvColumns.includes(value as typeof guideImportCsvColumns[number]));
  if (unknown.length) throw new GuideManagementError(`Unknown CSV column${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}.`);
  for (const required of ["externalId", "slug", "title", "guideType", "regionKey", "regionName"]) if (!headers.includes(required)) throw new GuideManagementError(`CSV is missing required column ${required}.`);
  const guides = rows.slice(1).map((values, rowIndex) => {
    if (values.length > headers.length) throw new GuideManagementError(`CSV row ${rowIndex + 2} has more cells than the header.`);
    const cells = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    const structured = (name: string) => jsonCell(cells[name] || "", name, rowIndex + 2);
    const number = (name: string) => cells[name]?.trim() ? Number(cells[name]) : undefined;
    return {
      externalId: cells.externalId, updatedAt: cells.updatedAt || undefined, slug: cells.slug, title: cells.title, guideType: cells.guideType,
      region: { key: cells.regionKey, name: cells.regionName, area: cells.area || undefined, parentGuideId: cells.parentGuideId || undefined, parentGuideSlug: cells.parentGuideSlug || undefined },
      editorial: { standfirst: cells.standfirst, introduction: cells.introduction, sections: structured("sections"), oldSeaDogsView: structured("oldSeaDogsView"), practicalNotes: structured("practicalNotes"), localKnowledge: structured("localKnowledge"), warnings: structured("warnings") },
      navigation: { latitude: number("latitude"), longitude: number("longitude"), vhfChannel: cells.vhfChannel, depths: cells.depths, tidalInformation: cells.tidalInformation, approach: structured("approach"), hazards: structured("hazards") },
      marina: structured("marinaFacilities"), contacts: { officialWebsite: cells.officialWebsite, telephone: cells.telephone, email: cells.email },
      media: { heroImage: cells.heroUrl ? { mediaId: cells.heroMediaId || undefined, url: cells.heroUrl, alt: cells.heroAlt } : undefined, gallery: structured("gallery") },
      seo: { seoTitle: cells.seoTitle, metaDescription: cells.metaDescription }, verification: { sources: structured("sources"), unresolved: structured("unresolved") },
    } as GuideDraftContractRecord;
  });
  return { contract: guideDraftContractName, version: guideDraftContractVersion, mode, guides };
}

function unknownFieldIssues(envelope: unknown) {
  const issues: string[] = [];
  if (!object(envelope) || !Array.isArray(envelope.guides)) return issues;
  for (const key of Object.keys(envelope)) if (!["contract", "version", "mode", "guides"].includes(key)) issues.push(`${key} is unknown; unknown fields are not imported.`);
  for (const [index, raw] of envelope.guides.entries()) {
    if (!object(raw)) continue;
    for (const key of Object.keys(raw)) if (!topKeys.has(key)) issues.push(`guides[${index}].${key} is unknown; unknown fields are not imported.`);
    for (const [name, allowed] of Object.entries(nestedKeys)) {
      const value = raw[name];
      if (object(value)) for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push(`guides[${index}].${name}.${key} is unknown; unknown fields are not imported.`);
    }
    for (const [path, allowed] of Object.entries(deepKeys)) {
      const [parent, child] = path.split(".");
      const parentValue = object(raw[parent]) ? raw[parent] : null;
      const value = parentValue?.[child];
      const values = Array.isArray(value) ? value : object(value) ? [value] : [];
      values.forEach((item, itemIndex) => { if (object(item)) for (const key of Object.keys(item)) if (!allowed.has(key)) issues.push(`guides[${index}].${path}${Array.isArray(value) ? `[${itemIndex}]` : ""}.${key} is unknown; unknown fields are not imported.`); });
    }
    if (object(raw.marina)) for (const [facilityName, facility] of Object.entries(raw.marina)) if (object(facility)) for (const key of Object.keys(facility)) if (!["available", "detail", "sourceUrl", "verifiedAt"].includes(key)) issues.push(`guides[${index}].marina.${facilityName}.${key} is unknown; unknown fields are not imported.`);
  }
  return issues;
}

function recordIssues(record: GuideDraftContractRecord, index: number) {
  const prefix = `guides[${index}]`;
  const issues: string[] = [];
  if (!record.externalId?.trim()) issues.push(`${prefix}.externalId is required for idempotent import.`);
  if ((record.externalId || "").length > 200) issues.push(`${prefix}.externalId exceeds 200 characters.`);
  if (record.title.length > 500) issues.push(`${prefix}.title exceeds 500 characters.`);
  const walkStrings = (value: unknown, path: string) => {
    if (typeof value === "string" && value.length > 10_000) issues.push(`${prefix}.${path} exceeds 10,000 characters.`);
    else if (Array.isArray(value)) value.forEach((item, itemIndex) => walkStrings(item, `${path}[${itemIndex}]`));
    else if (object(value)) Object.entries(value).forEach(([key, item]) => walkStrings(item, `${path}.${key}`));
  };
  walkStrings(record, "record");
  if (!GUIDE_TYPES.includes(record.guideType as GuideType)) issues.push(`${prefix}.guideType must be a recognised Guide type.`);
  if (!record.region?.key?.trim() || !record.region?.name?.trim()) issues.push(`${prefix}.region.key and region.name are required.`);
  if (record.region?.key && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.region.key)) issues.push(`${prefix}.region.key must be a lowercase URL key.`);
  if (record.updatedAt !== undefined && Number.isNaN(Date.parse(record.updatedAt))) issues.push(`${prefix}.updatedAt must be an ISO date.`);
  const validateUrl = (value: unknown, label: string) => { if (value && (typeof value !== "string" || !/^https?:\/\//i.test(value))) issues.push(`${prefix}.${label} must be an HTTP(S) URL.`); };
  validateUrl(record.contacts?.officialWebsite, "contacts.officialWebsite");
  if (record.contacts?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contacts.email)) issues.push(`${prefix}.contacts.email must be a valid email address.`);
  for (const [sourceIndex, source] of (record.verification?.sources || []).entries()) validateUrl(source.url, `verification.sources[${sourceIndex}].url`);
  if (record.verification?.verifiedAt && Number.isNaN(Date.parse(record.verification.verifiedAt))) issues.push(`${prefix}.verification.verifiedAt must be an ISO date.`);
  for (const [sectionIndex, section] of (record.editorial?.sections || []).entries()) if (!section.heading?.trim() || !Array.isArray(section.body)) issues.push(`${prefix}.editorial.sections[${sectionIndex}] requires a heading and paragraph array.`);
  for (const [warningIndex, warning] of (record.editorial?.warnings || []).entries()) {
    if (!warning.text?.trim()) issues.push(`${prefix}.editorial.warnings[${warningIndex}].text is required.`);
    validateUrl(warning.sourceUrl, `editorial.warnings[${warningIndex}].sourceUrl`);
    if (warning.verifiedAt && Number.isNaN(Date.parse(warning.verifiedAt))) issues.push(`${prefix}.editorial.warnings[${warningIndex}].verifiedAt must be an ISO date.`);
  }
  for (const [key, facility] of Object.entries(record.marina || {})) if (object(facility)) { validateUrl(facility.sourceUrl, `marina.${key}.sourceUrl`); if (facility.verifiedAt && Number.isNaN(Date.parse(String(facility.verifiedAt)))) issues.push(`${prefix}.marina.${key}.verifiedAt must be an ISO date.`); }
  if (record.navigation?.latitude !== undefined && (!Number.isFinite(record.navigation.latitude) || record.navigation.latitude < -90 || record.navigation.latitude > 90)) issues.push(`${prefix}.navigation.latitude must be between -90 and 90.`);
  if (record.navigation?.longitude !== undefined && (!Number.isFinite(record.navigation.longitude) || record.navigation.longitude < -180 || record.navigation.longitude > 180)) issues.push(`${prefix}.navigation.longitude must be between -180 and 180.`);
  return issues;
}

function mediaReferences(record: GuideDraftContractRecord) { return [record.media?.heroImage, ...(record.media?.gallery || [])].filter(Boolean) as Array<{ mediaId?: string; url: string }> }
function mediaIssues(record: GuideDraftContractRecord, media: MediaAsset[]) {
  const issues: string[] = [];
  const byId = new Map(media.map((asset) => [asset.id, asset]));
  const byUrl = new Map(media.map((asset) => [asset.url, asset]));
  for (const [index, image] of mediaReferences(record).entries()) {
    if (/^data:/i.test(image.url) || /^https?:/i.test(image.url)) { issues.push(`media image ${index + 1} must reference an existing CMS media asset, not embedded or remote binary data.`); continue; }
    const asset = image.mediaId ? byId.get(image.mediaId) : byUrl.get(image.url);
    if (!asset || asset.url !== image.url) issues.push(`media image ${index + 1} does not match an existing media ID and URL.`);
  }
  return issues;
}

function verificationStatus(record: GuideDraftContractRecord): GuideImportItem["verificationStatus"] {
  const unresolved = record.verification?.unresolved || [];
  if (unresolved.some((item) => item.severity === "safety")) return "unresolved-safety";
  if (unresolved.length) return "unresolved-editorial";
  return record.verification?.verifiedAt ? "verified" : "unverified";
}

function fingerprint(guides: EditableGuide[], media: MediaAsset[]) {
  return JSON.stringify({ guides: guides.map((guide) => [guide.externalId || "", guide.slug, guide.status, guide.updatedAt]).sort(), media: media.map((asset) => [asset.id, asset.url]).sort() });
}

function planSummary(items: GuideImportItem[]) { return { total: items.length, valid: items.filter((item) => item.valid).length, warnings: items.filter((item) => item.warnings.length).length, blocked: items.filter((item) => !item.valid).length, creates: items.filter((item) => item.action === "create").length, updates: items.filter((item) => item.action === "update").length, duplicates: items.filter((item) => item.action === "duplicate").length }; }

export async function validateGuideImport(input: { format: "json" | "csv"; content: string | unknown; mode?: "create-draft" | "update-draft"; source?: "bulk-import" | "skill-import" }) {
  let raw: unknown;
  try { raw = input.format === "csv" ? csvToGuideEnvelope(String(input.content || ""), input.mode) : typeof input.content === "string" ? JSON.parse(input.content) : input.content; }
  catch (error) { if (error instanceof GuideManagementError) throw error; throw new GuideManagementError("Malformed JSON: the Guide Draft envelope could not be parsed."); }
  if (input.format === "json" && input.mode && object(raw) && raw.mode === undefined) raw = { ...raw, mode: input.mode };
  const unknown = unknownFieldIssues(raw);
  if (unknown.length) throw new GuideManagementError(unknown.join(" "), 400, unknown);
  let envelope: GuideDraftContractEnvelope;
  let contractRecordIssues: string[] = [];
  try { envelope = validateGuideDraftEnvelope(raw); } catch (error) {
    if (!(error instanceof GuideContractValidationError)) throw error;
    const recordOnly = error.issues.every((issue) => /^guides\[\d+\]/.test(issue));
    if (!recordOnly || !object(raw) || !Array.isArray(raw.guides) || raw.guides.some((guide) => !object(guide))) throw new GuideManagementError(error.message, 400, error.issues);
    contractRecordIssues = error.issues;
    envelope = raw as unknown as GuideDraftContractEnvelope;
  }
  const mode = envelope.mode || "create-draft";
  const [guides, editorData] = await Promise.all([getAllGuides(), getEditorData()]);
  const externalIds = new Map<string, number>(), slugs = new Map<string, number>();
  envelope.guides.forEach((record) => { if (record.externalId) externalIds.set(record.externalId, (externalIds.get(record.externalId) || 0) + 1); slugs.set(record.slug, (slugs.get(record.slug) || 0) + 1); });
  const items = envelope.guides.map((record, index): GuideImportItem => {
    const errors = [...contractRecordIssues.filter((issue) => issue.startsWith(`guides[${index}]`)), ...recordIssues(record, index)];
    const warnings: string[] = [];
    if ((externalIds.get(record.externalId || "") || 0) > 1) errors.push("externalId is duplicated within this import.");
    if ((slugs.get(record.slug) || 0) > 1) errors.push("slug is duplicated within this import.");
    const existingExternal = guides.find((guide) => guide.externalId === record.externalId);
    const existingSlug = guides.find((guide) => guide.slug === record.slug);
    let existing = existingExternal || existingSlug || null;
    let action: GuideImportItem["action"] = mode === "update-draft" ? "update" : "create";
    if (mode === "create-draft" && existingExternal) { action = "duplicate"; warnings.push("This externalId already exists; the existing Guide will not be overwritten."); }
    else if (mode === "create-draft" && existingSlug) errors.push("The slug already belongs to an existing static or CMS Guide.");
    if (mode === "update-draft") {
      existing = existingExternal || null;
      if (!existing) errors.push("update-draft requires an existing Guide with the same externalId.");
      else {
        if (existing.status !== "draft") errors.push("Bulk import can update Draft Guides only; Published and Unpublished Guides are protected.");
        if (!record.updatedAt) errors.push("update-draft requires the current updatedAt revision token.");
        else if (record.updatedAt !== existing.updatedAt) errors.push("The update token is stale; validate again against the latest Draft.");
        if (record.slug !== existing.slug) errors.push("Bulk update cannot change an existing Guide slug.");
      }
    }
    const mediaErrors = mediaIssues(record, editorData.media);
    errors.push(...mediaErrors);
    if (!record.media?.heroImage) warnings.push("No hero image is supplied. Draft import may continue, but publication will remain blocked until a hero and alt text are added.");
    if (verificationStatus(record) === "unresolved-safety") warnings.push("Safety-critical information remains unresolved and will block publication.");
    errors.push(...validateForDraft({ ...normalizeManagedGuideFields(record), slug: record.slug, title: record.title, guideType: record.guideType as GuideType }));
    if (errors.length) action = "blocked";
    return { externalId: record.externalId || "", slug: record.slug, title: record.title, action, valid: errors.length === 0, warnings: [...new Set(warnings)], errors: [...new Set(errors)], unresolved: record.verification?.unresolved || [], existingMatch: existing ? { id: identity(existing), slug: existing.slug, status: existing.status, updatedAt: existing.updatedAt } : null, mediaStatus: mediaErrors.length ? "invalid" : record.media?.heroImage ? "valid" : "missing-hero", verificationStatus: verificationStatus(record) };
  });
  const token = crypto.randomUUID();
  const createdAt = nowIso();
  const plan: StoredPlan = { planToken: token, contract: guideDraftContractName, version: guideDraftContractVersion, mode, createdAt, expiresAt: new Date(Date.now() + planLifetimeMs).toISOString(), summary: planSummary(items), items, records: envelope.guides, fingerprint: fingerprint(guides, editorData.media), source: input.source === "skill-import" ? "skill-import" : "bulk-import" };
  plans.set(token, plan);
  return { planToken: plan.planToken, contract: plan.contract, version: plan.version, mode: plan.mode, createdAt: plan.createdAt, expiresAt: plan.expiresAt, summary: plan.summary, items: plan.items };
}

function cruisingAreaSlug(record: GuideDraftContractRecord, records: GuideDraftContractRecord[]) {
  const explicit = record.region?.parentGuideSlug || record.parentGuideSlug;
  if (explicit) return explicit;
  if (record.guideType === "Cruising Area") return "";
  const regionKey = record.region?.key || "";
  return records.find((candidate) =>
    candidate.guideType === "Cruising Area"
    && candidate.region?.key === regionKey
  )?.slug || "";
}

function importedGuide(
  record: GuideDraftContractRecord,
  current: EditableGuide | null,
  guides: EditableGuide[],
  records: GuideDraftContractRecord[],
  recordIndex: number,
) {
  const managed = normalizeManagedGuideFields(record);
  const regionKey = record.region?.key || "";
  const stamp = nextTimestamp(current?.updatedAt);
  const parentGuideSlug = cruisingAreaSlug(record, records);
  const canonicalPath = record.guideType === "Cruising Area" && record.slug === regionKey
    ? `/guides/${regionKey}`
    : publicPath(record.slug, regionKey);
  const adapted = adaptManagedGuideForRenderer({ ...(current || {}), ...managed, externalId: record.externalId, slug: record.slug, title: record.title, guideType: record.guideType as GuideType, regionKey, regionName: record.region?.name || "", subregion: record.region?.area || record.area || "", area: record.region?.area || record.area, parentGuideId: record.region?.parentGuideId || record.parentGuideId, parentGuideSlug, editorialOrder: current?.editorialOrder ?? recordIndex, canonicalPath });
  return normalizeStoredGuide({ ...(current || {}), ...adapted, id: current?.id || makeId("guide"), internalId: current?.internalId || nextInternalId(guides), externalId: record.externalId, slug: record.slug, title: record.title, status: "draft", noindex: true, showOnHomepage: false, homepageOrder: 0, canonicalPath, imageUrl: adapted.imageUrl || "", imageAlt: adapted.imageAlt || "", updatedAt: stamp, publication: { createdAt: current?.publication?.createdAt || stamp, updatedAt: stamp, publishedAt: null, scheduledAt: null }, seo: { ...adapted.seo, noindex: true } }, current ? guides.indexOf(current) : guides.length);
}

export async function confirmGuideImport(planToken: string, actor: string) {
  const plan = plans.get(planToken);
  if (!plan || Date.parse(plan.expiresAt) < Date.now()) throw new GuideManagementError("This import plan is missing or expired. Run Validate / Dry Run again.", 409);
  if (plan.items.some((item) => !item.valid)) throw new GuideManagementError("The batch contains blocking validation errors. Nothing was imported.");
  const imported: EditableGuide[] = [];
  await updateLocalEditorStore((store) => {
    let guides = mergeLocalGuidesWithStatic(store.guides);
    if (fingerprint(guides, store.media) !== plan.fingerprint) throw new GuideManagementError("The Guide or media store changed after this dry run. No records were written; validate again.", 409);
    let storedGuides = [...store.guides];
    const revisions: GuideRevision[] = [];
    for (const [index, record] of plan.records.entries()) {
      const item = plan.items[index];
      if (item.action === "duplicate") continue;
      const current = plan.mode === "update-draft" ? guides.find((guide) => guide.externalId === record.externalId) || null : null;
      if (plan.mode === "update-draft" && (!current || current.status !== "draft" || current.updatedAt !== record.updatedAt)) throw new GuideManagementError("An update target changed after validation. Nothing was imported.", 409);
      if (plan.mode === "create-draft" && guides.some((guide) => guide.externalId === record.externalId || guide.slug === record.slug)) throw new GuideManagementError("A create target now conflicts with an existing Guide. Nothing was imported.", 409);
      const next = importedGuide(record, current, guides, plan.records, index);
      revisions.push({ id: makeId("guide-revision"), guideId: identity(next), snapshot: current || next, actor: actor || "Bridge editor", reason: `Bulk Draft import ${current ? "update" : "create"} (${record.externalId}; plan ${plan.planToken})`, source: plan.source, createdAt: nowIso() });
      storedGuides = [next, ...storedGuides.filter((guide) => current ? identity(guide) !== identity(current) : guide.slug !== next.slug)];
      guides = [next, ...guides.filter((guide) => current ? identity(guide) !== identity(current) : guide.slug !== next.slug)];
      imported.push(next);
    }
    return { ...store, guides: storedGuides, guideRevisions: [...revisions, ...store.guideRevisions] } as LocalEditorStore;
  });
  plans.delete(planToken);
  return { ok: true, imported, skippedDuplicates: plan.items.filter((item) => item.action === "duplicate").length, summary: plan.summary };
}
