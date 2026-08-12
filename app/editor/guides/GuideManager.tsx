"use client";

import { useEffect, useState } from "react";
import { GuideEditor } from "./GuideEditor";
import { GuideBulkImport } from "./GuideBulkImport";
import { GuideList } from "./GuideList";
import type { EditorGuide, GuidesPayload, MediaAsset, MediaPayload } from "./guide-types";

function blankGuide(): EditorGuide {
  return {
    schemaVersion: 2, internalId: "", slug: "", title: "", eyebrow: "Old Sea Dogs Guides", summary: "", introduction: "", guideType: "Destination", regionKey: "", regionName: "", subregion: "", area: "", parentGuideId: "", parentGuideSlug: "", editorialOrder: 0, author: "Michael Hodges", contributorCredits: [], updatedAt: new Date().toISOString(), imageUrl: "", imageAlt: "", imageFocalPoint: "50% 50%", artworkCredit: "", quickFacts: [], sections: [], checklist: [], sourceLinks: [], location: {}, relatedGuideSlugs: [], cruiseOnGuideSlugs: [], previousGuideSlug: "", nextGuideSlug: "", status: "draft", noindex: true, showOnHomepage: false, homepageOrder: 0, seoTitle: "", seoDescription: "", socialTitle: "", socialDescription: "", canonicalPath: "", editorialNotes: "", researchNotes: "", reviewDue: "", accuracyConcerns: "", sourceNotes: "", draftComments: "", verifiedFacilities: [], facilityVerificationNotes: "", tags: [], wordCount: 0, minimumWords: 80, quality: "Draft", imageCaption: "", imageCredit: "", featuredMediaId: "", inlineImages: [],
    editorial: { standfirst: "", introduction: "", sections: [], oldSeaDogsView: [], practicalNotes: [], localKnowledge: [], warnings: [] }, navigation: { approach: [], hazards: [] }, marina: {}, contacts: {}, media: { gallery: [] }, seo: { noindex: true }, publication: { publishedAt: null, scheduledAt: null }, verification: { sources: [], unresolved: [] },
  };
}

function identity(guide: EditorGuide) { return guide.id || guide.internalId || guide.slug; }

export default function GuideManager() {
  const [payload, setPayload] = useState<GuidesPayload | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<EditorGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duplicateSource, setDuplicateSource] = useState<EditorGuide | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState("");
  const [duplicateSlug, setDuplicateSlug] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  const load = async (preferredId?: string) => {
    setLoading(true); setError("");
    try {
      const [guideResponse, mediaResponse] = await Promise.all([fetch("/api/editor?view=guides", { cache: "no-store" }), fetch("/api/editor?view=media&filter=all&page=1&pageSize=120", { cache: "no-store" })]);
      const guidePayload = await guideResponse.json() as GuidesPayload & { error?: string };
      const mediaPayload = await mediaResponse.json() as MediaPayload & { error?: string };
      if (!guideResponse.ok) throw new Error(guidePayload.error || "Guides could not be loaded.");
      if (!mediaResponse.ok) throw new Error(mediaPayload.error || "Media could not be loaded.");
      setPayload(guidePayload); setAssets(mediaPayload.media || []);
      const id = preferredId || (selected ? identity(selected) : "");
      setSelected(guidePayload.guides.find((guide) => identity(guide) === id) || guidePayload.guides[0] || null);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Guides could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // The initial load is intentionally run once; later refreshes preserve selection explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDuplicate = (guide: EditorGuide) => {
    setDuplicateSource(guide);
    setDuplicateTitle(`${guide.title} copy`);
    setDuplicateSlug(`${guide.slug}-copy`);
  };

  const duplicate = async () => {
    if (!duplicateSource) return;
    setDuplicating(true); setError("");
    try {
      const response = await fetch("/api/editor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "duplicateGuide", id: identity(duplicateSource), guide: { title: duplicateTitle, slug: duplicateSlug } }) });
      const result = await response.json() as { guide?: EditorGuide; error?: string };
      if (!response.ok || !result.guide) throw new Error(result.error || "The Guide could not be duplicated.");
      setDuplicateSource(null);
      await load(identity(result.guide));
    } catch (duplicateError) { setError(duplicateError instanceof Error ? duplicateError.message : "The Guide could not be duplicated."); }
    finally { setDuplicating(false); }
  };

  if (loading && !payload) return <section className="bridge-loading"><span className="bridge-loader" /><strong>Loading Guide Manager</strong></section>;
  if (error && !payload) return <section className="bridge-error"><strong>Guide Manager could not load</strong><span>{error}</span><button type="button" onClick={() => void load()}>Try again</button></section>;
  if (!payload) return null;

  return <div className="guide-manager">
    <header className="bridge-page-header"><div><p className="eyebrow">Useful pages for real days afloat</p><h1>Guide Manager</h1><p>Create, verify and publish structured Old Sea Dogs Guides without changing their public presentation.</p></div></header>
    <section className="bridge-stat-grid compact" aria-label="Guide summary"><article className="bridge-stat"><span>Guides</span><strong>{payload.summary.total}</strong></article><article className="bridge-stat"><span>Published</span><strong>{payload.summary.published}</strong></article><article className="bridge-stat"><span>Indexed</span><strong>{payload.summary.indexed}</strong></article><article className="bridge-stat"><span>Thin</span><strong>{payload.summary.thin}</strong></article></section>
    {error ? <div className="bridge-error"><strong>Guide Manager needs attention</strong><span>{error}</span></div> : null}
    <GuideBulkImport onImported={() => void load()} />
    <div className="guide-manager-layout">
      <GuideList guides={payload.guides} selectedId={selected ? identity(selected) : ""} onEdit={setSelected} onCreate={() => setSelected(blankGuide())} onDuplicate={startDuplicate} />
      <section className="bridge-panel guide-manager-workspace">{selected ? <GuideEditor key={`${identity(selected)}-${selected.updatedAt}`} guide={selected} guides={payload.guides} assets={assets} onSaved={(guide) => void load(identity(guide))} onReload={() => void load(selected ? identity(selected) : undefined)} onDuplicate={startDuplicate} onMediaAdded={(asset) => setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)])} /> : <p className="bridge-muted">Create or choose a Guide to begin.</p>}</section>
    </div>
    {duplicateSource ? <div className="guide-manager-modal-backdrop"><section className="bridge-panel guide-manager-modal" role="dialog" aria-modal="true" aria-label="Duplicate Guide"><div className="bridge-panel-heading"><div><p className="eyebrow">Duplicate as Draft</p><h2>{duplicateSource.title}</h2></div><button type="button" onClick={() => setDuplicateSource(null)}>Close</button></div><label><span>New title</span><input value={duplicateTitle} onChange={(event) => setDuplicateTitle(event.target.value)} /></label><label><span>New slug</span><input value={duplicateSlug} onChange={(event) => setDuplicateSlug(event.target.value)} /></label><p className="bridge-muted">The duplicate is always private, noindex and unpublished.</p><button className="bridge-primary-action" disabled={duplicating || !duplicateTitle.trim() || !duplicateSlug.trim()} type="button" onClick={() => void duplicate()}>{duplicating ? "Duplicating…" : "Create Draft copy"}</button></section></div> : null}
  </div>;
}
