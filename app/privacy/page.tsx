import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { oldSeaDogsSections } from "../../content/sections";
import { createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy | Old Sea Dogs",
  description:
    "Old Sea Dogs privacy policy, including cookies, advertising, photo credits, and contact details.",
  path: "/privacy",
});

export default function PrivacyPage() {
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
        <p className="eyebrow">Privacy Policy</p>
        <h1>Privacy Policy</h1>
        <p>
          How Old Sea Dogs handles contact details, cookies, advertising,
          submitted material, and photo credits.
        </p>
        <span>Last updated: 10 June 2026</span>
      </header>

      <section className="privacy-layout" aria-label="Privacy policy">
        <article className="privacy-panel">
          <h2>Who We Are</h2>
          <p>
            Old Sea Dogs is an online boating and yachting publication edited by
            Michael Hodges. You can contact us at{" "}
            <a href="mailto:captainoldseadog@gmail.com">
              captainoldseadog@gmail.com
            </a>
            .
          </p>

          <h2>Information We May Collect</h2>
          <p>
            We may receive personal information when you contact us, send a
            press release, submit a story idea, provide a correction, or send a
            photo for possible publication. This may include your name, email
            address, organisation, message, photo credit, and any details you
            choose to include.
          </p>
          <p>
            Like most websites, the site may also collect basic technical
            information such as browser type, device information, pages viewed,
            referring pages, approximate location, and cookie or similar
            identifiers used for security, performance, analytics, and
            advertising.
          </p>

          <h2>How We Use Information</h2>
          <p>
            We use information to run the website, reply to messages, review
            submissions, publish agreed credits, correct articles, protect the
            site, understand what readers use, and support advertising.
          </p>

          <h2>Cookies And Advertising</h2>
          <p>
            Old Sea Dogs may use cookies and similar technologies to help the
            site work, understand readership, and show advertising. Third-party
            vendors, including Google, use cookies to serve ads based on a
            user&apos;s prior visits to this website or other websites.
          </p>
          <p>
            Google&apos;s use of advertising cookies enables Google and its
            partners to serve ads to users based on visits to this site and
            other sites on the Internet. Users may opt out of personalised
            advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" rel="noreferrer" target="_blank">
              Google Ads Settings
            </a>
            . Users may also opt out of some third-party vendors&apos; use of
            cookies for personalised advertising by visiting{" "}
            <a href="https://www.aboutads.info/" rel="noreferrer" target="_blank">
              www.aboutads.info
            </a>
            .
          </p>
          <p>
            If additional advertising networks are used, they may also use
            cookies or similar technologies. Where required, visitors may be
            asked to make cookie choices before non-essential cookies are used.
          </p>
          <p>
            Some Ports and Clubs pages may also include embedded Google Maps or
            satellite views. Google may receive technical information when those
            maps load, in line with Google&apos;s own privacy and cookie policies.
          </p>
          <p>
            For more detail, read the{" "}
            <Link href="/cookie-policy">Old Sea Dogs Cookie Policy</Link>.
          </p>

          <h2>Photos, Press Releases, And Credits</h2>
          <p>
            If you provide photos, press material, or story details, we may use
            them to prepare or publish Old Sea Dogs articles. Where a photo
            credit is supplied, we aim to show that credit with the image, such
            as &quot;© Michael Hodges&quot; or the credit supplied by the rights
            holder.
          </p>

          <h2>Sharing Information</h2>
          <p>
            We do not sell personal information. Information may be shared with
            service providers that help operate the website, email, hosting,
            security, analytics, or advertising. We may also disclose
            information where required by law or to protect the site and its
            readers.
          </p>

          <h2>Keeping Information</h2>
          <p>
            We keep information only for as long as needed for the reason it was
            provided, for editorial records, or where we have a legitimate need
            to keep it. Published articles, captions, and photo credits may stay
            online as part of the editorial archive unless changed or removed.
          </p>

          <h2>Your Choices</h2>
          <p>
            You can ask about information you have sent to Old Sea Dogs, request
            a correction, or raise a privacy concern by emailing{" "}
            <a href="mailto:captainoldseadog@gmail.com">
              captainoldseadog@gmail.com
            </a>
            .
          </p>

          <h2>Changes To This Policy</h2>
          <p>
            This policy may be updated as the site develops, including when new
            advertising, analytics, or publishing tools are added.
          </p>
        </article>

        <aside className="privacy-contact-card">
          <p className="eyebrow">Questions</p>
          <h2>Contact Old Sea Dogs</h2>
          <p>
            For privacy questions, photo credit corrections, or AdSense-related
            enquiries, contact Michael directly.
          </p>
          <a href="mailto:captainoldseadog@gmail.com">
            captainoldseadog@gmail.com
          </a>
        </aside>
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/news", label: "News" },
        ]}
      />
    </main>
  );
}
