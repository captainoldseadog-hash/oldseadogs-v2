import type { Metadata } from "next";
import Link from "next/link";
import { readSellerListing } from "../../../../lib/classifieds-service.ts";
import { createPageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Keep your advertisement running",
  description: "Keep a free Old Sea Dogs boat advertisement running for another three months.",
  path: "/boats-for-sale/keep",
  noIndex: true,
});

export default async function KeepBoatPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const [{ token: rawToken }, query] = await Promise.all([params, searchParams]);
  const token = decodeURIComponent(rawToken);
  const context = await readSellerListing(token, "keep");
  return (
    <main className="boats-wrap boats-closed">
      <p className="boats-kicker">Three-month check</p>
      <h1>{query.done === "keep" ? "It will run for another three months" : "Keep my ad running for another 3 months"}</h1>
      {!context && query.done !== "keep" ? <p>This renewal link has expired or has already been used.</p> : null}
      {context && query.done !== "keep" ? (
        <>
          <p>Confirm and the advertisement for {context.listing.title} stays on Old Sea Dogs for another three months. There is nothing to pay.</p>
          {query.error ? <p className="boats-note boats-note-error" role="alert">We could not renew it from this link.</p> : null}
          <form action="/api/boats/manage" method="post">
            <input name="token" type="hidden" value={token} />
            <input name="action" type="hidden" value="keep" />
            <button className="boats-button" type="submit">Keep my ad running for another 3 months</button>
          </form>
        </>
      ) : null}
      {query.done === "keep" ? <p>Thank you. The fortnightly notes will continue, and we will ask again in three months.</p> : null}
      <Link className="boats-text-link" href="/boats-for-sale">Back to Boats for Sale</Link>
    </main>
  );
}
