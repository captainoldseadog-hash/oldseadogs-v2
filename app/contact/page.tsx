import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../components/JsonLd";
import { SiteFooter } from "../../components/SiteFooter";
import { SocialFollowBlock } from "../../components/SocialFollowBlock";
import { marinaGuideNavigationLink, oldSeaDogsSections } from "../../content/sections";
import { contactEmail, createPageMetadata } from "../../lib/seo";
import { contactPageJsonLd } from "../../lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact Old Sea Dogs with boating stories, press releases, photo credits, corrections, advertising enquiries, and general questions.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="article-shell privacy-shell">
      <JsonLd data={contactPageJsonLd()} />
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

      <header className="privacy-hero">
        <p className="eyebrow">Contact</p>
        <h1>Contact Old Sea Dogs</h1>
        <p>
          Send boating stories, yacht club notes, marina updates, press releases,
          photo credits, corrections, and advertising enquiries.
        </p>
        <span>Editor: Michael Hodges</span>
      </header>

      <section className="privacy-layout" aria-label="Contact Old Sea Dogs">
        <article className="privacy-panel">
          <h2>Email</h2>
          <p>
            The best way to reach Old Sea Dogs is by email:
            {" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>

          <h2>Stories And Press Releases</h2>
          <p>
            If you are sending a story idea or press release, include the key
            dates, names, location, source contact, and any usage permissions for
            photos. Old Sea Dogs rewrites submitted material in its own editorial
            style before publication.
          </p>

          <h2>Photos And Credits</h2>
          <p>
            If you send photos, please include the photographer or rights holder
            name exactly as it should appear. Photo credits can be shown with the
            image, for example &quot;© Michael Hodges&quot;.
          </p>

          <h2>Corrections</h2>
          <p>
            For corrections, include the article title or link and the detail
            that needs checking. We aim to correct factual issues promptly.
          </p>

          <h2>Advertising</h2>
          <p>
            Old Sea Dogs can carry manual adverts and may use advertising
            networks such as Google AdSense. Send advertising enquiries by email.
          </p>
        </article>

        <aside className="privacy-contact-card">
          <p className="eyebrow">Direct Email</p>
          <h2>Michael Hodges</h2>
          <p>Editor and founder of Old Sea Dogs.</p>
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </aside>
      </section>

      <SocialFollowBlock
        compact
        body="Follow Old Sea Dogs for story updates, short videos, photos, race notes and social posts."
      />

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
