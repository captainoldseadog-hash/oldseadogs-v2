import type { Metadata } from "next";
import Link from "next/link";
import { readSellerListing } from "../../../../lib/classifieds-service.ts";
import { createPageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "List your boat again",
  description: "Send an ended Old Sea Dogs boat advertisement back to the editor.",
  path: "/boats-for-sale/relist",
  noIndex: true,
});

export default async function RelistBoatPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const [{ token: rawToken }, query] = await Promise.all([params, searchParams]);
  const token = decodeURIComponent(rawToken);
  const context = await readSellerListing(token, "relist");
  return (
    <main className="boats-wrap boats-closed">
      <p className="boats-kicker">List it again</p>
      <h1>{query.done === "relist" ? "It is back with the editor" : "List this boat again"}</h1>
      {context && query.done !== "relist" ? (
        <>
          <p>This sends {context.listing.title} back for another look. It is still free, and it stays off the public site until it is approved.</p>
          <form action="/api/boats/manage" method="post">
            <input name="token" type="hidden" value={token} />
            <input name="action" type="hidden" value="relist" />
            <button className="boats-button" type="submit">Send it back for another look</button>
          </form>
        </>
      ) : null}
      {!context && query.done !== "relist" ? <p>This link has expired. You can start a new advertisement instead.</p> : null}
      {query.done === "relist" ? <p>We will read it again before it goes back on the site.</p> : null}
      <Link className="boats-text-link" href="/boats-for-sale/list-your-boat">Start a new advertisement</Link>
    </main>
  );
}
