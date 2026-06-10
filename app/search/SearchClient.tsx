"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SearchResult } from "../../lib/search";

const exampleSearches = [
  "Cowes Week",
  "Rolex Fastnet",
  "Sunseeker",
  "Royal Thames Yacht Club",
];

export function SearchClient({
  initialQuery,
  initialResults,
}: {
  initialQuery: string;
  initialResults: SearchResult[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    initialQuery ? `${initialResults.length} results` : "Try a search term."
  );

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const search = normalizedQuery;
      const params = new URLSearchParams(window.location.search);

      if (search) params.set("q", search);
      else params.delete("q");
      window.history.replaceState(null, "", params.toString() ? `/search?${params}` : "/search");

      if (search.length < 2) {
        setResults([]);
        setMessage("Type at least two characters.");
        setBusy(false);
        return;
      }

      setBusy(true);
      fetch(`/api/search?q=${encodeURIComponent(search)}&limit=40`, {
        cache: "no-store",
      })
        .then((response) => response.json())
        .then((payload) => {
          const nextResults = Array.isArray(payload.results) ? payload.results : [];
          setResults(nextResults);
          setMessage(`${nextResults.length} results`);
        })
        .catch(() => {
          setResults([]);
          setMessage("Search is not available right now.");
        })
        .finally(() => setBusy(false));
    }, 180);

    return () => window.clearTimeout(handle);
  }, [normalizedQuery]);

  return (
    <section className="search-workbench" aria-label="Old Sea Dogs search">
      <div className="search-box-panel">
        <label>
          Search the archive
          <input
            autoComplete="off"
            autoFocus
            placeholder="Search stories, clubs, ports, boats, races..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="search-examples" aria-label="Example searches">
          {exampleSearches.map((example) => (
            <button type="button" key={example} onClick={() => setQuery(example)}>
              {example}
            </button>
          ))}
        </div>
        <p>{busy ? "Searching..." : message}</p>
      </div>

      <div className="search-results">
        {results.map((result) => (
          <article
            className={`search-result-card ${result.imageUrl ? "" : "text-only-search-result"}`}
            key={result.slug}
          >
            {result.imageUrl ? (
              <Link href={`/stories/${result.slug}`} className="search-result-image-link">
                <span
                  className="search-result-image"
                  role="img"
                  aria-label={result.imageAlt || result.title}
                  style={{ backgroundImage: `url(${result.imageUrl})` }}
                >
                  {result.imageCredit ? (
                    <small className="image-credit-chip">{result.imageCredit}</small>
                  ) : null}
                </span>
              </Link>
            ) : null}
            <div>
              <p className="story-meta">
                <span>{result.category}</span>
                <span>{result.displayDate}</span>
                <span>{result.readMinutes} min read</span>
              </p>
              <h2>
                <Link href={`/stories/${result.slug}`}>{result.title}</Link>
              </h2>
              <Link href={`/stories/${result.slug}`} className="story-summary-link">
                {result.summary}
              </Link>
            </div>
          </article>
        ))}
        {normalizedQuery.length >= 2 && !busy && results.length === 0 ? (
          <div className="empty-section">
            <h2>No results found</h2>
            <p>Try a boat builder, yacht club, port, regatta, or place name.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
