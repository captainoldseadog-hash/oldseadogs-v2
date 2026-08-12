import { GUIDE_TYPES } from "../content/flagship-guides.ts";
import { adaptManagedGuideForRenderer, type ManagedGuideInput } from "./guide-renderer-adapter.ts";
import {
  guideMinimumWordCount,
  guideWordCount,
  makeId,
  mergeLocalGuidesWithStatic,
  normalizeStoredGuide,
  updateLocalEditorStore,
  type EditableGuide,
  type GuideRevision,
  type LocalEditorStore,
  type MediaAsset,
} from "./site-content.ts";

export type GuideRevisionSource = GuideRevision["source"];

export class GuideManagementError extends Error {
  readonly status: number;
  readonly issues: string[];

  constructor(message: string, status = 400, issues: string[] = [message]) {
    super(message);
    this.name = "GuideManagementError";
    this.status = status;
    this.issues = issues;
  }
}

export class GuideConflictError extends GuideManagementError {
  constructor() {
    super("This Guide changed after you loaded it. Reload and compare the latest version before saving.", 409);
    this.name = "GuideConflictError";
  }
}

function nowIso() {
  return new Date().toISOString();
}

function nextTimestamp(current?: string) {
  const now = Date.now();
  const previous = current ? Date.parse(current) : Number.NaN;
  return new Date(Number.isFinite(previous) && previous >= now ? previous + 1 : now).toISOString();
}

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function guideIdentity(guide: Pick<EditableGuide, "id" | "internalId" | "slug">) {
  return guide.id || guide.internalId || guide.slug;
}

function sameGuide(left: Pick<EditableGuide, "id" | "internalId" | "slug">, right: Pick<EditableGuide, "id" | "internalId" | "slug">) {
  return Boolean(left.id && right.id && left.id === right.id)
    || Boolean(left.internalId && right.internalId && left.internalId === right.internalId)
    || left.slug === right.slug;
}

function findGuide(guides: EditableGuide[], id: string) {
  return guides.find((guide) => guide.id === id || guide.internalId === id || guide.slug === id) || null;
}

function assertCurrentVersion(current: EditableGuide, expectedUpdatedAt?: string) {
  if (expectedUpdatedAt !== undefined && current.updatedAt !== expectedUpdatedAt) throw new GuideConflictError();
}

function nextInternalId(guides: EditableGuide[]) {
  const highest = guides.reduce((value, guide) => {
    const match = guide.internalId.match(/^OSD-G(\d+)$/i);
    return match ? Math.max(value, Number(match[1])) : value;
  }, 0);
  return `OSD-G${String(highest + 1).padStart(3, "0")}`;
}

function publicPath(guide: Pick<EditableGuide, "slug" | "regionKey">) {
  return guide.regionKey ? `/guides/${guide.regionKey}/${guide.slug}` : `/guides/${guide.slug}`;
}

function upsertStoredGuide(store: LocalEditorStore, current: EditableGuide | null, next: EditableGuide) {
  return [next, ...store.guides.filter((guide) => current ? !sameGuide(guide, current) : guide.slug !== next.slug)];
}

function revision(snapshot: EditableGuide, actor: string, reason: string, source: GuideRevisionSource): GuideRevision {
  return {
    id: makeId("guide-revision"),
    guideId: guideIdentity(snapshot),
    snapshot,
    actor: actor.trim() || "Bridge editor",
    reason: reason.trim() || "Guide edit",
    source,
    createdAt: nowIso(),
  };
}

function mediaIds(guide: EditableGuide) {
  const values = [
    guide.featuredMediaId,
    guide.imageUrl,
    ...guide.inlineImages.flatMap((image) => [image.mediaId, image.url]),
    ...(guide.media?.gallery || []).flatMap((image) => [image.mediaId || "", image.url]),
  ];
  return [...new Set(values.flatMap((value) => {
    const match = String(value || "").match(/^\/api\/media\/([^/?#]+)/);
    return match ? [match[1]] : value && !String(value).includes("/") ? [String(value)] : [];
  }))];
}

function validateMediaReferences(guide: EditableGuide, media: MediaAsset[]) {
  const available = new Set(media.map((asset) => asset.id));
  return mediaIds(guide).filter((id) => !available.has(id)).map((id) => `Guide media ${id} does not exist in the media library.`);
}

function contentForComparison(guide: EditableGuide) {
  const rest = { ...guide };
  delete (rest as Partial<EditableGuide>).updatedAt;
  const publication = guide.publication;
  delete (rest as Partial<EditableGuide>).publication;
  return JSON.stringify({ ...rest, publication: publication ? { ...publication, updatedAt: undefined } : undefined });
}

function mergeManagedInput(base: EditableGuide | null, input: ManagedGuideInput): ManagedGuideInput {
  if (!base) return input;
  return {
    ...base,
    ...input,
    editorial: input.editorial ? { ...base.editorial, ...input.editorial } : base.editorial,
    navigation: input.navigation ? { ...base.navigation, ...input.navigation } : base.navigation,
    marina: input.marina ? { ...base.marina, ...input.marina } : base.marina,
    contacts: input.contacts ? { ...base.contacts, ...input.contacts } : base.contacts,
    media: input.media ? { ...base.media, ...input.media } : base.media,
    seo: input.seo ? { ...base.seo, ...input.seo } : base.seo,
    publication: input.publication ? { ...base.publication, ...input.publication } : base.publication,
    verification: input.verification ? { ...base.verification, ...input.verification } : base.verification,
  };
}

export function validateForDraft(input: ManagedGuideInput) {
  const issues: string[] = [];
  const slug = makeSlug(String(input.slug || input.title || ""));
  if (!slug) issues.push("A Guide title or slug is required.");
  if (input.slug && input.slug !== slug) issues.push("The Guide slug must contain only lowercase letters, numbers and hyphens.");
  if (input.guideType && !GUIDE_TYPES.includes(input.guideType)) issues.push("Choose a recognised Guide type.");
  if (input.navigation?.latitude !== undefined && (input.navigation.latitude < -90 || input.navigation.latitude > 90)) issues.push("Latitude must be between -90 and 90.");
  if (input.navigation?.longitude !== undefined && (input.navigation.longitude < -180 || input.navigation.longitude > 180)) issues.push("Longitude must be between -180 and 180.");
  return issues;
}

export function validateForPublish(
  guide: EditableGuide,
  options: { media?: MediaAsset[]; approvedCanonicalPath?: string } = {},
) {
  const issues = validateForDraft(guide);
  if (!guide.title.trim()) issues.push("A title is required before publication.");
  if (!guide.regionKey || !guide.regionName) issues.push("A region is required before publication.");
  if (!guide.introduction.trim() || guide.sections.length === 0) issues.push("An introduction and at least one body section are required before publication.");
  if (guideWordCount(guide) < guideMinimumWordCount(guide)) issues.push(`This Guide needs at least ${guideMinimumWordCount(guide)} useful words before publication.`);
  if (!guide.imageUrl || !guide.imageAlt.trim()) issues.push("A Guide hero image and alt text are required before publication.");
  const selfCanonical = publicPath(guide);
  if (!guide.canonicalPath.startsWith("/guides/")) issues.push("The canonical path must be an internal /guides/ path.");
  if (guide.canonicalPath !== selfCanonical && guide.canonicalPath !== options.approvedCanonicalPath) {
    issues.push("The canonical path must be self-referencing unless an existing intentional canonical is retained.");
  }
  if (guide.verification?.unresolved?.some((issue) => issue.severity === "safety")) {
    issues.push("Resolve all safety-critical navigation uncertainties before publication.");
  }
  if (options.media) issues.push(...validateMediaReferences(guide, options.media));
  return [...new Set(issues)];
}

function throwIssues(issues: string[]) {
  if (issues.length) throw new GuideManagementError(issues.join(" "), 400, issues);
}

function ensureUniqueSlug(guides: EditableGuide[], slug: string, current: EditableGuide | null = null) {
  const duplicate = guides.find((guide) => guide.slug === slug && (!current || !sameGuide(guide, current)));
  if (duplicate) throw new GuideManagementError(`The Guide slug ${slug} is already in use.`, 409);
}

function uniqueDuplicateSlug(guides: EditableGuide[], requested: string) {
  const base = makeSlug(requested) || "guide-copy";
  const used = new Set(guides.map((guide) => guide.slug));
  if (!used.has(base)) return base;
  let number = 2;
  while (used.has(`${base}-${number}`)) number += 1;
  return `${base}-${number}`;
}

export async function saveDraft(input: ManagedGuideInput, actor: string, expectedUpdatedAt?: string) {
  throwIssues(validateForDraft(input));
  let saved: EditableGuide | null = null;
  await updateLocalEditorStore((store) => {
    const guides = mergeLocalGuidesWithStatic(store.guides);
    const current = findGuide(guides, String(input.id || input.internalId || input.slug || ""));
    if (current) assertCurrentVersion(current, expectedUpdatedAt);
    if (current?.status === "published") {
      throw new GuideManagementError("Unpublish this Guide before editing it as a Draft.", 409);
    }
    const slug = makeSlug(String(input.slug || input.title || current?.slug || ""));
    ensureUniqueSlug(guides, slug, current);
    if (current && slug !== current.slug && (current.status === "unpublished" || Boolean(current.publication?.publishedAt))) {
      throw new GuideManagementError("A Guide that has been published cannot change slug in the normal CMS workflow.", 409);
    }
    const stamp = nextTimestamp(current?.updatedAt);
    const adapted = adaptManagedGuideForRenderer({ ...mergeManagedInput(current, input), slug });
    const selfCanonical = publicPath({ slug, regionKey: String(adapted.regionKey || "") });
    const currentSelfCanonical = current ? publicPath(current) : "";
    const proposedCanonical = !adapted.canonicalPath || adapted.canonicalPath === "/guides/untitled-guide" || adapted.canonicalPath === currentSelfCanonical
      ? selfCanonical
      : adapted.canonicalPath;
    if (proposedCanonical !== selfCanonical && proposedCanonical !== current?.canonicalPath) {
      throw new GuideManagementError("A new canonical must be the Guide's self-referencing public path.", 400);
    }
    const next = normalizeStoredGuide({
      ...(current || {}),
      ...adapted,
      schemaVersion: adapted.schemaVersion || current?.schemaVersion || 2,
      id: current?.id || adapted.id || makeId("guide"),
      internalId: current?.internalId || adapted.internalId || nextInternalId(guides),
      slug,
      status: "draft",
      noindex: current ? Boolean(adapted.noindex) : true,
      showOnHomepage: current?.showOnHomepage ?? false,
      homepageOrder: current?.homepageOrder ?? 0,
      canonicalPath: proposedCanonical,
      updatedAt: stamp,
      publication: {
        ...current?.publication,
        ...adapted.publication,
        createdAt: current?.publication?.createdAt || adapted.publication?.createdAt || stamp,
        updatedAt: stamp,
        publishedAt: current?.publication?.publishedAt || null,
        scheduledAt: null,
      },
    }, current ? guides.indexOf(current) : guides.length);
    const changed = current && contentForComparison(current) !== contentForComparison(next);
    saved = next;
    return {
      ...store,
      guides: upsertStoredGuide(store, current, next),
      guideRevisions: changed
        ? [revision(current, actor, "Material CMS Draft edit", "cms"), ...store.guideRevisions]
        : store.guideRevisions,
    };
  });
  if (!saved) throw new GuideManagementError("The Guide Draft could not be saved.", 500);
  return saved;
}

export async function duplicate(sourceId: string, overrides: ManagedGuideInput, actor: string) {
  void actor;
  let saved: EditableGuide | null = null;
  await updateLocalEditorStore((store) => {
    const guides = mergeLocalGuidesWithStatic(store.guides);
    const source = findGuide(guides, sourceId);
    if (!source) throw new GuideManagementError("The Guide to duplicate could not be found.", 404);
    const slug = uniqueDuplicateSlug(guides, String(overrides.slug || `${source.slug}-copy`));
    const stamp = nextTimestamp();
    const adapted = adaptManagedGuideForRenderer({ ...mergeManagedInput(source, overrides), slug });
    throwIssues(validateForDraft(adapted));
    const next = normalizeStoredGuide({
      ...adapted,
      schemaVersion: adapted.schemaVersion || 2,
      id: makeId("guide"),
      internalId: nextInternalId(guides),
      slug,
      title: overrides.title || `${source.title} — copy`,
      status: "draft",
      noindex: true,
      showOnHomepage: false,
      homepageOrder: 0,
      canonicalPath: publicPath({ slug, regionKey: String(adapted.regionKey || source.regionKey) }),
      updatedAt: stamp,
      publication: { createdAt: stamp, updatedAt: stamp, publishedAt: null, scheduledAt: null },
    }, guides.length);
    saved = next;
    return { ...store, guides: [next, ...store.guides] };
  });
  if (!saved) throw new GuideManagementError("The Guide duplicate could not be saved.", 500);
  return saved;
}

export async function publish(id: string, actor: string, expectedUpdatedAt?: string) {
  let saved: EditableGuide | null = null;
  await updateLocalEditorStore((store) => {
    const guides = mergeLocalGuidesWithStatic(store.guides);
    const current = findGuide(guides, id);
    if (!current) throw new GuideManagementError("The Guide to publish could not be found.", 404);
    assertCurrentVersion(current, expectedUpdatedAt);
    ensureUniqueSlug(guides, current.slug, current);
    throwIssues(validateForPublish(current, { media: store.media, approvedCanonicalPath: current.canonicalPath }));
    const stamp = nextTimestamp(current.updatedAt);
    const next = normalizeStoredGuide({
      ...current,
      status: "published",
      updatedAt: stamp,
      publication: {
        ...current.publication,
        createdAt: current.publication?.createdAt || stamp,
        updatedAt: stamp,
        publishedAt: current.publication?.publishedAt || stamp,
        scheduledAt: null,
      },
    });
    saved = next;
    return {
      ...store,
      guides: upsertStoredGuide(store, current, next),
      guideRevisions: [revision(current, actor, "Guide published", "cms"), ...store.guideRevisions],
    };
  });
  if (!saved) throw new GuideManagementError("The Guide could not be published.", 500);
  return saved;
}

export async function unpublish(id: string, actor: string, expectedUpdatedAt?: string) {
  let saved: EditableGuide | null = null;
  await updateLocalEditorStore((store) => {
    const guides = mergeLocalGuidesWithStatic(store.guides);
    const current = findGuide(guides, id);
    if (!current) throw new GuideManagementError("The Guide to unpublish could not be found.", 404);
    assertCurrentVersion(current, expectedUpdatedAt);
    const stamp = nextTimestamp(current.updatedAt);
    const next = normalizeStoredGuide({
      ...current,
      status: "unpublished",
      noindex: true,
      updatedAt: stamp,
      publication: {
        ...current.publication,
        createdAt: current.publication?.createdAt || stamp,
        updatedAt: stamp,
        publishedAt: current.publication?.publishedAt || null,
        scheduledAt: null,
      },
    });
    saved = next;
    return {
      ...store,
      guides: upsertStoredGuide(store, current, next),
      guideRevisions: [revision(current, actor, "Guide unpublished", "cms"), ...store.guideRevisions],
    };
  });
  if (!saved) throw new GuideManagementError("The Guide could not be unpublished.", 500);
  return saved;
}
