import Link from "next/link";
import { PrivacyChoicesButton } from "./PrivacyChoicesButton";
import { SocialIconLinks } from "./SocialIconLinks";
import {
  oldSeaDogsSocialPlatforms,
  type OldSeaDogsSocialPlatform,
} from "../content/social-links";
import { defaultSettings, getSiteSettings, type SiteSettings } from "../lib/site-content";

type FooterLink = {
  href: string;
  label: string;
};

type SiteFooterProps = {
  brandName?: string;
  footerText?: string;
  extraLinks?: FooterLink[];
};

const policyLinks: FooterLink[] = [
  { href: "/search", label: "Search" },
  { href: "/guides", label: "Guides" },
  { href: "/social", label: "Social" },
  { href: "/about", label: "About Us" },
  { href: "/authors/michael-hodges", label: "Author Profile" },
  { href: "/editorial-standards", label: "Editorial Standards" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/terms", label: "Terms of Use" },
];

const socialSettingKeys: Record<OldSeaDogsSocialPlatform["key"], keyof SiteSettings> = {
  tiktok: "socialTikTok",
  instagram: "socialInstagram",
  facebook: "socialFacebook",
  x: "socialX",
  youtube: "socialYouTube",
  threads: "socialThreads",
  linkedin: "socialLinkedIn",
};

function socialHref(value: string, fallbackUrl: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallbackUrl;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallbackUrl;
}

function linksFromSettings(settings: SiteSettings) {
  return oldSeaDogsSocialPlatforms
    .map((platform) => ({
      ...platform,
      href: socialHref(settings[socialSettingKeys[platform.key]], platform.href),
    }))
    .filter((platform) => platform.href);
}

export async function SiteFooter({
  brandName,
  footerText,
  extraLinks = [],
}: SiteFooterProps) {
  const settings = await getSiteSettings();
  const footerBrandName = brandName ?? settings.brandName ?? defaultSettings.brandName;
  const footerCopy = footerText ?? settings.footerText ?? defaultSettings.footerText;
  const seen = new Set<string>();
  const links = [...extraLinks, ...policyLinks].filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
  const socialLinks = linksFromSettings(settings);

  return (
    <footer className="site-footer">
      <div>
        <p className="brand-footer">
          <span className="brand-mark footer-mark" aria-hidden="true" />
          <span>{footerBrandName}</span>
        </p>
        <p>{footerCopy}</p>
        {socialLinks.length > 0 ? (
          <SocialIconLinks compact links={socialLinks} />
        ) : null}
      </div>
      <div className="footer-links">
        {links.map((link) =>
          link.href.startsWith("#") ? (
            <a href={link.href} key={`${link.href}-${link.label}`}>
              {link.label}
            </a>
          ) : (
            <Link href={link.href} key={`${link.href}-${link.label}`}>
              {link.label}
            </Link>
          )
        )}
        <PrivacyChoicesButton />
      </div>
    </footer>
  );
}
