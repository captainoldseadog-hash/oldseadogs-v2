import type { Metadata } from "next";
import Link from "next/link";
import { verifyBoatEmail } from "../../../../lib/classifieds-service.ts";
import { createPageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Confirm your email",
  description: "Confirm the email address for an Old Sea Dogs boat advertisement.",
  path: "/boats-for-sale/verify",
  noIndex: true,
});

export default async function VerifyBoatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyBoatEmail(decodeURIComponent(token));
  return (
    <main className="boats-wrap boats-closed">
      <p className="boats-kicker">Email confirmation</p>
      <h1>{result.ok ? "Thank you. The editor has it." : "That link did not work"}</h1>
      <p>
        {result.ok
          ? "Your advertisement is waiting to be read. It is not public until it is approved. We will not show your email address."
          : result.error}
      </p>
      <Link className="boats-button" href="/boats-for-sale">Back to Boats for Sale</Link>
    </main>
  );
}
