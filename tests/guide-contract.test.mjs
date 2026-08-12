import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GuideContractValidationError,
  guideDraftContractName,
  guideDraftContractVersion,
  validateGuideDraftEnvelope,
} from "../lib/guide-contract.ts";

function envelope(overrides = {}) {
  return {
    contract: guideDraftContractName,
    version: guideDraftContractVersion,
    mode: "create-draft",
    guides: [{
      externalId: "port-hamble-2026-08-12",
      slug: "port-hamble-marina",
      title: "Port Hamble Marina Guide",
      guideType: "Marina",
      verification: {
        sources: [{ label: "Official marina", url: "https://example.com/marina", accessedAt: "2026-08-12" }],
        unresolved: [{ field: "navigation.depths", reason: "No current official value found", severity: "safety" }],
      },
    }],
    ...overrides,
  };
}

test("the future Skill contract accepts one or multiple Draft-ready Guides", () => {
  const one = validateGuideDraftEnvelope(envelope());
  assert.equal(one.guides.length, 1);
  const many = validateGuideDraftEnvelope(envelope({ guides: [...one.guides, { ...one.guides[0], externalId: "second", slug: "second-marina", title: "Second Marina" }] }));
  assert.equal(many.guides.length, 2);
});

test("the Skill contract has no publication mode or status escape hatch", () => {
  assert.throws(() => validateGuideDraftEnvelope(envelope({ mode: "publish" })), GuideContractValidationError);
  assert.throws(() => validateGuideDraftEnvelope(envelope({ guides: [{ ...envelope().guides[0], status: "published" }] })), /always creates or updates Drafts/);
});

test("the Skill contract rejects malformed sources, safety issues and versions", () => {
  assert.throws(() => validateGuideDraftEnvelope(envelope({ version: 2 })), /version must be 1/);
  assert.throws(() => validateGuideDraftEnvelope(envelope({ guides: [{ ...envelope().guides[0], verification: { sources: [{ label: "Bad", url: "javascript:alert(1)" }] } }] })), /HTTP\(S\) URL/);
  assert.throws(() => validateGuideDraftEnvelope(envelope({ guides: [{ ...envelope().guides[0], verification: { unresolved: [{ field: "depths", reason: "Unknown", severity: "guess" }] } }] })), /editorial\|safety/);
});
