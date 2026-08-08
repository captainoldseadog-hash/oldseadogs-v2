import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/JsonLd";
import { SiteFooter } from "../../../components/SiteFooter";
import { oldSeaDogsSections } from "../../../content/sections";
import { contactEmail, createPageMetadata } from "../../../lib/seo";
import { profilePageJsonLd } from "../../../lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Michael Hodges Author Profile",
  description:
    "Author profile for Michael Hodges, editor and founder of Old Sea Dogs, covering boating, yachting, ports, clubs, and practical sea stories.",
  path: "/authors/michael-hodges",
  type: "profile",
  image: {
    url: "/images/authors/oldseadogs-michael-hodges.webp",
    width: 1448,
    height: 1086,
    alt: "Michael Hodges and Old Sea Dogs maritime artwork",
  },
});

export default function MichaelHodgesAuthorPage() {
  return (
    <main className="article-shell about-shell">
      <JsonLd data={profilePageJsonLd()} />
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
        </div>
      </nav>

      <header className="about-hero">
        <div className="about-intro">
          <p className="eyebrow">Author Profile</p>
          <h1>Michael Hodges</h1>
          <p>
            Editor, founder, and principal Old Sea Dogs author, covering the
            marine world with a practical eye and a lifelong interest in boats.
          </p>
          <a className="button-primary about-email" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </div>
        <figure className="about-photo-card">
          <span
            className="about-photo"
            role="img"
            aria-label="Michael Hodges writing for OldSeaDogs.com"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(10, 22, 27, 0), rgba(10, 22, 27, 0.14)), url('/images/authors/michael-hodges-2.jpg'), url('/images/authors/michael-hodges-1.jpg')",
            }}
          />
          <figcaption>Michael Hodges, editor and founder of Old Sea Dogs.</figcaption>
        </figure>
      </header>

      <section className="about-layout" aria-label="Michael Hodges author profile">
        <article className="about-story-panel">
          <p>
            Michael Hodges founded Old Sea Dogs to collect and publish the
            boating stories that sit between news, club gossip, marina knowledge,
            boat reviews, and practical life afloat.
          </p>
          <p>
            His own boating began in 1997 with a Sunseeker Martinique on the
            Hamble and has since included cruising, RIB boating, sailing in the
            Ionian, powerboat training, diving, and years around the Solent.
          </p>
          <p>
            Michael writes and edits Old Sea Dogs with an emphasis on clarity,
            useful detail, photo credits, and a tone that feels at home among
            sailors, motor boaters, club members, marina visitors, and curious
            readers ashore.
          </p>
        </article>

        <aside className="about-contact-card">
          <p className="eyebrow">Contact The Author</p>
          <h2>Send stories or corrections</h2>
          <p>
            Contact Michael with story ideas, press releases, rights questions,
            or factual corrections.
          </p>
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </aside>
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/about", label: "About" },
          { href: "/contact", label: "Contact" },
        ]}
      />
    </main>
  );
}
