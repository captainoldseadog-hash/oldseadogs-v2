import Link from "next/link";
import { headers } from "next/headers";
import { boatsForSaleNavigationLink, publicNavigationLinks } from "../../content/sections.ts";

const requestPathHeader = "x-oldseadogs-request-path";

export async function BoatsMasthead() {
  const requestHeaders = await headers();
  const path = requestHeaders.get(requestPathHeader) || "/boats-for-sale";
  const browsing = path === "/boats-for-sale";
  const listingForm = path.startsWith("/boats-for-sale/list-your-boat");

  return (
    <header className="boats-masthead">
      <nav className="article-nav boats-site-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-lockup dark" aria-label="Old Sea Dogs home">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="nav-links section-nav-links">
          {publicNavigationLinks.map((link) => (
            <Link className={link.slug === "boats-for-sale" ? "active" : ""} href={link.href} key={link.slug}>
              {link.label}
            </Link>
          ))}
          <Link href="/search">Search</Link>
        </div>
      </nav>
      <div className="boats-masthead-panel">
        <CompassRose />
        <p className="boats-kicker">Classifieds · Private sellers</p>
        <div className="boats-masthead-title">
          {browsing ? <h1>Boats for Sale</h1> : <p className="boats-display">Boats for Sale</p>}
          <p>Free advertisements from people selling their own boats. No commission, and the seller’s email stays private.</p>
        </div>
        <nav className="boats-subnav" aria-label="Boats for Sale">
          <Link aria-current={browsing ? "page" : undefined} href="/boats-for-sale">Browse</Link>
          <Link aria-current={listingForm ? "page" : undefined} href="/boats-for-sale/list-your-boat">List your boat free</Link>
          <Link href={boatsForSaleNavigationLink.href === path ? "/boats-for-sale#grounds" : "/boats-for-sale#grounds"}>Cruising grounds</Link>
          <Link href="/guides/solent-marina-guide">Marina guide</Link>
        </nav>
      </div>
    </header>
  );
}

export function CompassRose() {
  return (
    <svg className="boats-compass" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="40" cy="40" r="4" fill="currentColor" />
      <path d="M40 12 L44 40 L40 36 L36 40 Z" fill="currentColor" />
      <path d="M40 68 L36 40 L40 44 L44 40 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M12 40 L40 36 L36 40 L40 44 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M68 40 L40 44 L44 40 L40 36 Z" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
