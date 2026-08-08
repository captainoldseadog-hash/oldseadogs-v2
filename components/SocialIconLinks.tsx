"use client";

import type { OldSeaDogsSocialPlatform } from "../content/social-links";
import { trackSocialEvent } from "./social-tracking";

type SocialIconLinksProps = {
  links: OldSeaDogsSocialPlatform[];
  className?: string;
  compact?: boolean;
};

export function SocialIconLinks({
  links,
  className = "",
  compact = false,
}: SocialIconLinksProps) {
  return (
    <div className={`social-icon-links ${compact ? "compact" : ""} ${className}`.trim()}>
      {links.map((link) => (
        <a
          href={link.href}
          key={link.key}
          rel="me noopener noreferrer"
          target="_blank"
          title={`${link.label}: ${link.handle}`}
          aria-label={`Follow Old Sea Dogs on ${link.label}`}
          onClick={() =>
            void trackSocialEvent({
              type: "social_click",
              platform: link.label,
              target: link.href,
            })
          }
        >
          <span aria-hidden="true">{link.icon}</span>
          <small>{link.label}</small>
        </a>
      ))}
    </div>
  );
}
