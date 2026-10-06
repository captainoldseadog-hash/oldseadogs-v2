"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { boatsForSaleNavigationLink, oldSeaDogsSections, throughTheLensNavigationLink } from "../content/sections";

const guideLinks = [
  { href: "/guides", label: "All Guides" },
  { href: "/guides/solent", label: "The Solent" },
  { href: "/guides/poole-harbour", label: "Poole Harbour" },
  { href: "/guides/chichester-harbour", label: "Chichester Harbour" },
];

export function MobileSiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

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

  return (
    <header className={`mobile-site-header ${open ? "is-open" : ""}`}>
      <div className="mobile-header-bar">
        <Link className="mobile-brand" href="/" aria-label="Old Sea Dogs home" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="mobile-header-actions">
          <Link className="mobile-search-link" href="/search" onClick={closeMenu}>
            <SearchIcon />
            <span>Search</span>
          </Link>
          <button
            aria-controls={menuId}
            aria-expanded={open}
            className="mobile-menu-toggle"
            onClick={() => setOpen((current) => !current)}
            ref={toggleRef}
            type="button"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
            <span>{open ? "Close" : "Menu"}</span>
          </button>
        </div>
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
