import Link from "next/link";
import { headers } from "next/headers";

const requestPathHeader = "x-oldseadogs-request-path";

export async function BoatsMasthead() {
  const requestHeaders = await headers();
  const path = requestHeaders.get(requestPathHeader) || "/boats-for-sale";
  const browsing = path === "/boats-for-sale" || (path.startsWith("/boats-for-sale/") && !path.startsWith("/boats-for-sale/list-your-boat") && !path.startsWith("/boats-for-sale/manage") && !path.startsWith("/boats-for-sale/verify") && !path.startsWith("/boats-for-sale/keep") && !path.startsWith("/boats-for-sale/relist"));
  const listingForm = path.startsWith("/boats-for-sale/list-your-boat");

  return (
    <nav className="boats-subnav" aria-label="Boats for Sale">
      <Link aria-current={browsing && !listingForm ? "page" : undefined} href="/boats-for-sale">Browse boats</Link>
      <Link aria-current={listingForm ? "page" : undefined} className="boats-subnav-button" href="/boats-for-sale/list-your-boat">List your boat free</Link>
    </nav>
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
