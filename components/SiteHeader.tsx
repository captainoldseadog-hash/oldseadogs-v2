import Link from "next/link";
import {
  boatsForSaleNavigationLink,
  desktopNavigationRowBreak,
  publicNavigationLinks,
} from "../content/sections";

const desktopNavigationRows = [
  publicNavigationLinks.slice(0, desktopNavigationRowBreak),
  publicNavigationLinks.slice(desktopNavigationRowBreak),
];

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
        {desktopNavigationRows.map((row) => (
          <div className="site-mast-nav-row" key={row[0].slug}>
            {row.map((link) => {
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
          </div>
        ))}
      </nav>
    </header>
  );
}
