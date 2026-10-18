"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyGoogleConsentDefaults, googleFcPresentSnippet } from "../lib/google-cmp";
import { isAdsenseLoaderPath } from "../lib/route-boundaries";

type GoogleCmpLoaderProps = {
  enabled: boolean;
  src: string;
};

function matchingScripts(src: string) {
  const absoluteSrc = new URL(src, window.location.origin).href;
  return [...document.querySelectorAll<HTMLScriptElement>("script[src]")].filter((script) =>
    script.getAttribute("src") === src || script.src === absoluteSrc
  );
}

function signalGooglefcPresent() {
  if (document.getElementById("oldseadogs-googlefc-present")) return;
  const script = document.createElement("script");
  script.id = "oldseadogs-googlefc-present";
  script.text = googleFcPresentSnippet;
  document.head.appendChild(script);
}

function removeGoogleCmp(src: string) {
  for (const script of matchingScripts(src)) script.remove();
  document.getElementById("oldseadogs-google-cmp")?.remove();
  document.getElementById("oldseadogs-googlefc-present")?.remove();
  for (const frame of document.querySelectorAll('iframe[name="googlefcPresent"]')) frame.remove();
}

export function GoogleCmpLoader({ enabled, src }: GoogleCmpLoaderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !src) return;
    const allow = enabled && isAdsenseLoaderPath(pathname);
    if (!allow) {
      removeGoogleCmp(src);
      return;
    }
    applyGoogleConsentDefaults(true);
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    signalGooglefcPresent();
    if (matchingScripts(src).length > 0) return;
    const script = document.createElement("script");
    script.async = true;
    script.id = "oldseadogs-google-cmp";
    script.src = src;
    script.onerror = () => {
      script.dataset.cmpFailed = "true";
      window.dispatchEvent(new Event("oldseadogs:google-cmp-unavailable"));
    };
    document.head.appendChild(script);
  }, [enabled, pathname, src]);

  return null;
}
