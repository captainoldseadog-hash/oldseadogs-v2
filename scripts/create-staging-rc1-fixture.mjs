import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.argv[2] || ".staging-rc1-data");
const stamp = "2026-07-16T09:00:00.000Z";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3L8AAAAASUVORK5CYII=", "base64");
const articleBody = (subject) => [
  `${subject} is represented by a realistic disposable record prepared solely for The Helm Phase 1 RC1 staging rehearsal. The record contains enough editorial detail to exercise the complete Story Editor, preview, publication, unpublication and canonical URL workflow without copying any production content.`,
  "The harbour team confirmed dates, access arrangements, safety advice and contact details in the supplied source. Editors can review the wording, preserve the source privately, add photography and formatting, and make the publication decision without changing the selected Homepage Lead.",
  "This staging copy deliberately uses synthetic names, references and prose. It tests record shape and workflow behaviour only. No production credentials, customer information, private correspondence or live media have been read or included in this package.",
];

function story({ id, slug, title, sourceType, originalSourceType = "", originalSourceRef = "", originalSourceContent = "", status = "draft", sectionSlugs = ["news"], imageUrl = "", category = "News", publishedAt = "" }) {
  return {
    id, slug, title, category, sectionSlugs, date: "2026-07-16", author: "Old Sea Dogs",
    sourceType, sourceName: "RC1 synthetic staging source", sourceUrl: "https://example.invalid/staging-source",
    originalSourceType, originalSourceRef, originalSourceContent,
    imageUrl, imageAlt: `${title} staging photograph`, imageCredit: "Synthetic RC1 fixture", imageCaption: "Disposable staging image.",
    videoUrl: "", videoCaption: "", videoPosition: "", oldSeaDogsView: "The practical point is to verify the detail against the named source before acting.",
    sourceNotes: "Synthetic source retained privately for RC1 staging verification.", methodNotes: "Imported into a disposable staging copy and edited in the standard Story Editor.",
    contentBasis: sourceType, editorialStatus: status === "published" ? "Published" : "Needs improvement", noindex: false,
    summary: `${title} is a disposable Phase 1 staging record used to verify the complete editorial workflow.`,
    body: articleBody(title), tags: ["RC1", "staging"], readMinutes: 3, isFeatured: id === "staging-homepage-lead",
    status, publishedAt, scheduledPublishAt: "", sortOrder: 0, createdAt: stamp, updatedAt: stamp, statusHistory: [],
  };
}

const representativeStories = [
  story({ id: "staging-homepage-lead", slug: "staging-harbour-notice", title: "Staging harbour notice for July 2026", sourceType: "Original reporting", status: "published", publishedAt: "2026-07-15T08:00:00.000Z" }),
  story({ id: "staging-multisection-story", slug: "staging-solent-race-briefing", title: "Solent race briefing confirms staging start times", sourceType: "Original reporting", sectionSlugs: ["news", "races"] }),
  story({ id: "staging-email-import", slug: "staging-email-import", title: "Harbour authority issues synthetic staging update", sourceType: "Email import", originalSourceType: "email/rfc822", originalSourceRef: "<rc1-email-import@example.invalid>", originalSourceContent: "From: harbour@example.invalid\nSubject: Synthetic staging update\n\nThis is a private disposable email body for RC1 testing." }),
  story({ id: "staging-ocr-story", slug: "staging-ocr-notice", title: "Scanned race notice records synthetic course change", sourceType: "Scanned/OCR", originalSourceType: "application/pdf+ocr", originalSourceRef: "staging-race-notice.pdf#page=1", originalSourceContent: "OCR TEXT: NOTICE OF RACE — SYNTHETIC STAGING RECORD — COURSE CHANGE AT 0900." }),
  story({ id: "staging-press-release", slug: "staging-press-release", title: "Marina publishes synthetic visitor timetable", sourceType: "Press release", originalSourceType: "email/rfc822", originalSourceRef: "<rc1-press-release@example.invalid>", originalSourceContent: "From: press@example.invalid\nSubject: Synthetic visitor timetable\n\nDisposable press-release source retained privately." }),
  story({ id: "staging-vague-headline", slug: "the-next-generation-sets-sail", title: "The Next Generation Sets Sail", sourceType: "Original reporting" }),
];

const scrapedStories = Array.from({ length: 145 }, (_, index) => story({
  id: `staging-scraped-${String(index + 1).padStart(3, "0")}`,
  slug: `staging-scraped-${String(index + 1).padStart(3, "0")}`,
  title: index === 0 ? "Scraped harbour bulletin awaits editorial review" : `Synthetic scraped queue item ${index + 1}`,
  sourceType: "Automatic watch",
  originalSourceType: "text/html",
  originalSourceRef: `https://example.invalid/source-watch/${index + 1}`,
  originalSourceContent: `<article><h1>Synthetic source watch item ${index + 1}</h1><p>Private disposable HTML payload.</p></article>`,
}));
scrapedStories[0].id = "staging-scraped-story";
scrapedStories[0].slug = "staging-scraped-story";

const continuityStories = Array.from({ length: 22 }, (_, index) => story({
  id: `staging-continuity-${String(index + 1).padStart(3, "0")}`,
  slug: `staging-continuity-${String(index + 1).padStart(3, "0")}`,
  title: `Synthetic continuity story ${index + 1}`,
  sourceType: "Original reporting",
  status: "published",
  publishedAt: `2026-06-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z`,
}));

const media = Array.from({ length: 15 }, (_, index) => {
  const n = String(index + 1).padStart(2, "0");
  return {
    id: `staging-media-${n}`, filename: `staging-media-${n}.png`, originalFilename: `synthetic-photo-${n}.png`, displayName: `Synthetic staging photo ${n}`,
    internalTitle: `RC1 media ${n}`, contentType: "image/png", size: png.length, r2Key: `staging-media-${n}.png`, url: `/api/media/staging-media-${n}`,
    alt: `Synthetic staging image ${n}`, caption: `Disposable staging caption ${n}.`, credit: "Synthetic RC1 fixture", copyright: "",
    copyrightOwnership: index === 0 ? "unknown" : "owned", copyrightOwner: index === 0 ? "" : "Old Sea Dogs staging fixture", photographer: "RC1 fixture generator",
    source: "Synthetic fixture", licence: index === 0 ? "" : "Internal staging use", permissionNote: "", usageRestrictions: "Staging only", creditLine: "Synthetic RC1 fixture",
    permissionReceivedAt: "", location: "Solent (synthetic)", dateTaken: "2026-07-16", sourceType: "upload", category: "Staging", tagsJson: "[\"RC1\"]",
    collectionsJson: "[\"Phase 1\"]", storyIdsJson: index === 0 ? "[\"staging-email-import\"]" : "[]", galleryItemId: index < 3 ? `staging-gallery-${n}` : "",
    originalKey: `staging-media-${n}.png`, webKey: "", width: 1, height: 1, posterMediaId: "", externalUrl: "", description: "Disposable staging media record.",
    storyAssociationId: index === 0 ? "staging-email-import" : "", galleryAssociationId: index < 3 ? `staging-gallery-${n}` : "", createdAt: stamp,
  };
});
representativeStories[2].imageUrl = "/api/media/staging-media-01";

const pressReleases = [
  { id: "staging-email-001", messageId: "<rc1-email-import@example.invalid>", senderName: "Synthetic Harbour Authority", senderEmail: "harbour@example.invalid", senderDomain: "example.invalid", subject: "Synthetic staging update", receivedAt: stamp, preview: "Disposable staging email.", bodyText: "This is a private disposable email body for RC1 testing.", rawEmail: "From: harbour@example.invalid\nSubject: Synthetic staging update\n\nThis is a private disposable email body for RC1 testing.", attachments: [], status: "processed", category: "News", relevanceScore: 90, duplicateOf: "", duplicateScore: 0, warnings: [], generatedTitle: representativeStories[2].title, generatedExcerpt: representativeStories[2].summary, generatedBody: representativeStories[2].body, generatedWordCount: 150, selectedAttachmentId: "", imageUrl: representativeStories[2].imageUrl, imageAlt: representativeStories[2].imageAlt, imageCredit: representativeStories[2].imageCredit, imageCaption: representativeStories[2].imageCaption, rightsNote: "Unknown rights retained as advisory.", storyId: representativeStories[2].id, createdAt: stamp, updatedAt: stamp },
  { id: "staging-email-002", messageId: "<rc1-press-release@example.invalid>", senderName: "Synthetic Marina Press Office", senderEmail: "press@example.invalid", senderDomain: "example.invalid", subject: "Synthetic visitor timetable", receivedAt: stamp, preview: "Disposable press release.", bodyText: "Disposable press-release source retained privately.", rawEmail: "From: press@example.invalid\nSubject: Synthetic visitor timetable\n\nDisposable press-release source retained privately.", attachments: [], status: "processed", category: "News", relevanceScore: 82, duplicateOf: "", duplicateScore: 0, warnings: [], generatedTitle: representativeStories[4].title, generatedExcerpt: representativeStories[4].summary, generatedBody: representativeStories[4].body, generatedWordCount: 150, selectedAttachmentId: "", imageUrl: "", imageAlt: "", imageCredit: "", imageCaption: "", rightsNote: "", storyId: representativeStories[4].id, createdAt: stamp, updatedAt: stamp },
  { id: "staging-email-003", messageId: "<rc1-unprocessed@example.invalid>", senderName: "Synthetic Sailing Club", senderEmail: "club@example.invalid", senderDomain: "example.invalid", subject: "Synthetic unprocessed inbox item", receivedAt: stamp, preview: "Pending disposable item.", bodyText: "Pending private source.", rawEmail: "From: club@example.invalid\nSubject: Synthetic unprocessed inbox item\n\nPending private source.", attachments: [], status: "new", category: "Races", relevanceScore: 70, duplicateOf: "", duplicateScore: 0, warnings: [], generatedTitle: "", generatedExcerpt: "", generatedBody: [], generatedWordCount: 0, selectedAttachmentId: "", imageUrl: "", imageAlt: "", imageCredit: "", imageCaption: "", rightsNote: "", storyId: "", createdAt: stamp, updatedAt: stamp },
];

const store = {
  version: 1,
  stories: [...representativeStories, ...scrapedStories, ...continuityStories],
  guides: [], media,
  galleryCategories: Array.from({ length: 27 }, (_, index) => ({ id: `staging-category-${index + 1}`, name: `Synthetic category ${index + 1}`, slug: `synthetic-category-${index + 1}`, description: "Disposable staging category.", sortOrder: index, createdAt: stamp, updatedAt: stamp })),
  galleryItems: media.slice(0, 3).map((item, index) => ({ id: `staging-gallery-${String(index + 1).padStart(2, "0")}`, mediaId: item.id, sourceType: "upload", sourceId: "", sourceUrl: "", title: item.displayName, caption: item.caption, alt: item.alt, credit: item.credit, copyright: "", location: item.location, dateTaken: item.dateTaken, tags: ["RC1"], categoryIds: ["staging-category-1"], storyIds: [], boatId: "", marinaId: "", yachtClubId: "", eventId: "", status: "approved", rejectionReason: "", createdAt: stamp, updatedAt: stamp })),
  instagramImports: [], ads: [], socialEvents: [], pressReleases, blockedSenders: [], publicationOverrides: [],
  settings: { homepageLeadStoryId: "staging-homepage-lead", homepageLeadStorySlug: "staging-harbour-notice", homepageLatestStoryIds: "[\"staging-homepage-lead\"]", homepageEditorsChoiceStoryIds: "[]", homepageHiddenStoryIds: "[]" },
  updatedAt: stamp,
};

if (store.stories.length !== 173) throw new Error(`Expected 173 stories, generated ${store.stories.length}.`);
await fs.mkdir(path.join(outputDir, "media"), { recursive: true });
await Promise.all(media.map((item) => fs.writeFile(path.join(outputDir, "media", item.r2Key), png)));
await fs.writeFile(path.join(outputDir, "editor-store.json"), `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify({ outputDir, stories: store.stories.length, scrapedQueueStories: scrapedStories.length, media: media.length, homepageSettings: 5, emailImports: pressReleases.length, galleryItems: store.galleryItems.length, galleryCategories: store.galleryCategories.length }, null, 2)}\n`);
