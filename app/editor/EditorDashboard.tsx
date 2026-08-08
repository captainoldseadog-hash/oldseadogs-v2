"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticlePreviewContent } from "../../components/ArticlePreviewContent";
import {
  featuredPortClubExcludedTag,
  isIncludedInFeaturedPortClubRotation,
  isPortOrClubCategory,
} from "../../content/featured-port-club";
import {
  displayCategoryLabel,
  getSectionForCategory,
  normalizeStoryCategory,
  sectionPathForCategory,
  storyMatchesSection,
} from "../../content/sections";
import {
  analyzeOldSeaDogsStyle,
  analyzeHeadlineQuality,
  getEditorialWarnings,
  oldSeaDogsViewQuality,
  validateStoryForPublication,
  type HeadlineQualityReport,
  type OldSeaDogsViewQuality,
  type OldSeaDogsStyleReport,
} from "../../lib/editorial-quality";
import { saveEditorStoryRequest } from "../../lib/editor-publication.js";
import { previewPressReleaseCleaning, type PressReleaseCleaningPreview } from "../../lib/press-release-utils";
import { createSafeId } from "../../lib/safe-id";
import { cleanStoryTags } from "../../lib/tags";
import { isoToUkDateTimeInput, ukDateTimeInputToIso } from "../../lib/story-schedule-time";

type StoryStatus = "draft" | "scheduled" | "published" | "unpublished";

type EditorStory = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  videoUrl: string;
  videoCaption: string;
  videoPosition: "top" | "after-intro" | "bottom" | "";
  oldSeaDogsView: string;
  sourceNotes: string;
  methodNotes: string;
  contentBasis: string;
  editorialStatus: string;
  noindex: boolean;
  summary: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  isFeatured: boolean;
  status: StoryStatus;
  publishedAt: string;
  scheduledPublishAt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MediaAsset = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  createdAt: string;
};

type Advert = {
  id: string;
  placement: string;
  kind: string;
  label: string;
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Settings = {
  brandName: string;
  kicker: string;
  footerText: string;
  siteDescription: string;
  socialFacebook: string;
  socialInstagram: string;
  socialX: string;
  socialYouTube: string;
  socialTikTok: string;
  socialThreads: string;
  socialLinkedIn: string;
};

type SourceWatchSite = {
  id: string;
  name: string;
  url: string;
  group: string;
  focus: string;
  sections: string[];
  storyStyle: string;
  photoRule: string;
  approvalRule: string;
  feedUrls: string[];
  checkEveryHours: number;
  status: "active" | "inactive";
};

type SourcePreviewArticle = {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  headline: string;
  category: string;
  standfirst: string;
  body: string[];
  wordCount: number;
  sourceWordCount?: number;
  generatedWordCount?: number;
  oldSeaDogsStyleScore?: number;
  prLanguageScore?: number;
  storytellingScore?: number;
  humanInterestScore?: number;
  styleReport?: OldSeaDogsStyleReport;
  status: "ready" | "needsMoreDetail";
  qualityWarnings: string[];
};

type SourceCheckResult = {
  checkedAt: string;
  created: number;
  previewed: number;
  needsDetail: number;
  skipped: number;
  failed: number;
  previews: SourcePreviewArticle[];
  sources: Array<{
    id: string;
    name: string;
    group: string;
    checked: number;
    found: number;
    created: number;
    previewed: number;
    needsDetail: number;
    rejected: number;
    skipped: number;
    duplicates: number;
    failed: boolean;
    message: string;
    errors: string[];
  }>;
};

type PressReleaseStatus =
  | "new"
  | "reviewed"
  | "accepted"
  | "rejected"
  | "spam"
  | "converted"
  | "published"
  | "needsDetail";

type PressReleaseAttachment = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  dataUrl: string;
  suggestedCredit: string;
  caption: string;
  rightsNote: string;
};

type PressReleaseEmail = {
  id: string;
  messageId: string;
  senderName: string;
  senderEmail: string;
  senderDomain: string;
  subject: string;
  receivedAt: string;
  preview: string;
  bodyText: string;
  rawEmail: string;
  attachments: PressReleaseAttachment[];
  status: PressReleaseStatus;
  category: string;
  relevanceScore: number;
  duplicateOf: string;
  duplicateScore: number;
  warnings: string[];
  generatedTitle: string;
  generatedExcerpt: string;
  generatedBody: string[];
  generatedWordCount: number;
  selectedAttachmentId: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  rightsNote: string;
  storyId: string;
  createdAt: string;
  updatedAt: string;
};

type PressReleaseBlockedSender = {
  id: string;
  value: string;
  kind: string;
  reason: string;
  createdAt: string;
};

type EmailIngestionSettings = {
  methods: string[];
  inboxConfigured: boolean;
  environmentKeys: string[];
  configuredEnvironmentKeys: string[];
  missingEnvironmentKeys: string[];
  secretEnvironmentKeys: string[];
  status: string;
  note: string;
  storageMode: string;
  storageDetail: string;
};

type DeploymentInfo = {
  buildTimestamp: string;
  gitCommit: string;
  gitBranch: string;
  deploymentTimestamp: string;
  serverStartedAt: string;
  serverHostname: string;
  dataDir: string;
  mediaDir: string;
  runtime: string;
  digitalOceanMode: boolean;
  latestPreviewPublishCodeActive: boolean;
  features: Record<string, boolean>;
};

type SocialAnalyticsSummary = {
  socialClicks: number;
  outboundClicks: number;
  generatedPostUsage: number;
  byPlatform: Array<{
    platform: string;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    platform: string;
    target: string;
    storySlug: string;
    createdAt: string;
  }>;
};

type SocialPostDrafts = {
  tiktokCaption: string;
  instagramCaption: string;
  facebookPost: string;
  xPost: string;
  youtubeShortsDescription: string;
};

type EditorData = {
  stories: EditorStory[];
  media: MediaAsset[];
  ads: Advert[];
  settings: Settings;
  sourceWatch: SourceWatchSite[];
  pressReleases: PressReleaseEmail[];
  blockedSenders: PressReleaseBlockedSender[];
  emailIngestion: EmailIngestionSettings;
  deployment: DeploymentInfo;
  socialAnalytics: SocialAnalyticsSummary;
  user: {
    email: string;
  };
};

type StoryVisibility = {
  publicUrl: string;
  category: string;
  actualRoute: string;
  homepageEligible: boolean;
  appearsOnHomepage: boolean;
  appearsInSection: boolean;
  sectionLabel: string;
  sectionSlug: string;
  sectionFeedAssigned: string;
};

type RecoveryFilters = {
  category: string;
  source: string;
  hasImage: string;
  usable: string;
  search: string;
};

type RecoveryDiagnostic = {
  status: string;
  publicUrl: string;
  directUrlStatus: string;
  sectionVisibility: string;
  homepageVisibility: string;
  error: string;
};

type StoryImagePublishDiagnostics = {
  storyImageUrl: string;
  featuredImageUrl: string;
  thumbnailUrl: string;
  caption: string;
  credit: string;
  alt: string;
  mediaId: string;
  imageVisibleOnPublicStory: boolean;
};

type PressReleasePublishDiagnostics = {
  publishRequestReceived: boolean;
  activeItemId: string;
  newsroomStatusBeforePublish: string;
  selectedAttachmentId: string;
  selectedImageUrl: string;
  featuredImageUrl: string;
  imageUrl: string;
  mediaId: string;
  draftStoryId: string;
  draftStoryStatus: string;
  draftImageField: string;
  draftFeaturedImageField: string;
  publishPayloadImageField: string;
  publishPayloadFeaturedImageField: string;
  publishPayloadInlineImageCount: number;
  storyCreated: boolean;
  storyId: string;
  storySlug: string;
  storyStatus: string;
  publicUrl: string;
  publicStoryExists: boolean;
  publicStoryImageField: string;
  publicStoryFeaturedImageField: string;
  publicStoryInlineImageCount: number;
  appearsOnHomepage: boolean;
  appearsInSection: boolean;
  homepageEligible: boolean;
  sectionLabel: string;
};

type EditorApiPayload = Partial<EditorData> & {
  error?: string;
  warning?: string;
  story?: EditorStory;
  settings?: Settings;
  ad?: Advert;
  media?: MediaAsset;
  result?: SourceCheckResult;
  pressRelease?: PressReleaseEmail;
  blockedSender?: PressReleaseBlockedSender;
  publicUrl?: string;
  visibility?: StoryVisibility;
  imageDiagnostics?: StoryImagePublishDiagnostics;
  publishDiagnostics?: PressReleasePublishDiagnostics;
  deleted?: boolean;
  id?: string;
  publicStoryAction?: string;
  requiresPublicationOverride?: boolean;
  editorialWarnings?: string[];
  copyrightWarnings?: Array<{ message: string; mediaId?: string; filename?: string }>;
};

type UploadDebug = {
  selectedFileName: string;
  uploadStatus: string;
  uploadRequestSent: string;
  uploadRequestUrl: string;
  mediaRecordCreated: string;
  mediaId: string;
  returnedImageUrl: string;
  thumbnailUrl: string;
  articleImageField: string;
  featuredImageField: string;
  previewSrc: string;
  responseStatus: string;
  responseText: string;
  error: string;
};

type PressImportDebug = {
  selectedFileName: string;
  attemptedAction: string;
  requestSent: string;
  requestUrl: string;
  responseStatus: string;
  responseText: string;
  extractedSubject: string;
  extractedSender: string;
  extractedBodyLength: string;
  extractedImageCount: string;
  itemId: string;
  storeSaveStatus: string;
  error: string;
};

type PressSaveDebug = {
  requestSent: string;
  requestUrl: string;
  itemId: string;
  payloadBytes: string;
  rawEmailBytesSkipped: string;
  attachmentCount: string;
  dataAttachmentCountSkipped: string;
  sentAttachmentCount: string;
  responseStatus: string;
  responseText: string;
  error: string;
};

type NewsroomImageActionDebug = {
  featuredClicked: string;
  featuredActiveItemId: string;
  featuredMediaId: string;
  featuredImageUrl: string;
  featuredBeforeImage: string;
  featuredBeforeFeatured: string;
  featuredSaveRequestSent: string;
  featuredSaveResponseOk: string;
  featuredAfterImage: string;
  featuredAfterFeatured: string;
  featuredPersistedImage: string;
  featuredMessage: string;
  inlineClicked: string;
  inlineActiveItemId: string;
  inlineMediaId: string;
  inlineImageUrl: string;
  inlineBodyLengthBefore: string;
  inlineBodyLengthAfter: string;
  inlineInsertPosition: string;
  inlineSaveRequestSent: string;
  inlineSaveResponseOk: string;
  inlinePersistedBodyContainsImage: string;
  inlineMessage: string;
};

type PressPublishDebug = {
  publishButtonClicked: string;
  activeItemId: string;
  publishRequestSent: string;
  apiResponse: string;
  storyCreated: string;
  storySlug: string;
  storyStatus: string;
  appearsOnHomepage: string;
  appearsInSection: string;
  publicUrl: string;
  selectedImageUrl: string;
  featuredImageUrl: string;
  imageUrl: string;
  mediaId: string;
  draftImageField: string;
  draftFeaturedImageField: string;
  publishPayloadImageField: string;
  publishPayloadFeaturedImageField: string;
  publicStoryImageField: string;
  publicStoryFeaturedImageField: string;
  publicStoryInlineImageCount: string;
  isHomepageFeatured: string;
  homepageFeaturedSlug: string;
  appearsAsMainHomepageFeature: string;
  error: string;
};

type ScrapeReviewDebug = {
  itemId: string;
  itemType: string;
  attemptedAction: string;
  missingDataField: string;
  apiResponseStatus: string;
  errorMessage: string;
};

function editorResponseStatus(response: Response) {
  return `${response.status} ${response.statusText || ""}`.trim();
}

function parseEditorPayloadText(response: Response, text: string, fallbackMessage: string) {
  if (!text.trim()) {
    throw new Error(
      `${fallbackMessage} The editor API returned ${editorResponseStatus(response)} with an empty response.`
    );
  }

  let payload: EditorApiPayload;
  try {
    payload = JSON.parse(text) as EditorApiPayload;
  } catch {
    throw new Error(
      response.ok
        ? "The local editor received a broken reply. Please restart the OldSeaDogs preview."
        : `${fallbackMessage} Server returned ${editorResponseStatus(response)}: ${text.slice(0, 240)}`
    );
  }

  if (!response.ok) {
    throw new Error(payload.error || `${fallbackMessage} Server returned ${editorResponseStatus(response)}.`);
  }

  return payload;
}

async function readEditorPayload(response: Response, fallbackMessage: string) {
  const text = await response.text();
  return parseEditorPayloadText(response, text, fallbackMessage);
}

const blankStory = (): EditorStory => ({
  id: "",
  slug: "",
  title: "",
  category: "News",
  date: new Date().toISOString().slice(0, 10),
  author: "Michael Hodges",
  sourceType: "Original",
  sourceName: "Old Sea Dogs desk",
  sourceUrl: "",
  imageUrl: "",
  imageAlt: "",
  imageCredit: "",
  imageCaption: "",
  videoUrl: "",
  videoCaption: "",
  videoPosition: "",
  oldSeaDogsView: "",
  sourceNotes: "",
  methodNotes: "",
  contentBasis: "Old Sea Dogs observation and editorial research",
  editorialStatus: "Needs improvement",
  noindex: false,
  summary: "",
  body: [""],
  tags: [],
  readMinutes: 3,
  isFeatured: false,
  status: "draft",
  publishedAt: "",
  scheduledPublishAt: "",
  sortOrder: 0,
  createdAt: "",
  updatedAt: "",
});

const blankAd = (): Advert => ({
  id: "",
  placement: "sidebar",
  kind: "manual",
  label: "Advert",
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  code: "",
  startDate: "",
  endDate: "",
  isActive: true,
  createdAt: "",
  updatedAt: "",
});

const blankPressReleaseImport = () => ({
  senderName: "",
  senderEmail: "",
  subject: "",
  receivedAt: new Date().toISOString().slice(0, 16),
  bodyText: "",
  rawEmail: "",
  attachments: [] as PressReleaseAttachment[],
});

function textBytes(value: string) {
  if (typeof Blob !== "undefined") return new Blob([value]).size;
  return value.length;
}

function blankPressSaveDebug(status = "No press-release save attempted yet."): PressSaveDebug {
  return {
    requestSent: "No",
    requestUrl: "/api/editor",
    itemId: "",
    payloadBytes: "",
    rawEmailBytesSkipped: "",
    attachmentCount: "",
    dataAttachmentCountSkipped: "",
    sentAttachmentCount: "",
    responseStatus: status,
    responseText: "",
    error: "",
  };
}

function pressReleaseSavePayload(item: PressReleaseEmail): Partial<PressReleaseEmail> & { id: string } {
  const storedAttachments = item.attachments.filter((attachment) => isStoredMediaUrl(attachment.dataUrl));

  return {
    id: item.id,
    messageId: item.messageId,
    senderName: item.senderName,
    senderEmail: item.senderEmail,
    senderDomain: item.senderDomain,
    subject: item.subject,
    receivedAt: item.receivedAt,
    preview: item.preview,
    bodyText: item.bodyText,
    status: item.status,
    category: item.category,
    relevanceScore: item.relevanceScore,
    duplicateOf: item.duplicateOf,
    duplicateScore: item.duplicateScore,
    warnings: item.warnings,
    generatedTitle: item.generatedTitle,
    generatedExcerpt: item.generatedExcerpt,
    generatedBody: item.generatedBody,
    generatedWordCount: item.generatedWordCount,
    selectedAttachmentId: item.selectedAttachmentId,
    imageUrl: item.imageUrl.startsWith("data:image/") ? "" : item.imageUrl,
    imageAlt: item.imageAlt,
    imageCredit: item.imageCredit,
    imageCaption: item.imageCaption,
    rightsNote: item.rightsNote,
    storyId: item.storyId,
    attachments: storedAttachments.length > 0 ? storedAttachments : undefined,
  };
}

const storyCategoryOptions = [
  "News",
  "Shows",
  "Races",
  "Reviews",
  "Gear",
  "Destinations",
  "Masterclass",
  "Lifestyle",
  "Clubs",
  "Ports",
];

const adPlacementOptions = [
  { value: "homepage-featured-club", label: "Homepage Featured Club" },
  { value: "homepage-bottom", label: "Homepage Bottom" },
  { value: "homepage-sidebar", label: "Homepage sidebar" },
  { value: "banner", label: "Homepage wide banner" },
  { value: "sidebar", label: "Legacy sidebar" },
  { value: "article-sidebar", label: "Article sidebar" },
  { value: "article-inline", label: "Between article sections" },
  { value: "footer", label: "Footer" },
  { value: "future", label: "Future positions" },
];

const starterImages = [
  { url: "", label: "No photo" },
  { url: "/images/marina-hero.png", label: "Classic marina" },
  { url: "/images/racing-yachts.png", label: "Racing yachts" },
  { url: "/images/motor-yacht-review.png", label: "Motor yacht" },
  { url: "/images/boatyard-maintenance.png", label: "Boatyard" },
  { url: "/images/monaco-port-hercules-grand-prix.png", label: "Port Hercules, Monaco Grand Prix" },
];

const promotedStoryOrder = -100;
const placeholderStoryImages = new Set(["", "/images/marina-hero.png"]);
const activeReviewSourceTypes = new Set([
  "automatic watch",
  "automatic watch approved",
  "press release",
  "needs more source detail",
  "insufficient source detail for publication",
]);
const handledReviewSourceTypes = new Set([
  "rejected source watch item",
  "duplicate source watch item",
]);
const maxPhotoUploadMb = 25;
const maxPhotoUploadBytes = maxPhotoUploadMb * 1024 * 1024;
const maxDirectUploadBytes = 650 * 1024;
const photoUploadAccept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const allowedPhotoUploadTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const minimumUsableReviewWords = 100;

function blankScrapeReviewDebug(): ScrapeReviewDebug {
  return {
    itemId: "",
    itemType: "",
    attemptedAction: "",
    missingDataField: "",
    apiResponseStatus: "",
    errorMessage: "",
  };
}

function normalizedSourceType(story: Pick<EditorStory, "sourceType">) {
  return story.sourceType.trim().toLowerCase();
}

function isActiveReviewStory(story: Pick<EditorStory, "status" | "sourceType">) {
  return story.status === "draft" && activeReviewSourceTypes.has(normalizedSourceType(story));
}

function isHandledReviewStory(story: Pick<EditorStory, "status" | "sourceType">) {
  return story.status === "draft" && handledReviewSourceTypes.has(normalizedSourceType(story));
}

function sourceReviewWorkflowStatus(story: Pick<EditorStory, "status" | "sourceType">) {
  const sourceType = normalizedSourceType(story);
  if (story.status === "published") return "Published";
  if (story.status === "scheduled") return "Scheduled";
  if (story.status === "unpublished") return "Unpublished";
  if (sourceType === "automatic watch approved") return "Approved";
  if (sourceType === "needs more source detail" || sourceType === "insufficient source detail for publication") {
    return "Needs More Detail";
  }
  if (sourceType === "duplicate source watch item") return "Duplicate";
  if (sourceType === "rejected source watch item") return "Rejected";
  if (sourceType === "press release") return "Imported";
  if (sourceType === "automatic watch") return "Ready for Review";
  return "Draft";
}

function editorStoryStatusLabel(story: EditorStory, stories: EditorStory[] = [story]) {
  if (story.status === "scheduled") return story.scheduledPublishAt ? `Scheduled for ${formatDateTime(story.scheduledPublishAt)}` : "Scheduled, missing date";
  if (story.status === "unpublished") return "Unpublished";
  if (story.status === "draft") return "Draft";
  if (!story.slug.trim()) return "Publish problem: no public URL";
  const visibility = getEditorStoryVisibility(story, stories.length ? stories : [story]);
  if (!visibility.appearsInSection && !visibility.appearsOnHomepage) {
    return "Published record, not visible";
  }
  return "Live";
}

function editorStoryStatusClass(story: EditorStory, stories: EditorStory[]) {
  const label = editorStoryStatusLabel(story, stories);
  if (label === "Live") return "pill live";
  if (story.status === "scheduled") return "pill promoted";
  if (story.status === "unpublished") return "pill warning";
  if (label.startsWith("Publish problem") || label.includes("not visible")) return "pill warning";
  return "pill";
}

function sourceReviewStatusClass(story: Pick<EditorStory, "status" | "sourceType">) {
  const sourceType = normalizedSourceType(story);
  if (story.status === "published") return "pill live";
  if (sourceType === "automatic watch approved") return "pill promoted";
  if (sourceType === "needs more source detail" || sourceType === "insufficient source detail for publication") return "pill warning";
  if (sourceType === "duplicate source watch item" || sourceType === "rejected source watch item") return "pill warning";
  return "pill";
}

function isFeaturedPortClubHiddenTag(tag: string) {
  return tag.trim().toLowerCase() === featuredPortClubExcludedTag.toLowerCase();
}

function isPromotedStory(story: Pick<EditorStory, "sortOrder">) {
  return story.sortOrder < 0;
}

function hasPickedPhoto(story: Pick<EditorStory, "imageUrl">) {
  return !placeholderStoryImages.has(story.imageUrl.trim());
}

function storyWordCount(story: Pick<EditorStory, "body">) {
  return story.body.join(" ").split(/\s+/).filter(Boolean).length;
}

function draftStorySourceLabel(story: Pick<EditorStory, "sourceType" | "sourceName">) {
  const type = story.sourceType.trim() || "Original";
  const name = story.sourceName.trim();
  return name && name.toLowerCase() !== type.toLowerCase() ? `${type} / ${name}` : type;
}

function storyModifiedLabel(story: Pick<EditorStory, "updatedAt" | "createdAt" | "date">) {
  const value = story.updatedAt || story.createdAt || story.date;
  return value ? formatDateTime(value) : "Unknown";
}

function cleanSocialText(value: string) {
  return value
    .replace(/\[image:[^\]]+\]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value: string, maxLength: number) {
  const clean = cleanSocialText(value);
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}...`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isoToDateTimeInput(value: string) {
  return isoToUkDateTimeInput(value);
}

function dateTimeInputToIso(value: string) {
  return ukDateTimeInputToIso(value);
}

function socialStoryUrl(story: Pick<EditorStory, "slug">) {
  return story.slug ? `https://oldseadogs.com/stories/${story.slug}` : "https://oldseadogs.com/";
}

function socialHashtag(value: string) {
  const clean = value.replace(/[^a-z0-9]+/gi, " ").trim();
  if (!clean) return "";
  return `#${clean
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")}`;
}

function socialStoryHashtags(story: Pick<EditorStory, "category" | "tags">) {
  const category = displayCategoryLabel(story.category);
  const tags = story.tags
    .filter((tag) => !isFeaturedPortClubHiddenTag(tag))
    .slice(0, 4)
    .map(socialHashtag)
    .filter(Boolean);
  return Array.from(new Set(["#OldSeaDogs", "#Sailing", socialHashtag(category), ...tags])).slice(0, 6);
}

function buildSocialPostDrafts(story: EditorStory): SocialPostDrafts {
  const title = cleanSocialText(story.title || "Old Sea Dogs");
  const summary = truncateText(story.summary || story.body[0] || title, 210);
  const url = socialStoryUrl(story);
  const hashtags = socialStoryHashtags(story);
  const shortHashtags = hashtags.slice(0, 3).join(" ");
  const fullHashtags = hashtags.join(" ");
  const category = displayCategoryLabel(story.category);
  const angle = summary || "A fresh Old Sea Dogs story from the waterline.";

  const tiktokCaption = [
    title,
    angle,
    "Full story on OldSeaDogs.com.",
    fullHashtags,
  ]
    .filter(Boolean)
    .join("\n\n");

  const instagramCaption = [
    title,
    angle,
    "Read the full story at OldSeaDogs.com.",
    fullHashtags,
  ]
    .filter(Boolean)
    .join("\n\n");

  const facebookPost = [
    `${title}`,
    angle,
    `Read the full ${category.toLowerCase()} story here: ${url}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const xBase = `${title}\n${truncateText(angle, 132)}\n${url} ${shortHashtags}`;
  const xPost = truncateText(xBase, 275);

  const youtubeShortsDescription = [
    title,
    angle,
    `Full Old Sea Dogs story: ${url}`,
    fullHashtags,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    tiktokCaption,
    instagramCaption,
    facebookPost,
    xPost,
    youtubeShortsDescription,
  };
}

const socialPostFields: Array<{
  key: keyof SocialPostDrafts;
  label: string;
  help: string;
}> = [
  {
    key: "tiktokCaption",
    label: "TikTok caption",
    help: "Short, punchy copy for a video or story teaser.",
  },
  {
    key: "instagramCaption",
    label: "Instagram caption",
    help: "A little more room for the story angle and hashtags.",
  },
  {
    key: "facebookPost",
    label: "Facebook post",
    help: "Fuller post with the public article link included.",
  },
  {
    key: "xPost",
    label: "X post",
    help: "Kept short enough for a single post.",
  },
  {
    key: "youtubeShortsDescription",
    label: "YouTube Shorts description",
    help: "Description text for a short video linked to the article.",
  },
];

type ArticleFormattingKind = "h2" | "h3" | "bold" | "italic" | "quote" | "bullets" | "numbers" | "rule";

const articleFormattingTools: Array<{
  kind: ArticleFormattingKind;
  label: string;
  title: string;
}> = [
  { kind: "h2", label: "H2 Heading", title: "Make selected text a larger article heading" },
  { kind: "h3", label: "H3 Heading", title: "Make selected text a smaller article heading" },
  { kind: "bold", label: "Bold", title: "Make selected text bold" },
  { kind: "italic", label: "Italic", title: "Make selected text italic" },
  { kind: "quote", label: "Quote", title: "Format selected text as a quote" },
  { kind: "bullets", label: "Bullet List", title: "Create a bullet list" },
  { kind: "numbers", label: "Numbered List", title: "Create a numbered list" },
  { kind: "rule", label: "Horizontal Rule", title: "Insert a separator line" },
];

function listItemsFromSelection(value: string) {
  const items = value
    .split(/\n+/)
    .map((item) => item.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
  return items.length > 0 ? items : ["List item"];
}

function formatArticleSelection(kind: ArticleFormattingKind, selectedText: string) {
  const selected = selectedText.trim();
  if (kind === "h2") return `<h2>${selected || "New section heading"}</h2>`;
  if (kind === "h3") return `<h3>${selected || "New sub-heading"}</h3>`;
  if (kind === "bold") return `<strong>${selectedText || "bold text"}</strong>`;
  if (kind === "italic") return `<em>${selectedText || "italic text"}</em>`;
  if (kind === "quote") return `<blockquote>${selected || "Quoted text"}</blockquote>`;
  if (kind === "bullets") {
    return `<ul>\n${listItemsFromSelection(selectedText).map((item) => `<li>${item}</li>`).join("\n")}\n</ul>`;
  }
  if (kind === "numbers") {
    return `<ol>\n${listItemsFromSelection(selectedText).map((item) => `<li>${item}</li>`).join("\n")}\n</ol>`;
  }
  return "<hr />";
}

function isBlockArticleFormatting(kind: ArticleFormattingKind) {
  return kind !== "bold" && kind !== "italic";
}

function reviewStatusLabel(story: Pick<EditorStory, "status" | "sourceType">) {
  return sourceReviewWorkflowStatus(story);
}

function canApproveReview(story: Pick<EditorStory, "title" | "summary" | "body" | "category" | "sourceType">) {
  return Boolean(story.title.trim() && story.body.some((paragraph) => paragraph.trim()));
}

function validatePhotoUpload(file: File) {
  const lowerName = file.name.toLowerCase();
  const fileLooksSupported =
    allowedPhotoUploadTypes.has(file.type.toLowerCase()) || /\.(jpe?g|png|webp)$/.test(lowerName);

  if (!fileLooksSupported) {
    return "Unsupported file type. Please upload a JPG, JPEG, PNG or WebP image.";
  }

  if (file.size <= 0) {
    return "That image file is empty. Please choose another photo.";
  }

  if (file.size > maxPhotoUploadBytes) {
    return `File too large. Please upload an image under ${maxPhotoUploadMb} MB.`;
  }

  return "";
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function debugImageValue(value: string) {
  if (!value) return "";
  if (value.startsWith("data:")) {
    return `${value.slice(0, 48)}... (${formatBytes(value.length)} inline image)`;
  }
  return value;
}

function displayMediaName(src: string, fallback = "Selected photo") {
  if (!src) return fallback;
  if (src.startsWith("data:")) return fallback;
  try {
    const url = new URL(src, "https://oldseadogs.local");
    return url.pathname.split("/").filter(Boolean).pop() || fallback;
  } catch {
    return src.split("/").filter(Boolean).pop() || fallback;
  }
}

function displayMediaType(src: string, fallback = "Image") {
  if (src.startsWith("data:image/")) {
    return src.slice("data:".length, src.indexOf(";"));
  }
  const lower = src.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

function mediaIdFromUrl(src: string) {
  if (!src) return "";
  const match = src.match(/\/api\/media\/([^/?#]+)/);
  return match?.[1] || "";
}

function thumbnailUrlFromMediaUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:image/")) return src;
  const mediaId = mediaIdFromUrl(src);
  return mediaId ? `/api/media/${mediaId}?variant=thumbnail` : "";
}

function isStoredMediaUrl(src: string) {
  return /^\/api\/media\/[^/?#]+/.test(src.trim());
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildArticleInlineImageFigure({
  url,
  alt,
  caption,
  credit,
}: {
  url: string;
  alt: string;
  caption: string;
  credit: string;
}) {
  const cleanUrl = url.trim();
  const mediaId = mediaIdFromUrl(cleanUrl);
  const safeCaption = caption.trim();
  const safeCredit = credit.trim();
  const figcaption = safeCaption ? `<figcaption>${escapeHtml(safeCaption)}</figcaption>` : "";
  return `<figure class="article-inline-image" data-media-id="${escapeHtml(mediaId)}" data-caption="${escapeHtml(safeCaption)}" data-credit="${escapeHtml(safeCredit)}"><img src="${escapeHtml(cleanUrl)}" alt="${escapeHtml(alt.trim() || safeCaption || "Old Sea Dogs newsroom image")}" loading="lazy" />${figcaption}</figure>`;
}

function articleTextWordCount(paragraphs: string[]) {
  return paragraphs
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function blankUploadDebug(status = "No image selected yet."): UploadDebug {
  return {
    selectedFileName: "",
    uploadStatus: status,
    uploadRequestSent: "No",
    uploadRequestUrl: "",
    mediaRecordCreated: "No",
    mediaId: "",
    returnedImageUrl: "",
    thumbnailUrl: "",
    articleImageField: "",
    featuredImageField: "",
    previewSrc: "",
    responseStatus: "",
    responseText: "",
    error: "",
  };
}

function blankNewsroomImageActionDebug(): NewsroomImageActionDebug {
  return {
    featuredClicked: "No",
    featuredActiveItemId: "",
    featuredMediaId: "",
    featuredImageUrl: "",
    featuredBeforeImage: "",
    featuredBeforeFeatured: "",
    featuredSaveRequestSent: "No",
    featuredSaveResponseOk: "No",
    featuredAfterImage: "",
    featuredAfterFeatured: "",
    featuredPersistedImage: "",
    featuredMessage: "No featured-image action yet.",
    inlineClicked: "No",
    inlineActiveItemId: "",
    inlineMediaId: "",
    inlineImageUrl: "",
    inlineBodyLengthBefore: "",
    inlineBodyLengthAfter: "",
    inlineInsertPosition: "",
    inlineSaveRequestSent: "No",
    inlineSaveResponseOk: "No",
    inlinePersistedBodyContainsImage: "No",
    inlineMessage: "No inline-image action yet.",
  };
}

function blankPressPublishDebug(): PressPublishDebug {
  return {
    publishButtonClicked: "No",
    activeItemId: "",
    publishRequestSent: "No",
    apiResponse: "No publish request yet",
    storyCreated: "No",
    storySlug: "",
    storyStatus: "",
    appearsOnHomepage: "No",
    appearsInSection: "No",
    publicUrl: "",
    selectedImageUrl: "",
    featuredImageUrl: "",
    imageUrl: "",
    mediaId: "",
    draftImageField: "",
    draftFeaturedImageField: "",
    publishPayloadImageField: "",
    publishPayloadFeaturedImageField: "",
    publicStoryImageField: "",
    publicStoryFeaturedImageField: "",
    publicStoryInlineImageCount: "0",
    isHomepageFeatured: "",
    homepageFeaturedSlug: "",
    appearsAsMainHomepageFeature: "",
    error: "",
  };
}

function blankPressImportDebug(status = "No import started yet."): PressImportDebug {
  return {
    selectedFileName: "",
    attemptedAction: status,
    requestSent: "No",
    requestUrl: "",
    responseStatus: "",
    responseText: "",
    extractedSubject: "",
    extractedSender: "",
    extractedBodyLength: "",
    extractedImageCount: "",
    itemId: "",
    storeSaveStatus: "",
    error: "",
  };
}

function storyFromPressRelease(item: PressReleaseEmail): EditorStory {
  const body =
    item.generatedBody.length > 0
      ? item.generatedBody
      : item.bodyText
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);
  const text = body.join(" ");

  return {
    ...blankStory(),
    id: item.storyId || item.id,
    slug: item.storyId || item.id,
    title: item.generatedTitle || item.subject || "Untitled newsroom story",
    category: normalizeStoryCategory(item.category || "News"),
    date: item.receivedAt.slice(0, 10),
    author: "Michael Hodges",
    sourceType: "Press release",
    sourceName: "Private newsroom email",
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt || item.generatedTitle || item.subject,
    imageCredit: item.imageCredit,
    imageCaption: item.imageCaption,
    oldSeaDogsView:
      "This story began as a newsroom email, so the first job is to separate useful waterfront facts from promotional polish. The item matters only if it changes what sailors, owners, clubs or marina visitors can do next: enter, attend, inspect, compare, avoid a problem, or understand a local decision. The new information should be the named date, place, boat, organiser, result or notice in the report, not the sender's excitement about it. What remains uncertain is anything not supported by the email or an official public page: final entries, weather, availability, pricing, or claims that need testing afloat. Treat it as a pointer, then check the named source before making plans.",
    sourceNotes: `Newsroom email from ${item.senderName || item.senderEmail || "press contact"}.`,
    methodNotes: "Email text cleaned for boilerplate, duplicate wording and promotional claims, then edited for Old Sea Dogs readers before publication.",
    contentBasis: "Press release",
    editorialStatus: "Needs improvement",
    noindex: true,
    summary: item.generatedExcerpt || item.preview,
    body,
    tags: [normalizeStoryCategory(item.category || "News")].filter(Boolean),
    readMinutes: Math.max(3, Math.ceil(text.split(/\s+/).filter(Boolean).length / 220)),
    status: "draft",
  };
}

function normalizeEditorStory(story: EditorStory): EditorStory {
  return {
    ...blankStory(),
    ...story,
    status: story.status === "draft" || story.status === "scheduled" || story.status === "published" || story.status === "unpublished"
      ? story.status
      : "draft",
    category: normalizeStoryCategory(story.category),
    tags: cleanStoryTags(story.tags),
    publishedAt: story.publishedAt || "",
    scheduledPublishAt: story.scheduledPublishAt || "",
    oldSeaDogsView: story.oldSeaDogsView || "",
    sourceNotes: story.sourceNotes || "",
    methodNotes: story.methodNotes || "",
    contentBasis: story.contentBasis || "Old Sea Dogs observation and editorial research",
    editorialStatus: story.editorialStatus || "Needs improvement",
    noindex: Boolean(story.noindex),
  };
}

function normalizePressReleaseForEditor(item: PressReleaseEmail): PressReleaseEmail {
  return {
    ...item,
    category: normalizeStoryCategory(item.category),
  };
}

function uploadFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "old-sea-dogs-photo";
  return `${baseName}.jpg`;
}

function dataUrlToFile(dataUrl: string, filename: string, contentType = "image/jpeg") {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("That press-release image was not in a usable upload format.");
  }
  const mimeType = match[1] || contentType;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], filename || "press-release-photo.jpg", { type: mimeType });
}

function extractCreditHint(text: string) {
  const patterns = [
    /(?:photo|image|picture|credit)\s*(?:by|:|-)\s*([^\n\r.;]+)/i,
    /\u00a9\s*([^\n\r.;]+)/i,
    /copyright\s*(?:by|:|-)?\s*([^\n\r.;]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const credit = match[1].replace(/\s+/g, " ").trim();
      if (credit) return credit.startsWith("\u00a9") ? credit : `\u00a9 ${credit}`;
    }
  }
  return "";
}

function filenameCaption(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function makeUploadedPressAttachment(file: File, media: MediaAsset, bodyText: string): PressReleaseAttachment {
  return {
    id: createSafeId("att"),
    filename: media.filename || file.name,
    contentType: media.contentType || file.type || "image/jpeg",
    size: media.size || file.size,
    dataUrl: media.url,
    suggestedCredit: extractCreditHint(`${bodyText}\n${file.name}`),
    caption: filenameCaption(file.name),
    rightsNote: "Uploaded through the Newsroom media library.",
  };
}

function pressReleaseWordCount(item: Pick<PressReleaseEmail, "generatedBody" | "bodyText">) {
  const text = item.generatedBody.length ? item.generatedBody.join(" ") : item.bodyText;
  return text.split(/\s+/).filter(Boolean).length;
}

function reviewItemWordCount(story: Pick<EditorStory, "body">) {
  return storyWordCount(story);
}

function generatedArticleLength(story: Pick<EditorStory, "body">) {
  return story.body.join("\n\n").trim().length;
}

function reviewContentIssue(story: Pick<EditorStory, "body" | "sourceType" | "sourceUrl">) {
  const wordCount = reviewItemWordCount(story);
  const sourceType = normalizedSourceType(story);
  if (!story.body.join(" ").trim()) return "Empty source";
  if (sourceType.includes("insufficient") || sourceType.includes("needs more source detail")) {
    return story.sourceUrl ? "Scrape failed" : "Import failed";
  }
  if (wordCount < minimumUsableReviewWords) return "Content too short";
  return "";
}

function isIncompleteReviewContent(story: Pick<EditorStory, "body" | "sourceType" | "sourceUrl">) {
  return Boolean(reviewContentIssue(story));
}

function pressStatusLabel(status: PressReleaseStatus) {
  const labels: Record<PressReleaseStatus, string> = {
    new: "Imported",
    reviewed: "Needs Review",
    accepted: "Approved",
    rejected: "Rejected",
    spam: "Spam",
    converted: "Generated",
    published: "Published",
    needsDetail: "Needs Review",
  };
  return labels[status];
}

function pressWorkflowStatus(item: PressReleaseEmail, liveStory?: EditorStory | null) {
  if (item.status === "published") {
    return liveStory && isEditorStoryPublicNow(liveStory) ? "Live" : "Published record missing live page";
  }
  if (item.status === "converted" && item.storyId) return "Draft";
  if (item.status === "converted") return "Generated";
  return pressStatusLabel(item.status);
}

function pressStatusClass(status: PressReleaseStatus, liveStory?: EditorStory | null) {
  if (status === "published" && liveStory && isEditorStoryPublicNow(liveStory)) return "pill live";
  if (status === "spam" || status === "rejected" || status === "needsDetail") return "pill warning";
  if (status === "converted" || status === "accepted") return "pill promoted";
  return "pill";
}

function pressReleaseStyleReport(item: PressReleaseEmail) {
  return analyzeOldSeaDogsStyle({
    sourceText: item.bodyText,
    headline: item.generatedTitle,
    excerpt: item.generatedExcerpt,
    body: item.generatedBody,
    category: item.category,
  });
}

function canPublishPressReleaseItem(item: PressReleaseEmail) {
  const publicationIssues = validateStoryForPublication({
    ...storyFromPressRelease(item),
    status: "published",
  });
  return (
    item.generatedBody.length > 0 &&
    item.status !== "published" &&
    item.status !== "spam" &&
    item.status !== "rejected" &&
    publicationIssues.length === 0
  );
}

function pressReleaseContentIssue(item: PressReleaseEmail) {
  const wordCount = pressReleaseWordCount(item);
  if (!item.bodyText.trim() && item.generatedBody.length === 0) return "Empty source";
  if (item.status === "needsDetail") return item.rawEmail || item.bodyText ? "Content too short" : "Import failed";
  if (wordCount < 100) return "Content too short";
  return "";
}

function formatEditorDateTime(value: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function sourceStatusLabel(status: SourceWatchSite["status"]) {
  return status === "active" ? "Active" : "Inactive";
}

function editorDateToTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function editorStoryHomepageTime(story: Pick<EditorStory, "date" | "createdAt" | "updatedAt">) {
  return (
    editorDateToTime(story.updatedAt) ||
    editorDateToTime(story.createdAt) ||
    editorDateToTime(`${story.date}T00:00:00.000Z`)
  );
}

function isEditorStoryPublicNow(story: Pick<EditorStory, "status" | "publishedAt" | "scheduledPublishAt">) {
  return story.status === "published";
}

function isStaticStoryId(id: string) {
  return id.startsWith("legacy_") || id.startsWith("seed_");
}

function editorStoryOrigin(story: Pick<EditorStory, "id" | "sourceType">) {
  if (story.id.startsWith("legacy_")) return "legacy/static";
  if (story.id.startsWith("seed_")) return "seed/static";
  const sourceType = story.sourceType.trim().toLowerCase();
  if (sourceType.includes("press release")) return "newsroom/editor";
  if (sourceType.includes("automatic")) return "source watch/editor";
  return "editor";
}

function editorStoryOverrideDiagnostics(story: Pick<EditorStory, "id" | "status">) {
  const overridesStatic = isStaticStoryId(story.id);
  const hidesStatic = overridesStatic && story.status === "unpublished";
  return {
    origin: overridesStatic ? editorStoryOrigin({ ...story, sourceType: "" }) : "editor",
    overridesStatic,
    hidesStatic,
  };
}

function isEditorHomepageEligibleStory(story: Pick<EditorStory, "status" | "slug" | "sourceType" | "publishedAt" | "scheduledPublishAt">) {
  const sourceType = story.sourceType.trim().toLowerCase();
  return (
    isEditorStoryPublicNow(story) &&
    Boolean(story.slug.trim()) &&
    sourceType !== "insufficient source detail for publication" &&
    sourceType !== "needs more source detail"
  );
}

function sortEditorStoriesByHomepageRecency(stories: EditorStory[]) {
  return [...stories]
    .filter(isEditorHomepageEligibleStory)
    .sort((a, b) => {
      const timeCompare = editorStoryHomepageTime(b) - editorStoryHomepageTime(a);
      if (timeCompare !== 0) return timeCompare;
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      const updateCompare = b.updatedAt.localeCompare(a.updatedAt);
      if (updateCompare !== 0) return updateCompare;
      return a.sortOrder - b.sortOrder;
    });
}

function isEditorStaticArchiveStory(story: Pick<EditorStory, "id">) {
  return story.id.startsWith("legacy_") || story.id.startsWith("seed_");
}

function getEditorHomepageLatestStories(stories: EditorStory[], excludeSlug = "", limit = 4) {
  const eligibleStories = sortEditorStoriesByHomepageRecency(stories)
    .filter((story) => story.slug !== excludeSlug);
  const currentStories = eligibleStories.filter((story) => !isEditorStaticArchiveStory(story));
  const archiveFallbackStories = eligibleStories.filter(isEditorStaticArchiveStory);
  return [...currentStories, ...archiveFallbackStories].slice(0, limit);
}

function getEditorStoryVisibility(story: EditorStory, stories: EditorStory[]): StoryVisibility {
  const publishedStories = stories.filter(isEditorStoryPublicNow);
  const featuredStory = publishedStories.find((candidate) => candidate.isFeatured) ?? publishedStories[0] ?? null;
  const homepageLatest = getEditorHomepageLatestStories(publishedStories, featuredStory?.slug, 4);
  const section = getSectionForCategory(story.category);
  const sectionStories = section
    ? publishedStories.filter((candidate) => storyMatchesSection(candidate, section)).slice(0, 80)
    : [];
  const actualRoute = sectionPathForCategory(story.category);

  return {
    publicUrl: story.slug ? `/stories/${story.slug}` : "",
    category: displayCategoryLabel(story.category),
    actualRoute,
    homepageEligible: isEditorHomepageEligibleStory(story),
    appearsOnHomepage: Boolean(featuredStory?.id === story.id || homepageLatest.some((candidate) => candidate.id === story.id)),
    appearsInSection: sectionStories.some((candidate) => candidate.id === story.id),
    sectionLabel: section?.label ?? "",
    sectionSlug: section?.slug ?? "",
    sectionFeedAssigned: section ? `${section.label} (${actualRoute})` : "No matching public section",
  };
}

function storyPersistenceDiagnostics(story: EditorStory) {
  const override = editorStoryOverrideDiagnostics(story);
  return `origin: ${editorStoryOrigin(story)} · overridesStatic: ${override.overridesStatic ? "yes" : "no"} · hidesStatic: ${override.hidesStatic ? "yes" : "no"}`;
}

async function loadImageForUpload(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = imageUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The editor could not read this image. Please try another JPG, PNG or WebP file."));
    });

    return image;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The editor could not prepare this image for upload."));
      }
    }, "image/jpeg", quality);
  });
}

async function preparePhotoForUpload(file: File) {
  if (file.size <= maxDirectUploadBytes) {
    return {
      file,
      changed: false,
      message: `Using original image (${formatBytes(file.size)}).`,
    };
  }

  const image = await loadImageForUpload(file);
  const attempts = [
    { longestEdge: 2200, quality: 0.82 },
    { longestEdge: 1800, quality: 0.76 },
    { longestEdge: 1500, quality: 0.7 },
    { longestEdge: 1200, quality: 0.64 },
  ];
  let bestFile: File | null = null;

  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.longestEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("The editor could not prepare this image for upload.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, attempt.quality);
    bestFile = new File([blob], uploadFileName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    if (bestFile.size <= maxDirectUploadBytes) {
      return {
        file: bestFile,
        changed: true,
        message: `Prepared web-sized upload: ${formatBytes(file.size)} original, ${formatBytes(bestFile.size)} sent.`,
      };
    }
  }

  if (!bestFile) {
    throw new Error("The editor could not prepare this image for upload.");
  }

  return {
    file: bestFile,
    changed: true,
    message: `Prepared smallest web-sized upload available: ${formatBytes(file.size)} original, ${formatBytes(bestFile.size)} sent.`,
  };
}

export default function EditorDashboard() {
  const [data, setData] = useState<EditorData | null>(null);
  const [activeTab, setActiveTab] = useState<"stories" | "audit" | "recover" | "scrape" | "press" | "photos" | "ads" | "settings">("stories");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [selectedAdId, setSelectedAdId] = useState<string>("");
  const [selectedPressReleaseId, setSelectedPressReleaseId] = useState<string>("");
  const [storyDraft, setStoryDraft] = useState<EditorStory>(blankStory);
  const [adDraft, setAdDraft] = useState<Advert>(blankAd);
  const [pressReleaseDraft, setPressReleaseDraft] = useState<PressReleaseEmail | null>(null);
  const [pressImportDraft, setPressImportDraft] = useState(blankPressReleaseImport);
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null);
  const [photoAlt, setPhotoAlt] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [photoStoriesOnly, setPhotoStoriesOnly] = useState(false);
  const [message, setMessage] = useState("Loading editor...");
  const [uploadDebug, setUploadDebug] = useState<UploadDebug>(blankUploadDebug());
  const [pressImportDebug, setPressImportDebug] = useState<PressImportDebug>(blankPressImportDebug());
  const [pressSaveDebug, setPressSaveDebug] = useState<PressSaveDebug>(blankPressSaveDebug());
  const [pressPublishDebug, setPressPublishDebug] = useState<PressPublishDebug>(blankPressPublishDebug());
  const [scrapeReviewDebug, setScrapeReviewDebug] = useState<ScrapeReviewDebug>(blankScrapeReviewDebug);
  const [sourceCheckResult, setSourceCheckResult] = useState<SourceCheckResult | null>(null);
  const [articlePreviewStory, setArticlePreviewStory] = useState<EditorStory | null>(null);
  const [deleteStoryCandidate, setDeleteStoryCandidate] = useState<EditorStory | null>(null);
  const [recoveryFilters, setRecoveryFilters] = useState<RecoveryFilters>({
    category: "",
    source: "",
    hasImage: "",
    usable: "",
    search: "",
  });
  const [recoverySelectedIds, setRecoverySelectedIds] = useState<Set<string>>(new Set());
  const [recoveryDiagnostics, setRecoveryDiagnostics] = useState<Record<string, RecoveryDiagnostic>>({});
  const [busy, setBusy] = useState(false);
  const [pendingPublicationOverride, setPendingPublicationOverride] = useState<{
    story: EditorStory;
    editorialWarnings: string[];
    copyrightWarnings: Array<{ message: string; mediaId?: string; filename?: string }>;
    successMessage: string;
  } | null>(null);
  const [classicRightsConfirmed, setClassicRightsConfirmed] = useState(false);
  const [classicOverrideReason, setClassicOverrideReason] = useState("");

  async function loadEditor() {
    setBusy(true);
    try {
      const response = await fetch("/api/editor", { cache: "no-store" });
      const payload = await readEditorPayload(response, "Could not load editor.");
      if (
        !payload.stories ||
        !payload.media ||
        !payload.ads ||
        !payload.settings ||
        !payload.sourceWatch ||
        !payload.pressReleases ||
        !payload.blockedSenders ||
        !payload.emailIngestion ||
        !payload.deployment ||
        !payload.user
      ) {
        throw new Error("The local editor reply was incomplete. Please restart the OldSeaDogs preview.");
      }
      setData(payload as EditorData);
      setSettingsDraft(payload.settings);
      const firstStory = payload.stories[0] ? normalizeEditorStory(payload.stories[0]) : blankStory();
      setSelectedStoryId(firstStory.id);
      setStoryDraft(firstStory);
      const firstAd = payload.ads[0] ?? blankAd();
      setSelectedAdId(firstAd.id);
      setAdDraft(firstAd);
      const currentPress =
        payload.pressReleases.find((item) => item.id === selectedPressReleaseId) ??
        payload.pressReleases[0] ??
        null;
      setSelectedPressReleaseId(currentPress?.id || "");
      setPressReleaseDraft(currentPress ? normalizePressReleaseForEditor(currentPress) : null);
      setMessage("Ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load editor.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEditor();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const imageChoices = useMemo(
    () => [
      ...starterImages,
      ...(data?.media ?? []).map((asset) => ({
        url: asset.url,
        label: asset.alt || asset.filename,
      })),
    ],
    [data?.media]
  );

  const visibleStories = useMemo(() => {
    const stories = data?.stories ?? [];
    const query = storySearch.trim().toLowerCase();
    return stories
      .filter((story) => !photoStoriesOnly || hasPickedPhoto(story))
      .filter((story) => {
        if (!query) return true;
        return [
          story.title,
          story.category,
          story.date,
          story.author,
          story.sourceName,
          story.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 200);
  }, [data?.stories, photoStoriesOnly, storySearch]);
  const editorialAuditRows = useMemo(() => {
    const stories = data?.stories ?? [];
    return stories
      .map((story) => auditStory(story, stories))
      .sort((a, b) => {
        if (a.flags.length !== b.flags.length) return b.flags.length - a.flags.length;
        return editorStoryHomepageTime(b.story) - editorStoryHomepageTime(a.story);
      });
  }, [data?.stories]);

  const reviewStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter(isActiveReviewStory)
      .filter((story) => storyWordCount(story) >= minimumUsableReviewWords)
      .slice(0, 100);
  }, [data?.stories]);
  const shortReviewStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter(isActiveReviewStory)
      .filter((story) => storyWordCount(story) < minimumUsableReviewWords)
      .slice(0, 30);
  }, [data?.stories]);
  const handledReviewStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter(isHandledReviewStory)
      .slice(0, 30);
  }, [data?.stories]);
  const recentPublishedStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter(isEditorStoryPublicNow)
      .sort((a, b) => editorStoryHomepageTime(b) - editorStoryHomepageTime(a))
      .slice(0, 12);
  }, [data?.stories]);
  const scheduledStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter((story) => story.status === "scheduled")
      .sort((a, b) => (a.scheduledPublishAt || "").localeCompare(b.scheduledPublishAt || ""))
      .slice(0, 12);
  }, [data?.stories]);
  const draftStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter((story) => story.status === "draft")
      .sort((a, b) => editorStoryHomepageTime(b) - editorStoryHomepageTime(a))
      .slice(0, 12);
  }, [data?.stories]);
  const unpublishedStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter((story) => story.status === "unpublished")
      .sort((a, b) => editorStoryHomepageTime(b) - editorStoryHomepageTime(a))
      .slice(0, 12);
  }, [data?.stories]);
  const allRecoverableDraftStories = useMemo(() => {
    return (data?.stories ?? [])
      .filter((story) => story.status === "draft")
      .sort((a, b) => editorStoryHomepageTime(b) - editorStoryHomepageTime(a));
  }, [data?.stories]);
  const recoveryCategories = useMemo(() => {
    return Array.from(new Set(allRecoverableDraftStories.map((story) => displayCategoryLabel(story.category)))).sort();
  }, [allRecoverableDraftStories]);
  const recoverySources = useMemo(() => {
    return Array.from(new Set(allRecoverableDraftStories.map(draftStorySourceLabel))).sort();
  }, [allRecoverableDraftStories]);
  const filteredRecoverableDraftStories = useMemo(() => {
    const query = recoveryFilters.search.trim().toLowerCase();
    return allRecoverableDraftStories.filter((story) => {
      const category = displayCategoryLabel(story.category);
      const source = draftStorySourceLabel(story);
      const hasImage = hasPickedPhoto(story);
      const wordCount = storyWordCount(story);
      const likelyUsable = wordCount >= minimumUsableReviewWords && Boolean(story.slug.trim() && story.title.trim());

      if (recoveryFilters.category && category !== recoveryFilters.category) return false;
      if (recoveryFilters.source && source !== recoveryFilters.source) return false;
      if (recoveryFilters.hasImage === "with" && !hasImage) return false;
      if (recoveryFilters.hasImage === "without" && hasImage) return false;
      if (recoveryFilters.usable === "usable" && !likelyUsable) return false;
      if (recoveryFilters.usable === "needs-work" && likelyUsable) return false;
      if (query) {
        const haystack = [
          story.title,
          story.slug,
          story.category,
          story.sourceType,
          story.sourceName,
          story.tags.join(" "),
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allRecoverableDraftStories, recoveryFilters]);
  const currentReviewStory = isActiveReviewStory(storyDraft)
    ? storyDraft
    : reviewStories[0] ?? null;
  const currentReviewStyleReport = currentReviewStory
    ? analyzeOldSeaDogsStyle({
        headline: currentReviewStory.title,
        excerpt: currentReviewStory.summary,
        body: currentReviewStory.body,
        category: currentReviewStory.category,
      })
    : null;
  const pressReleaseQueue = useMemo(() => {
    return (data?.pressReleases ?? []).slice().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }, [data?.pressReleases]);
  const activePressRelease =
    pressReleaseDraft && data?.pressReleases.some((item) => item.id === pressReleaseDraft.id)
      ? pressReleaseDraft
      : pressReleaseQueue[0] ?? null;

  function pickStory(story: EditorStory) {
    setSelectedStoryId(story.id);
    setStoryDraft(normalizeEditorStory(story));
    setActiveTab("stories");
  }

  function pickReviewStory(story: EditorStory, attemptedAction = "Review") {
    const missingFields = [
      story.id ? "" : "id",
      story.title ? "" : "title",
      story.sourceType ? "" : "sourceType",
    ].filter(Boolean);

    setScrapeReviewDebug({
      itemId: story.id || "missing item id",
      itemType: story.sourceType || "missing source type",
      attemptedAction,
      missingDataField: missingFields.join(", "),
      apiResponseStatus: "Not needed; opening local editor state",
      errorMessage: missingFields.length ? `Missing ${missingFields.join(", ")}` : "",
    });

    if (missingFields.length > 0) {
      setMessage(`Cannot open review item yet: missing ${missingFields.join(", ")}.`);
      return;
    }

    setSelectedStoryId(story.id);
    setStoryDraft(normalizeEditorStory(story));
    setActiveTab("scrape");
    setMessage(`${attemptedAction} opened: ${story.title || story.id}`);
  }

  function openScrapeReview() {
    const firstReview = reviewStories[0];
    if (firstReview && !isActiveReviewStory(storyDraft)) {
      setSelectedStoryId(firstReview.id);
      setStoryDraft(normalizeEditorStory(firstReview));
    }
    setActiveTab("scrape");
  }

  function openPressRoom() {
    const firstPressRelease = pressReleaseQueue[0];
    if (!pressReleaseDraft && firstPressRelease) {
      setSelectedPressReleaseId(firstPressRelease.id);
      setPressReleaseDraft(normalizePressReleaseForEditor(firstPressRelease));
    }
    setActiveTab("press");
  }

  function pickPressRelease(item: PressReleaseEmail) {
    setSelectedPressReleaseId(item.id);
    setPressReleaseDraft(normalizePressReleaseForEditor(item));
    setActiveTab("press");
  }

  function previewArticle(story: EditorStory) {
    setArticlePreviewStory(story);
    setMessage("Preview Article opened. Nothing has been published.");
  }

  function previewPressReleaseArticle(item: PressReleaseEmail) {
    previewArticle(storyFromPressRelease(item));
  }

  function updatePressReleaseInState(item: PressReleaseEmail) {
    setData((current) =>
      current
        ? {
            ...current,
            pressReleases: [
              normalizePressReleaseForEditor(item),
              ...current.pressReleases.filter((pressRelease) => pressRelease.id !== item.id),
            ].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
          }
        : current
    );
    setSelectedPressReleaseId(item.id);
    setPressReleaseDraft(normalizePressReleaseForEditor(item));
  }

  async function importPressReleaseDraft(
    draft: ReturnType<typeof blankPressReleaseImport>,
    attemptedAction: string,
    selectedFileName = pressImportDebug.selectedFileName
  ) {
    const hasContent = draft.rawEmail.trim() || draft.bodyText.trim() || draft.subject.trim();
    if (!hasContent) {
      setMessage("Paste an email, upload a .eml file, or add the subject and body before importing.");
      setPressImportDebug((current) => ({
        ...current,
        attemptedAction,
        selectedFileName,
        requestSent: "No",
        requestUrl: "/api/editor",
        responseStatus: "Not sent",
        error: "No email text, raw .eml content, or subject was supplied.",
      }));
      return;
    }

    setBusy(true);
    setMessage("Importing press release into the private review queue...");
    setPressImportDebug({
      ...blankPressImportDebug(attemptedAction),
      selectedFileName,
      requestSent: "Yes",
      requestUrl: "/api/editor?action=importPressReleaseEmail",
      responseStatus: "Waiting for editor reply...",
    });
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "importPressReleaseEmail",
          pressRelease: draft,
        }),
      });
      const responseText = await response.text();
      let payload: EditorApiPayload;
      try {
        payload = JSON.parse(responseText) as EditorApiPayload;
      } catch {
        setPressImportDebug((current) => ({
          ...current,
          selectedFileName,
          attemptedAction,
          requestSent: "Yes",
          requestUrl: "/api/editor?action=importPressReleaseEmail",
          responseStatus: `${response.status} ${response.statusText || ""}`.trim(),
          responseText: responseText.slice(0, 600),
          error: response.ok ? "Broken editor reply." : "Import request failed.",
        }));
        throw new Error(
          response.ok
            ? "The editor received a broken import reply. Please restart the OldSeaDogs preview."
            : `Import failed with ${response.status} ${response.statusText || ""}. ${responseText.slice(0, 220)}`
        );
      }
      if (!response.ok) {
        setPressImportDebug((current) => ({
          ...current,
          selectedFileName,
          attemptedAction,
          requestSent: "Yes",
          requestUrl: "/api/editor?action=importPressReleaseEmail",
          responseStatus: `${response.status} ${response.statusText || ""}`.trim(),
          responseText: responseText.slice(0, 600),
          error: payload.error || "Could not import press release.",
        }));
        throw new Error(payload.error || "Could not import press release.");
      }
      if (!payload.pressRelease) throw new Error("The press release imported, but the editor did not receive it.");
      const imported = normalizePressReleaseForEditor(payload.pressRelease);
      const importedWords = pressReleaseWordCount(imported);
      const imageCount = imported.attachments.length;
      updatePressReleaseInState(imported);
      setPressImportDraft(blankPressReleaseImport());
      setPressImportDebug({
        selectedFileName,
        attemptedAction,
        requestSent: "Yes",
        requestUrl: "/api/editor?action=importPressReleaseEmail",
        responseStatus: `${response.status} ${response.statusText || "OK"}`.trim(),
        responseText: responseText.slice(0, 600),
        extractedSubject: imported.subject || "No subject extracted",
        extractedSender: imported.senderName || imported.senderEmail || "No sender extracted",
        extractedBodyLength: `${imported.bodyText.length} characters / ${importedWords} words`,
        extractedImageCount: String(imageCount),
        itemId: imported.id,
        storeSaveStatus: "Saved to editor queue",
        error: "",
      });
      setActiveTab("press");
      if (imported.attachments.length > 0 && !imported.imageUrl && imported.status !== "spam" && imported.status !== "rejected") {
        await attachPressAttachmentAsFeatured(
          imported,
          imported.attachments[0],
          "Email imported. Image attachment uploaded, previewed, and selected as the featured image."
        );
      } else {
        setMessage(
          imported.status === "spam"
            ? "Press release imported and marked as spam for review."
            : imported.status === "needsDetail"
              ? "Press release imported, but it needs more detail before article generation. You can edit it or delete it from the queue."
            : imported.attachments.length === 0
              ? "Press release imported for review. No image attachments were found in this email. You can add photos manually."
              : "Press release imported for review."
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import press release.";
      setMessage(message);
      setPressImportDebug((current) => ({
        ...current,
        attemptedAction,
        selectedFileName,
        requestSent: current.requestSent || "Yes",
        requestUrl: current.requestUrl || "/api/editor?action=importPressReleaseEmail",
        responseStatus: current.responseStatus || "Import failed",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  }

  async function importPressRelease() {
    await importPressReleaseDraft(
      pressImportDraft,
      pressImportDraft.rawEmail.trim() ? "Import .eml/raw email" : "Paste import",
      pressImportDebug.selectedFileName
    );
  }

  async function uploadPressEml(file: File) {
    setBusy(true);
    setMessage("Reading .eml email file...");
    setPressImportDebug({
      ...blankPressImportDebug("Upload .eml"),
      selectedFileName: file.name,
      requestUrl: "/api/editor?action=importPressReleaseEmail",
      responseStatus: "Reading selected file...",
    });
    try {
      const rawEmail = await file.text();
      const nextDraft = {
        ...pressImportDraft,
        rawEmail,
        subject: pressImportDraft.subject || file.name.replace(/\.[^.]+$/, ""),
      };
      setPressImportDraft(nextDraft);
      setBusy(false);
      await importPressReleaseDraft(nextDraft, "Upload .eml", file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read that .eml file.";
      setMessage(message);
      setPressImportDebug((current) => ({
        ...current,
        selectedFileName: file.name,
        responseStatus: "File read failed",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  }

  async function addPressAttachments(files: FileList | null) {
    if (!files || !files.length) return;
    const fileList = Array.from(files);
    const firstFile = fileList[0];
    const firstPreviewSrc = firstFile ? URL.createObjectURL(firstFile) : "";
    if (firstFile) {
      setUploadDebug({
        ...blankUploadDebug("File selected for Newsroom photo upload."),
        selectedFileName: firstFile.name,
        uploadRequestUrl: "/api/editor",
        previewSrc: firstPreviewSrc,
      });
    }
    setMessage("File selected. Showing preview and sending Newsroom photo upload...");
    try {
      const targetPressRelease = activePressRelease;
      if (targetPressRelease) {
        let currentItem = targetPressRelease;
        for (const [index, file] of fileList.entries()) {
          const previewSrc = index === 0 ? firstPreviewSrc : URL.createObjectURL(file);
          const saved = await uploadPressPhotoToItem(
            currentItem,
            file,
            previewSrc,
            index === 0,
            index === 0
              ? "Image uploaded. Preview is ready. Featured image selected and saved to this Newsroom item."
              : "Additional Newsroom photo uploaded and saved."
          );
          if (saved) currentItem = saved;
        }
      } else {
        const attachments: PressReleaseAttachment[] = [];
        for (const [index, file] of fileList.entries()) {
          const previewSrc = index === 0 ? firstPreviewSrc : URL.createObjectURL(file);
          const media = await uploadMediaFile(
            file,
            filenameCaption(file.name) || file.name,
            "Uploading photo for the Newsroom import form...",
            {
              localPreviewSrc: previewSrc,
              skipClientPrepare: true,
            }
          );
          if (media) {
            attachments.push(makeUploadedPressAttachment(file, media, pressImportDraft.bodyText || ""));
          }
        }
        setPressImportDraft((current) => ({
          ...current,
          attachments: [...current.attachments, ...attachments],
        }));
        if (attachments[0]) {
          setUploadDebug((current) => ({
            ...current,
            uploadStatus: "Photo uploaded and added to the import form. Import the email to save it.",
            mediaRecordCreated: "Yes",
            previewSrc: attachments[0].dataUrl,
            returnedImageUrl: attachments[0].dataUrl,
            thumbnailUrl: thumbnailUrlFromMediaUrl(attachments[0].dataUrl),
          }));
        }
        setMessage(attachments.length ? "Photo uploaded and added. Import the email when ready." : "No photo could be uploaded.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload that Newsroom photo.";
      setMessage(message);
      setUploadDebug((current) => ({
        ...current,
        uploadStatus: "Upload failed.",
        error: message,
        previewSrc: current.previewSrc || firstPreviewSrc,
      }));
    }
  }

  async function savePressRelease(item: PressReleaseEmail, successMessage = "Press-release item saved.") {
    setBusy(true);
    setMessage("Saving press-release review item...");
    try {
      const payloadPressRelease = pressReleaseSavePayload(item);
      const requestBody = JSON.stringify({ action: "savePressRelease", pressRelease: payloadPressRelease });
      const dataAttachmentCount = item.attachments.filter((attachment) => attachment.dataUrl.startsWith("data:")).length;
      const debugSnapshot: PressSaveDebug = {
        ...blankPressSaveDebug("Waiting for editor save reply..."),
        requestSent: "Yes",
        requestUrl: "/api/editor?action=savePressRelease",
        itemId: item.id,
        payloadBytes: formatBytes(textBytes(requestBody)),
        rawEmailBytesSkipped: formatBytes(textBytes(item.rawEmail || "")),
        attachmentCount: String(item.attachments.length),
        dataAttachmentCountSkipped: String(dataAttachmentCount),
        sentAttachmentCount: String(payloadPressRelease.attachments?.length ?? 0),
      };
      setPressSaveDebug(debugSnapshot);
      console.info("[OldSeaDogs editor] savePressRelease request", debugSnapshot);

      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: requestBody,
      });
      const responseText = await response.text();
      setPressSaveDebug((current) => ({
        ...current,
        responseStatus: editorResponseStatus(response),
        responseText: responseText.slice(0, 1200),
        error: response.ok ? "" : responseText.slice(0, 400),
      }));
      const payload = parseEditorPayloadText(response, responseText, "Could not save press release.");
      if (!payload.pressRelease) throw new Error("The press release was saved, but the editor did not receive it.");
      const returnedPressRelease = payload.pressRelease;
      const savedPressRelease = normalizePressReleaseForEditor({
        ...item,
        ...returnedPressRelease,
        rawEmail: returnedPressRelease.rawEmail || item.rawEmail,
        attachments: Array.isArray(returnedPressRelease.attachments)
          ? returnedPressRelease.attachments
          : item.attachments,
      });
      updatePressReleaseInState(savedPressRelease);
      if (savedPressRelease.id === selectedPressReleaseId || savedPressRelease.id === pressReleaseDraft?.id) {
        setPressReleaseDraft(savedPressRelease);
      }
      if (savedPressRelease.imageUrl) {
        setUploadDebug((current) => ({
          ...current,
          articleImageField: savedPressRelease.imageUrl || current.articleImageField,
          featuredImageField: savedPressRelease.imageUrl || current.featuredImageField,
          previewSrc: savedPressRelease.imageUrl || current.previewSrc,
          mediaId: mediaIdFromUrl(savedPressRelease.imageUrl) || current.mediaId,
          thumbnailUrl: thumbnailUrlFromMediaUrl(savedPressRelease.imageUrl) || current.thumbnailUrl,
        }));
      }
      setMessage(successMessage);
      return savedPressRelease;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save press release.";
      console.error("[OldSeaDogs editor] savePressRelease failed", error);
      setPressSaveDebug((current) => ({
        ...current,
        error: message,
        responseStatus: current.responseStatus || "Save failed before server reply",
      }));
      setMessage(message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function attachPressAttachmentAsFeatured(
    item: PressReleaseEmail,
    attachment: PressReleaseAttachment,
    successMessage = "Image uploaded. Image attached to article. Featured image selected."
  ) {
    try {
      if (attachment.dataUrl.startsWith("/api/media/")) {
        const updated = {
          ...item,
          attachments: [attachment, ...item.attachments.filter((candidate) => candidate.id !== attachment.id)],
          selectedAttachmentId: attachment.id,
          imageUrl: attachment.dataUrl,
          imageAlt: attachment.caption || attachment.filename,
          imageCaption: item.imageCaption || attachment.caption,
          imageCredit: item.imageCredit || attachment.suggestedCredit,
          rightsNote: item.rightsNote || attachment.rightsNote,
        };
        const saved = await savePressRelease(updated, successMessage);
        setUploadDebug((current) => ({
          ...current,
          uploadStatus: "Image attached to article. Featured image selected.",
          mediaRecordCreated: "Yes",
          mediaId: mediaIdFromUrl(attachment.dataUrl) || current.mediaId,
          returnedImageUrl: attachment.dataUrl,
          thumbnailUrl: thumbnailUrlFromMediaUrl(attachment.dataUrl),
          articleImageField: saved?.imageUrl || attachment.dataUrl,
          featuredImageField: saved?.imageUrl || attachment.dataUrl,
          previewSrc: saved?.imageUrl || attachment.dataUrl,
          error: "",
        }));
        return saved;
      }

      const file = dataUrlToFile(attachment.dataUrl, attachment.filename, attachment.contentType);
      const media = await uploadMediaFile(
        file,
        attachment.caption || attachment.filename,
        "Uploading press-release photo to staging media storage..."
      );
      if (!media) return null;
      const nextAttachments = [attachment, ...item.attachments.filter((candidate) => candidate.id !== attachment.id)];

      const updated = {
        ...item,
        attachments: nextAttachments,
        selectedAttachmentId: attachment.id,
        imageUrl: media.url,
        imageAlt: attachment.caption || attachment.filename,
        imageCaption: item.imageCaption || attachment.caption,
        imageCredit: item.imageCredit || attachment.suggestedCredit,
        rightsNote: item.rightsNote || attachment.rightsNote,
      };
      const saved = await savePressRelease(
        updated,
        successMessage
      );
      setUploadDebug((current) => ({
        ...current,
        uploadStatus: "Image uploaded. Image attached to article. Featured image selected.",
        mediaRecordCreated: "Yes",
        mediaId: media.id,
        returnedImageUrl: media.url,
        thumbnailUrl: thumbnailUrlFromMediaUrl(media.url),
        articleImageField: saved?.imageUrl || media.url,
        featuredImageField: saved?.imageUrl || media.url,
        previewSrc: saved?.imageUrl || media.url,
        error: "",
      }));
      return saved;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not attach that press-release photo.");
      setUploadDebug((current) => ({
        ...current,
        uploadStatus: "Upload failed while attaching the Newsroom photo.",
        error: error instanceof Error ? error.message : "Could not attach that press-release photo.",
      }));
      return null;
    }
  }

  async function uploadPressPhotoToItem(
    item: PressReleaseEmail,
    file: File,
    localPreviewSrc: string,
    useAsFeatured: boolean,
    successMessage: string
  ) {
    const media = await uploadMediaFile(
      file,
      filenameCaption(file.name) || file.name,
      "Uploading Newsroom photo to staging media storage...",
      {
        localPreviewSrc,
        skipClientPrepare: true,
      }
    );
    if (!media) return null;

    setUploadDebug((current) => ({
      ...current,
      uploadStatus: "Upload successful.",
      mediaRecordCreated: "Yes",
      mediaId: media.id,
      returnedImageUrl: media.url,
      thumbnailUrl: media.thumbnailUrl || thumbnailUrlFromMediaUrl(media.url),
      articleImageField: useAsFeatured ? media.url : current.articleImageField,
      featuredImageField: useAsFeatured ? media.url : current.featuredImageField,
      previewSrc: media.url,
      error: "",
    }));

    try {
      const attachment = makeUploadedPressAttachment(file, media, item.bodyText || pressImportDraft.bodyText || "");
      const nextAttachments = [attachment, ...item.attachments.filter((candidate) => candidate.id !== attachment.id)];
      const updated: PressReleaseEmail = useAsFeatured
        ? {
            ...item,
            attachments: nextAttachments,
            selectedAttachmentId: attachment.id,
            imageUrl: media.url,
            imageAlt: attachment.caption || attachment.filename,
            imageCaption: item.imageCaption || attachment.caption,
            imageCredit: item.imageCredit || attachment.suggestedCredit,
            rightsNote: item.rightsNote || attachment.rightsNote,
          }
        : {
            ...item,
            attachments: nextAttachments,
          };
      const saved = await savePressRelease(updated, successMessage);

      setUploadDebug((current) => ({
        ...current,
        uploadStatus: useAsFeatured
          ? "Upload successful. Image attached to article. Featured image selected."
          : "Upload successful. Image saved to this Newsroom item.",
        mediaRecordCreated: "Yes",
        mediaId: media.id,
        returnedImageUrl: media.url,
        thumbnailUrl: media.thumbnailUrl || thumbnailUrlFromMediaUrl(media.url),
        articleImageField: saved?.imageUrl || (useAsFeatured ? media.url : current.articleImageField),
        featuredImageField: saved?.imageUrl || (useAsFeatured ? media.url : current.featuredImageField),
        previewSrc: saved?.imageUrl || media.url,
        error: "",
      }));
      return saved;
    } catch (error) {
      const warning = error instanceof Error ? error.message : "The editor UI could not finish attaching this image.";
      const fallback: PressReleaseEmail = useAsFeatured
        ? {
            ...item,
            imageUrl: media.url,
            imageAlt: filenameCaption(file.name) || file.name,
            imageCaption: item.imageCaption || filenameCaption(file.name),
          }
        : item;
      updatePressReleaseInState(fallback);
      setMessage(`Upload succeeded, but editor UI update warning: ${warning}`);
      setUploadDebug((current) => ({
        ...current,
        uploadStatus: `Upload succeeded, but editor UI update warning: ${warning}`,
        mediaRecordCreated: "Yes",
        mediaId: media.id,
        returnedImageUrl: media.url,
        thumbnailUrl: media.thumbnailUrl || thumbnailUrlFromMediaUrl(media.url),
        articleImageField: useAsFeatured ? media.url : current.articleImageField,
        featuredImageField: useAsFeatured ? media.url : current.featuredImageField,
        previewSrc: media.url,
        error: "",
      }));
      return fallback;
    }
  }

  async function selectPressAttachmentAsImage(attachment: PressReleaseAttachment) {
    if (!activePressRelease) return null;
    return attachPressAttachmentAsFeatured(activePressRelease, attachment);
  }

  async function markPressRelease(status: PressReleaseStatus, successMessage: string) {
    if (!activePressRelease) return;
    setBusy(true);
    setMessage("Updating press-release status...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "markPressRelease", id: activePressRelease.id, pressReleaseStatus: status }),
      });
      const payload = await readEditorPayload(response, "Could not update press-release status.");
      if (!payload.pressRelease) throw new Error("The editor did not receive the updated press release.");
      updatePressReleaseInState(payload.pressRelease);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update press-release status.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePressReleaseItem(item: PressReleaseEmail | null = activePressRelease) {
    if (!item) return;

    const linkedStory = item.storyId && data?.stories
      ? data.stories.find((story) => story.id === item.storyId)
      : null;
    let deleteMode: "queueOnly" | "unpublishStory" = "queueOnly";

    if ((linkedStory && isEditorStoryPublicNow(linkedStory)) || item.status === "published") {
      const choice = window.prompt(
        [
          "This newsroom item is linked to a public story.",
          "",
          "Type QUEUE to remove it from the editor queue only.",
          "Type UNPUBLISH to unpublish the public story and remove the queue item.",
          "Leave blank to cancel.",
        ].join("\n"),
        "QUEUE"
      );
      const normalizedChoice = choice?.trim().toLowerCase() || "";
      if (!normalizedChoice) return;
      if (normalizedChoice === "queue") {
        deleteMode = "queueOnly";
      } else if (normalizedChoice === "unpublish") {
        deleteMode = "unpublishStory";
      } else {
        setMessage("Delete cancelled. Type QUEUE or UNPUBLISH when choosing a published newsroom item.");
        return;
      }
    } else if (!confirm("Delete this imported email/story from the editor queue?")) {
      return;
    }

    setBusy(true);
    setMessage("Deleting newsroom item from the editor queue...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "deletePressRelease", id: item.id, deleteMode }),
      });
      const payload = await readEditorPayload(response, "Could not delete newsroom item.");
      if (!payload.deleted) throw new Error("The editor did not confirm that the newsroom item was deleted.");
      setData((current) => {
        if (!current) return current;
        const nextStories = payload.story
          ? [payload.story, ...current.stories.filter((story) => story.id !== payload.story?.id)]
          : current.stories;
        return {
          ...current,
          stories: nextStories,
          pressReleases: current.pressReleases.filter((pressRelease) => pressRelease.id !== item.id),
        };
      });
      const nextItem = pressReleaseQueue.find((candidate) => candidate.id !== item.id) ?? null;
      setSelectedPressReleaseId(nextItem?.id || "");
      setPressReleaseDraft(nextItem ? normalizePressReleaseForEditor(nextItem) : null);
      setPressImportDebug((current) => ({
        ...current,
        attemptedAction: "Delete newsroom item",
        requestSent: "Yes",
        requestUrl: "/api/editor?action=deletePressRelease",
        responseStatus: `${response.status} ${response.statusText || "OK"}`.trim(),
        itemId: item.id,
        storeSaveStatus: "Removed from editor queue",
        error: "",
      }));
      setMessage(
        payload.publicStoryAction === "unpublished"
          ? "Newsroom item deleted and the linked public story was unpublished."
          : "Newsroom item deleted from the editor queue. Any public story was left unchanged."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete newsroom item.";
      setMessage(message);
      setPressImportDebug((current) => ({
        ...current,
        attemptedAction: "Delete newsroom item",
        requestSent: "Yes",
        requestUrl: "/api/editor?action=deletePressRelease",
        responseStatus: current.responseStatus || "Delete failed",
        itemId: item.id,
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  }

  async function blockActivePressRelease(kind: "sender" | "domain") {
    if (!activePressRelease) return;
    const value = kind === "domain" ? activePressRelease.senderDomain : activePressRelease.senderEmail;
    if (!value) {
      setMessage("There is no sender or domain to block on this item.");
      return;
    }

    setBusy(true);
    setMessage(`Blocking ${kind}...`);
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "blockPressReleaseSender",
          block: { value, kind, reason: "Blocked from the Email Press Releases editor" },
        }),
      });
      const payload = await readEditorPayload(response, "Could not block sender.");
      await loadEditor();
      setMessage(payload.blockedSender ? `${kind === "domain" ? "Domain" : "Sender"} blocked.` : "Block saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not block sender.");
    } finally {
      setBusy(false);
    }
  }

  async function unblockSender(id: string) {
    setBusy(true);
    setMessage("Removing blocked sender...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unblockPressReleaseSender", blockId: id }),
      });
      await readEditorPayload(response, "Could not unblock sender.");
      await loadEditor();
      setMessage("Sender or domain unblocked.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not unblock sender.");
    } finally {
      setBusy(false);
    }
  }

  async function generatePressRelease() {
    if (!activePressRelease) return;
    setBusy(true);
    setMessage("Saving the latest newsroom edits before generating the article...");
    try {
      const saved = await savePressRelease(activePressRelease, "Latest newsroom edits saved for generation.");
      if (!saved) return;
      setMessage("Generating an Old Sea Dogs-style article for review...");
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generatePressReleaseArticle", id: saved.id }),
      });
      const payload = await readEditorPayload(response, "Could not generate article.");
      if (!payload.pressRelease) throw new Error("The article was generated, but the editor did not receive it.");
      updatePressReleaseInState(payload.pressRelease);
      setMessage(
        payload.pressRelease.status === "needsDetail"
          ? "Needs more source detail before an article can be written."
          : "Article generated for review. Nothing has been published."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate article.");
    } finally {
      setBusy(false);
    }
  }

  async function savePressReleaseDraft() {
    if (!activePressRelease) return;
    const saved = await savePressRelease(activePressRelease, "Press-release edits saved.");
    if (!saved) return;

    setBusy(true);
    setMessage("Saving as private story draft...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "savePressReleaseDraft", id: saved.id }),
      });
      const payload = await readEditorPayload(response, "Could not save press release as draft.");
      if (!payload.story || !payload.pressRelease) throw new Error("Draft saved, but the editor did not receive the updated record.");
      await loadEditor();
      setSelectedStoryId(payload.story.id);
      setStoryDraft(normalizeEditorStory(payload.story));
      setSelectedPressReleaseId(payload.pressRelease.id);
      setPressReleaseDraft(normalizePressReleaseForEditor(payload.pressRelease));
      setMessage("Saved as a story draft. Final publish still requires the Publish button.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save press release as draft.");
    } finally {
      setBusy(false);
    }
  }

  async function publishPressReleaseFinal(item: PressReleaseEmail | null = activePressRelease) {
    if (!item) return;
    setPressPublishDebug({
      ...blankPressPublishDebug(),
      publishButtonClicked: "Yes",
      activeItemId: item.id,
      selectedImageUrl: item.imageUrl || "No image on active item",
      featuredImageUrl: item.imageUrl || "No featured image on active item",
      imageUrl: item.imageUrl || "No image on active item",
      mediaId: mediaIdFromUrl(item.imageUrl) || "No media ID",
      draftImageField: item.storyId
        ? data?.stories.find((story) => story.id === item.storyId)?.imageUrl || "No draft image found"
        : "No draft story yet",
      draftFeaturedImageField: item.storyId
        ? data?.stories.find((story) => story.id === item.storyId)?.imageUrl || "No draft featured image found"
        : "No draft story yet",
    });
    if (!confirm("Publish this newsroom story to the staging/development site?")) return;
    setSelectedPressReleaseId(item.id);
    setPressReleaseDraft(normalizePressReleaseForEditor(item));
    const saved = await savePressRelease(item, "Press-release edits saved.");
    if (!saved) return;

    setBusy(true);
    setMessage("Publishing newsroom story and checking the public URL...");
    setPressPublishDebug((current) => ({
      ...current,
      publishRequestSent: "Yes",
      apiResponse: "Waiting for /api/editor publishPressReleaseStory response...",
    }));
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publishPressReleaseStory", id: saved.id }),
      });
      const payload = await readEditorPayload(response, "Could not publish press release.");
      if (!payload.story || !payload.pressRelease) throw new Error("Published, but the editor did not receive the updated story.");
      const publishedStory = payload.story;
      const publishedPressRelease = payload.pressRelease;
      const publishDiagnostics = payload.publishDiagnostics;
      setPressPublishDebug((current) => ({
        ...current,
        apiResponse: `${response.status} ${response.statusText || "OK"}`.trim(),
        storyCreated: publishDiagnostics?.storyCreated === false ? "No" : "Yes",
        storySlug: publishDiagnostics?.storySlug || publishedStory.slug || "",
        storyStatus: publishDiagnostics?.storyStatus || publishedStory.status || "",
        appearsOnHomepage: publishDiagnostics?.appearsOnHomepage ? "Yes" : payload.visibility?.appearsOnHomepage ? "Yes" : "No",
        appearsInSection: publishDiagnostics?.appearsInSection ? "Yes" : payload.visibility?.appearsInSection ? "Yes" : "No",
        publicUrl: publishDiagnostics?.publicUrl || payload.publicUrl || `/stories/${publishedStory.slug}`,
        selectedImageUrl: publishDiagnostics?.selectedImageUrl || saved.imageUrl || "",
        featuredImageUrl: publishDiagnostics?.featuredImageUrl || publishedStory.imageUrl || "",
        imageUrl: publishDiagnostics?.imageUrl || saved.imageUrl || "",
        mediaId: publishDiagnostics?.mediaId || mediaIdFromUrl(publishedStory.imageUrl) || "",
        draftImageField: publishDiagnostics?.draftImageField || current.draftImageField,
        draftFeaturedImageField: publishDiagnostics?.draftFeaturedImageField || current.draftFeaturedImageField,
        publishPayloadImageField: publishDiagnostics?.publishPayloadImageField || "",
        publishPayloadFeaturedImageField: publishDiagnostics?.publishPayloadFeaturedImageField || "",
        publicStoryImageField: publishDiagnostics?.publicStoryImageField || publishedStory.imageUrl || "",
        publicStoryFeaturedImageField: publishDiagnostics?.publicStoryFeaturedImageField || publishedStory.imageUrl || "",
        publicStoryInlineImageCount: String(publishDiagnostics?.publicStoryInlineImageCount ?? 0),
        isHomepageFeatured: publishedStory.isFeatured ? "Yes" : "No",
        homepageFeaturedSlug:
          data?.stories.find((story) => isEditorStoryPublicNow(story) && story.isFeatured)?.slug || "",
        appearsAsMainHomepageFeature: publishedStory.isFeatured ? "Yes" : "No",
        error: "",
      }));
      await loadEditor();
      setSelectedStoryId(publishedStory.id);
      setStoryDraft(normalizeEditorStory(publishedStory));
      setSelectedPressReleaseId(publishedPressRelease.id);
      setPressReleaseDraft(normalizePressReleaseForEditor(publishedPressRelease));
      const publicUrl = payload.publicUrl || `/stories/${publishedStory.slug}`;
      const visibility = payload.visibility;
      const imageDiagnostics = payload.imageDiagnostics;
      const imageStatus = imageDiagnostics
        ? ` Story image field saved: ${imageDiagnostics.storyImageUrl || "no"}. Featured image URL saved: ${imageDiagnostics.featuredImageUrl || "no"}. Caption saved: ${imageDiagnostics.caption || "no"}. Credit saved: ${imageDiagnostics.credit || "no"}. Media ID saved: ${imageDiagnostics.mediaId || "no"}. Image visible on public story: ${imageDiagnostics.imageVisibleOnPublicStory ? "yes" : "no"}.`
        : "";
      setMessage(
        visibility
          ? `Published successfully. Public URL: ${publicUrl}. Homepage eligible: ${visibility.homepageEligible ? "yes" : "no"}. Appears in ${visibility.sectionLabel || "section"}: ${visibility.appearsInSection ? "yes" : "no"}. Appears on homepage: ${visibility.appearsOnHomepage ? "yes" : "no"}.${imageStatus}`
          : `Published successfully. Public URL: ${publicUrl}.${imageStatus}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not publish press release.";
      setPressPublishDebug((current) => ({
        ...current,
        apiResponse: current.apiResponse || "Publish failed before a readable response was returned.",
        error: errorMessage,
      }));
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  }

  async function unpublishPressReleaseFinal() {
    if (!activePressRelease?.storyId) return;
    if (!confirm("Unpublish this newsroom story and return it to draft?")) return;

    setBusy(true);
    setMessage("Unpublishing newsroom story...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unpublishPressReleaseStory", id: activePressRelease.id }),
      });
      const payload = await readEditorPayload(response, "Could not unpublish press release.");
      if (!payload.story || !payload.pressRelease) throw new Error("Unpublished, but the editor did not receive the updated records.");
      await loadEditor();
      setSelectedStoryId(payload.story.id);
      setStoryDraft(normalizeEditorStory(payload.story));
      setSelectedPressReleaseId(payload.pressRelease.id);
      setPressReleaseDraft(normalizePressReleaseForEditor(payload.pressRelease));
      setMessage("Story unpublished and returned to draft.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not unpublish press release.");
    } finally {
      setBusy(false);
    }
  }

  function newStory() {
    const fresh = blankStory();
    setSelectedStoryId("");
      setStoryDraft(normalizeEditorStory(fresh));
    setActiveTab("stories");
    setMessage("New story ready.");
  }

  function pickAd(ad: Advert) {
    setSelectedAdId(ad.id);
    setAdDraft(ad);
    setActiveTab("ads");
  }

  function newAd() {
    setSelectedAdId("");
    setAdDraft(blankAd());
    setActiveTab("ads");
    setMessage("New advert ready.");
  }

  function addMediaToGallery(media: MediaAsset) {
    setData((current) =>
      current
        ? {
            ...current,
            media: [media, ...current.media.filter((asset) => asset.id !== media.id)],
          }
        : current
    );
  }

  function showStoryPhoto(imageUrl: string, imageAlt: string, storyId = storyDraft.id) {
    setStoryDraft((story) => ({
      ...story,
      imageUrl,
      imageAlt,
    }));
    setData((current) =>
      current
        ? {
            ...current,
            stories: current.stories.map((story) =>
              story.id === storyId ? { ...story, imageUrl, imageAlt } : story
            ),
          }
        : current
    );
  }

  async function saveCurrentStoryPhoto(imageUrl: string, imageAlt: string) {
    if (!storyDraft.id) {
      setMessage(imageUrl ? "Photo selected. Press Save story when the new story is ready." : "No photo selected. Press Save story when the new story is ready.");
      return;
    }

    const response = await fetch("/api/editor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "saveStory", story: { ...storyDraft, imageUrl, imageAlt } }),
    });
    const payload = await readEditorPayload(response, "Could not save the photo to this story.");
    if (!payload.story) throw new Error("The story was saved, but the editor did not receive the updated story.");
    showStoryPhoto(payload.story.imageUrl, payload.story.imageAlt, payload.story.id);
    setMessage(payload.story.imageUrl ? "Photo saved to this story." : "This story now has no photo.");
  }

  async function chooseStoryPhoto(image: { url: string; label: string }) {
    const imageAlt = image.url ? image.label || storyDraft.imageAlt || "Old Sea Dogs story image" : "";
    setBusy(true);
    setMessage(image.url ? "Saving photo to this story..." : "Removing photo from this story...");
    try {
      showStoryPhoto(image.url, imageAlt);
      setActiveTab((current) => current === "scrape" ? "scrape" : "stories");
      await saveCurrentStoryPhoto(image.url, imageAlt);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the photo to this story.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStoryRecord(story: EditorStory, successMessage: string, confirmOverride = false): Promise<EditorStory | null> {
    setBusy(true);
    setMessage("Saving story...");
    try {
      const storyToSave = confirmOverride ? {
        ...story,
        publicationOverride: {
          confirm: true,
          confirmImageRights: Boolean(pendingPublicationOverride?.copyrightWarnings.length && classicRightsConfirmed),
          confirmEditorialWarnings: Boolean(pendingPublicationOverride?.editorialWarnings.length),
          editorNote: classicOverrideReason,
        },
      } : story;
      const { response, payload } = await saveEditorStoryRequest<{
        story?: EditorStory;
        error?: string;
        copyrightWarnings?: Array<{ message: string }>;
        editorialWarnings?: string[];
        requiresPublicationOverride?: boolean;
      }, EditorStory>({ story: storyToSave });
      if (response.status === 409 && payload.requiresPublicationOverride) {
        setPendingPublicationOverride({
          story,
          editorialWarnings: payload.editorialWarnings || [],
          copyrightWarnings: payload.copyrightWarnings || [],
          successMessage,
        });
        setMessage("Review the publication warnings, then choose Publish Anyway if you want to continue.");
        return null;
      }
      if (!response.ok) throw new Error(payload.error || "Could not save story.");
      if (!payload.story) throw new Error("The story was saved, but the editor did not receive the updated story.");
      const savedStory = normalizeEditorStory(payload.story);
      await loadEditor();
      setSelectedStoryId(savedStory.id);
      setStoryDraft(savedStory);
      setPendingPublicationOverride(null);
      setClassicRightsConfirmed(false);
      setClassicOverrideReason("");
      const successWithRightsAdvisory = payload.copyrightWarnings?.length
        ? `${successMessage} The image-rights confirmation was recorded in the audit trail.`
        : successMessage;
      const successWithEditorialAdvisory = payload.editorialWarnings?.length
        ? `${successWithRightsAdvisory} Editorial suggestions were recorded; the headline and body were not changed.`
        : successWithRightsAdvisory;
      setMessage(
        savedStory.status === "published" && savedStory.slug
          ? `${successWithEditorialAdvisory} Public URL: /stories/${savedStory.slug}`
          : successWithEditorialAdvisory
      );
      return savedStory;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save story.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function checkPublicStoryUrl(story: EditorStory) {
    if (!story.slug.trim()) {
      return { ok: false, status: "Missing slug", publicUrl: "" };
    }

    const publicUrl = `/stories/${story.slug}`;
    try {
      const response = await fetch(publicUrl, { cache: "no-store" });
      return {
        ok: response.ok,
        status: `${response.status} ${response.statusText || ""}`.trim(),
        publicUrl,
      };
    } catch (error) {
      return {
        ok: false,
        status: error instanceof Error ? error.message : "Could not check public URL",
        publicUrl,
      };
    }
  }

  async function publishRecoveredDraftStory(story: EditorStory, options?: { quiet?: boolean }) {
    const recoveredStory = normalizeEditorStory({
      ...story,
      status: "published",
      publishedAt: story.publishedAt || new Date().toISOString(),
      scheduledPublishAt: "",
    });
    const savedStory = await saveStoryRecord(
      recoveredStory,
      "Recovered draft published."
    );
    if (!savedStory) {
      setRecoveryDiagnostics((current) => ({
        ...current,
        [story.id]: {
          status: "failed",
          publicUrl: story.slug ? `/stories/${story.slug}` : "",
          directUrlStatus: "not checked",
          sectionVisibility: "not checked",
          homepageVisibility: "not checked",
          error: "The editor could not save the recovered story.",
        },
      }));
      return null;
    }

    const urlCheck = await checkPublicStoryUrl(savedStory);
    const nextStories = data
      ? [savedStory, ...data.stories.filter((item) => item.id !== savedStory.id)]
      : [savedStory];
    const visibility = getEditorStoryVisibility(savedStory, nextStories);
    setRecoveryDiagnostics((current) => ({
      ...current,
      [story.id]: {
        status: urlCheck.ok ? "published successfully" : "published, URL check failed",
        publicUrl: urlCheck.publicUrl,
        directUrlStatus: urlCheck.status,
        sectionVisibility: visibility.appearsInSection ? "visible in section" : "not visible in section",
        homepageVisibility: visibility.appearsOnHomepage ? "visible on homepage" : "not on homepage",
        error: urlCheck.ok ? "" : "The story saved, but the public URL check did not return OK.",
      },
    }));
    setRecoverySelectedIds((current) => {
      const next = new Set(current);
      next.delete(story.id);
      return next;
    });
    if (!options?.quiet) {
      setMessage(
        urlCheck.ok
          ? `Published successfully. Public URL: ${urlCheck.publicUrl}`
          : `Published, but the public URL check returned ${urlCheck.status}.`
      );
    }
    return savedStory;
  }

	  async function publishSelectedRecoveredDrafts() {
	    const selectedStories = filteredRecoverableDraftStories.filter((story) => recoverySelectedIds.has(story.id));
	    if (selectedStories.length === 0) {
	      setMessage("Select at least one draft story to publish.");
	      return;
	    }
	    if (selectedStories.length > 1) {
	      setMessage("Bulk draft publishing is disabled during the AdSense recovery pass. Select one reviewed story at a time.");
	      return;
	    }
	    const confirmed = window.confirm(
	      "Publish this reviewed draft story now? This will not publish any other draft."
	    );
	    if (!confirmed) return;

    let published = 0;
    for (const story of selectedStories) {
      const savedStory = await publishRecoveredDraftStory(story, { quiet: true });
      if (savedStory) published += 1;
    }
	    setMessage(`${published} reviewed draft ${published === 1 ? "story" : "stories"} published. Check the recovery diagnostic before moving on.`);
	  }

  async function saveStoryChanges(story = storyDraft, successMessage = "Story changes saved.") {
    await saveStoryRecord(
      {
        ...story,
        publishedAt:
          story.status === "published"
            ? story.publishedAt || new Date().toISOString()
            : story.publishedAt,
      },
      successMessage
    );
  }

  async function saveStoryAsDraft(story = storyDraft, successMessage = "Story saved as a draft.") {
    await saveStoryRecord(
      { ...story, status: "draft", publishedAt: "", scheduledPublishAt: "" },
      successMessage
    );
  }

  async function publishStoryNow(story = storyDraft) {
    await saveStoryRecord(
      {
        ...story,
        status: "published",
        publishedAt: new Date().toISOString(),
        scheduledPublishAt: "",
      },
      "Story published now."
    );
  }

  async function scheduleStoryForLater(story = storyDraft) {
    if (!story.scheduledPublishAt) {
      setMessage("Choose a date and time before scheduling this story.");
      return;
    }
    await saveStoryRecord(
      {
        ...story,
        status: "scheduled",
        publishedAt: "",
      },
      `Story scheduled for ${formatDateTime(story.scheduledPublishAt)}.`
    );
  }

  async function checkSourcesNow(options?: { maxSources?: number; maxDraftsPerSource?: number; previewOnly?: boolean }) {
    setBusy(true);
    setMessage(options?.previewOnly ? "Generating a no-save article preview..." : "Checking source sites and generating review drafts...");
    setSourceCheckResult(null);

    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "checkSources", sourceWatchOptions: options }),
      });
      const payload = await readEditorPayload(response, "Could not check source sites.");
      if (!payload.result) throw new Error("The source check finished, but the editor did not receive the result.");
      setSourceCheckResult(payload.result);
      await loadEditor();
      setActiveTab("scrape");
      const storiesFound = payload.result.sources.reduce((total, source) => total + (source.found ?? source.checked), 0);
      const duplicatesSkipped = payload.result.sources.reduce((total, source) => total + (source.duplicates ?? source.skipped), 0);
      setMessage(
        payload.result.previewed > 0
          ? payload.result.previewed + " article preview" + (payload.result.previewed === 1 ? "" : "s") + " ready below. Nothing was saved."
          : payload.result.created > 0
          ? payload.result.created + " generated draft" + (payload.result.created === 1 ? "" : "s") + " ready for review."
          : storiesFound > 0 || duplicatesSkipped > 0 || payload.result.needsDetail > 0 || payload.result.failed > 0
            ? `Source check complete: ${storiesFound} found, ${duplicatesSkipped} duplicate${duplicatesSkipped === 1 ? "" : "s"} skipped, ${payload.result.needsDetail} need more detail, ${payload.result.failed} source error${payload.result.failed === 1 ? "" : "s"}.`
            : "Source check complete. No usable article links were found; see the source notes below."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not check source sites.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteStoryById(id: string, successMessage: string) {
    if (!id) return;
    setBusy(true);
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "deleteStories", ids: [id], confirm: true, backupBeforeDelete: true }),
      });
      await readEditorPayload(response, "Could not delete story.");
      await loadEditor();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete story.");
    } finally {
      setBusy(false);
    }
  }

  function requestStoryDelete(story: EditorStory) {
    if (!story.id) {
      setMessage("Save this story before deleting it.");
      return;
    }
    setDeleteStoryCandidate(story);
  }

  async function unpublishStoryRecord(story: EditorStory, successMessage = "Story unpublished. It is no longer public, but remains editable.") {
    if (!story.id) {
      setMessage("Save this story before unpublishing it.");
      return;
    }
    await saveStoryRecord(
      {
        ...story,
        status: "unpublished",
        publishedAt: "",
        scheduledPublishAt: "",
      },
      successMessage
    );
  }

  async function markStoryAuditStatus(story: EditorStory, editorialStatus: string) {
    const status = auditStatuses.includes(editorialStatus) ? editorialStatus : "Needs improvement";
    const shouldHide = status === "Hide from public";

    if (shouldHide && !window.confirm("Hide this story from public pages? It will be unpublished, not deleted.")) {
      return;
    }

    const nextStory = normalizeEditorStory({
      ...story,
      editorialStatus: status,
      noindex: status === "Needs improvement" || shouldHide ? true : false,
      status: shouldHide ? "unpublished" : story.status,
      publishedAt: shouldHide ? "" : story.publishedAt,
      scheduledPublishAt: shouldHide ? "" : story.scheduledPublishAt,
    });

    await saveStoryRecord(
      nextStory,
      shouldHide
        ? "Story marked Hide from public and unpublished. It has not been deleted."
        : `Story marked ${status}.`
    );
  }

  async function unpublishDeleteCandidate() {
    if (!deleteStoryCandidate) return;
    const story = deleteStoryCandidate;
    setDeleteStoryCandidate(null);
    await unpublishStoryRecord(story, "Story unpublished and returned to draft instead of being deleted.");
  }

  async function permanentlyDeleteStoryCandidate() {
    if (!deleteStoryCandidate) return;
    const story = deleteStoryCandidate;
    setDeleteStoryCandidate(null);
    await deleteStoryById(story.id, "Story deleted successfully.");
  }

  async function deleteCurrentStory() {
    if (activeTab === "scrape") {
      await deleteReviewStory(storyDraft);
      return;
    }
    requestStoryDelete(storyDraft);
  }

  async function markReviewStory(story: EditorStory, sourceType: string, successMessage: string) {
    await saveStoryRecord(
      {
        ...story,
        sourceType,
        status: "draft",
      },
      successMessage
    );
  }

  async function approveReviewStory(story: EditorStory) {
    await markReviewStory(story, "Automatic watch approved", "Scrape review approved. It is still private until you press Publish.");
  }

  async function markReviewStoryNeedsDetail(story: EditorStory) {
    await markReviewStory(story, "Needs more source detail", "Review item marked as needing more detail.");
  }

  async function markReviewStoryDuplicate(story: EditorStory) {
    if (!confirm("Mark this scraped item as a duplicate and remove it from the active review queue?")) return;
    await markReviewStory(story, "Duplicate source watch item", "Review item marked as duplicate and removed from the active queue.");
  }

  async function rejectReviewStory(story: EditorStory) {
    if (!confirm("Reject this scraped draft and remove it from the active review queue?")) return;
    await markReviewStory(story, "Rejected source watch item", "Review item rejected and removed from the active queue.");
  }

  async function deleteReviewStory(story: EditorStory) {
    if (!story.id) {
      setMessage("Cannot delete this review item because it has no item ID.");
      setScrapeReviewDebug({
        itemId: "missing item id",
        itemType: story.sourceType || "unknown",
        attemptedAction: "Delete review item",
        missingDataField: "id",
        apiResponseStatus: "Not sent",
        errorMessage: "The selected review item has no ID.",
      });
      return;
    }

    if (story.status === "published") {
      setMessage("This item is already published. Delete is disabled here so a live story is not removed by mistake.");
      setScrapeReviewDebug({
        itemId: story.id,
        itemType: story.sourceType,
        attemptedAction: "Delete review item",
        missingDataField: "",
        apiResponseStatus: "Not sent",
        errorMessage: "Published stories cannot be deleted from the scrape review queue.",
      });
      return;
    }

    if (!confirm(`Delete this queued scrape item?\n\n${story.title || story.id}\n\nThis removes it from the review queue, but does not touch any already published story.`)) return;
    await deleteStoryById(story.id, "Queued scrape item deleted.");
  }

  async function uploadMediaFile(
    file: File,
    alt = "",
    progressMessage = "Uploading image. Please keep this page open...",
    options: {
      localPreviewSrc?: string;
      skipClientPrepare?: boolean;
      uploadUrl?: string;
    } = {}
  ) {
    const uploadUrl = options.uploadUrl || "/api/editor";
    const localPreviewSrc = options.localPreviewSrc || "";
    setUploadDebug({
      ...blankUploadDebug("Selected file. Checking it now..."),
      uploadStatus: "Selected file. Checking it now...",
      selectedFileName: file.name,
      uploadRequestUrl: uploadUrl,
      previewSrc: localPreviewSrc,
    });

    const validationError = validatePhotoUpload(file);
    if (validationError) {
      setUploadDebug({
        ...blankUploadDebug("Upload stopped before sending."),
        uploadStatus: "Upload stopped before sending.",
        selectedFileName: file.name,
        uploadRequestUrl: uploadUrl,
        previewSrc: localPreviewSrc,
        error: validationError,
      });
      setMessage(validationError);
      return null;
    }

    setBusy(true);
    setMessage(progressMessage);
    setUploadDebug({
      ...blankUploadDebug(options.skipClientPrepare ? "Sending selected image to the upload endpoint..." : "Preparing image for upload..."),
      uploadStatus: options.skipClientPrepare ? "Sending selected image to the upload endpoint..." : "Preparing image for upload...",
      selectedFileName: file.name,
      uploadRequestUrl: uploadUrl,
      previewSrc: localPreviewSrc,
    });
    try {
      const prepared = options.skipClientPrepare
        ? {
            file,
            changed: false,
            message: `Using selected image directly (${formatBytes(file.size)}).`,
          }
        : await preparePhotoForUpload(file);
      const uploadFile = prepared.file;
      setUploadDebug({
        ...blankUploadDebug(prepared.message),
        uploadStatus: prepared.message,
        selectedFileName: file.name,
        uploadRequestUrl: uploadUrl,
        previewSrc: localPreviewSrc,
      });

      const form = new FormData();
      form.append("photo", uploadFile);
      form.append("alt", alt);
      setUploadDebug((current) => ({
        ...current,
        uploadStatus: "Upload request sent to the editor server.",
        uploadRequestSent: "Yes",
        uploadRequestUrl: uploadUrl,
      }));
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });
      const responseText = await response.text();
      const responseStatus = `${response.status} ${response.statusText || ""}`.trim();
      setUploadDebug({
        ...blankUploadDebug("Upload request returned from the server."),
        selectedFileName: file.name,
        uploadStatus: "Upload request returned from the server.",
        uploadRequestSent: "Yes",
        uploadRequestUrl: uploadUrl,
        responseStatus,
        responseText: responseText.trim().slice(0, 700) || "Empty response body",
        previewSrc: localPreviewSrc,
      });

      if (!responseText.trim()) {
        throw new Error(`Could not upload photo. The server returned ${responseStatus} with no message.`);
      }

      let payload: EditorApiPayload;
      try {
        payload = JSON.parse(responseText) as EditorApiPayload;
      } catch {
        throw new Error(
          `Could not upload photo. The server returned ${responseStatus}, but it was not a JSON editor reply.`
        );
      }

      if (!response.ok) {
        throw new Error(payload.error || `Could not upload photo. The server returned ${responseStatus}.`);
      }

      if (!payload.media) throw new Error("The photo uploaded, but the editor did not receive the new photo.");
      const media = payload.media as MediaAsset;
      const thumbnailUrl = media.thumbnailUrl || thumbnailUrlFromMediaUrl(media.url);
      const mediaRecordCreated = payload.warning ? "Warning: preview only" : "Yes";
      setUploadDebug({
        ...blankUploadDebug("Image uploaded. Thumbnail created. Image URL returned."),
        selectedFileName: file.name,
        uploadStatus: payload.warning || "Image uploaded. Thumbnail created. Image URL returned.",
        uploadRequestSent: "Yes",
        uploadRequestUrl: uploadUrl,
        mediaRecordCreated,
        mediaId: media.id,
        returnedImageUrl: media.url,
        thumbnailUrl,
        articleImageField: media.url,
        featuredImageField: media.url,
        previewSrc: media.url,
        responseStatus,
        responseText: responseText.trim().slice(0, 700),
      });
      addMediaToGallery(media);
      return media;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload photo.";
      setUploadDebug((current) => ({
        ...current,
        selectedFileName: current.selectedFileName || file.name,
        uploadStatus: "Upload failed.",
        uploadRequestUrl: current.uploadRequestUrl || uploadUrl,
        previewSrc: current.previewSrc || localPreviewSrc,
        error: message,
      }));
      setMessage(message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File, alt = "") {
    const media = await uploadMediaFile(file, alt, "Uploading photo. Please keep this page open...");
    if (!media) return;

      const imageAlt = media.alt || alt || media.filename || "Old Sea Dogs story image";
      setBusy(true);
      try {
        showStoryPhoto(media.url, imageAlt);
        setActiveTab((current) => current === "scrape" ? "scrape" : "stories");
        await saveCurrentStoryPhoto(media.url, imageAlt);
        setUploadDebug((current) => ({
          ...current,
          uploadStatus: storyDraft.id ? "Image uploaded. Image attached to article. Featured image selected." : "Image uploaded. Featured image selected. Press Save story when the new story is ready.",
          error: "",
        }));
        setMessage(storyDraft.id ? "Image uploaded. Image attached to article. Featured image selected." : "Image uploaded. Featured image selected. Press Save story when the new story is ready.");
      } catch (error) {
      const message = error instanceof Error ? error.message : "Photo uploaded, but it could not be saved to this story.";
      setUploadDebug((current) => ({
        ...current,
        uploadStatus: "Upload finished, but the story image field was not saved.",
        error: message,
      }));
      setMessage(message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadAdvertImage(file: File) {
    const media = await uploadMediaFile(file, adDraft.title || adDraft.label, "Uploading advert image...");
    if (!media) return;

    setAdDraft((current) => ({
      ...current,
      imageUrl: media.url,
      title: current.title || media.alt || current.label,
    }));
    setActiveTab("ads");
    setMessage("Advert image uploaded. Press Save advert when the advert is ready.");
  }

  async function saveSettingsDraft() {
    if (!settingsDraft) return;
    setBusy(true);
    setMessage("Saving site settings...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "saveSettings", settings: settingsDraft }),
      });
      const payload = await readEditorPayload(response, "Could not save settings.");
      if (!payload.settings) throw new Error("The settings were saved, but the editor did not receive the updated settings.");
      setSettingsDraft(payload.settings);
      await loadEditor();
      setMessage("Site settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAdvert() {
    setBusy(true);
    setMessage("Saving advert...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "saveAd", ad: adDraft }),
      });
      const payload = await readEditorPayload(response, "Could not save advert.");
      if (!payload.ad) throw new Error("The advert was saved, but the editor did not receive the updated advert.");
      await loadEditor();
      setSelectedAdId(payload.ad.id);
      setAdDraft(payload.ad);
      setMessage("Advert saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save advert.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentAd() {
    if (!adDraft.id || !confirm("Delete this advert?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "deleteAd", id: adDraft.id }),
      });
      await readEditorPayload(response, "Could not delete advert.");
      await loadEditor();
      setMessage("Advert deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete advert.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="editor-actions">
          <Link href="/" className="editor-link">View site</Link>
          <Link href="/#latest" className="editor-link">Latest stories</Link>
        </div>
      </header>

      <section className="editor-hero">
        <div>
          <p className="eyebrow">Private editor</p>
          <h1>Old Sea Dogs editor</h1>
          <p>Stories, scrape reviews, email press releases, photos, site words, and adverts.</p>
        </div>
        <aside className="editor-status">
          <strong>{busy ? "Working..." : "Status"}</strong>
          <span>{message}</span>
          {data ? <small>{reviewStories.length} usable generated draft{reviewStories.length === 1 ? "" : "s"} waiting · {shortReviewStories.length} too short hidden · {pressReleaseQueue.filter((item) => item.status !== "published" && item.status !== "rejected" && item.status !== "spam").length} press release{pressReleaseQueue.length === 1 ? "" : "s"} in newsroom · {data.sourceWatch.filter((source) => source.status === "active").length} active source{data.sourceWatch.filter((source) => source.status === "active").length === 1 ? "" : "s"} watched</small> : null}
          {data?.user.email ? <small>Signed in as {data.user.email}</small> : null}
        </aside>
      </section>

      {pendingPublicationOverride ? (
        <section className="editor-panel press-warning-box" aria-label="Publication warning override">
          <strong>Publication warnings require confirmation</strong>
          {pendingPublicationOverride.editorialWarnings.map((warning) => <span key={warning}>{warning}</span>)}
          {pendingPublicationOverride.copyrightWarnings.map((warning, index) => (
            <span key={`${warning.mediaId || "image"}-${index}`}>{warning.filename ? `${warning.filename}: ` : ""}{warning.message}</span>
          ))}
          {pendingPublicationOverride.copyrightWarnings.length ? (
            <label className="check-row">
              <input
                type="checkbox"
                checked={classicRightsConfirmed}
                onChange={(event) => setClassicRightsConfirmed(event.target.checked)}
              />
              I confirm I have the rights to publish this image.
            </label>
          ) : null}
          <label>
            Reason for publishing anyway (optional)
            <textarea value={classicOverrideReason} onChange={(event) => setClassicOverrideReason(event.target.value)} />
          </label>
          <button
            type="button"
            disabled={busy || (pendingPublicationOverride.copyrightWarnings.length > 0 && !classicRightsConfirmed)}
            onClick={() => void saveStoryRecord(
              pendingPublicationOverride.story,
              pendingPublicationOverride.successMessage,
              true
            )}
          >
            Publish Anyway
          </button>
        </section>
      ) : null}

      {data ? (
        <StagingBuildPanel
          deployment={data.deployment}
          sourceCount={data.sourceWatch.length}
          activeSourceCount={data.sourceWatch.filter((source) => source.status === "active").length}
        />
      ) : null}

      <nav className="editor-tabs" aria-label="Editor sections">
        <button className={activeTab === "stories" ? "active" : ""} onClick={() => setActiveTab("stories")}>Stories</button>
        <button className={activeTab === "audit" ? "active" : ""} onClick={() => setActiveTab("audit")}>Editorial Audit {editorialAuditRows.filter((row) => row.flags.length > 0).length ? `(${editorialAuditRows.filter((row) => row.flags.length > 0).length})` : ""}</button>
        <button className={activeTab === "recover" ? "active" : ""} onClick={() => setActiveTab("recover")}>Recover Draft Stories {allRecoverableDraftStories.length ? `(${allRecoverableDraftStories.length})` : ""}</button>
        <button className={activeTab === "scrape" ? "active" : ""} onClick={openScrapeReview}>Scrape & Review {reviewStories.length ? `(${reviewStories.length})` : ""}</button>
        <button className={activeTab === "press" ? "active" : ""} onClick={openPressRoom}>Email Press Releases {pressReleaseQueue.length ? `(${pressReleaseQueue.length})` : ""}</button>
        <button className={activeTab === "photos" ? "active" : ""} onClick={() => setActiveTab("photos")}>Photos</button>
        <button className={activeTab === "ads" ? "active" : ""} onClick={() => setActiveTab("ads")}>Adverts</button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Site & social</button>
      </nav>

      {!data ? (
        <section className="editor-panel">
          <h2>Loading</h2>
          <p>{message}</p>
        </section>
      ) : null}

      {data && activeTab === "stories" ? (
        <section className="editor-grid">
          <aside className="editor-list">
            <div className="editor-list-header">
              <h2>Stories</h2>
              <button onClick={newStory}>New story</button>
            </div>
            {recentPublishedStories.length > 0 ? (
              <div className="recent-published-panel">
                <div className="queue-heading">
                  <h3>Recent published stories</h3>
                  <span>{recentPublishedStories.length} live</span>
                </div>
                {recentPublishedStories.map((story) => {
                  const visibility = getEditorStoryVisibility(story, data.stories);
                  const statusLabel = editorStoryStatusLabel(story, data.stories);
                  return (
                    <article className="recent-published-card" key={story.id}>
                      <div>
                        <strong>{story.title || "Untitled story"}</strong>
                        <small>{statusLabel} · {displayCategoryLabel(story.category)} · {visibility.publicUrl}</small>
                        <small>
                          Homepage: {visibility.appearsOnHomepage ? "yes" : "no"} · Section: {visibility.appearsInSection ? "yes" : "no"} ·
                          Main headline: {story.isFeatured ? "yes" : "no"}
                        </small>
                        <small className="story-routing-diagnostics">
                          slug: {story.slug || "missing"} · status: {story.status} · publishedAt: {story.publishedAt || "empty"} ·
                          scheduledAt: {story.scheduledPublishAt || "empty"} · isPublic: {isEditorStoryPublicNow(story) ? "yes" : "no"} ·
                          directUrlStatus: {isEditorStoryPublicNow(story) && story.slug ? "expected 200" : "not public"} · {storyPersistenceDiagnostics(story)} · tags: {story.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag)).join(", ") || "none"}
                        </small>
                      </div>
                      <div className="story-row-actions">
                        <button type="button" onClick={() => pickStory(story)} disabled={busy}>Edit</button>
                        <button type="button" onClick={() => previewArticle(story)} disabled={busy}>Preview</button>
                        {story.slug ? (
                          <Link className="editor-link compact-live-link" href={`/stories/${story.slug}`} target="_blank">
                            View live
                          </Link>
                        ) : null}
                        <button type="button" onClick={() => void unpublishStoryRecord(story)} disabled={busy}>Unpublish</button>
                        <button type="button" onClick={() => void publishStoryNow(story)} disabled={busy}>Republish</button>
                        <button type="button" className="danger-button" onClick={() => requestStoryDelete(story)} disabled={busy}>Delete</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
            {scheduledStories.length > 0 ? (
              <div className="recent-published-panel story-management-panel">
                <div className="queue-heading">
                  <h3>Scheduled stories</h3>
                  <span>{scheduledStories.length} waiting</span>
                </div>
                {scheduledStories.map((story) => (
                  <article className="recent-published-card" key={story.id}>
                    <div>
                      <strong>{story.title || "Untitled story"}</strong>
                      <small>Scheduled for {formatDateTime(story.scheduledPublishAt)} · {displayCategoryLabel(story.category)}</small>
                      <small className="story-routing-diagnostics">
                        slug: {story.slug || "missing"} · status: {story.status} · publishedAt: {story.publishedAt || "empty"} ·
                        scheduledAt: {story.scheduledPublishAt || "empty"} · isPublic: {isEditorStoryPublicNow(story) ? "yes" : "no"} ·
                        appearsOnHomepage: no · appearsInSection: no · directUrlStatus: not public · {storyPersistenceDiagnostics(story)} · tags: {story.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag)).join(", ") || "none"}
                      </small>
                    </div>
                    <div className="story-row-actions">
                      <button type="button" onClick={() => pickStory(story)} disabled={busy}>Edit</button>
                      <button type="button" onClick={() => previewArticle(story)} disabled={busy}>Preview</button>
                      <button type="button" onClick={() => void publishStoryNow(story)} disabled={busy}>Publish Now</button>
                      <button type="button" className="quiet-button" onClick={() => void unpublishStoryRecord(story)} disabled={busy}>Unpublish</button>
                      <button type="button" className="danger-button" onClick={() => requestStoryDelete(story)} disabled={busy}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {draftStories.length > 0 || unpublishedStories.length > 0 ? (
              <div className="recent-published-panel story-management-panel compact-management-panel">
                <div className="queue-heading">
                  <h3>Drafts and unpublished stories</h3>
                  <span>{draftStories.length + unpublishedStories.length} editable</span>
                </div>
                {[...draftStories, ...unpublishedStories].slice(0, 18).map((story) => (
                  <article className="recent-published-card" key={story.id}>
                    <div>
                      <strong>{story.title || "Untitled story"}</strong>
                      <small>{editorStoryStatusLabel(story, data.stories)} · {displayCategoryLabel(story.category)}</small>
                      <small className="story-routing-diagnostics">
                        slug: {story.slug || "missing"} · status: {story.status} · publishedAt: {story.publishedAt || "empty"} ·
                        scheduledAt: {story.scheduledPublishAt || "empty"} · isPublic: {isEditorStoryPublicNow(story) ? "yes" : "no"} ·
                        appearsOnHomepage: no · appearsInSection: no · directUrlStatus: not public · {storyPersistenceDiagnostics(story)} · tags: {story.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag)).join(", ") || "none"}
                      </small>
                    </div>
                    <div className="story-row-actions">
                      <button type="button" onClick={() => pickStory(story)} disabled={busy}>Edit</button>
                      <button type="button" onClick={() => previewArticle(story)} disabled={busy}>Preview</button>
                      <button type="button" onClick={() => void publishStoryNow(story)} disabled={busy}>Publish Now</button>
                      <button type="button" className="danger-button" onClick={() => requestStoryDelete(story)} disabled={busy}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            <label className="editor-search">
              Search stories
              <input
                value={storySearch}
                placeholder="Headline, category, tag, date..."
                onChange={(event) => setStorySearch(event.target.value)}
              />
            </label>
            <label className="editor-filter-row">
              <input
                type="checkbox"
                checked={photoStoriesOnly}
                onChange={(event) => setPhotoStoriesOnly(event.target.checked)}
              />
              Photo stories only
            </label>
            <p className="story-count">
              Showing {visibleStories.length} of {data.stories.length}
              {storySearch || photoStoriesOnly ? " matching stories" : " latest stories"}
            </p>
            {visibleStories.map((story) => {
              const visibility = getEditorStoryVisibility(story, data.stories);
              return (
                <article
                  key={story.id}
                  className={selectedStoryId === story.id ? "editor-story-row selected" : "editor-story-row"}
                >
                  <button type="button" className="story-row-main" onClick={() => pickStory(story)}>
                    <span>{story.title || "Untitled story"}</span>
                    <small>
                      {isPromotedStory(story) ? "Promoted · " : ""}
                      <span className={editorStoryStatusClass(story, data.stories)}>{editorStoryStatusLabel(story, data.stories)}</span> · {displayCategoryLabel(story.category)}
                    </small>
                    <small className="story-routing-diagnostics">
                      slug: {story.slug || "missing"} · status: {story.status} · publishedAt: {story.publishedAt || "empty"} ·
                      scheduledAt: {story.scheduledPublishAt || "empty"} · isPublic: {isEditorStoryPublicNow(story) ? "yes" : "no"} ·
                      Category selected: {displayCategoryLabel(story.category)} · Route: {visibility.actualRoute} · Feed: {visibility.sectionFeedAssigned} ·
                      appearsOnHomepage: {visibility.appearsOnHomepage ? "yes" : "no"} · appearsInSection: {visibility.appearsInSection ? "yes" : "no"} ·
                      directUrlStatus: {isEditorStoryPublicNow(story) && story.slug ? "expected 200" : "not public"} · {storyPersistenceDiagnostics(story)} · Tags: {story.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag)).join(", ") || "none"}
                    </small>
                  </button>
                  <div className="story-row-actions">
                    <button type="button" onClick={() => pickStory(story)} disabled={busy}>Edit</button>
                    <button type="button" onClick={() => previewArticle(story)} disabled={busy}>Preview</button>
                    {isEditorStoryPublicNow(story) && story.slug ? (
                      <Link className="editor-link compact-live-link" href={`/stories/${story.slug}`} target="_blank">
                        View live
                      </Link>
                    ) : null}
                    {story.status === "published" || story.status === "scheduled" ? (
                      <button type="button" onClick={() => void unpublishStoryRecord(story)} disabled={busy}>
                        Unpublish
                      </button>
                    ) : null}
                    <button type="button" className="quiet-button danger-button" onClick={() => requestStoryDelete(story)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </aside>

          <StoryForm
            story={storyDraft}
            setStory={setStoryDraft}
            images={imageChoices}
            onUpload={uploadPhoto}
            onChooseImage={chooseStoryPhoto}
            onSaveChanges={() => saveStoryChanges(storyDraft)}
            onSaveAsDraft={() => saveStoryAsDraft(storyDraft)}
            onPublishNow={() => publishStoryNow(storyDraft)}
            onSchedule={() => scheduleStoryForLater(storyDraft)}
            onDelete={deleteCurrentStory}
            onUnpublish={() => unpublishStoryRecord(storyDraft)}
            onPreview={previewArticle}
            busy={busy}
            uploadDebug={uploadDebug}
          />
        </section>
      ) : null}

      {data && activeTab === "audit" ? (
        <EditorialAuditPanel
          busy={busy}
          onEdit={pickStory}
          onMark={(story, status) => void markStoryAuditStatus(story, status)}
          onPreview={previewArticle}
          rows={editorialAuditRows}
        />
      ) : null}

      {data && activeTab === "recover" ? (
        <section className="editor-panel recover-drafts-panel">
          <div className="editor-list-header source-watch-heading">
            <div>
              <p className="eyebrow">Safe manual recovery</p>
              <h2>Recover Draft Stories</h2>
              <p>
                These are private draft records from the editor store. Nothing here is published automatically:
                choose individual stories, preview them, then recover only the ones you want live.
              </p>
            </div>
            <div className="source-watch-actions">
	              <button
	                type="button"
	                onClick={() => {
	                  const firstStory = filteredRecoverableDraftStories[0];
	                  setRecoverySelectedIds(firstStory ? new Set([firstStory.id]) : new Set());
	                }}
	                disabled={busy || filteredRecoverableDraftStories.length === 0}
	              >
	                Select first filtered
	              </button>
              <button type="button" className="quiet-button" onClick={() => setRecoverySelectedIds(new Set())} disabled={busy || recoverySelectedIds.size === 0}>
                Clear selection
              </button>
	              <button type="button" onClick={() => void publishSelectedRecoveredDrafts()} disabled={busy || recoverySelectedIds.size === 0}>
	                Publish one reviewed story
	              </button>
            </div>
          </div>

          <div className="recover-filter-grid">
            <label>
              Search by title
              <input
                value={recoveryFilters.search}
                placeholder="Title, slug, tag..."
                onChange={(event) => setRecoveryFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>
            <label>
              Category
              <select
                value={recoveryFilters.category}
                onChange={(event) => setRecoveryFilters((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="">All categories</option>
                {recoveryCategories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Source
              <select
                value={recoveryFilters.source}
                onChange={(event) => setRecoveryFilters((current) => ({ ...current, source: event.target.value }))}
              >
                <option value="">All sources</option>
                {recoverySources.map((source) => (
                  <option value={source} key={source}>{source}</option>
                ))}
              </select>
            </label>
            <label>
              Image
              <select
                value={recoveryFilters.hasImage}
                onChange={(event) => setRecoveryFilters((current) => ({ ...current, hasImage: event.target.value }))}
              >
                <option value="">With or without images</option>
                <option value="with">Has image</option>
                <option value="without">No image</option>
              </select>
            </label>
            <label>
              Usability
              <select
                value={recoveryFilters.usable}
                onChange={(event) => setRecoveryFilters((current) => ({ ...current, usable: event.target.value }))}
              >
                <option value="">All draft stories</option>
                <option value="usable">Likely usable story</option>
                <option value="needs-work">Needs work / too short</option>
              </select>
            </label>
          </div>

          <div className="recover-summary">
            <strong>{filteredRecoverableDraftStories.length}</strong> of <strong>{allRecoverableDraftStories.length}</strong> draft stories shown.
            <span>{recoverySelectedIds.size} selected for manual recovery.</span>
          </div>

          <div className="recover-draft-list">
            {filteredRecoverableDraftStories.length === 0 ? (
              <div className="review-empty">
                <h3>No matching draft stories</h3>
                <p>Change the filters to find other draft records.</p>
              </div>
            ) : null}
            {filteredRecoverableDraftStories.map((story) => {
              const wordCount = storyWordCount(story);
              const hasImage = hasPickedPhoto(story);
              const likelyUsable = wordCount >= minimumUsableReviewWords && Boolean(story.slug.trim() && story.title.trim());
              const diagnostic = recoveryDiagnostics[story.id];
              return (
                <article className="recover-draft-card" key={story.id}>
                  <label className="recover-select-row">
                    <input
                      type="checkbox"
                      checked={recoverySelectedIds.has(story.id)}
                      onChange={(event) => {
                        setRecoverySelectedIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(story.id);
                          else next.delete(story.id);
                          return next;
                        });
                      }}
                    />
                    <span>{story.title || "Untitled draft"}</span>
                  </label>
                  <div className="recover-draft-meta">
                    <span>slug: {story.slug || "missing"}</span>
                    <span>{displayCategoryLabel(story.category)}</span>
                    <span>{wordCount} words</span>
                    <span>image: {hasImage ? "yes" : "no"}</span>
                    <span>source: {draftStorySourceLabel(story)}</span>
                    <span>last modified: {storyModifiedLabel(story)}</span>
                    <span className={likelyUsable ? "pill live" : "pill warning"}>
                      {likelyUsable ? "Likely usable" : "Needs review"}
                    </span>
                  </div>
                  <div className="recover-draft-actions">
                    <button type="button" onClick={() => previewArticle(story)} disabled={busy}>Preview</button>
                    <button type="button" onClick={() => pickStory(story)} disabled={busy}>Edit</button>
                    <button type="button" onClick={() => void publishRecoveredDraftStory(story)} disabled={busy}>Publish Now</button>
                    <button type="button" className="danger-button" onClick={() => requestStoryDelete(story)} disabled={busy}>Delete draft</button>
                  </div>
                  <small className="story-routing-diagnostics">
                    status: {story.status} · publishedAt: {story.publishedAt || "empty"} · scheduledAt: {story.scheduledPublishAt || "empty"} ·
                    public visibility: {isEditorStoryPublicNow(story) ? "public" : "private draft"} · tags: {story.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag)).join(", ") || "none"}
                  </small>
                  {diagnostic ? (
                    <div className={diagnostic.error ? "recover-diagnostic warning" : "recover-diagnostic"}>
                      <strong>{diagnostic.status}</strong>
                      <span>Public URL: {diagnostic.publicUrl || "not available"}</span>
                      <span>Direct URL: {diagnostic.directUrlStatus}</span>
                      <span>{diagnostic.sectionVisibility}</span>
                      <span>{diagnostic.homepageVisibility}</span>
                      {diagnostic.error ? <span>{diagnostic.error}</span> : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {data && activeTab === "scrape" ? (
        <section className="editor-panel source-review-panel">
          <div className="editor-list-header source-watch-heading">
            <div>
              <p className="eyebrow">Scrape & review articles</p>
              <h2>Source watch and review queue</h2>
            </div>
            <div className="source-watch-actions">
              <span>{data.sourceWatch.length} sources watched</span>
              <button
                type="button"
                onClick={() => void checkSourcesNow({ maxSources: 1, maxDraftsPerSource: 3, previewOnly: true })}
                disabled={busy}
              >
                Preview 3 only
              </button>
              <button
                type="button"
                onClick={() => void checkSourcesNow({ maxSources: 1, maxDraftsPerSource: 3 })}
                disabled={busy}
              >
                Run small test
              </button>
              <button
                type="button"
                onClick={() => void checkSourcesNow()}
                disabled={busy}
              >
                Check all sources
              </button>
            </div>
          </div>

          {sourceCheckResult ? (
            <div className="source-check-result">
              <div className="source-check-summary">
                <strong>
                  {sourceCheckResult.previewed > 0
                    ? sourceCheckResult.previewed + " no-save preview" + (sourceCheckResult.previewed === 1 ? "" : "s") + " generated"
                    : sourceCheckResult.created + " review draft" + (sourceCheckResult.created === 1 ? "" : "s") + " created"}
                </strong>
                <span>{sourceCheckResult.sources.reduce((total, source) => total + (source.found ?? source.checked), 0)} found · {sourceCheckResult.needsDetail} need detail · {sourceCheckResult.skipped} duplicates · {sourceCheckResult.failed} source{sourceCheckResult.failed === 1 ? "" : "s"} failed</span>
              </div>
              <div className="source-check-list">
                {sourceCheckResult.sources.map((source) => (
                  <article className={source.failed ? "failed" : ""} key={source.id}>
                    <strong>{source.name}</strong>
                    <span>
                      {source.group} · {source.found ?? source.checked} found · {source.previewed > 0 ? source.previewed + " previewed" : source.created + " new"} · {source.rejected ?? source.needsDetail} need detail · {source.duplicates ?? source.skipped} duplicates
                    </span>
                    <small>{source.message}</small>
                    {source.errors?.length ? <small>Notes: {source.errors.slice(0, 2).join(" · ")}</small> : null}
                  </article>
                ))}
              </div>
              {sourceCheckResult.previews.length > 0 ? (
                <div className="article-preview-output">
                  <h3>Generated output for review</h3>
                  {sourceCheckResult.previews.map((preview) => (
                    <article className={preview.status === "needsMoreDetail" ? "article-preview needs-detail" : "article-preview"} key={preview.sourceUrl}>
                      <div className="article-preview-head">
                        <div>
                          <p className="eyebrow">{preview.status === "needsMoreDetail" ? "Insufficient source detail for publication" : "Preview only, not saved"}</p>
                          <h4>{preview.headline}</h4>
                        </div>
                        <span>{displayCategoryLabel(preview.category)} · {preview.wordCount} words</span>
                      </div>
	                      <p className="article-preview-standfirst">{preview.standfirst}</p>
	                      {preview.styleReport ? <StyleScorePanel report={preview.styleReport} /> : null}
	                      {preview.qualityWarnings.length > 0 ? (
	                        <p className="article-preview-warning">{preview.qualityWarnings.join(" · ")}</p>
	                      ) : null}
                      <div className="article-preview-body">
                        {preview.body.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="source-review-grid">
            <aside className="source-review-column">
              <div className="queue-heading">
                <h3>Active review queue</h3>
                <span>{reviewStories.length} waiting</span>
              </div>
              {reviewStories.length === 0 ? (
                <div className="review-empty">
                  <p>No scraped drafts are waiting for review.</p>
                  <button type="button" onClick={() => void checkSourcesNow({ maxSources: 1, maxDraftsPerSource: 3, previewOnly: true })} disabled={busy}>
                    Preview 3 only
                  </button>
                </div>
              ) : (
                <div className="review-card-list">
                  {reviewStories.map((story) => (
                    <article className={selectedStoryId === story.id ? "review-card selected" : "review-card"} key={story.id}>
                      <button type="button" onClick={() => pickReviewStory(story, "Review")}>
                        <span>{story.title || "Untitled generated story"}</span>
                        <small>
                          <span className={sourceReviewStatusClass(story)}>{reviewStatusLabel(story)}</span>
                          {displayCategoryLabel(story.category)} · {storyWordCount(story)} words
                        </small>
                      </button>
                      <div>
                        <button type="button" onClick={() => pickReviewStory(story, "Review")} disabled={busy}>Review</button>
                        <button type="button" onClick={() => pickReviewStory(story, "Edit")} disabled={busy}>Edit</button>
                        <button type="button" onClick={() => void saveStoryRecord({ ...story, status: "draft" }, "Scrape review saved as draft.")} disabled={busy}>
                          Save as Draft
                        </button>
                        <button type="button" onClick={() => void approveReviewStory(story)} disabled={busy || !canApproveReview(story)}>
                          Approve
                        </button>
                        <button type="button" onClick={() => void publishStoryNow(story)} disabled={busy || !canApproveReview(story)}>
                          Publish
                        </button>
                        <button type="button" onClick={() => void markReviewStoryNeedsDetail(story)} disabled={busy}>Needs Detail</button>
                        <button type="button" onClick={() => void markReviewStoryDuplicate(story)} disabled={busy}>Duplicate</button>
                        <button type="button" onClick={() => void rejectReviewStory(story)} disabled={busy}>Reject</button>
                        <button type="button" className="danger-button" onClick={() => void deleteReviewStory(story)} disabled={busy}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {shortReviewStories.length > 0 ? (
                <div className="source-watch-compact short-review-list">
                  <h3>Hidden as too short</h3>
                  <p className="muted-note">
                    These scraped items are under {minimumUsableReviewWords} words, so they are not shown in the working review queue and cannot be published.
                  </p>
                  {shortReviewStories.map((story) => (
                    <article className="source-watch-card compact-source-card" key={story.id}>
                      <div className="source-watch-card-head">
                        <div>
                          <h4>{story.title || "Untitled short item"}</h4>
                          <small>{displayCategoryLabel(story.category)} · {storyWordCount(story)} words · {reviewContentIssue(story)}</small>
                        </div>
                        <span className="pill warning">Too Short</span>
                      </div>
                      <p>{story.sourceName || "Source Watch"} · {story.sourceUrl ? "source link kept private" : "no source link"}</p>
                      <div className="story-row-actions">
                        <button type="button" onClick={() => pickReviewStory(story, "Edit short item")} disabled={busy}>Edit Manually</button>
                        <button type="button" onClick={() => void markReviewStoryNeedsDetail(story)} disabled={busy}>Needs Detail</button>
                        <button type="button" className="danger-button" onClick={() => void deleteReviewStory(story)} disabled={busy}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {handledReviewStories.length > 0 ? (
                <div className="source-watch-compact handled-review-list">
                  <h3>Handled source items</h3>
                  {handledReviewStories.map((story) => (
                    <article className="source-watch-card compact-source-card" key={story.id}>
                      <div className="source-watch-card-head">
                        <div>
                          <h4>{story.title || "Untitled source item"}</h4>
                          <small>{displayCategoryLabel(story.category)} · {storyWordCount(story)} words</small>
                        </div>
                        <span className={sourceReviewStatusClass(story)}>{reviewStatusLabel(story)}</span>
                      </div>
                      <p>{story.sourceName || "Source Watch"} · {story.updatedAt ? formatEditorDateTime(story.updatedAt) : "No update date"}</p>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="source-watch-compact">
                <h3>Sources</h3>
                {data.sourceWatch.map((source) => (
                  <article className="source-watch-card compact-source-card" key={source.id}>
                    <div className="source-watch-card-head">
                      <div>
                        <h4>{source.name}</h4>
                        <a href={source.url} rel="noreferrer" target="_blank">{source.url.replace(/^https?:\/\//, "")}</a>
                      </div>
                      <span>{sourceStatusLabel(source.status)}</span>
                    </div>
                    <p><strong>{source.group}</strong> · {source.focus}</p>
                    <small>{source.feedUrls.length} feed/page target{source.feedUrls.length === 1 ? "" : "s"} · checks every {source.checkEveryHours} hours when scheduled</small>
                    <div className="source-watch-tags">
                      {source.sections.map((section) => (
                        <span key={section}>{section}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </aside>

            <div className="source-review-editor">
              {currentReviewStory ? (
                <>
                  <SourceReviewWorkspace
                    busy={busy}
                    debug={scrapeReviewDebug}
                    onApprove={() => void approveReviewStory(currentReviewStory)}
                    onDelete={() => void deleteReviewStory(currentReviewStory)}
                    onEdit={() => setMessage("Edit Article: use the fields below, then save or preview before publishing.")}
                    onMarkNeedsDetail={() => void markReviewStoryNeedsDetail(currentReviewStory)}
                    onPreview={() => void previewArticle(currentReviewStory)}
                    onPublish={() => void publishStoryNow(currentReviewStory)}
                    onReject={() => void rejectReviewStory(currentReviewStory)}
                    onReturnToQueue={() => void markReviewStory(currentReviewStory, "Automatic watch", "Review item returned to the active queue.")}
                    onRetryImport={() => void checkSourcesNow({ maxSources: 1, maxDraftsPerSource: 3 })}
                    onSaveDraft={() => void saveStoryRecord({ ...currentReviewStory, status: "draft" }, "Scrape review saved as draft.")}
                    story={currentReviewStory}
                    styleReport={currentReviewStyleReport}
                  />
                  <StoryForm
                    story={currentReviewStory}
                    setStory={setStoryDraft}
                    images={imageChoices}
                    onUpload={uploadPhoto}
                    onChooseImage={chooseStoryPhoto}
                    onSaveChanges={() => saveStoryChanges(currentReviewStory, "Review story changes saved.")}
                    onSaveAsDraft={() => saveStoryAsDraft(currentReviewStory, "Scrape review saved as draft.")}
                    onPublishNow={() => publishStoryNow(currentReviewStory)}
                    onSchedule={() => scheduleStoryForLater(currentReviewStory)}
                    onDelete={deleteCurrentStory}
                    onUnpublish={() => unpublishStoryRecord(currentReviewStory)}
                    onPreview={previewArticle}
                    busy={busy}
                    uploadDebug={uploadDebug}
                    reviewMode
                  />
                </>
              ) : (
                <div className="review-empty large">
                  <p>Run the scraper to generate private draft articles. They will appear here for review, editing, approval or rejection before they can go on the site.</p>
                  <button type="button" onClick={() => void checkSourcesNow({ maxSources: 1, maxDraftsPerSource: 3, previewOnly: true })} disabled={busy}>
                    Preview 3 only
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {data && activeTab === "press" ? (
        <PressReleasePanel
          data={data}
          queue={pressReleaseQueue}
          activeItem={activePressRelease}
          selectedId={selectedPressReleaseId}
          importDraft={pressImportDraft}
          setImportDraft={setPressImportDraft}
          setPressReleaseDraft={setPressReleaseDraft}
          onPick={pickPressRelease}
          onImport={importPressRelease}
          onUploadEml={uploadPressEml}
          onAddAttachments={addPressAttachments}
          onSave={savePressRelease}
          onSelectAttachment={selectPressAttachmentAsImage}
          onMark={markPressRelease}
          onDelete={deletePressReleaseItem}
          onBlock={blockActivePressRelease}
          onUnblock={unblockSender}
          onGenerate={generatePressRelease}
          onSaveDraft={savePressReleaseDraft}
          onPublish={publishPressReleaseFinal}
          onUnpublish={unpublishPressReleaseFinal}
          onPreview={previewPressReleaseArticle}
          importDebug={pressImportDebug}
          saveDebug={pressSaveDebug}
          publishDebug={pressPublishDebug}
          uploadDebug={uploadDebug}
          busy={busy}
        />
      ) : null}

      {data && activeTab === "photos" ? (
        <section className="editor-panel">
          <div className="editor-list-header">
            <h2>Photos</h2>
          </div>
          <div className="upload-strip">
            <label>
              Photo description
              <input
                value={photoAlt}
                placeholder="Short description for readers and search"
                onChange={(event) => setPhotoAlt(event.target.value)}
              />
            </label>
            <label className="upload-button">
              Upload photo
              <input
                type="file"
                accept={photoUploadAccept}
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadPhoto(file, photoAlt);
                    event.currentTarget.value = "";
                  }
                }}
              />
            </label>
          </div>
          <div className="photo-grid">
            {imageChoices.map((image) => (
              <button
                key={image.url}
                onClick={() => void chooseStoryPhoto(image)}
              >
                <span style={{ backgroundImage: `url(${image.url})` }} />
                <strong>{image.label}</strong>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {data && activeTab === "ads" ? (
        <section className="editor-grid">
          <aside className="editor-list">
            <div className="editor-list-header">
              <h2>Adverts</h2>
              <button onClick={newAd}>New advert</button>
            </div>
            {data.ads.length === 0 ? <p>No adverts yet.</p> : null}
            {data.ads.map((ad) => (
              <button
                key={ad.id}
                className={selectedAdId === ad.id ? "selected" : ""}
                onClick={() => pickAd(ad)}
              >
                <span>{ad.label}</span>
                <small>{ad.isActive ? "Live" : "Paused"} · {ad.placement}</small>
              </button>
            ))}
          </aside>

          <AdForm
            ad={adDraft}
            setAd={setAdDraft}
            images={imageChoices}
            onSave={saveAdvert}
            onDelete={deleteCurrentAd}
            onUploadImage={uploadAdvertImage}
            busy={busy}
          />
        </section>
      ) : null}

      {data && activeTab === "settings" && settingsDraft ? (
        <section className="editor-panel editor-form">
          <h2>Site and social links</h2>
          <div className="settings-group">
            <h3>Site words</h3>
            <label>
              Site name
              <input
                value={settingsDraft.brandName}
                onChange={(event) => setSettingsDraft({ ...settingsDraft, brandName: event.target.value })}
              />
            </label>
            <label>
              Short line above the homepage title
              <input
                value={settingsDraft.kicker}
                onChange={(event) => setSettingsDraft({ ...settingsDraft, kicker: event.target.value })}
              />
            </label>
            <label>
              Footer sentence
              <textarea
                value={settingsDraft.footerText}
                onChange={(event) => setSettingsDraft({ ...settingsDraft, footerText: event.target.value })}
              />
            </label>
            <label>
              Search description
              <textarea
                value={settingsDraft.siteDescription}
                onChange={(event) => setSettingsDraft({ ...settingsDraft, siteDescription: event.target.value })}
              />
            </label>
          </div>

          <div className="settings-group">
            <h3>Social media links</h3>
            <div className="split-fields">
              <label>
                TikTok
                <input
                  value={settingsDraft.socialTikTok}
                  placeholder="https://www.tiktok.com/@oldseadogs8"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialTikTok: event.target.value })}
                />
              </label>
              <label>
                Facebook
                <input
                  value={settingsDraft.socialFacebook}
                  placeholder="oldseadogs or full Facebook link"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialFacebook: event.target.value })}
                />
              </label>
              <label>
                Instagram
                <input
                  value={settingsDraft.socialInstagram}
                  placeholder="@oldseadogs or full Instagram link"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialInstagram: event.target.value })}
                />
              </label>
              <label>
                X / Twitter
                <input
                  value={settingsDraft.socialX}
                  placeholder="@oldseadogs or full X link"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialX: event.target.value })}
                />
              </label>
              <label>
                YouTube
                <input
                  value={settingsDraft.socialYouTube}
                  placeholder="@oldseadogs or full YouTube link"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialYouTube: event.target.value })}
                />
              </label>
              <label>
                Threads
                <input
                  value={settingsDraft.socialThreads}
                  placeholder="https://www.threads.com/@oldseadogs_website"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialThreads: event.target.value })}
                />
              </label>
              <label>
                LinkedIn
                <input
                  value={settingsDraft.socialLinkedIn}
                  placeholder="oldseadogs or full LinkedIn link"
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, socialLinkedIn: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>Social analytics</h3>
            <div className="social-analytics-grid">
              <article>
                <span>Social clicks</span>
                <strong>{data.socialAnalytics.socialClicks.toLocaleString("en-GB")}</strong>
              </article>
              <article>
                <span>Outbound clicks</span>
                <strong>{data.socialAnalytics.outboundClicks.toLocaleString("en-GB")}</strong>
              </article>
              <article>
                <span>Generated post usage</span>
                <strong>{data.socialAnalytics.generatedPostUsage.toLocaleString("en-GB")}</strong>
              </article>
            </div>
            {data.socialAnalytics.byPlatform.length > 0 ? (
              <div className="social-analytics-list">
                {data.socialAnalytics.byPlatform.slice(0, 8).map((item) => (
                  <span key={item.platform}>
                    {item.platform}: {item.count.toLocaleString("en-GB")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted-note">Social analytics will appear after visitors use the social buttons or the editor generates social posts.</p>
            )}
          </div>
          <div className="form-actions">
            <button onClick={saveSettingsDraft} disabled={busy}>Save site and social links</button>
          </div>
        </section>
      ) : null}

      {data && articlePreviewStory ? (
        <div className="editor-preview-overlay" role="dialog" aria-modal="true" aria-label="Article preview">
          <div className="editor-preview-modal">
            <div className="editor-preview-toolbar">
              <div>
                <p className="eyebrow">Preview Article</p>
                <h2>{articlePreviewStory.title || "Untitled story"}</h2>
                <span>Preview only — not published</span>
              </div>
              <div>
                {articlePreviewStory.id ? (
                  <Link
                    className="quiet-link"
                    href={`/editor/preview/${encodeURIComponent(articlePreviewStory.id)}`}
                    target="_blank"
                  >
                    Open protected preview URL
                  </Link>
                ) : null}
                <button type="button" onClick={() => setArticlePreviewStory(null)}>
                  Back to Editor
                </button>
              </div>
            </div>
            <ArticlePreviewContent
              ads={data.ads}
              previewOnly
              showAdditionalAds
              story={articlePreviewStory}
            />
          </div>
        </div>
      ) : null}

      {deleteStoryCandidate ? (
        <div className="editor-preview-overlay" role="dialog" aria-modal="true" aria-label="Delete story permanently?">
          <div className="delete-story-modal">
            <div>
              <p className="eyebrow">Delete this story permanently?</p>
              <h2>{deleteStoryCandidate.title || "Untitled story"}</h2>
              <p>
                This removes the public story, editor record, search result, homepage references, and category listing.
                It also removes any linked newsroom queue record for this story.
              </p>
            </div>
            <dl className="delete-story-details">
              <div>
                <dt>Status</dt>
                <dd>{deleteStoryCandidate.status}</dd>
              </div>
              <div>
                <dt>Public page</dt>
                <dd>{deleteStoryCandidate.slug ? `/stories/${deleteStoryCandidate.slug}` : "No public URL"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{displayCategoryLabel(deleteStoryCandidate.category)}</dd>
              </div>
            </dl>
            <div className="delete-story-actions">
              <button type="button" className="quiet-button" onClick={() => setDeleteStoryCandidate(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" onClick={() => void unpublishDeleteCandidate()} disabled={busy || deleteStoryCandidate.status !== "published"}>
                Unpublish instead
              </button>
              <button type="button" className="danger-button" onClick={() => void permanentlyDeleteStoryCandidate()} disabled={busy}>
                Permanently delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StagingBuildPanel({
  deployment,
  sourceCount,
  activeSourceCount,
}: {
  deployment: DeploymentInfo;
  sourceCount: number;
  activeSourceCount: number;
}) {
  const featureLabels: Record<string, string> = {
    newsroomPreviewEnabled: "Newsroom preview",
    emailPublishEnabled: "Email publish",
    protectedPreviewRouteEnabled: "Protected preview route",
    photoPreviewEnabled: "Photo preview",
    directNewsroomPublishEnabled: "Direct newsroom publish",
    scraperExpandedSourcesEnabled: "Expanded source list",
  };
  const activeFeatures = Object.entries(deployment.features).filter(([, enabled]) => enabled);
  const cryptoRandomUuidAvailable = typeof globalThis.crypto?.randomUUID === "function";

  return (
    <section className="deployment-panel" aria-label="Staging build status">
      <div className="deployment-panel-head">
        <div>
          <p className="eyebrow">Staging build</p>
          <h2>{deployment.digitalOceanMode ? "DigitalOcean staging mode" : "Local development mode"}</h2>
        </div>
        <span className={deployment.latestPreviewPublishCodeActive ? "pill live" : "pill warning"}>
          {deployment.latestPreviewPublishCodeActive ? "Latest preview/publish code active" : "Old preview/publish code"}
        </span>
      </div>
      <dl className="deployment-grid">
        <div>
          <dt>Build time</dt>
          <dd>{formatEditorDateTime(deployment.buildTimestamp)}</dd>
        </div>
        <div>
          <dt>Code version</dt>
          <dd>{deployment.gitCommit || "Unknown"}{deployment.gitBranch && deployment.gitBranch !== "unknown" ? ` on ${deployment.gitBranch}` : ""}</dd>
        </div>
        <div>
          <dt>Deployment/server start</dt>
          <dd>{formatEditorDateTime(deployment.deploymentTimestamp)}</dd>
        </div>
        <div>
          <dt>Server name</dt>
          <dd>{deployment.serverHostname || "Unknown"}</dd>
        </div>
        <div>
          <dt>Data folder</dt>
          <dd>{deployment.dataDir || "Not configured"}</dd>
        </div>
        <div>
          <dt>Media folder</dt>
          <dd>{deployment.mediaDir || "Not configured"}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{deployment.runtime}</dd>
        </div>
        <div>
          <dt>Scraper sources</dt>
          <dd>{activeSourceCount} active of {sourceCount}</dd>
        </div>
        <div>
          <dt>crypto.randomUUID available</dt>
          <dd>{cryptoRandomUuidAvailable ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt>Safe ID helper active</dt>
          <dd>yes</dd>
        </div>
      </dl>
      <div className="feature-chip-row">
        {activeFeatures.map(([key]) => (
          <span key={key}>{featureLabels[key] || key}</span>
        ))}
      </div>
    </section>
  );
}

function PhotoPreviewPanel({
  src,
  fileName,
  contentType,
  mediaId,
  thumbnailUrl,
  caption,
  credit,
  onCaptionChange,
  onCreditChange,
  onUseAsFeatured,
  onInsertInline,
  onRemove,
}: {
  src: string;
  fileName: string;
  contentType: string;
  mediaId?: string;
  thumbnailUrl?: string;
  caption: string;
  credit: string;
  onCaptionChange: (value: string) => void;
  onCreditChange: (value: string) => void;
  onUseAsFeatured: () => void;
  onInsertInline: () => void;
  onRemove: () => void;
}) {
  const [dimensions, setDimensions] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setDimensions("Checking image...");
      setLoadError("");
    }, 0);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setDimensions(`${image.naturalWidth} x ${image.naturalHeight}px`);
      setLoadError("");
    };
    image.onerror = () => {
      if (cancelled) return;
      setDimensions("Could not read dimensions");
      setLoadError("The image failed to load in the editor preview.");
    };
    image.src = src;

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [src]);

  return (
    <section className="photo-preview-window" aria-label="Photo preview">
      <div className="photo-preview-header">
        <div>
          <p className="eyebrow">Photo preview</p>
          <h3>{fileName || "Selected photo"}</h3>
        </div>
        <span>{contentType}</span>
      </div>
      <div className="photo-preview-body">
        <div className="photo-preview-thumbnail">
          <img src={src} alt={caption || fileName || "Selected photo"} />
        </div>
        <div className="photo-preview-large">
          {loadError ? (
            <div className="photo-preview-error">
              <strong>Image failed to load</strong>
              <span>{loadError}</span>
              <code>{src}</code>
            </div>
          ) : (
            <img src={src} alt={caption || fileName || "Selected photo"} />
          )}
        </div>
      </div>
      <dl className="photo-preview-meta">
        <div>
          <dt>File name</dt>
          <dd>{fileName || "Unknown"}</dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>{dimensions || "Checking image..."}</dd>
        </div>
        <div>
          <dt>File type</dt>
          <dd>{contentType || "Unknown image type"}</dd>
        </div>
        <div>
          <dt>Media path</dt>
          <dd>{debugImageValue(src)}</dd>
        </div>
        <div>
          <dt>Media ID</dt>
          <dd>{mediaId || mediaIdFromUrl(src) || "Not saved as a media record yet"}</dd>
        </div>
        <div>
          <dt>Thumbnail URL</dt>
          <dd>{debugImageValue(thumbnailUrl || thumbnailUrlFromMediaUrl(src)) || "No thumbnail URL yet"}</dd>
        </div>
      </dl>
      <div className="split-fields">
        <label>
          Caption
          <input value={caption} onChange={(event) => onCaptionChange(event.target.value)} />
        </label>
        <label>
          Photographer credit / source attribution
          <input value={credit} onChange={(event) => onCreditChange(event.target.value)} />
        </label>
      </div>
      <div className="photo-preview-actions">
        <button type="button" onClick={onUseAsFeatured}>
          Use as article featured image
        </button>
        <button type="button" onClick={onInsertInline}>
          Insert inline into article
        </button>
        <button type="button" className="quiet-button" onClick={onRemove}>
          Remove photo
        </button>
      </div>
    </section>
  );
}

function StoryForm({
  story,
  setStory,
  images,
  onUpload,
  onChooseImage,
  onSaveChanges,
  onSaveAsDraft,
  onPublishNow,
  onSchedule,
  onDelete,
  onUnpublish,
  onPreview,
  busy,
  uploadDebug,
  reviewMode = false,
}: {
  story: EditorStory;
  setStory: (story: EditorStory | ((story: EditorStory) => EditorStory)) => void;
  images: Array<{ url: string; label: string }>;
  onUpload: (file: File, alt?: string) => Promise<void>;
  onChooseImage: (image: { url: string; label: string }) => Promise<void>;
  onSaveChanges: () => Promise<void>;
  onSaveAsDraft: () => Promise<void>;
  onPublishNow: () => Promise<void>;
  onSchedule: () => Promise<void>;
  onDelete: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onPreview: (story: EditorStory) => void;
  busy: boolean;
  uploadDebug: UploadDebug;
  reviewMode?: boolean;
}) {
  const bodyText = story.body.join("\n\n");
  const visibleTags = story.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag));
  const storyPromoted = isPromotedStory(story);
  const storyIsPublic = isEditorStoryPublicNow(story);
  const isPortOrClub = isPortOrClubCategory(story.category);
  const includedInPortClubFeature = isIncludedInFeaturedPortClubRotation(story.tags);
  const headlineReport = analyzeHeadlineQuality({
    title: story.title,
    category: story.category,
    sourceName: story.sourceName,
    sourceType: story.sourceType,
  });
  const publicationIssues = getEditorialWarnings({ ...story, status: "published" });
  const categorySection = getSectionForCategory(story.category);
  const categoryRoute = sectionPathForCategory(story.category);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [socialPostState, setSocialPostState] = useState<{
    storyId: string;
    posts: SocialPostDrafts | null;
    status: string;
  }>({
    storyId: "",
    posts: null,
    status: "No social posts generated yet.",
  });
  const [tagEntry, setTagEntry] = useState("");
  const socialPosts = socialPostState.storyId === story.id ? socialPostState.posts : null;
  const socialPostStatus =
    socialPostState.storyId === story.id ? socialPostState.status : "No social posts generated yet.";

  function setStoryPromoted(promoted: boolean) {
    setStory((current) => ({
      ...current,
      sortOrder: promoted
        ? current.sortOrder < 0
          ? current.sortOrder
          : promotedStoryOrder
        : Math.max(0, current.sortOrder),
    }));
  }

  function setVisibleTags(nextVisibleTags: string[]) {
    const hiddenTags = story.tags.filter(isFeaturedPortClubHiddenTag);
    setStory({
      ...story,
      tags: cleanStoryTags([...nextVisibleTags, ...hiddenTags], 12),
    });
  }

  function addVisibleTagsFromText(value = tagEntry) {
    const nextTags = cleanStoryTags([...visibleTags, ...value.split(/[,\n]/)], 12);
    if (nextTags.length === visibleTags.length && !value.trim()) return;
    setVisibleTags(nextTags);
    setTagEntry("");
  }

  function removeVisibleTag(tag: string) {
    setVisibleTags(visibleTags.filter((item) => item.toLowerCase() !== tag.toLowerCase()));
  }

  function setPortClubFeatureIncluded(included: boolean) {
    setStory((current) => {
      const publicTags = current.tags.filter((tag) => !isFeaturedPortClubHiddenTag(tag));
      return {
        ...current,
        tags: included ? publicTags : [...publicTags, featuredPortClubExcludedTag],
      };
    });
  }

  function addSelectedImageInline() {
    if (!story.imageUrl) return;
    const token = `[image:${story.imageUrl}|${story.imageCaption || story.imageAlt || story.title}|${story.imageCredit}]`;
    setStory({
      ...story,
      body: [...story.body.filter(Boolean), token],
    });
  }

  function setBodyFromText(nextBodyText: string) {
    setStory({
      ...story,
      body: nextBodyText
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  function applyArticleFormatting(kind: ArticleFormattingKind) {
    const textarea = bodyTextareaRef.current;
    const start = textarea?.selectionStart ?? bodyText.length;
    const end = textarea?.selectionEnd ?? start;
    const selectedText = bodyText.slice(start, end);
    const insertion = formatArticleSelection(kind, selectedText);
    const before = bodyText.slice(0, start);
    const after = bodyText.slice(end);
    const block = isBlockArticleFormatting(kind);
    const spacedInsertion = block
      ? `${before && !before.endsWith("\n\n") ? "\n\n" : ""}${insertion}${after && !after.startsWith("\n\n") ? "\n\n" : ""}`
      : insertion;
    const nextBodyText = `${before}${spacedInsertion}${after}`;
    const cursorPosition = before.length + spacedInsertion.length;

    setBodyFromText(nextBodyText);
    window.requestAnimationFrame(() => {
      bodyTextareaRef.current?.focus();
      bodyTextareaRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  async function generateSocialPosts() {
    const drafts = buildSocialPostDrafts(story);
    setSocialPostState({
      storyId: story.id,
      posts: drafts,
      status: "Social posts generated.",
    });

    try {
      await fetch("/api/social/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "generated_post",
          platform: "Editor",
          target: story.title || story.slug || "Untitled story",
          storySlug: story.slug,
        }),
        keepalive: true,
      });
    } catch {
      setSocialPostState((current) =>
        current.storyId === story.id
          ? { ...current, status: "Social posts generated. Analytics could not be recorded." }
          : current
      );
    }
  }

  function updateSocialPost(key: keyof SocialPostDrafts, value: string) {
    setSocialPostState((current) =>
      current.storyId === story.id && current.posts
        ? { ...current, posts: { ...current.posts, [key]: value } }
        : current
    );
  }

  return (
    <section className="editor-panel editor-form">
      <div className="form-head">
        <div>
          <p className="eyebrow">{reviewMode ? "Review draft" : story.id ? "Edit story" : "New story"}</p>
          <h2>{story.title || "Untitled story"}</h2>
        </div>
        <div className="form-pill-row">
          {storyPromoted ? <span className="pill promoted">Promoted</span> : null}
          <span className={storyIsPublic ? "pill live" : "pill"}>{editorStoryStatusLabel(story)}</span>
        </div>
      </div>

      <div className="split-fields">
        <label>
          Headline
          <input value={story.title} onChange={(event) => setStory({ ...story, title: event.target.value })} />
        </label>
        <label>
          Category
          <select
            value={normalizeStoryCategory(story.category)}
            onChange={(event) => setStory({ ...story, category: normalizeStoryCategory(event.target.value) })}
          >
            {storyCategoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <span className="field-help">
            Site route: {categoryRoute} · Section feed: {categorySection?.label ?? "No matching public section"}
          </span>
        </label>
      </div>

      <HeadlineQualityPanel report={headlineReport} />

      <label>
        Page address
        <div className="address-field">
          <span>/stories/</span>
          <input
            value={story.slug}
            placeholder="filled from headline when blank"
            onChange={(event) => setStory({ ...story, slug: event.target.value })}
          />
        </div>
      </label>

      <label>
        Short summary for cards and the top story
        <textarea value={story.summary} onChange={(event) => setStory({ ...story, summary: event.target.value })} />
      </label>

      <div className="article-formatting-field">
        <div className="article-formatting-label">Article text</div>
        <div className="article-formatting-toolbar" aria-label="Article formatting toolbar">
          {articleFormattingTools.map((tool) => (
            <button
              key={tool.kind}
              onClick={() => applyArticleFormatting(tool.kind)}
              title={tool.title}
              type="button"
            >
              {tool.label}
            </button>
          ))}
        </div>
        <textarea
          aria-label="Article text"
          className="story-body-box"
          ref={bodyTextareaRef}
          value={bodyText}
          onChange={(event) => setBodyFromText(event.target.value)}
        />
        <small>Tip: leave a blank line between paragraphs.</small>
      </div>

      <label>
        Old Sea Dogs View
        <textarea
          value={story.oldSeaDogsView}
          placeholder="100-150 words: why it matters, what is new, what remains uncertain, and the practical impact for sailors or clubs."
          onChange={(event) => setStory({ ...story, oldSeaDogsView: event.target.value })}
        />
        <span className="field-help">
          Aim for 100-150 words of editor judgement. This is the human note AdSense reviewers and readers should be able to see.
        </span>
      </label>

      <div className="split-fields">
        <label>
          Publish date
          <input type="date" value={story.date} onChange={(event) => setStory({ ...story, date: event.target.value })} />
        </label>
        <label>
          Author
          <input value={story.author} onChange={(event) => setStory({ ...story, author: event.target.value })} />
        </label>
      </div>

      <div className="split-fields">
        <label>
          Source type
          <select value={story.sourceType} onChange={(event) => setStory({ ...story, sourceType: event.target.value })}>
            <option>Original</option>
            <option>Press release</option>
            <option>Automatic watch</option>
            <option>Automatic watch approved</option>
            <option>Needs more source detail</option>
            <option>Rejected source watch item</option>
            <option>Duplicate source watch item</option>
          </select>
        </label>
        <label>
          Source name
          <input value={story.sourceName} onChange={(event) => setStory({ ...story, sourceName: event.target.value })} />
        </label>
      </div>

      <label>
        Source link
        <input
          value={story.sourceUrl}
          placeholder="Optional link to a press release or source"
          onChange={(event) => setStory({ ...story, sourceUrl: event.target.value })}
        />
      </label>

      <div className="split-fields">
        <label>
          Source notes
          <textarea
            value={story.sourceNotes}
            placeholder="Example: Organiser statement, race notice, marina visit, interview, or Old Sea Dogs observation."
            onChange={(event) => setStory({ ...story, sourceNotes: event.target.value })}
          />
        </label>
        <label>
          Method notes
          <textarea
            value={story.methodNotes}
            placeholder="How the story was checked, edited, cleaned or followed up."
            onChange={(event) => setStory({ ...story, methodNotes: event.target.value })}
          />
        </label>
      </div>

      <div className="split-fields">
        <label>
          Content basis
          <select value={story.contentBasis} onChange={(event) => setStory({ ...story, contentBasis: event.target.value })}>
            <option>Old Sea Dogs observation and editorial research</option>
            <option>Press release</option>
            <option>Organiser statement</option>
            <option>Official notice</option>
            <option>Interview</option>
            <option>Site visit</option>
            <option>Old Sea Dogs archive</option>
          </select>
        </label>
        <label>
          Editorial audit status
          <select value={story.editorialStatus} onChange={(event) => setStory({ ...story, editorialStatus: event.target.value })}>
            {auditStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="split-fields">
        <div className="tag-editor-field">
          <span className="tag-editor-label">Tags</span>
          <div className="tag-chip-list" aria-label="Current story tags">
            {visibleTags.length > 0 ? (
              visibleTags.map((tag) => (
                <button key={tag} type="button" className="tag-chip" onClick={() => removeVisibleTag(tag)}>
                  {tag} <span aria-hidden="true">x</span>
                </button>
              ))
            ) : (
              <span className="muted-note">No tags yet.</span>
            )}
          </div>
          <div className="tag-add-row">
            <input
              aria-label="Add story tags"
              value={tagEntry}
              placeholder="Type a tag, or paste comma-separated tags"
              onChange={(event) => setTagEntry(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addVisibleTagsFromText();
                }
              }}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text");
                if (pasted.includes(",") || pasted.includes("\n")) {
                  event.preventDefault();
                  addVisibleTagsFromText(pasted);
                }
              }}
            />
            <button type="button" onClick={() => addVisibleTagsFromText()} disabled={!tagEntry.trim()}>
              Add
            </button>
          </div>
          <span className="field-help">Use Enter or Add. You can paste comma-separated tags. Tags save on draft, scheduled and published stories.</span>
        </div>
        <label>
          Reading time
          <input
            type="number"
            min="1"
            value={story.readMinutes}
            onChange={(event) => setStory({ ...story, readMinutes: Number(event.target.value || 1) })}
          />
        </label>
      </div>

      <div className="image-picker">
        <div
          className={`picked-image ${story.imageUrl ? "" : "no-picked-image"}`}
          role="img"
          aria-label={story.imageAlt || "Selected story image"}
        >
          {story.imageUrl ? (
            <img src={story.imageUrl} alt={story.imageAlt || "Selected story image"} />
          ) : (
            <span>No photo</span>
          )}
        </div>
        <div className="image-controls">
          <label>
            Story photo
            <select
              value={story.imageUrl}
              onChange={(event) => {
                const chosen = images.find((image) => image.url === event.target.value);
                void onChooseImage({
                  url: event.target.value,
                  label: chosen?.label || story.imageAlt,
                });
              }}
            >
              {images.map((image) => (
                <option key={image.url} value={image.url}>{image.label}</option>
              ))}
            </select>
          </label>
          <label>
            Photo description
            <input value={story.imageAlt} onChange={(event) => setStory({ ...story, imageAlt: event.target.value })} />
          </label>
          <label>
            Photo caption
            <input value={story.imageCaption} onChange={(event) => setStory({ ...story, imageCaption: event.target.value })} />
          </label>
          <label>
            Photographer credit / source attribution
            <input
              value={story.imageCredit}
              placeholder="Example: © Michael Hodges"
              onChange={(event) => setStory({ ...story, imageCredit: event.target.value })}
            />
          </label>
          <label className="upload-button">
            Upload new photo
            <input
              type="file"
              accept={photoUploadAccept}
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onUpload(file, story.imageAlt);
                  event.currentTarget.value = "";
                }
              }}
            />
          </label>
          <button
            type="button"
            className="quiet-button"
            onClick={addSelectedImageInline}
            disabled={!story.imageUrl}
          >
            Add selected photo inside article
          </button>
          {story.imageUrl ? (
            <PhotoPreviewPanel
              caption={story.imageCaption}
              contentType={displayMediaType(story.imageUrl)}
              credit={story.imageCredit}
              fileName={displayMediaName(story.imageUrl, uploadDebug.selectedFileName || story.imageAlt)}
              mediaId={mediaIdFromUrl(story.imageUrl)}
              onCaptionChange={(value) => setStory({ ...story, imageCaption: value })}
              onCreditChange={(value) => setStory({ ...story, imageCredit: value })}
              onInsertInline={addSelectedImageInline}
              onRemove={() => void onChooseImage({ url: "", label: "No photo" })}
              onUseAsFeatured={() => void onChooseImage({ url: story.imageUrl, label: story.imageAlt })}
              src={story.imageUrl}
              thumbnailUrl={thumbnailUrlFromMediaUrl(story.imageUrl)}
            />
          ) : null}
          <div className="upload-status-panel" aria-live="polite">
            <strong>Image upload status</strong>
            <dl>
              <div>
                <dt>Selected file name</dt>
                <dd>{uploadDebug.selectedFileName || "No file selected"}</dd>
              </div>
              <div>
                <dt>Upload status</dt>
                <dd>{uploadDebug.uploadStatus}</dd>
              </div>
                <div>
                  <dt>Upload request sent</dt>
                  <dd>{uploadDebug.uploadRequestSent}</dd>
                </div>
                <div>
                  <dt>Upload request URL</dt>
                  <dd>{uploadDebug.uploadRequestUrl || "No upload request URL yet"}</dd>
                </div>
                <div>
                  <dt>Media record created</dt>
                  <dd>{uploadDebug.mediaRecordCreated}</dd>
                </div>
              <div>
                <dt>Media ID</dt>
                <dd>{uploadDebug.mediaId || mediaIdFromUrl(story.imageUrl) || "No media ID yet"}</dd>
              </div>
              <div>
                <dt>Returned image URL</dt>
                <dd>{debugImageValue(uploadDebug.returnedImageUrl) || "No URL returned yet"}</dd>
              </div>
              <div>
                <dt>Thumbnail URL</dt>
                <dd>{debugImageValue(uploadDebug.thumbnailUrl || thumbnailUrlFromMediaUrl(story.imageUrl)) || "No thumbnail URL yet"}</dd>
              </div>
              <div>
                <dt>Server response status</dt>
                <dd>{uploadDebug.responseStatus || "No server response yet"}</dd>
              </div>
              <div>
                <dt>Server response text</dt>
                <dd>{uploadDebug.responseText || "No server response yet"}</dd>
              </div>
              <div>
                <dt>Current article image field</dt>
                <dd>{debugImageValue(uploadDebug.articleImageField || story.imageUrl) || "No image on this article"}</dd>
              </div>
              <div>
                <dt>Featured image field</dt>
                <dd>{debugImageValue(uploadDebug.featuredImageField || story.imageUrl) || "No featured image selected"}</dd>
              </div>
              <div>
                <dt>Preview image src</dt>
                <dd>{debugImageValue(uploadDebug.previewSrc || story.imageUrl) || "No preview image src"}</dd>
              </div>
              {uploadDebug.error ? (
                <div>
                  <dt>Upload error</dt>
                  <dd>{uploadDebug.error}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>

      <div className="publish-row">
        <label className={`check-row promotion-row ${storyPromoted ? "active" : ""}`}>
          <input
            type="checkbox"
            checked={storyPromoted}
            onChange={(event) => setStoryPromoted(event.target.checked)}
          />
          <span>
            <strong>Bring this story to the top of its section</strong>
            <small>Useful for older stories with strong photos.</small>
          </span>
        </label>
        {isPortOrClub ? (
          <label className={`check-row feature-rotation-row ${includedInPortClubFeature ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={includedInPortClubFeature}
              onChange={(event) => setPortClubFeatureIncluded(event.target.checked)}
            />
            <span>
              <strong>Include in Featured Port or Club</strong>
              <small>Lets the homepage daily panel rotate this entry.</small>
            </span>
          </label>
        ) : null}
        <label className={`check-row ${story.noindex ? "active" : ""}`}>
          <input type="checkbox" checked={story.noindex} onChange={(event) => setStory({ ...story, noindex: event.target.checked })} />
          <span>
            <strong>Noindex until improved</strong>
            <small>Keeps weak, imported or thin stories out of search while editorial work continues.</small>
          </span>
        </label>
      </div>

      <section className="publishing-panel" aria-label="Publishing controls">
        <div>
          <p className="eyebrow">Publishing</p>
          <h3>Release controls</h3>
          <p>
            Current status: <strong>{editorStoryStatusLabel(story)}</strong>
            {story.publishedAt ? ` · Published ${formatDateTime(story.publishedAt)}` : ""}
          </p>
          <p className="story-routing-diagnostics">
            scheduledAt: {story.scheduledPublishAt || "empty"} · {storyPersistenceDiagnostics(story)}
          </p>
        </div>
        <label>
          Schedule release date and time
          <input
            type="datetime-local"
            value={isoToDateTimeInput(story.scheduledPublishAt)}
            onChange={(event) => {
              const nextScheduledAt = dateTimeInputToIso(event.target.value);
              setStory({
                ...story,
                scheduledPublishAt: nextScheduledAt,
              });
            }}
          />
          <span className="field-help">Use this to prepare a story now and let it go live later. Leave blank for manual publishing.</span>
        </label>
        <div className="publishing-actions">
          <button type="button" onClick={onSaveChanges} disabled={busy}>
            Save Changes
          </button>
          <button type="button" onClick={onSaveAsDraft} disabled={busy}>
            Save as Draft
          </button>
          <button type="button" onClick={onPublishNow} disabled={busy}>
            Publish Now
          </button>
          <button type="button" onClick={onSchedule} disabled={busy || !story.scheduledPublishAt}>
            Schedule for Later
          </button>
          {story.status === "published" || story.status === "scheduled" ? (
            <button type="button" className="quiet-button" onClick={onUnpublish} disabled={busy || !story.id}>
              Unpublish
            </button>
          ) : null}
        </div>
      </section>

      {publicationIssues.length > 0 ? (
        <div className="press-warning-box" role="status">
          <strong>Editorial suggestions are available. You may publish now or review them first.</strong>
          {publicationIssues.map((issue) => (
            <span key={issue}>{issue}</span>
          ))}
          <span>Publish Now remains available and will not rewrite the story.</span>
        </div>
      ) : null}

      <section className="social-post-generator" aria-label="Generate social posts">
        <div className="social-post-generator-head">
          <div>
            <p className="eyebrow">Social</p>
            <h3>Generate Social Posts</h3>
            <p>
              Create platform-ready copy from this article. Review it, adjust the tone if needed,
              then paste it into the Old Sea Dogs social channels.
            </p>
          </div>
          <button type="button" onClick={() => void generateSocialPosts()} disabled={busy}>
            Generate Social Posts
          </button>
        </div>
        <div className="social-post-status" aria-live="polite">
          {socialPostStatus}
        </div>
        {socialPosts ? (
          <div className="social-post-grid">
            {socialPostFields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <small>{field.help}</small>
                <textarea
                  value={socialPosts[field.key]}
                  onChange={(event) => updateSocialPost(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>
        ) : null}
      </section>

      <div className="form-actions">
        <button onClick={onSaveChanges} disabled={busy}>Save Changes</button>
        <button type="button" className="quiet-button" onClick={onSaveAsDraft} disabled={busy}>
          Save as Draft
        </button>
        <button type="button" className="quiet-button" onClick={() => onPreview(story)} disabled={busy}>
          Preview Article
        </button>
        {story.slug ? (
          <Link className="quiet-link" href={`/stories/${story.slug}`}>
            View page
          </Link>
        ) : null}
        {story.status === "published" || story.status === "scheduled" ? (
          <button type="button" className="quiet-button" onClick={onUnpublish} disabled={busy || !story.id}>
            Unpublish
          </button>
        ) : null}
        <button className="danger-button" onClick={onDelete} disabled={busy || !story.id}>Delete</button>
      </div>
    </section>
  );
}

function CleanedImportPreviewBox({ preview }: { preview: PressReleaseCleaningPreview }) {
  return (
    <section className="cleaned-import-preview" aria-label="Cleaned import preview">
      <div className="cleaned-import-heading">
        <strong>Cleaned import preview</strong>
        <span>{preview.cleanedWordCount} usable words</span>
      </div>
      <dl>
        <div>
          <dt>Raw imported words</dt>
          <dd>{preview.rawWordCount}</dd>
        </div>
        <div>
          <dt>Cleaned words</dt>
          <dd>{preview.cleanedWordCount}</dd>
        </div>
        <div>
          <dt>Boilerplate removed</dt>
          <dd>{preview.removedBoilerplateCount}</dd>
        </div>
        <div>
          <dt>Raw links removed</dt>
          <dd>{preview.removedUrlCount}</dd>
        </div>
        <div>
          <dt>Broken characters removed</dt>
          <dd>{preview.removedBrokenCharacterCount}</dd>
        </div>
      </dl>
      {preview.extractedPhotoCredits.length > 0 ? (
        <div className="cleaned-credit-list">
          <span>Suggested photo credits</span>
          {preview.extractedPhotoCredits.map((credit) => (
            <small key={credit}>{credit}</small>
          ))}
        </div>
      ) : null}
      {preview.warnings.length > 0 ? (
        <div className="cleaned-warning-list">
          {preview.warnings.map((warning) => (
            <small key={warning}>{warning}</small>
          ))}
        </div>
      ) : null}
      <p>{preview.cleanedText.slice(0, 520) || "No usable article text found yet."}</p>
    </section>
  );
}

function ImportDebugBox({ debug }: { debug: PressImportDebug }) {
  const hasImportActivity =
    debug.selectedFileName ||
    debug.requestSent !== "No" ||
    debug.responseStatus ||
    debug.extractedSubject ||
    debug.error;

  if (!hasImportActivity) return null;

  return (
    <section className="import-debug-box" aria-label="Newsroom import status">
      <strong>Email import status</strong>
      <dl>
        <div>
          <dt>Selected filename</dt>
          <dd>{debug.selectedFileName || "No .eml file selected"}</dd>
        </div>
        <div>
          <dt>Action attempted</dt>
          <dd>{debug.attemptedAction || "No import attempted yet"}</dd>
        </div>
        <div>
          <dt>Import request sent</dt>
          <dd>{debug.requestSent}</dd>
        </div>
        <div>
          <dt>API route called</dt>
          <dd>{debug.requestUrl || "No API route called yet"}</dd>
        </div>
        <div>
          <dt>Response status</dt>
          <dd>{debug.responseStatus || "No server response yet"}</dd>
        </div>
        <div>
          <dt>Extracted subject</dt>
          <dd>{debug.extractedSubject || "No subject extracted yet"}</dd>
        </div>
        <div>
          <dt>Extracted sender</dt>
          <dd>{debug.extractedSender || "No sender extracted yet"}</dd>
        </div>
        <div>
          <dt>Extracted body length</dt>
          <dd>{debug.extractedBodyLength || "No body extracted yet"}</dd>
        </div>
        <div>
          <dt>Extracted image count</dt>
          <dd>{debug.extractedImageCount || "0"}</dd>
        </div>
        <div>
          <dt>Item ID</dt>
          <dd>{debug.itemId || "No item created yet"}</dd>
        </div>
        <div>
          <dt>Store save status</dt>
          <dd>{debug.storeSaveStatus || "Not saved yet"}</dd>
        </div>
        {debug.error ? (
          <div>
            <dt>Error</dt>
            <dd>{debug.error}</dd>
          </div>
        ) : null}
      </dl>
      {debug.responseText ? <p>{debug.responseText.slice(0, 500)}</p> : null}
    </section>
  );
}

function StyleScorePanel({ report }: { report: OldSeaDogsStyleReport }) {
  return (
    <section className="style-score-panel" aria-label="OldSeaDogs editorial style score">
      <div className="style-score-head">
        <div>
          <p className="eyebrow">OldSeaDogs style check</p>
          <h4>OldSeaDogs Style Score: {report.oldSeaDogsStyleScore}/100</h4>
        </div>
        <span className={report.oldSeaDogsStyleScore >= 70 ? "pill live" : report.oldSeaDogsStyleScore >= 55 ? "pill promoted" : "pill warning"}>
          {report.oldSeaDogsStyleScore >= 70 ? "Strong" : report.oldSeaDogsStyleScore >= 55 ? "Needs polish" : "Needs stronger rewrite"}
        </span>
      </div>
      <dl className="style-score-grid">
        <div>
          <dt>Source Word Count</dt>
          <dd>{report.sourceWordCount}</dd>
        </div>
        <div>
          <dt>Generated Word Count</dt>
          <dd>{report.generatedWordCount}</dd>
        </div>
        <div>
          <dt>PR Language Score</dt>
          <dd>{report.prLanguageRemaining}/100 remaining</dd>
        </div>
        <div>
          <dt>Storytelling Score</dt>
          <dd>{report.maritimeStorytelling}/100</dd>
        </div>
        <div>
          <dt>Human Interest Score</dt>
          <dd>{report.humanInterest}/100</dd>
        </div>
        <div>
          <dt>Originality</dt>
          <dd>{report.originality}/100</dd>
        </div>
        <div>
          <dt>Narrative Strength</dt>
          <dd>{report.narrativeStrength}/100</dd>
        </div>
        <div>
          <dt>Sailing Relevance</dt>
          <dd>{report.sailingRelevance}/100</dd>
        </div>
        <div>
          <dt>Readability</dt>
          <dd>{report.readability}/100</dd>
        </div>
        <div>
          <dt>Source Similarity</dt>
          <dd>{report.sourceSimilarity}/100</dd>
        </div>
      </dl>
      {report.warnings.length > 0 ? (
        <div className="style-warning-list" role="alert">
          {report.warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      ) : (
        <p className="muted-note">No style warnings. Still review facts, captions and tone before publishing.</p>
      )}
    </section>
  );
}

function HeadlineQualityPanel({ report }: { report: HeadlineQualityReport }) {
  if (!report.isGeneric) {
    return (
      <section className="headline-quality-panel headline-quality-panel--ok" aria-label="Headline quality">
        <strong>Headline check</strong>
        <span>Specific enough for publication.</span>
      </section>
    );
  }

  return (
    <section className="headline-quality-panel" aria-label="Headline quality" role="alert">
      <div>
        <strong>Headline needs work</strong>
        {report.issues.map((issue) => (
          <span key={issue}>{issue}</span>
        ))}
      </div>
      {report.suggestions.length > 0 ? (
        <div>
          <strong>Factual alternatives</strong>
          {report.suggestions.map((suggestion) => (
            <span key={suggestion}>{suggestion}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

type EditorialAuditRow = {
  story: EditorStory;
  wordCount: number;
  flags: string[];
  headlineReport: HeadlineQualityReport;
  oldSeaDogsViewQuality: OldSeaDogsViewQuality;
  duplicateTitle: string;
};

const auditStatuses = ["Needs improvement", "Ready", "Hide from public", "Keep live"];

function normalizeAuditTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\b(?:the|a|an|and|for|with|from|into|new|old)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a: string, b: string) {
  const aWords = new Set(normalizeAuditTitle(a).split(/\s+/).filter(Boolean));
  const bWords = new Set(normalizeAuditTitle(b).split(/\s+/).filter(Boolean));
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let overlap = 0;
  for (const word of aWords) {
    if (bWords.has(word)) overlap += 1;
  }
  return overlap / Math.max(aWords.size, bWords.size);
}

function nearDuplicateTitle(story: EditorStory, stories: EditorStory[]) {
  return stories.find((candidate) => {
    if (candidate.id === story.id) return false;
    const a = normalizeAuditTitle(story.title);
    const b = normalizeAuditTitle(candidate.title);
    if (!a || !b) return false;
    return a === b || titleSimilarity(story.title, candidate.title) >= 0.82;
  })?.title || "";
}

function auditStory(story: EditorStory, stories: EditorStory[]): EditorialAuditRow {
  const wordCount = storyWordCount(story);
  const headlineReport = analyzeHeadlineQuality({
    title: story.title,
    category: story.category,
    sourceName: story.sourceName,
    sourceType: story.sourceType,
  });
  const viewQuality = oldSeaDogsViewQuality(story.oldSeaDogsView);
  const duplicateTitle = nearDuplicateTitle(story, stories);
  const flags = [
    wordCount < 300 ? "Thin story under 300 words" : "",
    !story.sourceNotes.trim() ? "Missing source note" : "",
    viewQuality.status === "missing" ? "Missing Old Sea Dogs View" : "",
    viewQuality.status === "boilerplate" ? "Old Sea Dogs View is fallback boilerplate" : "",
    headlineReport.isGeneric ? "Generic headline" : "",
    !story.author.trim() || !/michael\s+hodges/i.test(story.author) ? "Missing Michael Hodges author box data" : "",
    hasPickedPhoto(story) && !story.imageCredit.trim() ? "No image credit" : "",
    duplicateTitle ? `Duplicate or near-duplicate title: ${duplicateTitle}` : "",
  ].filter(Boolean);

  return {
    story,
    wordCount,
    flags,
    headlineReport,
    oldSeaDogsViewQuality: viewQuality,
    duplicateTitle,
  };
}

function EditorialAuditPanel({
  rows,
  busy,
  onEdit,
  onPreview,
  onMark,
}: {
  rows: EditorialAuditRow[];
  busy: boolean;
  onEdit: (story: EditorStory) => void;
  onPreview: (story: EditorStory) => void;
  onMark: (story: EditorStory, status: string) => void;
}) {
  const weakRows = rows.filter((row) => row.flags.length > 0);
  const noindexRows = rows.filter((row) => row.story.noindex);
  const readyRows = rows.filter((row) => row.flags.length === 0);

  return (
    <section className="editor-panel editorial-audit-panel" aria-label="Editorial quality audit">
      <div className="editor-list-header source-watch-heading">
        <div>
          <p className="eyebrow">AdSense recovery audit</p>
          <h2>Editorial quality panel</h2>
          <p>
            Flags weak archive pages without deleting anything. Use noindex for
            weak imported or thin pages until they have proper source notes,
            image credit and an Old Sea Dogs View.
          </p>
        </div>
        <div className="audit-summary-grid">
          <span><strong>{rows.length}</strong> audited</span>
          <span><strong>{weakRows.length}</strong> need work</span>
          <span><strong>{noindexRows.length}</strong> noindex</span>
          <span><strong>{readyRows.length}</strong> clean</span>
        </div>
      </div>

      <div className="audit-table">
        {rows.map((row) => (
          <article className={row.flags.length ? "audit-row audit-row--warning" : "audit-row"} key={row.story.id}>
            <div className="audit-row-main">
              <div>
                <h3>{row.story.title || "Untitled story"}</h3>
                <p>
                  {displayCategoryLabel(row.story.category)} · {row.wordCount} words · {editorStoryStatusLabel(row.story)} ·
                  audit: {row.story.editorialStatus || "Needs improvement"} · noindex: {row.story.noindex ? "yes" : "no"} · view: {row.oldSeaDogsViewQuality.label}
                </p>
              </div>
              <div className="audit-flags">
                {row.flags.length > 0 ? row.flags.map((flag) => <span key={flag}>{flag}</span>) : <span>Ready</span>}
              </div>
              {row.headlineReport.isGeneric && row.headlineReport.suggestions.length > 0 ? (
                <p className="audit-suggestion">Suggested headline: {row.headlineReport.suggestions[0]}</p>
              ) : null}
            </div>
            <div className="audit-actions">
              <button type="button" onClick={() => onEdit(row.story)} disabled={busy}>Edit</button>
              <button type="button" onClick={() => onPreview(row.story)} disabled={busy}>Preview</button>
              {auditStatuses.map((status) => (
                <button
                  className={status === "Hide from public" ? "quiet-button" : undefined}
                  disabled={busy}
                  key={status}
                  onClick={() => onMark(row.story, status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceReviewWorkspace({
  story,
  styleReport,
  debug,
  busy,
  onEdit,
  onPreview,
  onPublish,
  onSaveDraft,
  onDelete,
  onReject,
  onReturnToQueue,
  onApprove,
  onMarkNeedsDetail,
  onRetryImport,
}: {
  story: EditorStory;
  styleReport: OldSeaDogsStyleReport | null;
  debug: ScrapeReviewDebug;
  busy: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onDelete: () => void;
  onReject: () => void;
  onReturnToQueue: () => void;
  onApprove: () => void;
  onMarkNeedsDetail: () => void;
  onRetryImport: () => void;
}) {
  const wordCount = reviewItemWordCount(story);
  const contentIssue = reviewContentIssue(story);
  const articleText = story.body.filter(Boolean);
  const sourceUrl = story.sourceUrl.trim();
  const publishDisabled = busy || !canApproveReview(story) || isIncompleteReviewContent(story);

  return (
    <section className="review-workspace" aria-label="Review before publishing">
      <div className="review-workspace-left">
        <div className="review-workspace-head">
          <div>
            <p className="eyebrow">Review before publishing</p>
            <h3>{contentIssue ? "Imported content incomplete" : story.title || "Untitled generated story"}</h3>
            <span>{wordCount} words · {displayCategoryLabel(story.category)} · {reviewStatusLabel(story)}</span>
          </div>
          <span className={sourceReviewStatusClass(story)}>{reviewStatusLabel(story)}</span>
        </div>

        {contentIssue ? (
          <div className="incomplete-review-box" role="alert">
            <strong>Imported content incomplete</strong>
            <p>
              This item cannot be published as-is. Reason: {contentIssue}. The editor found {wordCount} usable words,
              below the 100-word minimum for a meaningful review.
            </p>
            <div className="press-action-row">
              <button type="button" className="danger-button" onClick={onDelete} disabled={busy}>
                Delete Item
              </button>
              <button type="button" onClick={onRetryImport} disabled={busy}>
                Retry Import
              </button>
              <button type="button" onClick={onEdit} disabled={busy}>
                Edit Manually
              </button>
            </div>
          </div>
        ) : null}

        <article className="review-article-copy">
          <h4>{story.title || "No headline yet"}</h4>
          {story.summary ? <p className="review-standfirst">{story.summary}</p> : null}
          {articleText.length > 0 ? (
            articleText.map((paragraph, index) => (
              <p key={`${story.id}-paragraph-${index}`}>{paragraph}</p>
            ))
          ) : (
            <p>No generated article text is available yet.</p>
          )}
        </article>
      </div>

      <aside className="review-workspace-right">
        <div className="review-action-card">
          <h4>Publish controls</h4>
          <div className="review-action-stack">
            <button type="button" onClick={onEdit} disabled={busy}>
              Edit Article
            </button>
            <button type="button" onClick={onPreview} disabled={busy}>
              Preview Article
            </button>
            <button type="button" onClick={onSaveDraft} disabled={busy}>
              Save as Draft
            </button>
            <button type="button" onClick={onApprove} disabled={busy || !canApproveReview(story)}>
              Approve
            </button>
            <button type="button" onClick={onPublish} disabled={publishDisabled}>
              Publish
            </button>
            <button type="button" className="quiet-button" onClick={onMarkNeedsDetail} disabled={busy}>
              Mark Needs Detail
            </button>
            <button type="button" className="quiet-button" onClick={onReturnToQueue} disabled={busy}>
              Return to Queue
            </button>
            <button type="button" className="quiet-button" onClick={onReject} disabled={busy || !story.id}>
              Reject
            </button>
            <button type="button" className="danger-button" onClick={onDelete} disabled={busy || !story.id}>
              Delete
            </button>
          </div>
        </div>

        {story.imageUrl ? (
          <figure className="review-featured-image">
            <img src={story.imageUrl} alt={story.imageAlt || story.title || "Featured image"} />
            <figcaption>
              {story.imageCaption || "Featured image"}
              {story.imageCredit ? <span>{story.imageCredit}</span> : null}
            </figcaption>
          </figure>
        ) : (
          <div className="review-no-image">No featured image selected.</div>
        )}

        <dl className="review-metadata-list">
          <div>
            <dt>Headline</dt>
            <dd>{story.title || "No headline"}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{story.sourceName || "Source Watch"}</dd>
          </div>
          <div>
            <dt>Date imported</dt>
            <dd>{story.createdAt ? formatEditorDateTime(story.createdAt) : "No import date stored"}</dd>
          </div>
          <div>
            <dt>Source URL</dt>
            <dd>
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  Open original item
                </a>
              ) : (
                "No source URL stored"
              )}
            </dd>
          </div>
          <div>
            <dt>Article category</dt>
            <dd>{displayCategoryLabel(story.category)}</dd>
          </div>
          <div>
            <dt>Word count</dt>
            <dd>{wordCount}</dd>
          </div>
          <div>
            <dt>Featured image</dt>
            <dd>{story.imageUrl ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>SEO title</dt>
            <dd>{story.title || "No SEO title yet"}</dd>
          </div>
          <div>
            <dt>SEO summary</dt>
            <dd>{story.summary || "No SEO summary yet"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{reviewStatusLabel(story)}</dd>
          </div>
        </dl>

        <dl className="review-diagnostics-panel">
          <div>
            <dt>reviewItemId</dt>
            <dd>{story.id || "missing"}</dd>
          </div>
          <div>
            <dt>storyStatus</dt>
            <dd>{story.status}</dd>
          </div>
          <div>
            <dt>sourceType</dt>
            <dd>{story.sourceType || "unknown"}</dd>
          </div>
          <div>
            <dt>wordCount</dt>
            <dd>{wordCount}</dd>
          </div>
          <div>
            <dt>generatedArticleLength</dt>
            <dd>{generatedArticleLength(story)}</dd>
          </div>
          <div>
            <dt>hasImage</dt>
            <dd>{story.imageUrl ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt>publicStoryExists</dt>
            <dd>{isEditorStoryPublicNow(story) && story.slug ? "yes" : "no"}</dd>
          </div>
        </dl>

        {styleReport ? <StyleScorePanel report={styleReport} /> : null}

        {debug.attemptedAction ? (
          <div className="source-review-debug" role={debug.errorMessage ? "alert" : "status"}>
            <strong>Review action diagnostics</strong>
            <dl>
              <div>
                <dt>Item ID</dt>
                <dd>{debug.itemId}</dd>
              </div>
              <div>
                <dt>Item type</dt>
                <dd>{debug.itemType}</dd>
              </div>
              <div>
                <dt>Action attempted</dt>
                <dd>{debug.attemptedAction}</dd>
              </div>
              <div>
                <dt>Missing data field</dt>
                <dd>{debug.missingDataField || "None"}</dd>
              </div>
              <div>
                <dt>API response status</dt>
                <dd>{debug.apiResponseStatus || "No API request needed"}</dd>
              </div>
              <div>
                <dt>Error message</dt>
                <dd>{debug.errorMessage || "No error"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function PressReleasePanel({
  data,
  queue,
  activeItem,
  selectedId,
  importDraft,
  setImportDraft,
  setPressReleaseDraft,
  onPick,
  onImport,
  onUploadEml,
  onAddAttachments,
  onSave,
  onSelectAttachment,
  onMark,
  onDelete,
  onBlock,
  onUnblock,
  onGenerate,
  onSaveDraft,
  onPublish,
  onUnpublish,
  onPreview,
  importDebug,
  saveDebug,
  publishDebug,
  uploadDebug,
  busy,
}: {
  data: EditorData;
  queue: PressReleaseEmail[];
  activeItem: PressReleaseEmail | null;
  selectedId: string;
  importDraft: ReturnType<typeof blankPressReleaseImport>;
  setImportDraft: (draft: ReturnType<typeof blankPressReleaseImport> | ((draft: ReturnType<typeof blankPressReleaseImport>) => ReturnType<typeof blankPressReleaseImport>)) => void;
  setPressReleaseDraft: (item: PressReleaseEmail | null | ((item: PressReleaseEmail | null) => PressReleaseEmail | null)) => void;
  onPick: (item: PressReleaseEmail) => void;
  onImport: () => Promise<void>;
  onUploadEml: (file: File) => Promise<void>;
  onAddAttachments: (files: FileList | null) => Promise<void>;
  onSave: (item: PressReleaseEmail, successMessage?: string) => Promise<PressReleaseEmail | null>;
  onSelectAttachment: (attachment: PressReleaseAttachment) => Promise<PressReleaseEmail | null>;
  onMark: (status: PressReleaseStatus, successMessage: string) => Promise<void>;
  onDelete: (item?: PressReleaseEmail | null) => Promise<void>;
  onBlock: (kind: "sender" | "domain") => Promise<void>;
  onUnblock: (id: string) => Promise<void>;
  onGenerate: () => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onPublish: (item?: PressReleaseEmail | null) => Promise<void>;
  onUnpublish: () => Promise<void>;
  onPreview: (item: PressReleaseEmail) => void;
  importDebug: PressImportDebug;
  saveDebug: PressSaveDebug;
  publishDebug: PressPublishDebug;
  uploadDebug: UploadDebug;
  busy: boolean;
}) {
  const selectedAttachment = activeItem?.attachments.find((attachment) => attachment.id === activeItem.selectedAttachmentId) ?? null;
  const hasSelectedImage = Boolean(activeItem?.imageUrl);
  const needsCredit = Boolean(hasSelectedImage && !activeItem?.imageCredit.trim());
  const canGenerate = Boolean(activeItem && !["spam", "rejected", "published"].includes(activeItem.status));
	  const canDraft = Boolean(activeItem && activeItem.generatedBody.length > 0 && activeItem.status !== "spam" && activeItem.status !== "rejected");
	  const publishedStory = activeItem?.storyId
	    ? data.stories.find((story) => story.id === activeItem.storyId)
	    : null;
  const homepageFeaturedStory =
    data.stories.find((story) => isEditorStoryPublicNow(story) && story.isFeatured) ?? null;
  const appearsAsMainHomepageFeature = Boolean(
    publishedStory && homepageFeaturedStory?.id === publishedStory.id
  );
	  const activeStyleReport = activeItem ? pressReleaseStyleReport(activeItem) : null;
	  const canPublish = Boolean(activeItem && canPublishPressReleaseItem(activeItem));
  const workflowStatus = activeItem ? pressWorkflowStatus(activeItem, publishedStory) : "";
  const publicUrl = publishedStory && isEditorStoryPublicNow(publishedStory) ? `/stories/${publishedStory.slug}` : "";
  const liveVisibility = publishedStory ? getEditorStoryVisibility(publishedStory, data.stories) : null;
  const activeCategorySection = activeItem ? getSectionForCategory(activeItem.category) : null;
  const activeCategoryRoute = activeItem ? sectionPathForCategory(activeItem.category) : "";
  const activePublicationIssues = activeItem
    ? validateStoryForPublication({
        ...storyFromPressRelease(activeItem),
        status: "published",
      })
    : [];
  const importCleaningPreview = previewPressReleaseCleaning(importDraft.rawEmail || importDraft.bodyText);
  const activeCleaningPreview = activeItem
    ? previewPressReleaseCleaning(activeItem.rawEmail || activeItem.bodyText)
    : null;
  const activeContentIssue = activeItem ? pressReleaseContentIssue(activeItem) : "";
  const [imageActionDebug, setImageActionDebug] = useState<NewsroomImageActionDebug>(blankNewsroomImageActionDebug);

  function updateActiveItem(patch: Partial<PressReleaseEmail>) {
    if (!activeItem) return;
    setPressReleaseDraft(normalizePressReleaseForEditor({ ...activeItem, ...patch }));
  }

  function currentSaveableImageUrl() {
    return [
      activeItem?.imageUrl,
      selectedAttachment?.dataUrl,
      uploadDebug.returnedImageUrl,
      uploadDebug.previewSrc,
    ].find((value) => value && isStoredMediaUrl(value)) || "";
  }

  function selectAttachment(attachment: PressReleaseAttachment) {
    updateActiveItem({
      selectedAttachmentId: attachment.id,
      imageAlt: activeItem?.imageAlt || attachment.caption || attachment.filename,
      imageCaption: activeItem?.imageCaption || attachment.caption,
      imageCredit: activeItem?.imageCredit || attachment.suggestedCredit,
      rightsNote: activeItem?.rightsNote || attachment.rightsNote,
    });
    void onSelectAttachment(attachment);
  }

  async function markActiveImageAsFeatured() {
    if (!activeItem) return;
    let imageUrl = currentSaveableImageUrl();
    const mediaId = mediaIdFromUrl(imageUrl);
    setImageActionDebug((current) => ({
      ...current,
      featuredClicked: "Yes",
      featuredActiveItemId: activeItem.id,
      featuredMediaId: mediaId || "No media ID",
      featuredImageUrl: imageUrl || "No stored media URL",
      featuredBeforeImage: activeItem.imageUrl || "No image",
      featuredBeforeFeatured: activeItem.selectedAttachmentId || "No selected attachment",
      featuredSaveRequestSent: imageUrl ? "Yes" : "No",
      featuredSaveResponseOk: "No",
      featuredMessage: imageUrl
        ? "Saving featured image selection..."
        : "No stored /api/media image is available. Upload the image first.",
    }));

    if (!imageUrl && selectedAttachment?.dataUrl.startsWith("data:image/")) {
      setImageActionDebug((current) => ({
        ...current,
        featuredSaveRequestSent: "Yes",
        featuredMessage: "Uploading selected email attachment before setting featured image...",
      }));
      const savedFromAttachment = await onSelectAttachment(selectedAttachment);
      imageUrl = savedFromAttachment?.imageUrl || "";
      setImageActionDebug((current) => ({
        ...current,
        featuredSaveResponseOk: imageUrl ? "Yes" : "No",
        featuredAfterImage: imageUrl || "No image saved",
        featuredAfterFeatured: savedFromAttachment?.selectedAttachmentId || selectedAttachment.id,
        featuredPersistedImage: imageUrl || "No persisted image returned",
        featuredMediaId: mediaIdFromUrl(imageUrl) || "No media ID",
        featuredImageUrl: imageUrl || "No stored media URL",
        featuredMessage: imageUrl
          ? "Email attachment uploaded and saved as the featured image."
          : "The selected email attachment could not be saved as media.",
      }));
      return;
    }

    if (!imageUrl) return;

    const selectedByUrl =
      selectedAttachment?.dataUrl === imageUrl
        ? selectedAttachment
        : activeItem.attachments.find((attachment) => attachment.dataUrl === imageUrl) ?? null;
    const updated: PressReleaseEmail = {
      ...activeItem,
      selectedAttachmentId: selectedByUrl?.id || activeItem.selectedAttachmentId || mediaId,
      imageUrl,
      imageAlt: activeItem.imageAlt || selectedByUrl?.caption || selectedByUrl?.filename || activeItem.generatedTitle || activeItem.subject,
      imageCaption: activeItem.imageCaption || selectedByUrl?.caption || "",
      imageCredit: activeItem.imageCredit || selectedByUrl?.suggestedCredit || "",
      rightsNote: activeItem.rightsNote || selectedByUrl?.rightsNote || "Uploaded through the Newsroom media library.",
    };
    updateActiveItem(updated);
    const saved = await onSave(updated, "Featured image selected and saved.");

    setImageActionDebug((current) => ({
      ...current,
      featuredSaveResponseOk: saved?.imageUrl === imageUrl ? "Yes" : "No",
      featuredAfterImage: saved?.imageUrl || updated.imageUrl || "No image saved",
      featuredAfterFeatured: saved?.selectedAttachmentId || updated.selectedAttachmentId || "No selected attachment saved",
      featuredPersistedImage: saved?.imageUrl || "No persisted image returned",
      featuredMessage: saved?.imageUrl === imageUrl
        ? "Featured image saved to the newsroom item."
        : "Featured image save did not return the expected image URL.",
    }));
  }

  async function insertActiveImageInline() {
    if (!activeItem) return;
    let workingItem = activeItem;
    let imageUrl = currentSaveableImageUrl();
    let mediaId = mediaIdFromUrl(imageUrl);
    if (!imageUrl && selectedAttachment?.dataUrl.startsWith("data:image/")) {
      setImageActionDebug((current) => ({
        ...current,
        inlineClicked: "Yes",
        inlineActiveItemId: activeItem.id,
        inlineSaveRequestSent: "Yes",
        inlineMessage: "Uploading selected email attachment before inserting it inline...",
      }));
      const savedFromAttachment = await onSelectAttachment(selectedAttachment);
      if (savedFromAttachment?.imageUrl) {
        workingItem = savedFromAttachment;
        imageUrl = savedFromAttachment.imageUrl;
        mediaId = mediaIdFromUrl(imageUrl);
      }
    }
    const beforeBody = workingItem.generatedBody.filter(Boolean);
    setImageActionDebug((current) => ({
      ...current,
      inlineClicked: "Yes",
      inlineActiveItemId: workingItem.id,
      inlineMediaId: mediaId || "No media ID",
      inlineImageUrl: imageUrl || "No stored media URL",
      inlineBodyLengthBefore: String(beforeBody.join("\n\n").length),
      inlineInsertPosition: imageUrl ? `After paragraph ${beforeBody.length}` : "Not inserted",
      inlineSaveRequestSent: imageUrl ? "Yes" : "No",
      inlineSaveResponseOk: "No",
      inlinePersistedBodyContainsImage: "No",
      inlineMessage: imageUrl
        ? "Inserting inline image and saving newsroom item..."
        : "No stored /api/media image is available. Upload the image first.",
    }));

    if (!imageUrl) return;

    const selectedByUrl =
      selectedAttachment?.dataUrl === imageUrl
        ? selectedAttachment
        : workingItem.attachments.find((attachment) => attachment.dataUrl === imageUrl) ?? null;
    const figure = buildArticleInlineImageFigure({
      url: imageUrl,
      alt: workingItem.imageAlt || selectedByUrl?.caption || selectedByUrl?.filename || workingItem.generatedTitle || workingItem.subject,
      caption: workingItem.imageCaption || selectedByUrl?.caption || "",
      credit: workingItem.imageCredit || selectedByUrl?.suggestedCredit || "",
    });
    const nextBody = [...beforeBody, figure];
    const updated: PressReleaseEmail = {
      ...workingItem,
      selectedAttachmentId: selectedByUrl?.id || workingItem.selectedAttachmentId || mediaId,
      imageUrl: workingItem.imageUrl || imageUrl,
      imageAlt: workingItem.imageAlt || selectedByUrl?.caption || selectedByUrl?.filename || workingItem.generatedTitle || workingItem.subject,
      imageCaption: workingItem.imageCaption || selectedByUrl?.caption || "",
      imageCredit: workingItem.imageCredit || selectedByUrl?.suggestedCredit || "",
      generatedBody: nextBody,
      generatedWordCount: articleTextWordCount(nextBody),
    };
    updateActiveItem(updated);
    const saved = await onSave(updated, "Inline image inserted and saved.");

    setImageActionDebug((current) => ({
      ...current,
      inlineBodyLengthAfter: String(nextBody.join("\n\n").length),
      inlineSaveResponseOk: saved?.generatedBody?.some((paragraph) => paragraph.includes(imageUrl)) ? "Yes" : "No",
      inlinePersistedBodyContainsImage: saved?.generatedBody?.some((paragraph) => paragraph.includes(imageUrl)) ? "Yes" : "No",
      inlineMessage: saved?.generatedBody?.some((paragraph) => paragraph.includes(imageUrl))
        ? "Inline image saved into the article body."
        : "Inline image was inserted locally, but the saved item did not return it.",
    }));
  }

  function removeActiveImage() {
    if (!activeItem) return;
    void onSave(
      {
        ...activeItem,
        selectedAttachmentId: "",
        imageUrl: "",
        imageAlt: "",
        imageCaption: "",
        imageCredit: "",
        rightsNote: "",
      },
      "Photo removed from this newsroom item."
    );
  }

  return (
    <section className="editor-panel press-room-panel">
      <div className="editor-list-header source-watch-heading">
        <div>
          <p className="eyebrow">Email Press Releases</p>
          <h2>Review-and-approval newsroom</h2>
        </div>
        <div className="source-watch-actions">
          <span>{queue.length} email{queue.length === 1 ? "" : "s"} queued</span>
          <span>{data.blockedSenders.length} blocked</span>
        </div>
      </div>

      <div className="press-room-note newsroom-status-panel">
        <div>
          <strong>{data.emailIngestion.status}</strong>
          <span>{data.emailIngestion.note}</span>
        </div>
        <div className="newsroom-status-grid">
          <span>Paste import: ready</span>
          <span>.eml upload: ready</span>
          <span>Photo attachments: ready</span>
          <span>Live inbox: {data.emailIngestion.inboxConfigured ? "configured" : "not configured"}</span>
          <span>Storage: {data.emailIngestion.storageMode}</span>
        </div>
        <p>{data.emailIngestion.storageDetail}</p>
      </div>

      <div className="press-room-layout">
        <aside className="press-import-column">
          <div className="press-import-box">
            <h3>Import an email</h3>
            <p>Paste the press release, upload a .eml file, or add details by hand. This only creates a private review item.</p>
            <div className="split-fields">
              <label>
                Sender name
                <input
                  value={importDraft.senderName}
                  onChange={(event) => setImportDraft((current) => ({ ...current, senderName: event.target.value }))}
                />
              </label>
              <label>
                Sender email
                <input
                  value={importDraft.senderEmail}
                  onChange={(event) => setImportDraft((current) => ({ ...current, senderEmail: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Email subject
              <input
                value={importDraft.subject}
                onChange={(event) => setImportDraft((current) => ({ ...current, subject: event.target.value }))}
              />
            </label>
            <label>
              Received date
              <input
                type="datetime-local"
                value={importDraft.receivedAt}
                onChange={(event) => setImportDraft((current) => ({ ...current, receivedAt: event.target.value }))}
              />
            </label>
            <label>
              Paste email or press-release text
              <textarea
                value={importDraft.bodyText}
                onChange={(event) => setImportDraft((current) => ({ ...current, bodyText: event.target.value }))}
              />
            </label>
            <label>
              Raw .eml text
              <textarea
                value={importDraft.rawEmail}
                placeholder="Optional: upload a .eml file and the raw email appears here."
                onChange={(event) => setImportDraft((current) => ({ ...current, rawEmail: event.target.value }))}
              />
            </label>
            {importDraft.rawEmail.trim() || importDraft.bodyText.trim() ? (
              <CleanedImportPreviewBox preview={importCleaningPreview} />
            ) : null}
            {importDraft.attachments.length > 0 ? (
              <div className="press-mini-attachments">
                {importDraft.attachments.map((attachment) => (
                  <figure key={attachment.id}>
                    <img src={attachment.dataUrl} alt={attachment.caption || attachment.filename} />
                    <figcaption>{attachment.filename}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            <ImportDebugBox debug={importDebug} />
            <div className="press-action-row">
              <label className="upload-button">
                Upload .eml
                <input
                  type="file"
                  accept=".eml,message/rfc822,text/plain"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void onUploadEml(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="upload-button">
                Add photos
                <input
                  type="file"
                  multiple
                  accept={photoUploadAccept}
                  disabled={busy}
                  onChange={(event) => {
                    void onAddAttachments(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button type="button" onClick={() => void onImport()} disabled={busy}>
                Import email
              </button>
            </div>
            <details className="press-config">
              <summary>Live inbox setup</summary>
              <p>
                Email inbox import needs server environment variables. Passwords and tokens are never shown in
                the browser.
              </p>
              {data.emailIngestion.missingEnvironmentKeys.length > 0 ? (
                <>
                  <strong>Missing settings</strong>
                  <ul>
                    {data.emailIngestion.missingEnvironmentKeys.map((key) => (
                      <li key={key}>{key}=</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>All required live inbox settings are present on the server.</p>
              )}
              {data.emailIngestion.configuredEnvironmentKeys.length > 0 ? (
                <>
                  <strong>Configured on the server</strong>
                  <ul>
                    {data.emailIngestion.configuredEnvironmentKeys.map((key) => (
                      <li key={key}>
                        {data.emailIngestion.secretEnvironmentKeys.includes(key) ? `${key}=set privately` : `${key}=set`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <strong>Expected settings</strong>
              <ul>
                {data.emailIngestion.environmentKeys.map((key) => (
                  <li key={key}>{key}=</li>
                ))}
              </ul>
            </details>
          </div>

          <div className="press-queue">
            <div className="queue-heading">
              <h3>Review queue</h3>
              <span>{queue.length}</span>
            </div>
            {queue.length === 0 ? (
              <div className="review-empty">
                <p>No press releases have been imported yet.</p>
              </div>
            ) : (
              <div className="review-card-list">
                {queue.map((item) => (
                  <article className={selectedId === item.id ? "review-card selected press-queue-card" : "review-card press-queue-card"} key={item.id}>
                    <div className="press-queue-card-main">
                      <strong>{item.subject || "Untitled email"}</strong>
                      <small>
                        {pressWorkflowStatus(item, item.storyId ? data.stories.find((story) => story.id === item.storyId) : null)} · {displayCategoryLabel(item.category)} · {item.attachments.length} photo{item.attachments.length === 1 ? "" : "s"}
                      </small>
                      <small>{item.senderName || item.senderEmail || "Unknown sender"} · {new Date(item.receivedAt).toLocaleDateString()}</small>
                    </div>
                    <div className="press-queue-card-actions">
                      <button type="button" onClick={() => onPick(item)} disabled={busy}>
                        Review
                      </button>
                      <button type="button" onClick={() => onPick(item)} disabled={busy}>
                        Edit
                      </button>
                      <button type="button" onClick={() => void onSave({ ...item, status: "rejected" }, "Press release rejected.")} disabled={busy}>
                        Reject
                      </button>
                      <button type="button" onClick={() => void onPublish(item)} disabled={busy || !canPublishPressReleaseItem(item)}>
                        Publish
                      </button>
                      <button type="button" className="quiet-button danger-button" onClick={() => void onDelete(item)} disabled={busy}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="press-blocked-box">
            <h3>Blocked and spam senders</h3>
            {data.blockedSenders.length === 0 ? <p>No blocked senders yet.</p> : null}
            {data.blockedSenders.map((blocked) => (
              <div className="blocked-row" key={blocked.id}>
                <span>{blocked.value}</span>
                <small>{blocked.kind}</small>
                <button type="button" onClick={() => void onUnblock(blocked.id)} disabled={busy}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="press-review-editor">
          {!activeItem ? (
            <div className="review-empty large">
              <p>Import or select a press release to start reviewing. Nothing in this queue is public.</p>
            </div>
          ) : (
            <>
              <div className="review-toolbar press-review-toolbar">
                <div>
                  <p className="eyebrow">Private newsroom item</p>
                  <h3>{activeItem.subject || "Untitled press release"}</h3>
                  <span>{activeItem.senderName || activeItem.senderEmail || "Unknown sender"} · {new Date(activeItem.receivedAt).toLocaleString()} · {pressReleaseWordCount(activeItem)} words</span>
                </div>
                <div>
                  <span className={pressStatusClass(activeItem.status, publishedStory)}>{workflowStatus}</span>
                </div>
              </div>

              {activeItem.warnings.length || activePublicationIssues.length || activeItem.duplicateOf || needsCredit || (activeItem.status === "published" && !publicUrl) ? (
                <div className="press-warning-box">
                  {activeItem.warnings.map((warning) => (
                    <span key={warning}>{warning}</span>
                  ))}
                  {activePublicationIssues.map((issue) => (
                    <span key={issue}>{issue}</span>
                  ))}
                  {activeItem.duplicateOf ? <span>Possible duplicate: {activeItem.duplicateScore}% match.</span> : null}
                  {needsCredit ? <span>Image rights information is incomplete. You may publish now and update the rights details later.</span> : null}
                  {activeItem.status === "published" && !publicUrl ? <span>Published status exists, but no live public story was found.</span> : null}
                </div>
              ) : null}

              {activeContentIssue ? (
                <div className="incomplete-review-box" role="alert">
                  <strong>Imported content incomplete</strong>
                  <p>
                    This newsroom item needs attention before publication. Reason: {activeContentIssue}.
                    It has {pressReleaseWordCount(activeItem)} usable words.
                  </p>
                  <div className="press-action-row">
                    <button type="button" className="danger-button" onClick={() => void onDelete(activeItem)} disabled={busy}>
                      Delete Item
                    </button>
                    <button type="button" onClick={() => void onGenerate()} disabled={busy || !canGenerate}>
                      Retry Import
                    </button>
                    <button type="button" onClick={() => void onSave(activeItem, "Manual edits saved.")} disabled={busy}>
                      Edit Manually
                    </button>
                  </div>
                </div>
              ) : null}

              <dl className="review-diagnostics-panel newsroom-diagnostics-panel">
                <div>
                  <dt>reviewItemId</dt>
                  <dd>{activeItem.id}</dd>
                </div>
                <div>
                  <dt>storyStatus</dt>
                  <dd>{activeItem.status}</dd>
                </div>
                <div>
                  <dt>sourceType</dt>
                  <dd>Email Press Release</dd>
                </div>
                <div>
                  <dt>wordCount</dt>
                  <dd>{pressReleaseWordCount(activeItem)}</dd>
                </div>
                <div>
                  <dt>generatedArticleLength</dt>
                  <dd>{activeItem.generatedBody.join("\n\n").length}</dd>
                </div>
                <div>
                  <dt>hasImage</dt>
                  <dd>{activeItem.imageUrl ? "yes" : "no"}</dd>
                </div>
                <div>
                  <dt>publicStoryExists</dt>
                  <dd>{publishedStory && isEditorStoryPublicNow(publishedStory) ? "yes" : "no"}</dd>
                </div>
              </dl>

              <div className="upload-debug-box newsroom-save-status">
                <strong>Newsroom save diagnostics</strong>
                <dl>
                  <div>
                    <dt>Save request sent</dt>
                    <dd>{saveDebug.requestSent}</dd>
                  </div>
                  <div>
                    <dt>Save item ID</dt>
                    <dd>{saveDebug.itemId || activeItem.id}</dd>
                  </div>
                  <div>
                    <dt>Save payload size</dt>
                    <dd>{saveDebug.payloadBytes || "No save payload yet"}</dd>
                  </div>
                  <div>
                    <dt>Raw email skipped</dt>
                    <dd>{saveDebug.rawEmailBytesSkipped || "No raw email skipped yet"}</dd>
                  </div>
                  <div>
                    <dt>Attachments on item</dt>
                    <dd>{saveDebug.attachmentCount || String(activeItem.attachments.length)}</dd>
                  </div>
                  <div>
                    <dt>Data attachments skipped</dt>
                    <dd>{saveDebug.dataAttachmentCountSkipped || "0"}</dd>
                  </div>
                  <div>
                    <dt>Stored attachments sent</dt>
                    <dd>{saveDebug.sentAttachmentCount || "0"}</dd>
                  </div>
                  <div>
                    <dt>Save response status</dt>
                    <dd>{saveDebug.responseStatus}</dd>
                  </div>
                  <div>
                    <dt>Save response text</dt>
                    <dd>{saveDebug.responseText || "No response text yet"}</dd>
                  </div>
                  {saveDebug.error ? (
                    <div>
                      <dt>Save error</dt>
                      <dd>{saveDebug.error}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="upload-debug-box newsroom-publish-status">
                <strong>Newsroom publish diagnostics</strong>
                <dl>
                  <div>
                    <dt>Publish button clicked</dt>
                    <dd>{publishDebug.publishButtonClicked}</dd>
                  </div>
                  <div>
                    <dt>Active item ID</dt>
                    <dd>{publishDebug.activeItemId || activeItem.id}</dd>
                  </div>
                  <div>
                    <dt>Publish request sent</dt>
                    <dd>{publishDebug.publishRequestSent}</dd>
                  </div>
                  <div>
                    <dt>API response</dt>
                    <dd>{publishDebug.apiResponse}</dd>
                  </div>
                  <div>
                    <dt>Story created</dt>
                    <dd>{publishDebug.storyCreated}</dd>
                  </div>
                  <div>
                    <dt>Story slug</dt>
                    <dd>{publishDebug.storySlug || publishedStory?.slug || "No story slug yet"}</dd>
                  </div>
                  <div>
                    <dt>Story status</dt>
                    <dd>{publishDebug.storyStatus || publishedStory?.status || "No story status yet"}</dd>
                  </div>
                  <div>
                    <dt>Appears on homepage</dt>
                    <dd>{publishDebug.appearsOnHomepage}</dd>
                  </div>
                  <div>
                    <dt>Appears in section</dt>
                    <dd>{publishDebug.appearsInSection}</dd>
                  </div>
                  <div>
                    <dt>Public URL</dt>
                    <dd>{publishDebug.publicUrl || publicUrl || "No public URL yet"}</dd>
                  </div>
                  <div>
                    <dt>Selected image URL</dt>
                    <dd>{debugImageValue(publishDebug.selectedImageUrl || activeItem.imageUrl) || "No selected image URL"}</dd>
                  </div>
                  <div>
                    <dt>featuredImageUrl</dt>
                    <dd>{debugImageValue(publishDebug.featuredImageUrl || activeItem.imageUrl) || "No featured image URL"}</dd>
                  </div>
                  <div>
                    <dt>imageUrl</dt>
                    <dd>{debugImageValue(publishDebug.imageUrl || activeItem.imageUrl) || "No image URL"}</dd>
                  </div>
                  <div>
                    <dt>mediaId</dt>
                    <dd>{publishDebug.mediaId || mediaIdFromUrl(activeItem.imageUrl) || "No media ID"}</dd>
                  </div>
                  <div>
                    <dt>Draft image field</dt>
                    <dd>{debugImageValue(publishDebug.draftImageField) || "No draft image captured yet"}</dd>
                  </div>
                  <div>
                    <dt>Draft featured image field</dt>
                    <dd>{debugImageValue(publishDebug.draftFeaturedImageField) || "No draft featured image captured yet"}</dd>
                  </div>
                  <div>
                    <dt>Publish payload image field</dt>
                    <dd>{debugImageValue(publishDebug.publishPayloadImageField) || "No publish payload image yet"}</dd>
                  </div>
                  <div>
                    <dt>Publish payload featured image field</dt>
                    <dd>{debugImageValue(publishDebug.publishPayloadFeaturedImageField) || "No publish payload featured image yet"}</dd>
                  </div>
                  <div>
                    <dt>Public story image field</dt>
                    <dd>{debugImageValue(publishDebug.publicStoryImageField || publishedStory?.imageUrl || "") || "No public story image yet"}</dd>
                  </div>
                  <div>
                    <dt>Public story featured image field</dt>
                    <dd>{debugImageValue(publishDebug.publicStoryFeaturedImageField || publishedStory?.imageUrl || "") || "No public story featured image yet"}</dd>
                  </div>
                  <div>
                    <dt>Public story inline images</dt>
                    <dd>{publishDebug.publicStoryInlineImageCount}</dd>
                  </div>
                  <div>
                    <dt>isHomepageFeatured</dt>
                    <dd>{publishDebug.isHomepageFeatured || (publishedStory?.isFeatured ? "Yes" : "No")}</dd>
                  </div>
                  <div>
                    <dt>homepageFeaturedSlug</dt>
                    <dd>
                      {publishDebug.homepageFeaturedSlug ||
                        homepageFeaturedStory?.slug ||
                        "No homepage feature selected"}
                    </dd>
                  </div>
                  <div>
                    <dt>appearsAsMainHomepageFeature</dt>
                    <dd>
                      {publishDebug.appearsAsMainHomepageFeature ||
                        (appearsAsMainHomepageFeature ? "Yes" : "No")}
                    </dd>
                  </div>
                  {publishDebug.error ? (
                    <div>
                      <dt>Publish error</dt>
                      <dd>{publishDebug.error}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="press-detail-grid">
                <section className="press-card-box">
                  <h4>Email detail</h4>
                  <div className="split-fields">
                    <label>
                      Sender name
                      <input value={activeItem.senderName} onChange={(event) => updateActiveItem({ senderName: event.target.value })} />
                    </label>
                    <label>
                      Sender email
                      <input value={activeItem.senderEmail} onChange={(event) => updateActiveItem({ senderEmail: event.target.value })} />
                    </label>
                  </div>
                  <label>
                    Subject
                    <input value={activeItem.subject} onChange={(event) => updateActiveItem({ subject: event.target.value })} />
                  </label>
                  <label>
                    Category
                    <select
                      value={normalizeStoryCategory(activeItem.category)}
                      onChange={(event) => updateActiveItem({ category: normalizeStoryCategory(event.target.value) })}
                    >
                      {storyCategoryOptions.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                    <span className="field-help">
                      Site route: {activeCategoryRoute} · Section feed: {activeCategorySection?.label ?? "No matching public section"}
                    </span>
                  </label>
                  <label>
                    Original email text
                    <textarea
                      value={activeItem.bodyText}
                      onChange={(event) => updateActiveItem({ bodyText: event.target.value })}
                    />
                  </label>
                  {activeCleaningPreview ? <CleanedImportPreviewBox preview={activeCleaningPreview} /> : null}
                  <div className="press-action-row">
                    <button type="button" onClick={() => void onSave(activeItem)} disabled={busy}>Save email edits</button>
                    <button type="button" onClick={() => void onMark("accepted", "Press release approved for article generation.")} disabled={busy}>Approve</button>
                    <button type="button" className="quiet-button" onClick={() => void onMark("rejected", "Press release rejected.")} disabled={busy}>Reject</button>
                    <button type="button" className="quiet-button" onClick={() => void onMark("spam", "Press release marked as spam.")} disabled={busy}>Spam</button>
                    {activeItem.status === "spam" || activeItem.status === "rejected" ? (
                      <button type="button" onClick={() => void onMark("new", "Press release restored to the queue.")} disabled={busy}>Restore</button>
                    ) : null}
                    <button type="button" className="quiet-button" onClick={() => void onBlock("sender")} disabled={busy || !activeItem.senderEmail}>Block sender</button>
                    <button type="button" className="quiet-button" onClick={() => void onBlock("domain")} disabled={busy || !activeItem.senderDomain}>Block domain</button>
                    <button type="button" className="quiet-button danger-button" onClick={() => void onDelete(activeItem)} disabled={busy}>
                      Delete from queue
                    </button>
                  </div>
                </section>

                <section className="press-card-box">
                  <h4>Photos and credits</h4>
                  <label className="upload-button press-upload-inline">
                    Add photos to this email
                    <input
                      type="file"
                      multiple
                      accept={photoUploadAccept}
                      disabled={busy}
                      onChange={(event) => {
                        void onAddAttachments(event.currentTarget.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {activeItem.attachments.length === 0 ? (
                    <p className="muted-note">No image attachments were found in this email. You can add photos manually.</p>
                  ) : (
                    <div className="press-attachment-grid">
                      {activeItem.attachments.map((attachment) => (
                        <button
                          type="button"
                          className={activeItem.selectedAttachmentId === attachment.id ? "selected" : ""}
                          key={attachment.id}
                          onClick={() => selectAttachment(attachment)}
                        >
                          <img src={attachment.dataUrl} alt={attachment.caption || attachment.filename} />
                          <strong>{attachment.caption || attachment.filename}</strong>
                    <small>{attachment.suggestedCredit || "No credit found"}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedAttachment ? (
                    <p className="muted-note">Selected: {selectedAttachment.filename}</p>
                  ) : null}
                  {activeItem.imageUrl ? (
                    <div className="press-selected-image">
                      <img src={activeItem.imageUrl} alt={activeItem.imageAlt || "Selected press-release image"} />
                    </div>
                  ) : null}
                  <div className="upload-debug-box newsroom-photo-status">
                    <strong>Photo upload status</strong>
                    <dl>
                      <div>
                        <dt>Selected file</dt>
                        <dd>{uploadDebug.selectedFileName || selectedAttachment?.filename || "No file selected yet"}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{uploadDebug.uploadStatus || "No upload started yet"}</dd>
                      </div>
                      <div>
                        <dt>Upload request sent</dt>
                        <dd>{uploadDebug.uploadRequestSent}</dd>
                      </div>
                      <div>
                        <dt>Upload request URL</dt>
                        <dd>{uploadDebug.uploadRequestUrl || "No upload request URL yet"}</dd>
                      </div>
                      <div>
                        <dt>Upload response status</dt>
                        <dd>{uploadDebug.responseStatus || "No server response yet"}</dd>
                      </div>
                      <div>
                        <dt>Media record created</dt>
                        <dd>{uploadDebug.mediaRecordCreated}</dd>
                      </div>
                      <div>
                        <dt>Media ID</dt>
                        <dd>{uploadDebug.mediaId || mediaIdFromUrl(activeItem.imageUrl) || "No media ID yet"}</dd>
                      </div>
                      <div>
                        <dt>Returned image URL</dt>
                        <dd>{debugImageValue(uploadDebug.returnedImageUrl || activeItem.imageUrl) || "No URL returned yet"}</dd>
                      </div>
                      <div>
                        <dt>Thumbnail URL</dt>
                        <dd>{debugImageValue(uploadDebug.thumbnailUrl || thumbnailUrlFromMediaUrl(activeItem.imageUrl)) || "No thumbnail URL yet"}</dd>
                      </div>
                      <div>
                        <dt>Current article image field</dt>
                        <dd>{debugImageValue(uploadDebug.articleImageField || activeItem.imageUrl) || "No image on this newsroom item"}</dd>
                      </div>
                      <div>
                        <dt>Featured image field</dt>
                        <dd>{debugImageValue(uploadDebug.featuredImageField || activeItem.imageUrl) || "No featured image selected"}</dd>
                      </div>
                      <div>
                        <dt>Preview image src</dt>
                        <dd>{debugImageValue(uploadDebug.previewSrc || activeItem.imageUrl || selectedAttachment?.dataUrl || "") || "No preview image src"}</dd>
                      </div>
                      {uploadDebug.error ? (
                        <div>
                          <dt>Upload error</dt>
                          <dd>{uploadDebug.error}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  <div className="upload-debug-box newsroom-photo-action-status">
                    <strong>Newsroom image button diagnostics</strong>
                    <dl>
                      <div>
                        <dt>Featured clicked</dt>
                        <dd>{imageActionDebug.featuredClicked}</dd>
                      </div>
                      <div>
                        <dt>Featured active item</dt>
                        <dd>{imageActionDebug.featuredActiveItemId || activeItem.id}</dd>
                      </div>
                      <div>
                        <dt>Featured media ID</dt>
                        <dd>{imageActionDebug.featuredMediaId || mediaIdFromUrl(activeItem.imageUrl) || "No media ID"}</dd>
                      </div>
                      <div>
                        <dt>Featured image URL</dt>
                        <dd>{debugImageValue(imageActionDebug.featuredImageUrl || activeItem.imageUrl) || "No image URL"}</dd>
                      </div>
                      <div>
                        <dt>Before item image</dt>
                        <dd>{debugImageValue(imageActionDebug.featuredBeforeImage) || "Not captured yet"}</dd>
                      </div>
                      <div>
                        <dt>Before featured field</dt>
                        <dd>{imageActionDebug.featuredBeforeFeatured || "Not captured yet"}</dd>
                      </div>
                      <div>
                        <dt>Save request sent</dt>
                        <dd>{imageActionDebug.featuredSaveRequestSent}</dd>
                      </div>
                      <div>
                        <dt>Save response ok</dt>
                        <dd>{imageActionDebug.featuredSaveResponseOk}</dd>
                      </div>
                      <div>
                        <dt>After item image</dt>
                        <dd>{debugImageValue(imageActionDebug.featuredAfterImage) || "No saved image returned yet"}</dd>
                      </div>
                      <div>
                        <dt>After featured field</dt>
                        <dd>{imageActionDebug.featuredAfterFeatured || "No saved featured field returned yet"}</dd>
                      </div>
                      <div>
                        <dt>Persisted image value</dt>
                        <dd>{debugImageValue(imageActionDebug.featuredPersistedImage) || "Not verified yet"}</dd>
                      </div>
                      <div>
                        <dt>Featured message</dt>
                        <dd>{imageActionDebug.featuredMessage}</dd>
                      </div>
                      <div>
                        <dt>Inline clicked</dt>
                        <dd>{imageActionDebug.inlineClicked}</dd>
                      </div>
                      <div>
                        <dt>Inline active item</dt>
                        <dd>{imageActionDebug.inlineActiveItemId || activeItem.id}</dd>
                      </div>
                      <div>
                        <dt>Inline media ID</dt>
                        <dd>{imageActionDebug.inlineMediaId || mediaIdFromUrl(activeItem.imageUrl) || "No media ID"}</dd>
                      </div>
                      <div>
                        <dt>Inline image URL</dt>
                        <dd>{debugImageValue(imageActionDebug.inlineImageUrl || activeItem.imageUrl) || "No image URL"}</dd>
                      </div>
                      <div>
                        <dt>Article body length before</dt>
                        <dd>{imageActionDebug.inlineBodyLengthBefore || "Not captured yet"}</dd>
                      </div>
                      <div>
                        <dt>Article body length after</dt>
                        <dd>{imageActionDebug.inlineBodyLengthAfter || "Not captured yet"}</dd>
                      </div>
                      <div>
                        <dt>Insert position</dt>
                        <dd>{imageActionDebug.inlineInsertPosition || "Not inserted yet"}</dd>
                      </div>
                      <div>
                        <dt>Save request sent</dt>
                        <dd>{imageActionDebug.inlineSaveRequestSent}</dd>
                      </div>
                      <div>
                        <dt>Save response ok</dt>
                        <dd>{imageActionDebug.inlineSaveResponseOk}</dd>
                      </div>
                      <div>
                        <dt>Persisted article body contains image</dt>
                        <dd>{imageActionDebug.inlinePersistedBodyContainsImage}</dd>
                      </div>
                      <div>
                        <dt>Inline message</dt>
                        <dd>{imageActionDebug.inlineMessage}</dd>
                      </div>
                    </dl>
                  </div>
                  {activeItem.imageUrl || selectedAttachment || uploadDebug.previewSrc ? (
                    <PhotoPreviewPanel
                      caption={activeItem.imageCaption}
                      contentType={selectedAttachment?.contentType || displayMediaType(activeItem.imageUrl || uploadDebug.previewSrc)}
                      credit={activeItem.imageCredit}
                      fileName={selectedAttachment?.filename || uploadDebug.selectedFileName || displayMediaName(activeItem.imageUrl, activeItem.imageAlt)}
                      mediaId={mediaIdFromUrl(activeItem.imageUrl) || uploadDebug.mediaId}
                      onCaptionChange={(value) => updateActiveItem({ imageCaption: value })}
                      onCreditChange={(value) => updateActiveItem({ imageCredit: value })}
                      onInsertInline={() => void insertActiveImageInline()}
                      onRemove={removeActiveImage}
                      onUseAsFeatured={() => void markActiveImageAsFeatured()}
                      src={activeItem.imageUrl || selectedAttachment?.dataUrl || uploadDebug.previewSrc || ""}
                      thumbnailUrl={thumbnailUrlFromMediaUrl(activeItem.imageUrl) || uploadDebug.thumbnailUrl}
                    />
                  ) : null}
                  <label>
                    Caption
                    <input value={activeItem.imageCaption} onChange={(event) => updateActiveItem({ imageCaption: event.target.value })} />
                  </label>
                  <label>
                    Photographer credit / source attribution
                    <input
                      value={activeItem.imageCredit}
                      placeholder="Required before publishing if a photo is used"
                      onChange={(event) => updateActiveItem({ imageCredit: event.target.value })}
                    />
                  </label>
                  <label>
                    Rights / usage note
                    <textarea value={activeItem.rightsNote} onChange={(event) => updateActiveItem({ rightsNote: event.target.value })} />
                  </label>
                  <button type="button" onClick={() => void onSave(activeItem, "Photo choice and credit saved.")} disabled={busy}>Save photo details</button>
                </section>
              </div>

              <section className="press-card-box generated-article-box">
	                <div className="generated-article-head">
	                  <div>
	                    <p className="eyebrow">Generated article for review</p>
	                    <h4>{activeItem.generatedTitle || "No article generated yet"}</h4>
	                  </div>
	                  <span>{activeItem.generatedWordCount || pressReleaseWordCount(activeItem)} words</span>
	                </div>
	                {activeStyleReport ? <StyleScorePanel report={activeStyleReport} /> : null}
	                <div className="press-action-row">
                  <button type="button" onClick={() => void onSave(activeItem, "Article edits saved. Use the fields below to keep editing.")} disabled={busy}>
                    Edit Article
                  </button>
                  <button type="button" onClick={() => void onGenerate()} disabled={busy || !canGenerate}>
                    {activeItem.generatedBody.length ? "Regenerate article" : "Generate article"}
                  </button>
                  <button type="button" onClick={() => onPreview(activeItem)} disabled={busy}>
                    Preview Article
                  </button>
                  <button type="button" onClick={() => void onSave(activeItem, "Generated article edits saved.")} disabled={busy || !activeItem.generatedTitle}>
                    Save article edits
                  </button>
                  <button type="button" onClick={() => void onSaveDraft()} disabled={busy || !canDraft}>
                    Save as Draft
                  </button>
                  <button type="button" onClick={() => void onPublish()} disabled={busy || !canPublish}>
                    Publish
                  </button>
                  {publicUrl ? (
                    <Link className="editor-link compact-live-link" href={publicUrl} target="_blank">
                      View Live Story
                    </Link>
                  ) : null}
                  {publicUrl ? (
                    <button type="button" className="quiet-button" onClick={() => void onUnpublish()} disabled={busy}>
                      Unpublish
                    </button>
                  ) : null}
                  <button type="button" className="quiet-button" onClick={() => void onMark("new", "Press release returned to the queue.")} disabled={busy}>
                    Return to Queue
                  </button>
                  <button type="button" className="quiet-button" onClick={() => void onMark("rejected", "Press release rejected.")} disabled={busy}>
                    Reject
                  </button>
                  <button type="button" className="danger-button" onClick={() => void onDelete(activeItem)} disabled={busy}>
                    Delete
                  </button>
                </div>
                <label>
                  Headline
                  <input value={activeItem.generatedTitle} onChange={(event) => updateActiveItem({ generatedTitle: event.target.value })} />
                </label>
                <label>
                  Excerpt / standfirst
                  <textarea value={activeItem.generatedExcerpt} onChange={(event) => updateActiveItem({ generatedExcerpt: event.target.value })} />
                </label>
                <label>
                  Article body
                  <textarea
                    className="story-body-box"
                    value={activeItem.generatedBody.join("\n\n")}
                    onChange={(event) =>
                      updateActiveItem({
                        generatedBody: event.target.value
                          .split(/\n{2,}/)
                          .map((paragraph) => paragraph.trim())
                          .filter(Boolean),
                        generatedWordCount: event.target.value.split(/\s+/).filter(Boolean).length,
                      })
                    }
                  />
                </label>
                {activeItem.storyId ? (
                  <p className="muted-note">
                    Draft story created. Final publishing still needs the Publish button.
                  </p>
                ) : null}
                {activeItem.status === "published" && publishedStory && publicUrl ? (
                  <div className="live-story-note">
                    <strong>Published successfully</strong>
                    <span>Public URL: {publicUrl}</span>
                    <span>Category: {displayCategoryLabel(publishedStory.category)}</span>
                    <span>Published: {formatEditorDateTime(publishedStory.date)}</span>
                    <span>Story image field saved: {publishedStory.imageUrl || "no"}</span>
                    <span>Featured image URL saved: {publishedStory.imageUrl || "no"}</span>
                    <span>Caption saved: {publishedStory.imageCaption || "no"}</span>
                    <span>Credit saved: {publishedStory.imageCredit || "no"}</span>
                    <span>Media ID saved: {mediaIdFromUrl(publishedStory.imageUrl) || "no"}</span>
                    <span>Image visible on public story: {publishedStory.imageUrl ? "yes" : "no"}</span>
                    {liveVisibility ? (
                      <>
                        <span>Homepage eligible: {liveVisibility.homepageEligible ? "yes" : "no"}</span>
                        <span>Actual route generated: {liveVisibility.actualRoute}</span>
                        <span>Section feed assigned: {liveVisibility.sectionFeedAssigned}</span>
                        <span>Appears in {liveVisibility.sectionLabel || "section"}: {liveVisibility.appearsInSection ? "yes" : "no"}</span>
                        <span>Appears on homepage: {liveVisibility.appearsOnHomepage ? "yes" : "no"}</span>
                      </>
                    ) : null}
                    <Link href={publicUrl} target="_blank">
                      View live story
                    </Link>
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function AdForm({
  ad,
  setAd,
  images,
  onSave,
  onDelete,
  onUploadImage,
  busy,
}: {
  ad: Advert;
  setAd: (ad: Advert) => void;
  images: Array<{ url: string; label: string }>;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  busy: boolean;
}) {
  return (
    <section className="editor-panel editor-form">
      <div className="form-head">
        <div>
          <p className="eyebrow">{ad.id ? "Edit advert" : "New advert"}</p>
          <h2>{ad.label || "Advert"}</h2>
        </div>
        <span className={ad.isActive ? "pill live" : "pill"}>{ad.isActive ? "Live" : "Paused"}</span>
      </div>

      <div className="split-fields">
        <label>
          Advert name
          <input value={ad.label} onChange={(event) => setAd({ ...ad, label: event.target.value })} />
        </label>
        <label>
          Position
          <select value={ad.placement} onChange={(event) => setAd({ ...ad, placement: event.target.value })}>
            {adPlacementOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Advert type
        <select value={ad.kind} onChange={(event) => setAd({ ...ad, kind: event.target.value })}>
          <option value="manual">Manual banner advert</option>
          <option value="sponsor">Sponsor advert</option>
          <option value="affiliate">Affiliate banner</option>
          <option value="internal">Old Sea Dogs promotion</option>
          <option value="network">Google or advert network code</option>
          <option value="adsense">Google AdSense code</option>
        </select>
      </label>

      {ad.kind !== "network" && ad.kind !== "adsense" ? (
        <>
          <label>
            Advert headline
            <input value={ad.title} onChange={(event) => setAd({ ...ad, title: event.target.value })} />
          </label>
          <label>
            Advert text
            <textarea value={ad.body} onChange={(event) => setAd({ ...ad, body: event.target.value })} />
          </label>
          <div className="split-fields">
            <label>
              Advert image
              <select value={ad.imageUrl} onChange={(event) => setAd({ ...ad, imageUrl: event.target.value })}>
                <option value="">No image</option>
                {images.map((image) => (
                  <option key={image.url} value={image.url}>{image.label}</option>
                ))}
              </select>
            </label>
            <label>
              Link
              <input value={ad.linkUrl} onChange={(event) => setAd({ ...ad, linkUrl: event.target.value })} />
            </label>
          </div>
          <label className="upload-button">
            Upload advert banner
            <input
              accept={photoUploadAccept}
              disabled={busy}
              type="file"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  void onUploadImage(file);
                  event.currentTarget.value = "";
                }
              }}
            />
          </label>
        </>
      ) : (
        <label>
          Paste the advert code from Google or another provider
          <textarea
            className="story-body-box"
            value={ad.code}
            onChange={(event) => setAd({ ...ad, code: event.target.value })}
          />
        </label>
      )}

      <div className="split-fields">
        <label>
          Start date
          <input
            type="date"
            value={ad.startDate || ""}
            onChange={(event) => setAd({ ...ad, startDate: event.target.value })}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={ad.endDate || ""}
            onChange={(event) => setAd({ ...ad, endDate: event.target.value })}
          />
        </label>
      </div>

      <label className="check-row">
        <input type="checkbox" checked={ad.isActive} onChange={(event) => setAd({ ...ad, isActive: event.target.checked })} />
        Show this advert on the site
      </label>

      <div className="form-actions">
        <button onClick={onSave} disabled={busy}>Save advert</button>
        <button className="danger-button" onClick={onDelete} disabled={busy || !ad.id}>Delete</button>
      </div>
    </section>
  );
}
