import Link from "next/link";
import { oldSeaDogsSocialPlatforms, type OldSeaDogsSocialPlatform } from "../content/social-links";
import { SocialIconLinks } from "./SocialIconLinks";

type SocialFollowBlockProps = {
  title?: string;
  eyebrow?: string;
  body?: string;
  links?: OldSeaDogsSocialPlatform[];
  compact?: boolean;
  showSocialPageLink?: boolean;
};

export function SocialFollowBlock({
  title = "Follow Old Sea Dogs",
  eyebrow = "Social",
  body = "Old Sea Dogs is now the hub for our stories, shorts, race notes, photos and dockside updates across the main social channels.",
  links = oldSeaDogsSocialPlatforms,
  compact = false,
  showSocialPageLink = true,
}: SocialFollowBlockProps) {
  return (
    <section className={`social-follow-block ${compact ? "compact" : ""}`.trim()} aria-label={title}>
      <div className="social-follow-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{body}</p>
        {showSocialPageLink ? (
          <Link href="/social" className="button-secondary">
            Open social hub
          </Link>
        ) : null}
      </div>
      <SocialIconLinks links={links} />
    </section>
  );
}
