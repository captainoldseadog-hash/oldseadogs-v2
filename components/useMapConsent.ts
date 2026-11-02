"use client";

import { useEffect, useState } from "react";
import { consentCookieName, consentStorageKey, legacyConsentCookieName, legacyConsentStorageKey, parseConsentChoice, type ConsentChoice } from "../lib/cookie-consent.ts";

/** Fired by CookieConsent after any save (accept, reject or custom). */
export const consentUpdatedEvent = "oldseadogs:cookie-consent-updated";

function cookieChoice(name: string) {
  const prefix = `${name}=`;
  const raw = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix))?.slice(prefix.length);
  if (!raw) return null;
  try { return parseConsentChoice(decodeURIComponent(raw)); } catch { return null; }
}

export function readConsentChoice(): ConsentChoice | null {
  try {
    const local = parseConsentChoice(window.localStorage.getItem(consentStorageKey)) || parseConsentChoice(window.localStorage.getItem(legacyConsentStorageKey));
    if (local) return local;
  } catch {
    // Storage can be blocked; fall back to the first-party cookie.
  }
  return cookieChoice(consentCookieName) || cookieChoice(legacyConsentCookieName);
}

/** Accepted = the visitor opted in to analytics or ads. No choice, or "reject all", keeps third-party embeds behind a click. */
export function consentAccepted(choice: ConsentChoice | null) {
  return Boolean(choice && (choice.analytics || choice.ads));
}

export function useConsentAccepted() {
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const update = () => setAccepted(consentAccepted(readConsentChoice()));
    update();
    window.addEventListener(consentUpdatedEvent, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(consentUpdatedEvent, update); window.removeEventListener("storage", update); };
  }, []);
  return accepted;
}
