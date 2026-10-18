"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isAdsenseLoaderPath } from "../lib/route-boundaries";

type AdSenseLoaderProps = {
  enabled: boolean;
  src: string;
};

function matchingScripts(src: string) {
  const absoluteSrc = new URL(src, window.location.origin).href;
  return [...document.querySelectorAll<HTMLScriptElement>("script[src]")].filter((script) =>
    script.getAttribute("src") === src || script.src === absoluteSrc
  );
}

export function AdSenseLoader({ enabled, src }: AdSenseLoaderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !src) return;
    const present = matchingScripts(src);
    const allow = enabled && isAdsenseLoaderPath(pathname);
    if (!allow) {
      for (const script of present) script.remove();
      return;
    }
    if (present.length > 0) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, [enabled, pathname, src]);

  return null;
}
