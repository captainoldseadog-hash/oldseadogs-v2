/** Schedule -> homepage headline pick (pure; unit-tested in tests/auto-headline.test.mjs). */
type LeadStory = { promoteToHomepageLead?: boolean; homepageLeadOptOut?: boolean };

export function scheduledStoryWantsHomepageLead(story: LeadStory) {
  return Boolean(story.promoteToHomepageLead) || !story.homepageLeadOptOut;
}

export function pickScheduledHomepageLead<T extends LeadStory & { id: string; slug: string; publishedAt?: string }>(
  publishedStories: T[], pendingId = "", pendingSlug = ""
): T | undefined {
  const isPending = (story: T) => Boolean((pendingId && story.id === pendingId) || (pendingSlug && story.slug === pendingSlug));
  const candidates = publishedStories.filter((story) => isPending(story) || scheduledStoryWantsHomepageLead(story));
  const time = (story: T) => { const t = Date.parse(story.publishedAt || ""); return Number.isFinite(t) ? t : 0; };
  return candidates.reduce<T | undefined>((best, story) => (!best || time(story) >= time(best) ? story : best), undefined);
}

