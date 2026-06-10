import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { oldSeaDogsSections } from "../../content/sections";
import { createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About Michael Hodges | Old Sea Dogs",
  description:
    "Meet Michael Hodges, editor and founder of Old Sea Dogs, and contact the site.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="article-shell about-shell">
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
          <p className="eyebrow">About Old Sea Dogs</p>
          <h1>Michael Hodges</h1>
          <p>
            Editor and founder of Old Sea Dogs, based on the Isle of Wight and
            happiest when a story has salt on it.
          </p>
          <p>
            For a concise search-friendly byline page, visit the{" "}
            <Link href="/authors/michael-hodges">Michael Hodges author profile</Link>.
          </p>
          <a className="button-primary about-email" href="mailto:captainoldseadog@gmail.com">
            captainoldseadog@gmail.com
          </a>
        </div>
        <figure className="about-photo-card">
          <span
            className="about-photo"
            role="img"
            aria-label="Michael Hodges, editor and founder of Old Sea Dogs"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(10, 22, 27, 0), rgba(10, 22, 27, 0.18)), url('/legacy-photos/6bc0d66f63c5-flybridge-yacht-michael-hodges.webp')",
            }}
          />
          <figcaption>Michael Hodges, editor and founder of Old Sea Dogs.</figcaption>
        </figure>
      </header>

      <section className="about-layout" aria-label="About Michael Hodges">
        <article className="about-story-panel">
          <p>
            Old Sea Dogs grew from Michael&apos;s lifelong love of boating culture:
            the people, vessels, ports, clubs, yards, and sea stories that make
            the marine world so endlessly interesting.
          </p>
          <p>
            Around Cowes and the Solent, Michael is often found at the Island
            Sailing Club, Island Harbour Sailing Club, or out on the water in
            his Ribeye RIB. His boating life began in 1997 with a Sunseeker
            Martinique on the Hamble, close to the Jolly Sailor, and it has
            carried him through years of cruising, learning, writing, and
            meeting good people around the waterfront.
          </p>
          <p>
            He holds RYA Practical Day Skipper, Shorebased Day Skipper for Sail
            and Power Craft, and Powerboat Level 2 qualifications, and is also a
            certified PADI diver. Those practical experiences shape the tone of
            Old Sea Dogs: knowledgeable, curious, direct, and written for people
            who love boats whether they are already afloat or still dreaming
            from shore.
          </p>
          <p>
            Michael has sailed the Ionian many times, aboard both monohulls and
            multihulls, and continues to follow the stories that connect
            sailors, owners, builders, crews, clubs, and ports across the wider
            boating world.
          </p>
        </article>

        <aside className="about-contact-card">
          <p className="eyebrow">Contact</p>
          <h2>Send stories, photos, and press releases</h2>
          <p>
            For news tips, marine press releases, photo credits, corrections, or
            Old Sea Dogs enquiries, contact Michael directly.
          </p>
          <a href="mailto:captainoldseadog@gmail.com">captainoldseadog@gmail.com</a>
        </aside>
      </section>

      <section className="about-note-band">
        <div>
          <p className="eyebrow">Editorial voice</p>
          <h2>A practical eye, a storyteller&apos;s ear</h2>
        </div>
        <p>
          Old Sea Dogs is built for fellow enthusiasts, armchair sailors, club
          members, owners, crews, and curious newcomers - a lively online harbour
          for the stories that make life afloat worth following.
        </p>
      </section>

      <SiteFooter
        footerText="Boating, yachting, boat reviews, and practical sea stories."
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/news", label: "News" },
          { href: "/reviews", label: "Reviews" },
        ]}
      />
    </main>
  );
}
