import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";

import { createPageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy | Old Sea Dogs",
  description:
    "Old Sea Dogs privacy policy, including cookies, advertising, photo credits, and contact details.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="article-shell privacy-shell">
      <SiteHeader />

      <header className="privacy-hero">
        <p className="eyebrow">Privacy Policy</p>
        <h1>Privacy Policy</h1>
        <p>
          How Old Sea Dogs handles contact details, cookies, advertising,
          submitted material, and photo credits.
        </p>
        <span>Last updated: 3 August 2026</span>
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

          <h2 id="boats-for-sale">Boats for Sale</h2>
          <p>
            If you list a boat, we keep your name, email address and any
            telephone number you choose to give us so we can confirm the
            advertisement, pass on enquiries, and send the fortnightly and
            three-month notes. Your email address is not shown on the public
            page. A telephone number is shown only if you ask us to show it.
            You can take the advertisement down or delete these details from
            the link in those emails. If you do not delete them yourself, we
            remove the advertisement, photographs and contact details 183 days
            after the advertisement ends.
          </p>

          <h2>Cookies, Analytics And Advertising</h2>
          <p>
            Old Sea Dogs may use cookies and similar technologies to help the
            site work, understand readership, and show advertising. We may use
            Google Analytics to understand which public pages are useful, and
            Google AdSense or similar advertising partners to show sponsored
            adverts when advertising is enabled.
          </p>
          <p>
            Non-essential analytics and advertising services only load after
            the visitor&apos;s consent choice allows them. Analytics storage is
            denied by default through Google Consent Mode. Visitors can accept
            all optional cookies, reject non-essential cookies, manage
            preferences, or later withdraw consent using Privacy choices in the
            footer.
          </p>
          <p>
            Third-party vendors, including Google, may use cookies to serve ads
            based on a user&apos;s prior visits to this website or other websites
            where personalised advertising is allowed. Google and its partners
            may also serve non-personalised ads based on contextual information
            such as the page being viewed and approximate location.
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
            cookies or similar technologies. These third-party advertising
            partners may receive technical information needed to serve, measure,
            limit, or protect adverts. Old Sea Dogs does not sell personal
            information.
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
