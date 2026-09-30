import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { marinaGuideNavigationLink, oldSeaDogsSections } from "../../content/sections";
import { contactEmail, createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Editorial Standards",
  description:
    "How Old Sea Dogs sources, edits, checks, corrects and labels sailing, boating and marine stories.",
  path: "/editorial-standards",
});

export default function EditorialStandardsPage() {
  return (
    <main className="article-shell editorial-standards-shell">
      <nav className="article-nav" aria-label="Primary navigation">
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
          <Link href={marinaGuideNavigationLink.href}>{marinaGuideNavigationLink.label}</Link>
        </div>
      </nav>

      <header className="guide-hero editorial-standards-hero">
        <div>
          <p className="eyebrow">Editorial standards</p>
          <h1>How Old Sea Dogs is edited</h1>
          <p>
            Old Sea Dogs is edited by Michael Hodges as a practical sailing and
            boating publication. The aim is useful, attributed, human-edited
            coverage for sailors, owners, clubs, crews, marinas and readers
            who care about life afloat.
          </p>
        </div>
      </header>

      <section className="standards-grid" aria-label="Old Sea Dogs editorial standards">
        <article>
          <h2>Who edits Old Sea Dogs</h2>
          <p>
            Old Sea Dogs is written and edited by Michael Hodges, founder and
            editor. Michael is based around the Isle of Wight and Solent boating
            world, with practical experience across powerboating, sailing,
            cruising, diving, clubs, marinas and race-week life.
          </p>
        </article>
        <article>
          <h2>How stories are sourced</h2>
          <p>
            Stories may come from Old Sea Dogs observation, site visits,
            interviews, official notices, organiser statements, yacht clubs,
            marinas, manufacturers, race offices, public documents and reader
            tips. Public articles should name the main source or method where
            that helps readers judge the piece.
          </p>
        </article>
        <article>
          <h2>Press releases</h2>
          <p>
            Press releases are treated as starting points, not finished copy.
            The editor removes boilerplate, promotional claims, repeated email
            text and unsupported adjectives, then rewrites the story around
            practical facts: who, what, where, when, why it matters and what
            remains uncertain.
          </p>
        </article>
        <article>
          <h2>AI assistance</h2>
          <p>
            Old Sea Dogs may use AI assistance to clean email imports, organise
            notes, suggest structure, check style risks or prepare draft text
            for human review. AI assistance does not replace editorial
            judgement, source attribution, corrections, photo-credit checks or
            the final decision to publish.
          </p>
        </article>
        <article>
          <h2>Fact-checking approach</h2>
          <p>
            Names, dates, places, event details, race status, source links,
            image credits and practical claims are checked against the best
            available source before publication where possible. Articles should
            distinguish confirmed facts from claims, expectations or items that
            may change with weather, notices, entries or local conditions.
          </p>
        </article>
        <article>
          <h2>Corrections policy</h2>
          <p>
            Old Sea Dogs corrects factual errors, missing credits, unclear
            attribution and outdated practical information when notified. Minor
            fixes may be made silently. Material corrections should be reflected
            by updating the article and its method or source note where useful.
          </p>
        </article>
      </section>

      <section className="corrections-band" aria-label="Corrections contact">
        <div>
          <p className="eyebrow">Corrections</p>
          <h2>Send corrections, credits and source queries</h2>
          <p>
            For factual corrections, image-credit issues, source questions or
            right-of-reply requests, contact Michael directly.
          </p>
        </div>
        <a className="button-primary" href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/about", label: "About Michael" },
          { href: "/authors/michael-hodges", label: "Author Profile" },
          { href: "/contact", label: "Contact" },
        ]}
      />
    </main>
  );
}
