import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { oldSeaDogsSections } from "../../content/sections";
import { createPageMetadata } from "../../lib/seo";
import { searchStories } from "../../lib/search";
import { SearchClient } from "./SearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Search",
  description:
    "Search Old Sea Dogs articles by boat, marina, yacht club, race, regatta, builder, destination, or topic.",
  path: "/search",
  noIndex: true,
  noIndexFollow: true,
});

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (await searchParams)?.q?.trim() ?? "";
  const initialResults = query.length >= 2 ? await searchStories(query, 40) : [];

  return (
    <main className="article-shell search-shell">
      <nav className="article-nav" aria-label="Search navigation">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="nav-links section-nav-links">
          {oldSeaDogsSections.map((section) => (
            <Link href={`/${section.slug}`} key={section.slug}>
              {section.label}
            </Link>
          ))}
        </div>
      </nav>

      <header className="privacy-hero">
        <p className="eyebrow">Search</p>
        <h1>Find stories fast</h1>
        <p>
          Search the Old Sea Dogs archive by boat, builder, yacht club, port,
          race, regatta, destination, or plain old dockside curiosity.
        </p>
        <span>{initialResults.length.toLocaleString("en-GB")} starting results</span>
      </header>

      <SearchClient initialQuery={query} initialResults={initialResults} />

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
