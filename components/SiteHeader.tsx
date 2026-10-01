import Link from "next/link";
import { boatsForSaleNavigationLink, publicNavigationLinks } from "../content/sections";

export function SiteHeader({
  current = "",
  label = "Primary navigation",
}: {
  current?: string;
  label?: string;
}) {
  return (
    <header className="site-mast">
      <div className="site-mast-brand">
        <Link href="/" className="brand-lockup dark" aria-label="Old Sea Dogs home">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <Link className="site-mast-search" href="/search">Search</Link>
      </div>
      <nav aria-label={label} className="site-mast-nav">
        {publicNavigationLinks.map((link) => {
          const boats = link.slug === boatsForSaleNavigationLink.slug;
          return (
            <Link
              aria-current={current === link.slug ? "page" : undefined}
              className={boats ? "is-boats" : undefined}
              href={link.href}
              key={link.slug}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
