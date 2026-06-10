import Link from "next/link";
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

type SocialPlatform = {
  key: keyof Pick<
    SiteSettings,
    "socialFacebook" | "socialInstagram" | "socialX" | "socialYouTube" | "socialLinkedIn"
  >;
  label: string;
  baseUrl: string;
};

const socialPlatforms: SocialPlatform[] = [
  { key: "socialFacebook", label: "Facebook", baseUrl: "https://www.facebook.com/" },
  { key: "socialInstagram", label: "Instagram", baseUrl: "https://www.instagram.com/" },
  { key: "socialX", label: "X", baseUrl: "https://x.com/" },
  { key: "socialYouTube", label: "YouTube", baseUrl: "https://www.youtube.com/" },
  { key: "socialLinkedIn", label: "LinkedIn", baseUrl: "https://www.linkedin.com/company/" },
];

const policyLinks: FooterLink[] = [
  { href: "/search", label: "Search" },
  { href: "/about", label: "About Us" },
  { href: "/authors/michael-hodges", label: "Author Profile" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/terms", label: "Terms of Use" },
];

function socialHref(value: string, baseUrl: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "").replace(/^\/+/, "");
  return `${baseUrl}${handle}`;
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
  const socialLinks = socialPlatforms
    .map((platform) => ({
      label: platform.label,
      href: socialHref(settings[platform.key], platform.baseUrl),
    }))
    .filter((link) => link.href);

  return (
    <footer className="site-footer">
      <div>
        <p className="brand-footer">
          <span className="brand-mark footer-mark" aria-hidden="true" />
          <span>{footerBrandName}</span>
        </p>
        <p>{footerCopy}</p>
        {socialLinks.length > 0 ? (
          <div className="social-links" aria-label="Old Sea Dogs social media">
            {socialLinks.map((link) => (
              <a href={link.href} key={link.label} rel="me noopener noreferrer" target="_blank">
                {link.label}
              </a>
            ))}
          </div>
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
      </div>
    </footer>
  );
}
