"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AdSenseUnitProps = {
  clientId: string;
  enabled: boolean;
  format?: "auto" | "fluid" | "horizontal" | "rectangle" | "vertical";
  label?: string;
  placement: string;
  responsive?: boolean;
  showPlaceholder?: boolean;
  slotId: string;
  className?: string;
};

type ConsentChoice = {
  ads?: boolean;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const consentStorageKey = "oldseadogs_cookie_consent_v1";
const consentUpdatedEvent = "oldseadogs:cookie-consent-updated";
const adsenseUnitsSuspendedForQualityRecovery = true;

function isPrivatePath(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/editor") ||
    pathname.includes("/preview")
  );
}

function hasAdvertisingConsent() {
  try {
    const raw = window.localStorage.getItem(consentStorageKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as ConsentChoice;
    return Boolean(parsed.ads);
  } catch {
    return false;
  }
}

export function AdSenseUnit({
  clientId,
  enabled,
  format = "auto",
  label = "Advertisement",
  placement,
  responsive = true,
  showPlaceholder = false,
  slotId,
  className = "",
}: AdSenseUnitProps) {
  const pathname = usePathname();
  const adRef = useRef<HTMLModElement>(null);
  const hasPushedRef = useRef(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const canRenderRealAd = enabled && Boolean(clientId) && Boolean(slotId);
  const shouldHide =
    adsenseUnitsSuspendedForQualityRecovery ||
    isPrivatePath(pathname) ||
    (!canRenderRealAd && !showPlaceholder);

  useEffect(() => {
    if (shouldHide) return;

    function refreshConsent() {
      setHasConsent(hasAdvertisingConsent());
    }

    refreshConsent();
    window.addEventListener("storage", refreshConsent);
    window.addEventListener("focus", refreshConsent);
    window.addEventListener(consentUpdatedEvent, refreshConsent);
    return () => {
      window.removeEventListener("storage", refreshConsent);
      window.removeEventListener("focus", refreshConsent);
      window.removeEventListener(consentUpdatedEvent, refreshConsent);
    };
  }, [shouldHide]);

  useEffect(() => {
    if (shouldHide) return;
    const adNode = adRef.current;
    if (!adNode) return;

    if (!("IntersectionObserver" in window)) {
      const timer = globalThis.setTimeout(() => setIsVisible(true), 0);
      return () => globalThis.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(adNode);
    return () => observer.disconnect();
  }, [shouldHide]);

  useEffect(() => {
    if (!canRenderRealAd || !hasConsent || !isVisible || hasPushedRef.current) return;
    const adNode = adRef.current;
    if (!adNode || adNode.dataset.adsensePushed === "true") return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      adNode.dataset.adsensePushed = "true";
      hasPushedRef.current = true;
    } catch (error) {
      console.warn("OldSeaDogs AdSense unit could not be requested", error);
    }
  }, [canRenderRealAd, hasConsent, isVisible]);

  if (shouldHide) {
    return null;
  }

  const classes = [
    "adsense-unit",
    `adsense-unit--${format}`,
    hasConsent ? "adsense-unit--consented" : "adsense-unit--waiting",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} data-adsense-placement={placement} aria-label={label}>
      <p className="adsense-label">{label}</p>
      {canRenderRealAd ? (
        <ins
          ref={adRef}
          className="adsbygoogle"
          data-ad-client={clientId}
          data-ad-format={format}
          data-ad-slot={slotId}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      ) : (
        <div className="adsense-placeholder" role="note">
          <strong>AdSense slot ready</strong>
          <span>Add the {placement} slot ID in the server environment.</span>
        </div>
      )}
    </aside>
  );
}
