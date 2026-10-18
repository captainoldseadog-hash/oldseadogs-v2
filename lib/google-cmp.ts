// Google's free AdSense CMP is the Funding Choices / Privacy & messaging
// consent message. The account-side message is TCF-compatible and updates
// Consent Mode itself. This module only decides when that script is allowed
// to load and how analytics should follow its consent-mode values.

export const eeaUkAndSwitzerlandRegions = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
] as const;

const consentModeStatusFallback = {
  unknown: 0,
  granted: 1,
  denied: 2,
  notApplicable: 3,
  notConfigured: 4,
} as const;

const consentModeStatusNames = {
  unknown: ["UNKNOWN", "CONSENT_MODE_PURPOSE_STATUS_UNKNOWN"],
  granted: ["GRANTED", "CONSENT_MODE_PURPOSE_STATUS_GRANTED"],
  denied: ["DENIED", "CONSENT_MODE_PURPOSE_STATUS_DENIED"],
  notApplicable: ["NOT_APPLICABLE", "CONSENT_MODE_PURPOSE_STATUS_NOT_APPLICABLE"],
  notConfigured: ["NOT_CONFIGURED", "CONSENT_MODE_PURPOSE_STATUS_NOT_CONFIGURED"],
} as const;

export type AnalyticsConsentDecision = "granted" | "denied" | "use-stored-choice" | "wait";

export type GoogleConsentModeValues = {
  adStoragePurposeConsentStatus?: number;
  adUserDataPurposeConsentStatus?: number;
  adPersonalizationPurposeConsentStatus?: number;
  analyticsStoragePurposeConsentStatus?: number;
};

export type TcfData = {
  gdprApplies?: boolean;
  eventStatus?: string;
  listenerId?: number;
};

export type GoogleFcApi = {
  callbackQueue?: Array<Record<string, () => void> | (() => void)>;
  showRevocationMessage?: () => void;
  getGoogleConsentModeValues?: () => GoogleConsentModeValues;
  ConsentModePurposeStatusEnum?: Record<string, number>;
};

type GoogleTagCommand = [command: string, action: string | Date, parameters?: Record<string, unknown>];

declare global {
  interface Window {
    googlefc?: GoogleFcApi;
    __tcfapi?: (
      command: string,
      version: number,
      callback: (tcData: TcfData, success: boolean) => void,
      listenerId?: number,
    ) => void;
    __oldSeaDogsUseGoogleCmp?: boolean;
    __oldSeaDogsConsentPushWrapped?: boolean;
    __oldSeaDogsApplyingAnalyticsConsent?: boolean;
    __oldSeaDogsApplyAnalyticsConsent?: (allowed: boolean) => void;
    __oldSeaDogsSyncGoogleCmpAnalytics?: () => void;
  }
}

export function isGoogleCmpEnabled(value: string | undefined) {
  return value === "true";
}

export function fundingChoicesMessageSrc(publisherId = "ca-pub-7278382533036873") {
  const fundingChoicesId = publisherId.trim().replace(/^ca-/, "");
  return `https://fundingchoicesmessages.google.com/i/${fundingChoicesId}?ers=1`;
}

export function googleCmpConsentDefaultScript() {
  const denied = 'analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"';
  const region = JSON.stringify([...eeaUkAndSwitzerlandRegions]);
  return [
    "window.dataLayer=window.dataLayer||[];",
    "window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};",
    `window.gtag("consent","default",{${denied},region:${region},wait_for_update:500});`,
    `window.gtag("consent","default",{${denied}});`,
    "window.__oldSeaDogsGoogleConsentDefaulted=true;",
    "window.googlefc=window.googlefc||{};",
    "window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];",
  ].join("");
}

// Google's published tag. It creates the hidden googlefcPresent frame before
// the async Funding Choices script finishes, which is the race their snippet
// is written to close.
export const googleFcPresentSnippet = "(function(){function signalGooglefcPresent(){if(!window.frames['googlefcPresent']){if(document.body){const iframe=document.createElement('iframe');iframe.style='width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;';iframe.style.display='none';iframe.name='googlefcPresent';document.body.appendChild(iframe);}else{setTimeout(signalGooglefcPresent,0);}}}signalGooglefcPresent();})();";

function consentModeStatusValue(
  enumObject: Record<string, number> | undefined,
  name: keyof typeof consentModeStatusFallback,
) {
  for (const key of consentModeStatusNames[name]) {
    const value = enumObject?.[key];
    if (typeof value === "number") return value;
  }
  return consentModeStatusFallback[name];
}

export function analyticsDecisionFromConsentModeStatus(
  status: number | null | undefined,
  enumObject?: Record<string, number>,
): AnalyticsConsentDecision {
  if (typeof status !== "number") return "wait";
  if (status === consentModeStatusValue(enumObject, "unknown")) return "wait";
  if (status === consentModeStatusValue(enumObject, "granted")) return "granted";
  if (status === consentModeStatusValue(enumObject, "denied")) return "denied";
  if (
    status === consentModeStatusValue(enumObject, "notApplicable") ||
    status === consentModeStatusValue(enumObject, "notConfigured")
  ) {
    return "use-stored-choice";
  }
  return "wait";
}

export function analyticsStorageFromConsentCommand(command: unknown): boolean | null {
  if (!command || typeof command !== "object") return null;
  const record = command as { 0?: unknown; 1?: unknown; 2?: { analytics_storage?: unknown } };
  if (record[0] !== "consent" || record[1] !== "update") return null;
  if (record[2]?.analytics_storage === "granted") return true;
  if (record[2]?.analytics_storage === "denied") return false;
  return null;
}

function ensureGoogleTagQueue() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...command: GoogleTagCommand) => {
    window.dataLayer?.push(command);
  });
  return window.gtag;
}

export function applyGoogleConsentDefaults(regional: boolean) {
  if (typeof window === "undefined" || window.__oldSeaDogsGoogleConsentDefaulted) return;
  const denied = {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  };
  const gtag = ensureGoogleTagQueue();
  if (regional) {
    gtag("consent", "default", {
      ...denied,
      region: [...eeaUkAndSwitzerlandRegions],
      wait_for_update: 500,
    });
    gtag("consent", "default", denied);
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  } else {
    gtag("consent", "default", {
      ...denied,
      wait_for_update: 500,
    });
  }
  window.__oldSeaDogsGoogleConsentDefaulted = true;
}
