# CMS-managed Guides and Marinas: read-only architecture audit

Date: 12 August 2026

Checkout audited: production-matching checkout at commit `1bdaa6b059a20362eaf7f8f48a01324361613157`

Scope: architecture and implementation plan only; no application code, production data, media, deployment configuration or production services were changed.

## Executive recommendation

Extend the existing Guide capability inside The Helm as an additive module. Keep the existing editor authentication, `editor-store.json`, locked atomic write transaction, media library, dynamic Guide routes, sitemap filter and `GuidePublicContent` renderer. Do not create a second Guide renderer, migrate the current Guide library, replace the CMS, or move Guides into the story editor.

The safest implementation boundary is a small Guide-management service between the existing editor API and `lib/site-content.ts`. It should provide explicit operations for save Draft, duplicate, publish, unpublish and bulk Draft import. All operations must use the existing store transaction. A versioned import contract should be mapped into the existing `EditableGuide` shape and its `quickFacts`/`sections` renderer inputs. Existing static and stored records should continue through the current fallback-first normalizer without a mandatory migration.

After this feature is deployed once, every later Guide should be a normal content operation:

`Research -> structured Draft -> CMS preview/edit -> explicit Publish -> public SSR route + sitemap`

No Guide-specific code commit, build, SSH session, release archive, symlink change or PM2 restart should be needed.

## 1. Current CMS architecture

### Entry points and access control

- `app/editor/page.tsx` opens the dashboard through `BridgeCms` inside `EditorGate`.
- `app/editor/[section]/page.tsx` provides section routes including `/editor/guides`, stories, homepage, media, imports, audit, backups and settings.
- `app/editor/EditorGate.tsx` and `lib/editor-auth.ts` protect the editor using request-header identity and the configured staging access mechanism.
- Editor pages and API responses are private/noindex. The Guide preview additionally checks editor authorization server-side.
- `app/editor/BridgeCms.tsx` is the active client CMS shell. It defines navigation, data-loading helpers and section components. It already dispatches the `guides` section to `GuidesPage`.
- `app/editor/EditorDashboard.tsx` is an older/classic editor surface. It should not be replaced or coupled to the Guide work.

### Editor API

`app/api/editor/route.ts` is an authenticated multiplexed CMS endpoint:

- `GET /api/editor?view=guides` calls `getAllGuides()`, returns compact Guide records and reports total, published, homepage, indexed and thin counts.
- `POST /api/editor` with `action: "saveGuide"` calls `saveGuide()`.
- The same route supports the protected story, media-adjacent, homepage, press-release, email/import and other newsroom operations.
- Responses use the editor's private response helpers. New Guide actions should retain those headers and the same `canEditSite` authorization boundary.

### Story editor architecture — protected

Stories have a substantially richer publication subsystem than Guides. The CMS uses shared story modules such as `lib/editor-publication.js`, `lib/story-media-composer.js`, `lib/media-rights.ts`, `lib/editorial-quality.ts` and `lib/story-schedule-time.ts`. Stories support Draft, Scheduled, Published and Unpublished states, scheduling, status history, revisions and restoration, editorial validation, duplicate controls and publication overrides.

The Guide feature should not refactor or generalise this story stack during its first implementation. Reuse only already-safe infrastructure boundaries: editor authentication, media APIs, sanitizers and the editor-store transaction. Any later shared publication abstraction should be a separate, test-led project.

### Homepage Manager — protected

The Homepage Manager lives in `BridgeCms` and persists through dedicated homepage settings actions. Generic settings writes reject homepage keys; lead story, latest stories, Editor's Choice, hidden stories and Guide homepage visibility are deliberately isolated. The Guide project must not route publication through homepage settings or change homepage selection logic. A published Guide should not automatically become a homepage Guide.

### Persistence and concurrency

`lib/site-content.ts` defines a version-1 `LocalEditorStore` containing stories, Guides, media, gallery data, imports, adverts, settings, social events, press releases, publication overrides and story revisions. In the production runtime, `OLDSEADOGS_DATA_DIR` points outside the release tree; the operational source of truth is `/var/www/oldseadogs-data/editor-store.json`, with media under the same external data directory.

Important safety properties already present:

- Production fails closed if the store is missing or unreadable; it does not silently create an empty replacement.
- Reads are cached against an inode/size/mtime signature.
- Writes are serialized by an in-process promise queue.
- A cross-process directory lock protects the full read-modify-write transaction and includes owner identity and stale-lock recovery.
- The new JSON is written to a temporary file, parsed and checked, then atomically renamed over the store.

Every Guide mutation, including bulk import, duplicate and status transition, must enter through this one transaction. No Guide endpoint should read the store, release the lock, then write a separately assembled copy.

### Backup behaviour

`scripts/oldseadogs-ops.mjs` and `BACKUP_RUNBOOK.md` cover the external store and media tree. A backup is timestamped, refuses overwrite, has a SHA-256 manifest and can be verified/restored. It includes the complete `editor-store.json`, `guide-content.json`, `homepage-guide-visibility.json` and the media originals/web/thumbnail tree. Current Guide records are therefore already covered.

The Guide module does not need a new backup system. Before the one-time feature release, the existing `backup:create` and `backup:verify` process remains mandatory. Any future destructive Guide bulk operation should require a verified backup; the proposed importer is create/update Draft only and must not delete records.

## 2. Protected functionality

The implementation must preserve, with regression coverage, all of the following:

- story creation, editing, publication, scheduling, revisions and rollback;
- Homepage Manager, lead, latest and Editor's Choice selections and duplicate-card prevention;
- story media composition, upload, lookup and rights checks;
- press-release, email, scrape/import and duplicate-prevention workflows;
- existing story and Guide public rendering;
- current Guide URLs, artwork, region pages, Guide library and homepage Guide visibility;
- consent behaviour and GA4 measurement ID `G-88HT8MHR7T`;
- existing robots, canonical and sitemap/indexability behaviour;
- production editor-store and production media;
- backup, release, PM2 and deployment machinery.

No part of this proposal requires replacing the CMS or editing production data directly.

## 3. Existing Guide architecture

### Sources and merge behaviour

Guide inputs are assembled in `lib/site-content.ts` as:

1. `content/guide-product-seeds.ts` — structured OSD-G product records;
2. `content/solent-marina-guides.ts` — typed Solent marina records transformed into Guide seeds;
3. `content/flagship-guides.ts` — legacy Guide records;
4. `store.guides` — CMS-managed records in the external editor store.

`mergeLocalGuidesWithStatic()` normalizes both forms. A local record with the same slug overrides its static seed; static records without an override remain available; new local records are appended. `normalizeStoredGuide()` is fallback-first, so absent optional fields are populated from a matching seed or safe defaults. This is the backward-compatible seam to retain.

The current `saveGuide()` validates input, creates a slug and next `OSD-G###` identifier, normalizes the record, enforces a publication word-count threshold, preserves homepage visibility/order and writes through the locked store transaction. It currently permits status to be submitted as part of the same save request; separating Draft saving from publication is recommended below.

### Current record shape

`EditableGuide` extends `FlagshipGuide`. It currently includes:

- identity and hierarchy: `internalId`, `slug`, `title`, `eyebrow`, `guideType`, `regionKey`, `regionName`, `subregion`, `parentGuideSlug`, `editorialOrder`;
- editorial: `summary`, `introduction`, `sections`, `quickFacts`, `checklist`, author and contributor fields;
- location: latitude, longitude, zoom, What3Words and OS grid reference;
- media: hero URL/alt/focal point/caption/credit, `featuredMediaId`, ordered inline images with section/paragraph placement;
- relationships: related, Cruise On, previous and next Guide slugs;
- verification: source links, verified facilities, verification notes, research/accuracy/source notes and review date;
- publication/SEO: `draft | published | unpublished`, `updatedAt`, `noindex`, homepage settings, SEO/social titles and descriptions, canonical path and tags.

Missing or under-modelled items for the requested workflow are `createdAt`, `publishedAt`, `scheduledAt`, Guide revisions/audit entries, explicit transition operations, a stable import-contract version, structured navigation facts, structured marina facilities, search/filter, duplicate and bulk Draft import. The current Guide media picker is also narrower than the story picker.

### Current Guide CMS

`GuidesPage` and `GuideEditor` already provide a valuable base:

- a Guide list with status, type, region, author, modification date, order and word count;
- create Marina, Harbour, Cruising Area or another Guide type;
- edit identity, hierarchy, body, quick facts, relationships, coordinates, SEO, sources and internal notes;
- choose a featured or inline item from the media data returned to the CMS;
- position, reorder, replace or remove inline images;
- save Draft, Preview, Publish Now, Unpublish and open a live Guide.

Gaps: list search/filter, duplicate, first-class upload from the Guide editor, robust structured marina fields, bulk import, revisions/audit trail, explicit publish validation/transition and server-owned publication timestamps. Guide scheduling does not currently exist.

## 4. Exact recommended additive design

### Service boundary

Add a narrow `GuideManagementService` (name illustrative) with these operations:

- `saveDraft(input, actor, expectedUpdatedAt?)`
- `duplicate(sourceId, overrides, actor)`
- `publish(id, actor, expectedUpdatedAt?)`
- `unpublish(id, actor, expectedUpdatedAt?)`
- `importDrafts(envelope, actor, mode)`
- `validateForDraft(input)` and `validateForPublish(record)`

The service should call existing site-content repository functions, and those repository functions must continue to use `updateLocalEditorStore()` for every mutation. Keep the current `saveGuide()` API temporarily for compatibility, but route the new UI through explicit operations. This prevents a form edit from publishing merely because a `status` value was carried in its payload.

Use optimistic concurrency in addition to the existing file lock: the UI sends the `updatedAt` it loaded, and a stale edit receives HTTP 409 with a reload/compare message. The file lock prevents corrupted writes; the version check prevents one editor from silently overwriting another editor's valid newer content.

### Publication rules

- New and duplicated Guides always start as `draft`, `noindex: true`, `publishedAt: null`, `scheduledAt: null`, `showOnHomepage: false`.
- Draft save validates shape and sanitizes content but does not require every publication field.
- Publish reloads the record inside the lock, validates the complete record, sets `status: published`, preserves an explicit `noindex`, sets `publishedAt` on first publication and updates `updatedAt` server-side.
- Unpublish sets `status: unpublished`, forces it out of public reads and sitemap results, retains `publishedAt` as history, and sets `noindex: true` for its next edit cycle.
- Slugs are unique across static and stored Guides. Changing a published slug should be a separate future migration/redirect operation, not an ordinary edit.
- `scheduledAt` should be nullable and reserved in the schema. Do not connect it to the story scheduler in phase one. If Guide scheduling is later requested, implement and test it as a separate Guide scheduler operation.
- Publication should fail on unresolved critical validation: missing title/slug/type/region, no meaningful introduction/sections, missing hero alt/credit policy, invalid canonical, broken media reference, duplicate slug, or unacknowledged navigation-safety uncertainty.
- A warning may be published only with an explicit editor acknowledgement stored in the audit/revision entry; the system must never infer depths, tides, coordinates, VHF channels or hazards.

### Revisions and audit

Add optional `guideRevisions` records to the store rather than reusing `storyRevisions`. Snapshot before publish, unpublish and material edits; record actor, reason, source (`cms`, `skill-import`, `bulk-import`) and timestamp. Adding this array should be backward compatible because older stores are normalized to an empty array. Do not alter story revision semantics.

## 5. Proposed backward-compatible Guide schema

Persist existing fields unchanged and add optional structured fields. The public adapter should continue to emit the exact `EditableGuide` inputs consumed by `GuidePublicContent`.

```ts
type ManagedGuide = EditableGuide & {
  schemaVersion?: 2;
  id?: string;                    // stable UUID; internalId remains supported
  status: "draft" | "published" | "unpublished";
  area?: string;
  parentGuideId?: string;

  editorial?: {
    standfirst?: string;
    introduction?: string;
    sections?: Array<{ id?: string; heading: string; body: string[] }>;
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
    fuel?: FacilityValue;
    water?: FacilityValue;
    electricity?: FacilityValue;
    showers?: FacilityValue;
    toilets?: FacilityValue;
    laundry?: FacilityValue;
    wifi?: FacilityValue;
    repairs?: FacilityValue;
    chandlery?: FacilityValue;
    craneOrLift?: FacilityValue;
    restaurants?: FacilityValue;
    bars?: FacilityValue;
    shops?: FacilityValue;
    transport?: FacilityValue;
  };

  contacts?: {
    officialWebsite?: string;
    telephone?: string;
    email?: string;
    harbourMasterOffice?: string;
  };

  media?: {
    heroImage?: { mediaId?: string; url: string; alt: string; caption?: string; credit?: string; focalPoint?: string };
    gallery?: Array<{ mediaId?: string; url: string; alt: string; caption?: string; credit?: string; order?: number }>;
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
    sources?: Array<{ label: string; url: string; accessedAt?: string; supports?: string[] }>;
    notes?: string;
    verifiedAt?: string;
    unresolved?: Array<{ field: string; reason: string; severity: "editorial" | "safety" }>;
  };
};

type FacilityValue = {
  available?: true | false | "unknown";
  detail?: string;
  sourceUrl?: string;
  verifiedAt?: string;
};
```

All nested fields are optional. Preserve the current top-level fields as the renderer-facing compatibility layer. On import/save, map structured values deterministically into `quickFacts`, `verifiedFacilities`, `sections`, `sourceLinks`, `location`, hero fields and existing SEO fields. Existing records without `schemaVersion` or nested blocks continue to normalize exactly as they do now. Do not rewrite every stored record merely by loading the editor.

The stable identity should ultimately be `id`; retain `internalId` and slug for all current records and derive a stable ID for legacy display only until each record is next deliberately saved. Relations should accept IDs in the management model but keep slug arrays populated for the current renderer.

## 6. CMS UI design

Keep `/editor/guides` in The Helm and extract the existing Guide UI into Guide-owned components so story code is not disturbed.

### Guide list

- text search across title, slug, internal ID, region and area;
- filters for status, type, region, noindex, unresolved verification and missing media;
- columns/cards for title, type, region, status, updated date and verification state;
- actions: Edit, Duplicate, Preview; Publish/Unpublish remain deliberate editor actions inside the record;
- Create Guide opens as Draft and never publishes.

### Guide editor

Organise the existing controls into Identity, Editorial, Navigation & safety, Marina facilities, Contacts, Media, Relationships, SEO, Sources & verification, and Publication. Show only type-relevant optional panels without deleting hidden data.

Use the existing Guide body/section model and exact-placement inline image controls. Add a thin Guide adapter around the established media picker/upload APIs rather than modifying story media composition. Require alt text; retain caption, credit, focal point and media ID. Surface rights/provenance metadata before publication.

The action bar should be unambiguous:

- Save Draft
- Preview (private, same renderer)
- Publish (opens validation summary and requires confirmation)
- Unpublish
- Duplicate as Draft

Do not combine Save and Publish in one generic status dropdown. Do not make homepage placement part of publication.

## 7. Public rendering strategy: preserve the approved template

### Single renderer

Both public Guide routes and `/editor/preview/guide/[slug]` already render `components/GuidePublicContent.tsx`. That must remain the only Guide-detail renderer. A CMS record should be normalized/adapted before it reaches the component; the component should not know whether data came from a static seed, one-record import, CSV import or manual CMS editing.

### Exact presentation ownership

- Hero: `GuidePublicContent` and `.guide-product-hero*` styles in `app/globals.css`; full-width image, configured focal point, eager/high-priority hero loading, caption/credit, eyebrow, `h1` and standfirst.
- Heading hierarchy and typography: `GuidePublicContent` semantic section `h2`s and the existing `.guide-*`, article shell and typography rules in `app/globals.css`.
- Breadcrumbs: `GuideBreadcrumbs`, plus route-provided breadcrumb JSON-LD.
- “In This Guide”: `GuideSectionNavigation`; desktop navigation is a labelled `<nav>`, mobile uses the existing `<details>` jump control. Anchors are derived from rendered sections and remain crawlable links.
- Information panels and practical information: current quick-fact cards, practical-reference blocks, verification/source panels, warnings and map components in `GuidePublicContent`.
- Images: the current hero and ordered inline-image rendering, including lazy loading for body images and captions/credits.
- Related/onward navigation: existing related cards, Cruise On, previous and next Guide links derived through `lib/guides.ts` relationships.
- Map: `GuideGoogleMap`, activated only when valid coordinates are present.
- Collections: `GuideCollectionBrowser` and region route keep the approved library/region presentation.

There are current slug- and heading-specific presentation branches for Guides including Cowes, Yarmouth, Portsmouth, River Hamble, Beaulieu, Newtown, Southampton Water and Hamble Point. They are a regression risk and should be left untouched in phase one. New generic marina records should use the common renderer structures. A future `presentationProfile` could replace hard-coded branching, but only as a separate visual-parity project.

## 8. SEO and indexing strategy

The current architecture already provides automatic discovery when a stored Guide becomes published:

- Public routes are dynamic/SSR and use `getGuideBySlug()`, which exposes only `published` Guides; Draft and Unpublished return 404 publicly.
- The detail route calls `createPageMetadata()` with the Guide title/description, Guide public path, hero and `record.noindex`.
- In production, eligible Guides receive `index,follow` and Google `max-image-preview:large`.
- `guidePublicPath()` gives the self path unless an existing canonical Guide path is intentionally set.
- `app/sitemap.ts` calls `getIndexedGuides()`, therefore includes only `published && !noindex`; it uses the record's actual `updatedAt` for `lastModified`.
- `app/robots.ts` allows public pages and media while disallowing editor, preview and private API paths. `/api/media` is not disallowed.
- Internal region, section, related, Cruise On and previous/next links are normal crawlable anchors.

No per-Guide SEO registry or source-code edit is needed. The publish service only needs to set valid server timestamps and status atomically. For explicit `noindex`, retain a public HTTP 200 and self canonical but emit `noindex,follow`; this requires calling metadata with the existing follow-when-noindex option for Guide pages, because the current Guide call passes only `noIndex` and therefore produces the stricter nofollow response. That is a small SEO correction to test carefully, not a redesign of global SEO logic.

Current detail structured data is `Article` with an `about: Place` and optional `GeoCoordinates`, plus `BreadcrumbList`. Region/index pages use `ItemList` and breadcrumbs. Add an optional standalone `Place` node only for place-like Guide types (Marina, Harbour, River, Anchorage, Destination) when name and verified location/contact data support it. Include `datePublished` after the new timestamp exists and keep `dateModified` tied to actual `updatedAt`. Never emit invented coordinates, facilities, navigation facts or dates.

## 9. Media and image strategy

Reuse the existing media infrastructure:

- upload endpoints under `app/api/editor/media/`;
- public media delivery at `app/api/media/[id]/route.ts`;
- local media storage/lookup helpers and external media tree;
- existing media records, derivatives, captions, credits and rights/provenance checks.

The Guide editor should select or upload a hero and optional gallery/inline images through a Guide-owned adapter over this system. Do not create a second media store, write generated images into a release directory for routine Guide publishing, or change story image behaviour.

For the future `oldseadogs-guide-publisher` workflow, image generation happens before Draft creation using the approved Old Sea Dogs Guide art brief/reference set. The generated asset is then uploaded through the normal media endpoint with provenance, usage rights, alt text, caption and credit. The returned media ID/URL is placed in the Draft contract. Image generation must not publish the Guide and must not overwrite existing Guide artwork.

## 10. Draft, preview and publish workflow

For “Add Port Hamble Marina”:

1. Research official marina, harbour authority, Notices to Mariners and other authoritative current sources.
2. Record each factual claim's source and access/verification date.
3. Flag absent or conflicting safety/navigation data as unresolved; do not infer it.
4. Write the introduction and sections in the existing Old Sea Dogs Guide voice and structure.
5. Create/select approved-style artwork and upload it through the existing media library.
6. Produce a versioned structured Guide envelope.
7. Import it through the authenticated CMS as Draft only.
8. The editor reviews fields and the exact private preview, which uses `GuidePublicContent`.
9. Publish runs server-side validation and an explicit confirmation, then performs one locked atomic transition.
10. The dynamic route returns HTTP 200 immediately; metadata, internal links and sitemap derive from the stored record automatically.

No action before step 9 can make the Guide public.

## 11. `oldseadogs-guide-publisher` JSON contract

Use a versioned envelope rather than sending raw `EditableGuide`. It separates a stable automation contract from internal renderer fields.

```json
{
  "contract": "oldseadogs.guide-draft",
  "version": 1,
  "mode": "create-draft",
  "guides": [
    {
      "externalId": "port-hamble-marina-2026-08-12",
      "slug": "port-hamble-marina",
      "title": "Port Hamble Marina Guide",
      "guideType": "Marina",
      "region": { "key": "solent", "name": "The Solent", "area": "River Hamble", "parentGuideId": "OSD-G002" },
      "editorial": {
        "standfirst": "...",
        "introduction": "...",
        "sections": [{ "heading": "Approach and arrival", "body": ["..."] }],
        "oldSeaDogsView": ["..."],
        "practicalNotes": ["..."],
        "localKnowledge": ["..."],
        "warnings": []
      },
      "navigation": { "vhfChannel": "80", "approach": ["..."], "hazards": [] },
      "marina": { "visitorBerths": "Confirm availability directly", "fuel": { "available": true, "sourceUrl": "https://example.invalid/official", "verifiedAt": "2026-08-12" } },
      "contacts": { "officialWebsite": "https://example.invalid/official" },
      "media": { "heroImage": { "mediaId": "media-id", "url": "/api/media/media-id", "alt": "...", "caption": "...", "credit": "..." }, "gallery": [] },
      "seo": { "seoTitle": "Port Hamble Marina Guide", "metaDescription": "...", "canonicalSlug": "port-hamble-marina", "noindex": true },
      "verification": {
        "sources": [{ "label": "Official marina", "url": "https://example.invalid/official", "accessedAt": "2026-08-12", "supports": ["contacts", "facilities"] }],
        "verifiedAt": "2026-08-12",
        "unresolved": [{ "field": "navigation.depths", "reason": "No current authoritative value found", "severity": "safety" }]
      }
    }
  ]
}
```

Contract rules:

- The Skill may output one or many items in `guides`; one schema serves both paths.
- `mode` is only `create-draft` or, with explicit user choice, `update-draft`. There is no `publish` mode.
- Unknown fields are rejected for v1 or reported clearly; contract-version mismatches fail without writes.
- URLs, dates, enums, slug format and media references are schema validated.
- `externalId` supplies idempotency: re-import cannot accidentally create duplicates. Updating an existing Draft requires an explicit mode and matching ID/slug.
- Every safety/navigation claim should have source support. Uncertainty belongs in `verification.unresolved`, never in fabricated values.
- The importer returns per-record validation results and IDs/slugs; it must not log private credentials or large embedded image data.
- Images are referenced by an uploaded media ID/URL. Do not place base64 binaries in this JSON.

## 12. Bulk JSON/CSV Draft import

Prefer an authenticated `importGuideDrafts` action on the existing editor API for phase one, which preserves the established authorization/private-response boundary and avoids a second public surface. Accept:

- the JSON envelope above; or
- UTF-8 CSV with a documented fixed header set for simple scalar fields and JSON-encoded columns for sections, facilities, media and sources.

Use a two-stage process:

1. **Validate/dry run:** parse with size and row limits, normalize every row, validate contract and duplicates, resolve media references and return a per-row plan. No write.
2. **Confirm import:** submit the plan token/hash. Inside one locked transaction, re-check conflicts and insert/update only valid Draft records. For large batches, use bounded chunks with one transaction per declared chunk and a clear result ledger.

Safety invariants:

- force `status: draft`, `noindex: true`, `publishedAt: null`, `scheduledAt: null`, `showOnHomepage: false` regardless of input;
- never delete or unpublish existing records;
- default to reject-on-any-error for small batches; optionally allow explicitly selected valid-row import with a result file;
- reject duplicate slugs/internal IDs/external IDs across both static and stored Guides;
- updates apply only to Drafts and require explicit update mode plus the loaded version;
- escape spreadsheet formula prefixes when generating/exporting CSV and cap payload/field lengths;
- create Guide revision/audit entries for imported updates.

## 13. Backward compatibility plan

1. Keep all current static seeds, their order and existing public URLs.
2. Extend normalization with optional fields and safe defaults; do not require a bulk migration.
3. Keep the current flattened `EditableGuide` fields populated so `GuidePublicContent` remains unchanged.
4. Let a stored record continue to override a same-slug static seed exactly as today.
5. Do not persist all merged static records as an incidental side effect of a single new Draft; upsert only the target stored record in the new repository operation while retaining merge-on-read. Preserve current `saveGuide()` behaviour until a dedicated regression test proves the narrower upsert is equivalent.
6. Retain legacy one-segment Guide routes and current canonical paths.
7. Preserve special Guide artwork and slug-specific presentation branches.
8. Introduce schema/revision arrays as optional; older stores normalize to empty/default values.
9. Roll out behind an editor-only feature flag if desired. Public reads need no flag because Drafts are excluded.

## 14. Regression test plan

### Existing suites that must remain green

- `bridge-safety.integration.test.mjs`: editor isolation and protected CMS behaviour.
- `story-scheduling-revisions.integration.test.mjs` and `story-schedule-time.test.mjs`: scheduling, publication and revisions.
- `editor-publication.test.mjs` and `story-body-preservation.integration.test.mjs`: story editing/publication content integrity.
- `editor-store-concurrency.integration.test.mjs`: multi-process store locking and atomicity.
- `cookie-consent-homepage-preservation.test.mjs`, `google-analytics-consent.test.mjs` and `mobile-navigation-consent-performance.test.mjs`: consent, homepage and GA4.
- `future-story-seo.integration.test.mjs`: story routes, sitemap, robots, media crawlability and indexing.
- `media-asset-lookup.test.mjs` and `media-route.integration.test.mjs`: media selection/serving.
- `guides-product.test.mjs`, `guides-product.integration.test.mjs`, `solent-marina-guides.test.mjs`, `marina-guides-release-preservation.test.mjs`, `homepage-guides-release-safety.test.mjs` and `guides-release-package.regression.mjs`: current Guide content, artwork, renderer, navigation and release preservation.
- `backup-recovery.test.mjs`, `public-read-isolation.test.mjs`, `release-pm2-handover.test.mjs` and staging tests: storage, backups, release and public/private separation.

### New Guide-management tests

1. Create Draft: forced Draft/noindex, unique ID/slug, no public route and absent from sitemap.
2. Edit Draft: fields and structured-to-renderer mapping persist; stale version returns 409 without lost update.
3. Duplicate: new ID and slug, Draft/noindex, homepage false, publication timestamps cleared, original unchanged.
4. Preview: authenticated only, noindex/private headers, exact `GuidePublicContent` output including hero, navigation, panels, images and onward links.
5. Publish: validation runs inside transaction, HTTP 200 after success, actual timestamps set, one revision/audit entry.
6. Unpublish: public route becomes 404 and sitemap entry disappears; data remains editable.
7. Sitemap: eligible Guide appears automatically with exact canonical URL and stored `updatedAt` lastmod.
8. Noindex override: published Guide stays HTTP 200, is absent from sitemap, emits `noindex,follow` and self canonical.
9. Canonical: default self canonical; only validated intentional legacy canonical paths differ.
10. Structured data: valid Article, BreadcrumbList and conditional Place; no invented/empty navigation facts.
11. Media: selection/upload stores existing media ID, public image is crawlable, alt/caption/credit render, missing/deleted media blocks publish.
12. Static compatibility: byte/DOM snapshot or semantic assertions for every current Guide URL and special presentation profile before/after feature.
13. Bulk import: dry run has no writes; confirmed import creates Drafts only; idempotency, partial/error policy, size limits and CSV injection handling.
14. Concurrency: simultaneous story save, scheduled story publication, Guide import and Guide publish preserve all records/settings.
15. Homepage isolation: Guide publish does not change lead/latest/Editor's Choice or Guide homepage visibility.
16. Store failure: invalid/missing production store and lock timeout fail closed without creating a replacement.

Run the full existing validation suite plus focused new integration tests against disposable `OLDSEADOGS_DATA_DIR` fixtures. Never point tests at production data.

## 15. Risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Editing the large `BridgeCms.tsx` surface | Accidental story/homepage regression | First extract Guide-only UI with snapshot tests; keep the dispatch/import diff minimal. |
| Generic save carries `published` status | Accidental publication | Explicit Draft and Publish service operations; importer hard-forces Draft. |
| Lost update despite atomic file writes | Valid editor changes overwritten | `expectedUpdatedAt`/revision token and HTTP 409 conflict handling inside the lock. |
| Static merge causes unintended materialisation | Store fills with copies of seed records | New target-only upsert repository with compatibility tests; no migration-on-read. |
| Slug collision or slug edit | Wrong Guide overridden or link broken | Uniqueness across static/stored records; freeze published slugs; later redirect workflow. |
| Structured model drifts from renderer | New Guides look different | One deterministic adapter into current `EditableGuide`; DOM/visual regression tests. |
| Slug-specific renderer branches | New type behaves inconsistently | Leave branches unchanged; use generic renderer; defer presentation-profile refactor. |
| Unverified navigation facts | Safety and trust risk | Source-per-claim, unresolved flags, no inference, publish block/explicit acknowledgement. |
| Media without rights/credit | Legal/editorial exposure | Reuse rights/provenance metadata and add Guide publication checks. |
| Incorrect SEO noindex semantics | Excluded Guide becomes nofollow or enters sitemap | Test `published && !noindex` filter and `noindex,follow`; self canonical. |
| Bulk import overwhelms or corrupts store | Availability/data-loss risk | Payload limits, dry run, idempotency, bounded transactions, existing lock and verified backups. |
| Adding Guide scheduling to story scheduler | Story scheduling regression | Reserve field only; separate later implementation and tests. |

## 16. Implementation phases

### Phase 0 — characterization and safety net

Add no behaviour. Create fixture-based tests for current stored/static merge, every existing Guide route, preview parity, sitemap eligibility, artwork, Guide editor actions and concurrent story/Guide writes.

### Phase 1 — Guide contract and service

Add versioned schemas, deterministic structured-to-current adapter, explicit Draft/duplicate/publish/unpublish operations, server timestamps, optimistic concurrency and Guide revisions. Keep the current renderer and existing `saveGuide()` compatibility path.

### Phase 2 — focused CMS module

Extract Guide-owned UI, add list search/filter, structured optional panels, duplicate and explicit publication confirmation. Reuse the current media APIs through a Guide adapter. Do not edit story panels or Homepage Manager behaviour.

### Phase 3 — JSON/CSV Draft importer

Add authenticated dry-run/confirm import, idempotency and batch results. It creates/updates Drafts only.

### Phase 4 — SEO/structured-data completion

Add `publishedAt` to Article, conditional verified Place and `noindex,follow` Guide behaviour. Confirm automatic SSR, canonical and sitemap lastmod end to end.

### Phase 5 — one-time release and operational acceptance

Use the existing verified backup, build, release and PM2 handover procedures once. On a disposable/staging store, create a Guide Draft, preview, publish, confirm public page/sitemap/metadata, unpublish and confirm removal. Later Guide publishing is CMS-only.

Guide scheduling and any replacement of slug-specific presentation branches are explicitly outside these phases unless separately commissioned.

## 17. Estimated files/components that would need changing

Exact names for new files are recommendations, not implementation performed by this audit.

### Existing files likely requiring small, controlled edits

- `lib/site-content.ts` — optional Guide fields/revisions, target-only repository operations, server timestamps and normalizers.
- `app/api/editor/route.ts` — authenticated Guide actions and import dry-run/confirm dispatch.
- `app/editor/BridgeCms.tsx` — minimal extraction/import and Guides dispatch wiring; story/homepage sections must remain semantically unchanged.
- `lib/guides.ts` — additive Place/date structured-data helpers if chosen.
- `app/guides/[region]/[guide]/page.tsx` and legacy `app/guides/[region]/page.tsx` — additive structured data and `noindex,follow` metadata argument.
- `scripts/oldseadogs-ops.mjs` only if human-readable Guide revision backup exports are added; full store coverage already exists, so this is optional.

### Recommended new Guide-owned files

- `lib/guide-contract.ts` — v1 Skill/import DTO schemas and CSV mapping.
- `lib/guide-management.ts` — Draft, duplicate, publish, unpublish and import orchestration.
- `lib/guide-renderer-adapter.ts` — structured-to-existing `EditableGuide` mapping.
- `app/editor/guides/GuideManager.tsx`, `GuideList.tsx`, `GuideEditor.tsx`, `GuideMediaPicker.tsx` — extracted Guide-only CMS UI.
- focused unit/integration tests and disposable fixtures for management, import, SEO and renderer parity.

`components/GuidePublicContent.tsx`, Guide navigation components and `app/globals.css` should not require changes for this feature. If a new generic renderer field cannot be represented without altering them, stop and obtain visual-parity approval before proceeding.

## 18. Files/components that should not be changed

The following are outside the Guide-management implementation boundary and should be protected by diff review and tests:

- story editor/publication/scheduling/revision code, including `lib/editor-publication.js`, `lib/story-media-composer.js`, `lib/story-schedule-time.ts` and story sections within `BridgeCms`;
- Homepage Manager implementation, lead/latest/Editor's Choice selection and homepage settings isolation;
- consent components/logic and GA4 configuration (`G-88HT8MHR7T`);
- public story routes and rendering;
- existing static Guide seed content and current Guide artwork under `public/images/guides`;
- `components/GuidePublicContent.tsx`, `GuideSectionNavigation.tsx`, `GuideBreadcrumbs.tsx`, `GuideGoogleMap.tsx`, `GuideCollectionBrowser.tsx` and their existing Guide CSS during the initial feature;
- media storage and public media-serving semantics; reuse their APIs rather than rewriting them;
- global robots/sitemap eligibility logic except the narrow tested Guide additions described above;
- production `editor-store.json`, production media and any backup contents;
- PM2 ecosystem/configuration, release scripts, deployment scripts, symlink machinery and server configuration;
- Guides currently live: URLs, slugs, canonical paths, content, ordering, relationships, artwork and presentation.

Because `BridgeCms.tsx` currently contains both protected and Guide code, a line-level rule is necessary: only Guide extraction/wiring may change there; story, homepage, media, import and settings blocks should have zero semantic diff.

## 19. Recommended first implementation task

Build the characterization test harness before adding a feature:

1. create a disposable store fixture containing one static Guide override, one CMS-only Draft, one published/noindex Guide, story scheduling data, media and homepage selections;
2. assert merge precedence and target-only Guide upsert under concurrent story/Guide writes;
3. capture semantic render assertions for all existing special Guide layouts and artwork;
4. assert Draft preview parity, public 404 rules, published sitemap/canonical/robots behaviour and homepage isolation;
5. run the complete current suite.

Only after that safety net is green should Phase 1 add the versioned contract and explicit Draft/Publish service. This first task creates no production content and materially lowers the risk of touching a CMS file that currently contains several protected workflows.

## Audit conclusion

The desired workflow is compatible with the current architecture. Much of the foundation already exists: a Guide section in The Helm, external persistent Guide records, locked atomic writes, private same-renderer preview, dynamic public routes, automatic sitemap inclusion, crawlable media and the approved public Guide presentation. The safest work is therefore a focused hardening and extension of Guide management—not a CMS replacement and not a renderer rewrite.

This audit created this report only. No application source code, production data, production media, CMS content, deployment configuration or running service was changed. No commit, deployment or production SSH session was performed.
