import test from "node:test";
import assert from "node:assert/strict";
import { pickScheduledHomepageLead, scheduledStoryWantsHomepageLead } from "../lib/homepage-lead-pick.ts";
const s = (id, at, extra = {}) => ({ id, slug: id, publishedAt: at, promoteToHomepageLead: false, homepageLeadOptOut: false, ...extra });
test("default ON: untouched scheduled story wants the headline", () => {
  assert.equal(scheduledStoryWantsHomepageLead(s("a", "2026-10-31T06:05:00Z")), true);
  assert.equal(scheduledStoryWantsHomepageLead(s("a", "x", { homepageLeadOptOut: true })), false);
  assert.equal(scheduledStoryWantsHomepageLead(s("a", "x", { homepageLeadOptOut: true, promoteToHomepageLead: true })), true);
});
test("single story promoted; unticked one is not", () => {
  assert.equal(pickScheduledHomepageLead([s("a", "2026-10-31T06:05:00Z")])?.id, "a");
  assert.equal(pickScheduledHomepageLead([s("a", "2026-10-31T06:05:00Z", { homepageLeadOptOut: true })]), undefined);
});
test("several at once: latest-scheduled ticked wins", () => {
  const out = pickScheduledHomepageLead([s("early", "2026-10-31T06:00:00Z"), s("late", "2026-10-31T06:05:00Z"), s("latest-off", "2026-10-31T06:06:00Z", { homepageLeadOptOut: true })]);
  assert.equal(out?.id, "late");
});
