import type { Advert } from "../lib/site-content";
import { ResponsiveStoryImage } from "./ResponsiveStoryImage";

type AdBlockProps = {
  ad?: Advert | null;
  className?: string;
  reserveSpace?: boolean;
  placeholderTitle?: string;
  ctaLabel?: string;
  showSponsor?: boolean;
};

function displayLinkLabel(linkUrl: string) {
  try {
    const url = new URL(linkUrl);
    const host = url.hostname.startsWith("www.") ? url.hostname : `www.${url.hostname}`;
    return `Visit ${host}`;
  } catch {
    return "Visit advertiser";
  }
}

function dayNumber(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000
  );
}

export function pickAdvertForPlacement(
  ads: Advert[],
  placement: string | string[],
  date = new Date()
) {
  const placements = Array.isArray(placement) ? placement : [placement];
  const candidates = ads.filter((ad) => placements.includes(ad.placement));
  if (candidates.length === 0) return null;
  return candidates[dayNumber(date) % candidates.length];
}

export function AdBlock({
  ad,
  className = "",
  reserveSpace = false,
  placeholderTitle = "Advertising space available",
  ctaLabel,
  showSponsor = false,
}: AdBlockProps) {
  const classes = ["ad-card", ad && !ad.imageUrl ? "no-ad-image" : "", className].filter(Boolean).join(" ");

  if (!ad) {
    if (!reserveSpace) return null;
    return (
      <aside className={`${classes} empty-ad`} aria-label="Advertisement space">
        <div>
          <p>Advertisement</p>
          <h3>{placeholderTitle}</h3>
          <span>Reserved for Old Sea Dogs sponsors, affiliates and marine advertisers.</span>
        </div>
      </aside>
    );
  }

  if ((ad.kind === "network" || ad.kind === "adsense") && ad.code) {
    return (
      <aside
        className={`${classes} network-ad`}
        aria-label={ad.label || "Advertisement"}
        dangerouslySetInnerHTML={{ __html: ad.code }}
      />
    );
  }

  const body = (
    <>
      {ad.imageUrl ? (
        <ResponsiveStoryImage
          alt={ad.title || ad.label}
          className="ad-image"
          sizes="(max-width: 640px) calc(100vw - 40px), 580px"
          src={ad.imageUrl}
        />
      ) : null}
      <div>
        <p>Advertisement</p>
        {ad.title || ad.label ? <h3>{ad.title || ad.label}</h3> : null}
        {ad.body ? <span>{ad.body}</span> : null}
        {showSponsor && ad.label ? <em>Sponsored by {ad.label}</em> : null}
        {ad.linkUrl ? <strong>{ctaLabel || displayLinkLabel(ad.linkUrl)}</strong> : null}
      </div>
    </>
  );

  return (
    <aside className={classes} aria-label={ad.label || "Advertisement"}>
      {ad.linkUrl ? (
        <a className="ad-card-link" href={ad.linkUrl} rel="sponsored noopener noreferrer" target="_blank">
          {body}
        </a>
      ) : (
        body
      )}
    </aside>
  );
}
