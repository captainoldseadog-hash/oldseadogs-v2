import assert from "node:assert/strict";
import test from "node:test";

import {
  isoToUkDateTimeInput,
  isScheduledPublishDue,
  ukDateTimeInputToIso,
  validateScheduledPublishAt,
} from "../lib/story-schedule-time.ts";

test("UK scheduling converts winter and summer wall-clock times to UTC", () => {
  assert.equal(ukDateTimeInputToIso("2026-01-24T12:30"), "2026-01-24T12:30:00.000Z");
  assert.equal(ukDateTimeInputToIso("2026-07-24T12:30"), "2026-07-24T11:30:00.000Z");
  assert.equal(isoToUkDateTimeInput("2026-07-24T11:30:00.000Z"), "2026-07-24T12:30");
});

test("non-existent UK daylight-saving wall-clock times are rejected", () => {
  assert.equal(ukDateTimeInputToIso("2026-03-29T01:30"), "");
});

test("scheduled timestamps require an explicit timezone and a future instant", () => {
  const now = new Date("2026-07-24T10:00:00.000Z");
  assert.equal(validateScheduledPublishAt("2026-07-24T11:00:00.000Z", now).ok, true);
  assert.equal(validateScheduledPublishAt("2026-07-24T11:00", now).ok, false);
  assert.equal(validateScheduledPublishAt("not-a-date", now).ok, false);
  assert.equal(validateScheduledPublishAt("2026-07-24T09:00:00.000Z", now).ok, false);
});

test("due checks compare absolute instants", () => {
  const now = new Date("2026-07-24T10:00:00.000Z");
  assert.equal(isScheduledPublishDue("2026-07-24T11:00:00+01:00", now), true);
  assert.equal(isScheduledPublishDue("2026-07-24T11:00:01+01:00", now), false);
});
