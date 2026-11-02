"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GUIDE_TYPES } from "../../../content/flagship-guides";
import type { EditorGuide } from "./guide-types";

type Props = {
  guides: EditorGuide[];
  selectedId: string;
  onEdit: (guide: EditorGuide) => void;
  onCreate: () => void;
  onDuplicate: (guide: EditorGuide) => void;
};

function identity(guide: EditorGuide) {
  return guide.id || guide.internalId || guide.slug;
}

function verificationLabel(guide: EditorGuide) {
  const unresolved = guide.verification?.unresolved || [];
  if (unresolved.some((item) => item.severity === "safety")) return "Safety check open";
  if (unresolved.length) return `${unresolved.length} check${unresolved.length === 1 ? "" : "s"} open`;
  return guide.verification?.verifiedAt ? "Verified" : "Not verified";
}

export function GuideList({ guides, selectedId, onEdit, onCreate, onDuplicate }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [region, setRegion] = useState("all");
  const [attention, setAttention] = useState("all");
  const regions = useMemo(() => [...new Set(guides.map((guide) => guide.regionName).filter(Boolean))].sort(), [guides]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guides.filter((guide) => {
      if (status !== "all" && guide.status !== status) return false;
      if (type !== "all" && guide.guideType !== type) return false;
      if (region !== "all" && guide.regionName !== region) return false;
      if (attention === "noindex" && !guide.noindex) return false;
      if (attention === "missing-hero" && guide.imageUrl) return false;
      if (attention === "unresolved" && !(guide.verification?.unresolved?.length)) return false;
      return !needle || [guide.title, guide.slug, guide.internalId, guide.regionName, guide.area, guide.subregion]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [attention, guides, query, region, status, type]);

  return <section className="bridge-panel guide-manager-list" aria-label="Guide library">
    <div className="bridge-panel-heading">
      <div><p className="eyebrow">Guide library</p><h2>Find and manage Guides</h2></div>
      <button className="bridge-primary-action" onClick={onCreate} type="button">Create Guide</button>
    </div>
    <div className="guide-manager-filters">
      <label><span>Search</span><input aria-label="Search Guides" placeholder="Title, slug, ID, region or area" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label>
      <label><span>Type</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{GUIDE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Region</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">All regions</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Attention</span><select value={attention} onChange={(event) => setAttention(event.target.value)}><option value="all">All Guides</option><option value="unresolved">Unresolved checks</option><option value="missing-hero">Missing hero image</option><option value="noindex">Noindex enabled</option></select></label>
    </div>
    <p className="bridge-muted">{filtered.length} of {guides.length} Guides</p>
    <div className="bridge-activity-list guide-manager-results">
      {filtered.map((guide) => {
        const id = identity(guide);
        const livePath = guide.regionKey ? `/guides/${guide.regionKey}/${guide.slug}` : `/guides/${guide.slug}`;
        return <article className={id === selectedId ? "active" : ""} key={id}>
          <div className="guide-manager-card-copy">
            <div className="guide-manager-badges"><span className={`bridge-status ${guide.status === "published" ? "good" : ""}`}>{guide.status}</span><span>{guide.noindex ? "Noindex" : guide.status === "published" ? "Indexed" : "Not public"}</span><span>{verificationLabel(guide)}</span></div>
            <strong>{guide.title || "Untitled Guide"}</strong>
            <small>{guide.guideType} · {guide.regionName || guide.area || "No region"} · {guide.internalId || "ID on save"}</small>
            <small>Updated {guide.updatedAt} · {guide.wordCount} words</small>
          </div>
          <div className="bridge-row-actions">
            <button type="button" onClick={() => onEdit(guide)}>Edit</button>
            <button type="button" onClick={() => onDuplicate(guide)}>Duplicate</button>
            <Link href={`/editor/preview/guide/${guide.slug}`} target="_blank">Preview</Link>
            {guide.status === "published" ? <Link href={livePath} target="_blank">Live</Link> : null}
          </div>
        </article>;
      })}
      {filtered.length === 0 ? <p className="bridge-muted">No Guides match these filters.</p> : null}
    </div>
  </section>;
}
