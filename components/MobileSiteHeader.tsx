"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { boatsForSaleNavigationLink, oldSeaDogsSections, throughTheLensNavigationLink } from "../content/sections";

export function MobileSiteHeader({
  guideLinks,
}: {
  guideLinks: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.getElementById(menuId)?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuId, open]);

  function closeMenu() {
    setOpen(false);
  }

  const home = pathname === "/";
  const guides = pathname === "/guides" || pathname.startsWith("/guides/");
  const boats = pathname === "/boats-for-sale" || pathname.startsWith("/boats-for-sale/");
  const lens = pathname === "/through-the-lens" || pathname.startsWith("/through-the-lens/");

  return (
    <header className={`mobile-site-header ${open ? "is-open" : ""}`}>
      <div className="mobile-header-bar">
        <Link className="mobile-brand" href="/" aria-label="Old Sea Dogs home" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <Link className="mobile-search-link" href="/search" aria-label="Search" onClick={closeMenu}>
          <SearchIcon />
          <span className="tiktok-sr-only">Search</span>
        </Link>
      </div>
      <div className="mobile-menu-scrim" hidden={!open} onClick={() => setOpen(false)} />
      <nav aria-label="Mobile navigation" className="mobile-menu-panel" hidden={!open} id={menuId}>
        <div>
          <p>Sections</p>
          {oldSeaDogsSections.map((section) => (
            <Link href={`/${section.slug}`} key={section.slug} onClick={closeMenu}>{section.label}</Link>
          ))}
        </div>
        <div>
          <p>Gallery</p>
          <Link className="mobile-menu-span" href={throughTheLensNavigationLink.href} onClick={closeMenu}>{throughTheLensNavigationLink.label}</Link>
        </div>
        <div>
          <p>Guides</p>
          {guideLinks.map((link) => <Link href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}
        </div>
        <div>
          <p>Classifieds</p>
          <Link href={boatsForSaleNavigationLink.href} onClick={closeMenu}>{boatsForSaleNavigationLink.label}</Link>
          <Link href="/boats-for-sale/list-your-boat" onClick={closeMenu}>List your boat free</Link>
        </div>
        <Link className="mobile-menu-search" href="/search" onClick={closeMenu}>Search Old Sea Dogs</Link>
      </nav>
      <nav aria-label="Primary" className="mobile-tab-bar">
        <Link aria-current={home ? "page" : undefined} href="/" onClick={closeMenu}>
          <HomeIcon />
          <span>Home</span>
        </Link>
        <Link aria-current={guides ? "page" : undefined} href="/guides" onClick={closeMenu}>
          <GuidesIcon />
          <span>Guides</span>
        </Link>
        <Link aria-current={boats ? "page" : undefined} href="/boats-for-sale" onClick={closeMenu}>
          <BoatIcon />
          <span>Boats</span>
        </Link>
        <Link aria-current={lens ? "page" : undefined} href={throughTheLensNavigationLink.href} onClick={closeMenu}>
          <LensIcon />
          <span>Lens</span>
        </Link>
        <button
          aria-controls={menuId}
          aria-expanded={open}
          className={`mobile-menu-toggle ${open ? "is-current" : ""}`}
          onClick={() => setOpen((current) => !current)}
          ref={toggleRef}
          type="button"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          <span>Menu</span>
        </button>
      </nav>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <circle cx="11" cy="11" fill="none" r="6.25" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <path d="M6 6.5 18 18.5M18 6.5 6 18.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <path d="M4 11 12 4l8 7v9H4z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function GuidesIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <path d="M12 3v14M7 7h10M5 14a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function BoatIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <path d="M12 3v13M12 5l6 9h-6M10 7l-5 7h5M4 18c2 2 4 2 8 0s6-2 8 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg aria-hidden="true" className="mobile-tool-icon" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
