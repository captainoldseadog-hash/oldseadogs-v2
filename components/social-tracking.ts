export type SocialTrackingType = "social_click" | "outbound_click" | "generated_post";

const cookieConsentStorageKey = "oldseadogs_cookie_consent_v1";

export function hasOldSeaDogsAnalyticsConsent() {
  try {
    const raw = window.localStorage.getItem(cookieConsentStorageKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: unknown };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export async function trackSocialEvent({
  type,
  platform,
  target,
  storySlug,
  requireConsent = true,
}: {
  type: SocialTrackingType;
  platform: string;
  target: string;
  storySlug?: string;
  requireConsent?: boolean;
}) {
  if (requireConsent && !hasOldSeaDogsAnalyticsConsent()) return;

  try {
    await fetch("/api/social/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type,
        platform,
        target,
        storySlug,
      }),
      keepalive: true,
    });
  } catch {
    // Tracking must never interrupt a visitor action.
  }
}
