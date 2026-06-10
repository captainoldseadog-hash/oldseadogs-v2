import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { oldSeaDogsSections } from "../../content/sections";
import { contactEmail, createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Cookie Policy",
  description:
    "Old Sea Dogs cookie policy covering essential cookies, analytics, advertising, Google AdSense, embedded maps, and visitor choices.",
  path: "/cookie-policy",
});

export default function CookiePolicyPage() {
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
        </div>
      </nav>

      <header className="privacy-hero">
        <p className="eyebrow">Cookie Policy</p>
        <h1>Cookie Policy</h1>
        <p>
          How Old Sea Dogs may use cookies and similar technologies for site
          function, measurement, maps, and advertising.
        </p>
        <span>Last updated: 10 June 2026</span>
      </header>

      <section className="privacy-layout" aria-label="Cookie policy">
        <article className="privacy-panel">
          <h2>What Cookies Are</h2>
          <p>
            Cookies are small files or identifiers that a website, browser, or
            third-party service may store on a device. They can help a site work,
            remember choices, measure visits, protect services, or support
            advertising.
          </p>

          <h2>Cookies We May Use</h2>
          <p>
            Old Sea Dogs may use essential cookies for security, publishing, and
            site operation. We may also use analytics or performance tools to
            understand how readers use the site.
          </p>

          <h2>Advertising Cookies</h2>
          <p>
            If Old Sea Dogs uses Google AdSense or similar advertising networks,
            those providers may use cookies or similar technologies to serve ads,
            measure ad performance, prevent abuse, and, where permitted, show
            personalised advertising.
          </p>
          <p>
            Google and its partners may use advertising cookies based on a
            visitor&apos;s prior visits to this website or other websites. You can
            manage Google ad personalisation through{" "}
            <a href="https://www.google.com/settings/ads" rel="noreferrer" target="_blank">
              Google Ads Settings
            </a>
            .
          </p>

          <h2>Embedded Maps</h2>
          <p>
            Some Ports and Clubs articles may embed Google Maps or satellite
            views. Those embedded services may set cookies or receive technical
            information when they load.
          </p>

          <h2>Your Choices</h2>
          <p>
            You can control cookies through your browser settings. If a consent
            banner is added for advertising or analytics, you can use it to set
            your choices for non-essential cookies.
          </p>

          <h2>Questions</h2>
          <p>
            For cookie questions, email{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </article>

        <aside className="privacy-contact-card">
          <p className="eyebrow">Related</p>
          <h2>Privacy Policy</h2>
          <p>Read how Old Sea Dogs handles contact details, submissions, and advertising.</p>
          <Link href="/privacy">Privacy Policy</Link>
        </aside>
      </section>

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
