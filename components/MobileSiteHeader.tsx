"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { boatsForSaleNavigationLink, marinaGuideNavigationLink, oldSeaDogsSections } from "../content/sections";

const guideLinks = [
  { href: "/guides", label: "All Guides" },
  { href: "/guides/solent", label: "The Solent" },
  marinaGuideNavigationLink,
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
          <Link className="mobile-search-link" href="/search" onClick={closeMenu}>Search</Link>
          <button
            aria-controls={menuId}
            aria-expanded={open}
            className="mobile-menu-toggle"
            onClick={() => setOpen((current) => !current)}
            ref={toggleRef}
            type="button"
          >
            {open ? "Close" : "Menu"}
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
