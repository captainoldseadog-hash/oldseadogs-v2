"use client";

import type { ReactNode } from "react";
import { trackSocialEvent } from "./social-tracking";

type TrackedExternalLinkProps = {
  href: string;
  platform: string;
  children: ReactNode;
  className?: string;
  hidden?: boolean;
  rel?: string;
};

export function TrackedExternalLink({
  href,
  platform,
  children,
  className,
  hidden = false,
  rel = "noopener noreferrer",
}: TrackedExternalLinkProps) {
  return (
    <a
      className={className}
      hidden={hidden}
      href={href}
      rel={rel}
      target="_blank"
      onClick={() =>
        void trackSocialEvent({
          type: "outbound_click",
          platform,
          target: href,
        })
      }
    >
      {children}
    </a>
  );
}
