#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const [content, editor, classicEditor, homepage, emailUtils, sourceWatch, cookie, seo, operations, api, rights] = await Promise.all([
  read("lib/site-content.ts"), read("app/editor/BridgeCms.tsx"), read("app/editor/EditorDashboard.tsx"),
  read("lib/homepage-content-provider.ts"),
  read("lib/press-release-utils.ts"), read("lib/source-watch-runner.ts"), read("components/CookieConsent.tsx"),
  read("lib/seo.ts"), read("scripts/oldseadogs-ops.mjs"), read("app/api/editor/route.ts"), read("lib/media-rights.ts"),
]);

assert.match(content, /input\.status \|\| existingStory\?\.status \|\| "draft"/, "Save must preserve an existing public status by default.");
assert.match(content, /input\.publishedAt \|\| existingStory\?\.publishedAt \|\| stamp/, "Published date must be preserved.");
assert.match(content, /input\.slug \|\| existingStory\?\.slug/, "Story slug must be preserved.");
assert.match(content, /storyStatusHistory/, "Durable status history must be recorded.");
assert.match(content, /Object\.entries\(input\)\.map/, "Partial homepage settings saves must not reset the selected lead.");
assert.match(content, /isFeatured: existingStory\?\.isFeatured \?\? false/, "Ordinary story saves must preserve homepage feature state.");
assert.doesNotMatch(content, /story\.isFeatured && item\.id !== story\.id/, "Ordinary story saves must not clear another story's homepage flag.");
assert.match(content, /showOnHomepage: existingGuide\?\.showOnHomepage \?\? false/, "Normal Guide saves must preserve homepage visibility.");
assert.match(content, /Homepage settings can only be changed in Homepage Manager by pressing Save Homepage/, "General settings saves must reject homepage fields.");
assert.match(api, /payload\.action === "saveHomepage"/, "Homepage Manager must have one explicit save action.");
assert.match(api, /homepageSource !== "homepage-manager-save"/, "Homepage API must reject non-Homepage Manager callers.");
assert.match(editor, /homepageSource: "homepage-manager-save"/, "Save Homepage must identify the sole authorised caller.");
assert.doesNotMatch(classicEditor, /makeStoryMainHomepageFeature|makePressReleaseMainHomepageFeature|onMakeHomepageFeature|Make Homepage Lead Story|Make this the main homepage story/, "Story, email, recovery and quick-publish surfaces must not expose homepage mutations.");
assert.match(api, /payload\.action === "saveHomepageLead" \|\| payload\.action === "clearHomepageLead"/, "Legacy immediate homepage actions must be blocked.");
assert.match(rights, /Copyright Ownership or Rights Evidence/, "Copyright validation must identify the exact missing rights field.");
assert.match(rights, /copyrightOwner[\s\S]*photographer[\s\S]*credit[\s\S]*licence[\s\S]*permissionNote[\s\S]*usageRestrictions/, "Valid rights evidence combinations must be supported.");
assert.match(editor, /saveStory\(story\.status\)/, "Save Changes must retain the current visibility status.");
assert.match(editor, />Save Changes</, "The protected Save Changes action must be visible.");
assert.match(editor, /Unpublish this story\?/, "Unpublish must be explicit.");
assert.match(editor, /workflow changes cannot publish|changing workflow cannot publish/i, "Workflow changes must not publish.");
assert.match(homepage, /HomepageStoryUseTracker/, "Homepage duplicate prevention must remain active.");
assert.match(homepage, /homepageLatestStoryIds/, "Manual Latest selection must be supported.");
assert.match(homepage, /homepageEditorsChoiceStoryIds/, "Manual Editor's Choice selection must be supported.");
assert.match(homepage, /homepageHiddenStoryIds/, "Homepage hiding must be supported.");
assert.match(content, /pressReleaseStoryInput\(item, "draft"\)/, "Email conversion must create a Draft.");
assert.match(editor, /window\.location\.assign\(`\/editor\/write\?story=/, "Email conversion must open the standard Story Editor.");
assert.match(emailUtils, /according to[\s\S]*showcased[\s\S]*press release/i, "Email rewrites must reject corporate and press-release boilerplate.");
assert.match(sourceWatch, /status: "draft" as const/, "Scraped story conversion must remain Draft-only.");
assert.match(sourceWatch, /nearDuplicateTitle/, "Scraping must detect near-duplicate titles.");
assert.match(cookie, /if \(!choice \|\| isEditorRoute\) return/, "GA4 must not load in The Bridge.");
assert.match(cookie, /choice\.analytics && ga4Id/, "GA4 must require analytics consent.");
assert.match(seo, /\^G-\[A-Z0-9\]\{4,20\}\$/i, "GA4 Measurement IDs must be validated.");
assert.match(operations, /npm run check:stories/, "Safe deployment must retain story continuity checks.");

console.log("Bridge workflow regression checks passed: publication preservation, homepage controls, Draft-only imports, duplicate prevention and consent-gated GA4.");
