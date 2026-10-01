import type { Metadata } from "next";
import { boatsConsentLabel, boatsPrivacyNotice, boatsTermSummary } from "../../../lib/classifieds-copy.ts";
import { createPageMetadata } from "../../../lib/seo.ts";
import { ListYourBoatForm } from "./ListYourBoatForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "List your boat free",
  description: "List a boat for sale on Old Sea Dogs for nothing. The advertisement runs for three months, with a reminder every fortnight.",
  path: "/boats-for-sale/list-your-boat",
});

export default async function ListYourBoatPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="boats-wrap boats-logbook-page">
      <header className="boats-logbook-heading">
        <p className="boats-kicker">Seller’s log</p>
        <h1>List your boat free</h1>
        <p>{boatsTermSummary}</p>
      </header>
      <ol className="boats-timeline" aria-label="How a free advertisement runs">
        <li><span>Week 0</span><strong>You list it</strong><p>We email a confirmation link. Nothing is public until you confirm and the editor approves it.</p></li>
        <li><span>Every fortnight</span><strong>A short note</strong><p>While the advertisement is live we email to say it is still running, with a link to mark it sold, change it or take it down.</p></li>
        <li><span>Three months</span><strong>Keep it running?</strong><p>We ask once. One confirmation keeps it up for another three months. If we hear nothing within 14 days, it ends.</p></li>
      </ol>
      {query.sent ? (
        <p className="boats-note" role="status">Thank you. Check your email and confirm the address. The advertisement is not published until you do, and until the editor has read it.</p>
      ) : (
        <ListYourBoatForm consentLabel={boatsConsentLabel} privacyNotice={boatsPrivacyNotice} />
      )}
    </main>
  );
}
