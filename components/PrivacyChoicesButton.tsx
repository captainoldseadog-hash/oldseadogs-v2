"use client";

import { openOldSeaDogsPrivacyChoices } from "./CookieConsent";

export function PrivacyChoicesButton() {
  return (
    <button
      className="privacy-choices-footer-button"
      onClick={openOldSeaDogsPrivacyChoices}
      type="button"
    >
      Privacy choices
    </button>
  );
}
