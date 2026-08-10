"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type GuideBrowserItem = {
  slug: string;
  title: string;
  summary: string;
  guideType: string;
  regionName: string;
  path: string;
  imageUrl: string;
  imageAlt: string;
};

export function GuideCollectionBrowser({
  guides,
  initialGuideType = "All",
  searchPlaceholder,
  title = "All available Guides",
}: {
  guides: GuideBrowserItem[];
  initialGuideType?: string;
  searchPlaceholder: string;
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [guideType, setGuideType] = useState(initialGuideType);
  const guideTypes = useMemo(
    () => [...new Set(guides.map((guide) => guide.guideType))].sort(),
    [guides],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guides.filter((guide) => {
      const matchesType = guideType === "All" || guide.guideType === guideType;
      const matchesQuery = !needle
        || `${guide.title} ${guide.summary} ${guide.guideType} ${guide.regionName}`
          .toLowerCase()
          .includes(needle);
      return matchesType && matchesQuery;
    });
  }, [guideType, guides, query]);

  return (
    <section className="guide-browser" id="guide-library" aria-labelledby="guide-browser-title">
      <div className="section-heading">
        <p className="eyebrow">Find a Guide</p>
        <h2 id="guide-browser-title">{title}</h2>
      </div>
      <div className="guide-browser-controls">
        <label>
          <span>Search Guides</span>
          <input
            autoComplete="off"
            placeholder={searchPlaceholder}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>Browse by Guide type</span>
          <select value={guideType} onChange={(event) => setGuideType(event.target.value)}>
            <option value="All">All published types</option>
            {guideTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>
      <p className="guide-browser-status" aria-live="polite">
        {guideType === "All" ? "The published library" : guideType} · {filtered.length} {filtered.length === 1 ? "Guide" : "Guides"}
      </p>
      {filtered.length ? (
        <>
          <div className="guide-card-grid">
            {filtered.map((guide) => (
              <article className="guide-card" key={guide.slug}>
                <Link className="guide-card-image" href={guide.path}>
                  <img
                    alt={guide.imageAlt}
                    decoding="async"
                    loading="lazy"
                    sizes="(max-width: 640px) calc(100vw - 40px), 360px"
                    src={guide.imageUrl}
                  />
                </Link>
                <div>
                  <p className="eyebrow">{guide.guideType}</p>
                  <h3><Link href={guide.path}>{guide.title}</Link></h3>
                  <p>{guide.summary}</p>
                </div>
              </article>
            ))}
          </div>
          {guideType !== "All" && filtered.length < 2 ? (
            <p className="guide-collection-growth">
              More {guideType} Guides are currently being researched and will be published
              as the Old Sea Dogs Guides library continues to grow.
            </p>
          ) : null}
        </>
      ) : (
        <div className="guide-empty-state">
          <h3>The next Guide may still be on the chart table</h3>
          <p>
            {guideType !== "All"
              ? `More ${guideType} Guides are currently being researched and will be published as the Old Sea Dogs Guides library continues to grow.`
              : "Nothing in the library matches those words yet. Try a harbour, river, anchorage or cruising area."}
          </p>
        </div>
      )}
    </section>
  );
}
