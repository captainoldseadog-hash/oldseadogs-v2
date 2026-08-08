"use client";

import type { ReactNode } from "react";
import { trackSocialEvent } from "./social-tracking";

type TrackedExternalLinkProps = {
  href: string;
  platform: string;
  children: ReactNode;
  className?: string;
  rel?: string;
};

export function TrackedExternalLink({
  href,
  platform,
  children,
  className,
  rel = "noopener noreferrer",
}: TrackedExternalLinkProps) {
  return (
    <a
      className={className}
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
