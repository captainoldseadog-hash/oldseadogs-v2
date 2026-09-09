"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  consentCookieName,
  consentCookieAttributes,
  consentMaxAgeSeconds,
  consentStorageKey,
  legacyConsentStorageKey,
  parseConsentChoice,
  type ConsentChoice,
} from "../lib/cookie-consent.ts";
import { isEditorPath } from "../lib/route-boundaries";

type CookieConsentProps = {
  ga4Id?: string;
  adsenseClientId?: string;
  adsenseEnabled?: boolean;
};

const openPrivacyChoicesEvent = "oldseadogs:open-privacy-choices";
const consentUpdatedEvent = "oldseadogs:cookie-consent-updated";
const storageKey = consentStorageKey;

type GoogleTagCommand = [command: string, action: string | Date, parameters?: Record<string, unknown>];

declare global {
  interface Window {
    __oldSeaDogsGoogleConsentDefaulted?: boolean;
    dataLayer?: GoogleTagCommand[];
    gtag?: (...command: GoogleTagCommand) => void;
  }
}

function readCookieChoice() {
  const prefix = `${consentCookieName}=`;
  const raw = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
  if (!raw) return null;
  try {
    return parseConsentChoice(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

function persistChoice(nextChoice: ConsentChoice) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(nextChoice));
  } catch {
    // A durable first-party cookie remains available when storage is restricted.
  }
  document.cookie = `${consentCookieName}=${encodeURIComponent(JSON.stringify(nextChoice))}; ${consentCookieAttributes(window.location, consentMaxAgeSeconds)}`;
}

function readStoredChoice(): ConsentChoice | null {
  let localChoice: ConsentChoice | null = null;
  try {
    localChoice = parseConsentChoice(window.localStorage.getItem(consentStorageKey))
      || parseConsentChoice(window.localStorage.getItem(legacyConsentStorageKey));
  } catch {
    localChoice = null;
  }
  const choice = localChoice || readCookieChoice();
  if (choice) {
    persistChoice(choice);
    try {
      window.localStorage.removeItem(legacyConsentStorageKey);
    } catch {
      // The normalized cookie and current storage key are already persisted.
    }
  }
  return choice;
}

function saveChoice(choice: Pick<ConsentChoice, "analytics" | "ads">) {
  const nextChoice: ConsentChoice = {
    ...choice,
    decidedAt: new Date().toISOString(),
    version: 1,
  };
  persistChoice(nextChoice);
  window.dispatchEvent(new Event(consentUpdatedEvent));
  return nextChoice;
}

function loadScript(id: string, src: string, crossOrigin?: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  if (crossOrigin) script.crossOrigin = crossOrigin;
  script.src = src;
  document.head.appendChild(script);
}

function loadInlineScript(id: string, source: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.text = source;
  document.head.appendChild(script);
}

function ensureGoogleTagQueue() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...command: GoogleTagCommand) => {
    window.dataLayer?.push(command);
  });
  return window.gtag;
}

function ensureGoogleConsentDefaults() {
  if (window.__oldSeaDogsGoogleConsentDefaulted) return;
  ensureGoogleTagQueue()("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  window.__oldSeaDogsGoogleConsentDefaulted = true;
}

function setGoogleAnalyticsDisabled(ga4Id: string, disabled: boolean) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${ga4Id}`] = disabled;
}

function updateGoogleConsent(choice: Pick<ConsentChoice, "analytics" | "ads">) {
  ensureGoogleTagQueue()("consent", "update", {
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: choice.ads ? "granted" : "denied",
    ad_user_data: choice.ads ? "granted" : "denied",
    ad_personalization: choice.ads ? "granted" : "denied",
  });
}

function removeGoogleAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name?.startsWith("_ga")));
  const baseDomain = window.location.hostname.replace(/^www\./i, "");
  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    if (baseDomain.includes(".")) {
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${baseDomain}; SameSite=Lax`;
    }
  }
}

export function CookieConsent({
  ga4Id,
  adsenseClientId,
  adsenseEnabled = false,
}: CookieConsentProps) {
  const pathname = usePathname();
  const isEditorRoute = pathname ? isEditorPath(pathname) : false;
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const lastTrackedPath = useRef("");
  const hasOptionalServices = Boolean(ga4Id || (adsenseEnabled && adsenseClientId));

  useEffect(() => {
    ensureGoogleConsentDefaults();
    const timer = window.setTimeout(() => {
      const storedChoice = readStoredChoice();
      setChoice(storedChoice);
      setAnalytics(Boolean(storedChoice?.analytics));
      setAds(Boolean(storedChoice?.ads));
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!choice || isEditorRoute) return;

    updateGoogleConsent(choice);

    if (ga4Id) {
      setGoogleAnalyticsDisabled(ga4Id, !choice.analytics);
      if (!choice.analytics) removeGoogleAnalyticsCookies();
    }

    if (choice.analytics && ga4Id) {
      loadScript("oldseadogs-ga4", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`);
      loadInlineScript(
        "oldseadogs-ga4-init",
        `window.gtag("js",new Date());window.gtag("config","${ga4Id}",{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:false});`
      );
    }

    if (choice.ads && adsenseEnabled && adsenseClientId) {
      loadScript(
        "oldseadogs-adsense",
        `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`,
        "anonymous"
      );
    }
  }, [adsenseClientId, adsenseEnabled, choice, ga4Id, isEditorRoute]);

  useEffect(() => {
    if (!choice?.analytics || !ga4Id || isEditorRoute || !pathname) {
      lastTrackedPath.current = "";
      return;
    }
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    ensureGoogleTagQueue()("event", "page_view", {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
    });
  }, [choice?.analytics, ga4Id, isEditorRoute, pathname]);

  useEffect(() => {
    function openPreferences() {
      const storedChoice = readStoredChoice();
      setChoice(storedChoice);
      setAnalytics(Boolean(storedChoice?.analytics));
      setAds(Boolean(storedChoice?.ads));
      setShowPreferences(true);
    }

    window.addEventListener(openPrivacyChoicesEvent, openPreferences);
    return () => window.removeEventListener(openPrivacyChoicesEvent, openPreferences);
  }, []);

  const statusText = useMemo(() => {
    if (!hasOptionalServices) return "Only essential cookies are active.";
    if (!choice) return "Choose how Old Sea Dogs may use optional cookies.";
    if (choice.analytics && choice.ads) return "Analytics and advertising cookies accepted.";
    if (choice.analytics) return "Analytics cookies accepted. Advertising cookies rejected.";
    if (choice.ads) return "Advertising cookies accepted. Analytics cookies rejected.";
    return "Non-essential cookies rejected.";
  }, [choice, hasOptionalServices]);

  function acceptAll() {
    const nextChoice = saveChoice({ analytics: true, ads: true });
    setChoice(nextChoice);
    setAnalytics(true);
    setAds(true);
    setShowPreferences(false);
  }

  function rejectAll() {
    const nextChoice = saveChoice({ analytics: false, ads: false });
    setChoice(nextChoice);
    setAnalytics(false);
    setAds(false);
    setShowPreferences(false);
  }

  function savePreferences() {
    const nextChoice = saveChoice({ analytics, ads });
    setChoice(nextChoice);
    setShowPreferences(false);
  }

  if (isEditorRoute) {
    return null;
  }

  if (!isReady) {
    return null;
  }

  if (choice && !showPreferences) {
    return null;
  }

  return (
    <section className="cookie-consent" aria-label="Cookie choices">
      <div>
        <p className="eyebrow">Privacy choices</p>
        <h2>Cookies on Old Sea Dogs</h2>
        <p className="cookie-status">{statusText}</p>
        <p>
          Essential cookies keep the site and editor secure. Analytics and
          advertising only load after your choice allows them.
        </p>
        <div className="cookie-consent-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/cookie-policy">Cookie Policy</Link>
        </div>
        {showPreferences ? (
          <div className="cookie-preferences" aria-label="Cookie preferences">
            <div className="cookie-essential-row">
              <span>Essential cookies</span>
              <strong>Always on</strong>
            </div>
            <label>
              <input
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                type="checkbox"
              />
              Analytics cookies
            </label>
            <label>
              <input
                checked={ads}
                onChange={(event) => setAds(event.target.checked)}
                type="checkbox"
              />
              Advertising cookies, including Google AdSense when enabled
            </label>
          </div>
        ) : null}
      </div>
      <div className="cookie-actions">
        <button className="cookie-action-primary" type="button" onClick={acceptAll}>
          Accept all
        </button>
        <button type="button" onClick={rejectAll}>
          Reject non-essential
        </button>
        {showPreferences ? (
          <button type="button" onClick={savePreferences}>
            Save choices
          </button>
        ) : (
          <button type="button" onClick={() => setShowPreferences(true)}>
            Manage choices
          </button>
        )}
      </div>
    </section>
  );
}

export function openOldSeaDogsPrivacyChoices() {
  window.dispatchEvent(new Event(openPrivacyChoicesEvent));
}
