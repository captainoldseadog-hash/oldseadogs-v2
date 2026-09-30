import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { marinaGuideNavigationLink, oldSeaDogsSections } from "../../content/sections";
import { contactEmail, createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Use",
  description:
    "Old Sea Dogs terms of use covering editorial content, submitted material, photo rights, adverts, external links, and corrections.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="article-shell privacy-shell">
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
        <p className="eyebrow">Terms</p>
        <h1>Terms of Use</h1>
        <p>
          The terms for reading, sharing, submitting, and advertising with Old
          Sea Dogs.
        </p>
        <span>Last updated: 10 June 2026</span>
      </header>

      <section className="privacy-layout" aria-label="Terms of use">
        <article className="privacy-panel">
          <h2>Using This Website</h2>
          <p>
            Old Sea Dogs is an online boating and yachting publication. By using
            the site, you agree to use it lawfully and respectfully.
          </p>

          <h2>Editorial Content</h2>
          <p>
            Articles are provided for general interest and information. They are
            not a substitute for professional marine, navigation, safety,
            technical, legal, financial, or insurance advice.
          </p>

          <h2>Submitted Material</h2>
          <p>
            If you send stories, press releases, photos, or other material, you
            confirm that you have the right to share it with Old Sea Dogs and
            that we may review, edit, rewrite, store, and publish it unless
            agreed otherwise.
          </p>

          <h2>Photos And Copyright</h2>
          <p>
            Photos remain the property of their rights holders. Where a credit is
            provided, Old Sea Dogs aims to display it with the image. If a credit
            or usage permission needs correcting, contact us.
          </p>

          <h2>External Links And Maps</h2>
          <p>
            The site may link to external websites or embed third-party services
            such as Google Maps. Old Sea Dogs is not responsible for the content,
            policies, or availability of external services.
          </p>

          <h2>Advertising</h2>
          <p>
            Adverts may be supplied manually or through advertising networks.
            Advertising does not necessarily imply editorial endorsement.
          </p>

          <h2>Corrections And Contact</h2>
          <p>
            To raise a correction, copyright concern, or terms question, email{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </article>

        <aside className="privacy-contact-card">
          <p className="eyebrow">Contact</p>
          <h2>Questions Or Corrections</h2>
          <p>Send article corrections, rights questions, or policy queries by email.</p>
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </aside>
      </section>

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
