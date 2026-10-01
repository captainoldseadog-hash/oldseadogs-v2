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
        <p className="boats-kicker">Free for private owners</p>
        <h1>Enter your boat in the Register</h1>
        <p>{boatsTermSummary}</p>
      </header>
      {query.sent ? (
        <p className="boats-note" role="status">Thank you. Check your email and confirm the address. The advertisement is not published until you do, and until the editor has read it.</p>
      ) : (
        <div className="boats-book">
          <ListYourBoatForm consentLabel={boatsConsentLabel} privacyNotice={boatsPrivacyNotice} />
          <aside className="boats-passage">
            <p className="boats-kicker">The passage of your advert</p>
            <h2>Three months, with a note every fortnight.</h2>
            <ol>
              <li><strong>Week 0.</strong> You list it. We email a confirmation link. Nothing is public until you confirm and the editor approves it.</li>
              <li><strong>Every fortnight.</strong> A short note while the advertisement is live, with a link to mark it sold, change it or take it down.</li>
              <li><strong>Three months.</strong> We ask once. One confirmation keeps it up for another three months. If we hear nothing within 14 days, it ends.</li>
            </ol>
          </aside>
        </div>
      )}
    </main>
  );
}
