import {
  getHomepageLatestBlockers,
  HomepageContentProvider,
  isHomepageLatestStory,
} from "../../../lib/homepage-content-provider";
import { runSourceWatch } from "../../../lib/source-watch-runner";
import { getDeploymentInfo } from "../../../lib/deployment-info";
import { getInstagramConnectorStatus, syncInstagramGallery, testInstagramConnection } from "../../../lib/instagram-gallery";
import { disconnectInstagram, refreshInstagramToken } from "../../../lib/instagram-oauth";
import {
  canEditSite,
  forbiddenResponse,
  getRequestEmail,
  privateEditorHeaders,
} from "../../../lib/editor-auth";
import {
  EditorMediaUploadError,
  allowedPhotoTypes,
  editorMediaUploadAction,
  editorMediaUploadResponseBody,
  logEditorMediaUpload,
  logEditorMediaUploadError,
  makeEditorMediaUploadLogContext,
  parseAndSaveEditorMediaUpload,
  saveEditorImageAsset,
} from "../../../lib/editor-media-upload";
import {
  blockPressReleaseSender,
  deleteMediaAsset,
  deleteAd,
  deletePressReleaseEmail,
  deleteStory,
  findHomepageLeadStory,
  generatePressReleaseArticle,
  getAllGuides,
  getEditorData,
  getStoryRevisions,
  getEditorStorageStatus,
  guideMinimumWordCount,
  guideWordCount,
  importPressReleaseEmail,
  markPressReleaseEmail,
  publishPressReleaseStory,
  publishDueScheduledStories,
  saveAd,
  saveHomepageSettings,
  savePressReleaseAsDraft,
  savePressReleaseEmail,
  saveGuide,
  saveGalleryCategory,
  saveGalleryItem,
  saveSettings,
  saveExternalVideo,
  saveStory,
  saveStoryImage,
  restoreStoryRevision,
  PublicationOverrideRequiredError,
  StoryTechnicalValidationError,
  StoryScheduleValidationError,
  isHomepageLeadSelectable,
  unblockPressReleaseSender,
  unpublishPressReleaseStory,
  updateMediaAsset,
} from "../../../lib/site-content";
import { maxVideoUploadMb } from "../../../lib/editor-media-upload";
import {
  analyzeHeadlineQuality,
  getEditorialWarnings,
  oldSeaDogsViewQuality,
  validateStoryForPublication,
} from "../../../lib/editorial-quality";
import { type PressReleaseAttachment, type PressReleaseStatus } from "../../../lib/press-release-utils";
import { getMediaPublicationProhibition, validateMediaRights } from "../../../lib/media-rights";
import {
  GuideManagementError,
  duplicate as duplicateGuideDraft,
  publish as publishGuideRecord,
  saveDraft as saveGuideDraft,
  unpublish as unpublishGuideRecord,
} from "../../../lib/guide-management.ts";

type EditorData = Awaited<ReturnType<typeof getEditorData>>;
type EditorStory = EditorData["stories"][number];
type EditorPressRelease = EditorData["pressReleases"][number];
type EditorGuide = Awaited<ReturnType<typeof getAllGuides>>[number];
type EditorMedia = EditorData["media"][number];
const mediaRightsValidationPath = "server:/api/editor saveStory -> persist submitted metadata -> reload record -> advisory validateMediaRights -> publish";

function storyMediaIds(story: { imageUrl?: string; body?: string[] }) {
  return [...new Set([story.imageUrl, ...(story.body || [])]
    .flatMap((value) => [...String(value || "").matchAll(/\/api\/media\/([^|?\]#]+)/g)].map((match) => match[1])))];
}

function mediaRightsDiagnostics(item: EditorMedia, options: {
  metadataSavedBeforeValidation?: boolean;
  validationRecordMatches?: boolean;
} = {}) {
  const result = validateMediaRights(item);
  const prohibition = getMediaPublicationProhibition(item);
  return {
    mediaId: item.id,
    filename: item.filename,
    copyrightOwnership: item.copyrightOwnership,
    copyrightOwner: item.copyrightOwner,
    photographer: item.photographer,
    credit: item.credit,
    creditLine: item.creditLine,
    licence: item.licence,
    permissionNote: item.permissionNote,
    usageRestrictions: item.usageRestrictions,
    permissionReceivedAt: item.permissionReceivedAt,
    rightsEvidenceResult: result.valid ? result.evidence.join(", ") : "No valid rights evidence",
    validationSource: "server-side",
    validationPath: mediaRightsValidationPath,
    homepageWorkflowInvolved: false,
    blockingRule: prohibition || "None (advisory only)",
    metadataPersisted: true,
    metadataSavedBeforeValidation: Boolean(options.metadataSavedBeforeValidation),
    validationRecordMatches: options.validationRecordMatches !== false,
    missingField: result.missingField,
  };
}

function requestEditorRole(request: Request) {
  const roleHeader = (
    request.headers.get("oai-authenticated-user-role") ||
    request.headers.get("x-openai-authenticated-user-role") ||
    ""
  ).trim().toLowerCase();
  if (
    !roleHeader ||
    roleHeader === "editor" ||
    roleHeader === "member"
  ) {
    return "Editor";
  }

  if (
    roleHeader === "administrator" ||
    roleHeader === "admin" ||
    roleHeader === "owner"
  ) {
    return "Administrator";
  }

  return "Viewer";
}

function parseJsonList(value = "[]") {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch { return []; }
}

type HomepageDiagnosticsContext = {
  currentLeadId: string;
  currentLeadSlug: string;
  homepageIds: Set<string>;
  homepageSlugs: Set<string>;
  latestIds: Set<string>;
  latestSlugs: Set<string>;
  hiddenIds: Set<string>;
};

function editorErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error && error.message ? error.message : fallback;
  console.error("[OldSeaDogs editor API]", fallback, error);
  return privateJson({ error: message }, { status: 500 });
}

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(privateEditorHeaders())) {
    headers.set(key, value);
  }
  return Response.json(body, { ...init, headers });
}

function storyWordCount(story: Pick<EditorStory, "body">) {
  return story.body.join(" ").split(/\s+/).filter(Boolean).length;
}

function storyHasVideo(story: Pick<EditorStory, "body" | "sourceUrl">) {
  const haystack = `${story.sourceUrl || ""} ${story.body.join(" ")}`;
  return /\b(youtube|youtu\.be|vimeo|video|iframe|embed)\b/i.test(haystack);
}

function storyUpdatedStamp(story: Pick<EditorStory, "updatedAt" | "createdAt" | "date">) {
  return story.updatedAt || story.createdAt || story.date || "";
}

function isReviewQueueStory(story: Pick<EditorStory, "sourceType" | "status">) {
  return story.status === "draft" && /\b(automatic watch|source watch|scrape|scraped|generated|press release)\b/i.test(story.sourceType || "");
}

function storyMatchesHomepageLead(
  story: Pick<EditorStory, "id" | "slug">,
  context?: HomepageDiagnosticsContext
) {
  if (!context) return false;
  return Boolean(
    (context.currentLeadId && story.id === context.currentLeadId) ||
      (context.currentLeadSlug && story.slug === context.currentLeadSlug)
  );
}

function storyAppearsOnHomepage(
  story: Pick<EditorStory, "id" | "slug">,
  context?: HomepageDiagnosticsContext
) {
  if (!context) return false;
  return context.homepageIds.has(story.id) || context.homepageSlugs.has(story.slug);
}

function buildHomepageLeadDiagnostics({
  story,
  qualityLabel,
  publicationIssues,
  hasImage,
  context,
}: {
  story: EditorStory;
  qualityLabel: string;
  publicationIssues: string[];
  hasImage: boolean;
  context?: HomepageDiagnosticsContext;
}) {
  const published = story.status === "published";
  const editorialStatus = story.editorialStatus.trim() || qualityLabel;
  const editorialStatusReady = /^(ready|keep live)$/i.test(editorialStatus);
  const currentHomepageLead = storyMatchesHomepageLead(story, context);
  const appearsOnHomepage = storyAppearsOnHomepage(story, context);
  const explicitlyHidden = Boolean(context?.hiddenIds.has(story.id));
  const latestEligible = isHomepageLatestStory(story) && !explicitlyHidden;
  const latestVisible = Boolean(
    context && (context.latestIds.has(story.id) || context.latestSlugs.has(story.slug))
  );
  const homepageBlockingReasons = [
    ...getHomepageLatestBlockers(story),
    explicitlyHidden ? "Story is hidden by Homepage Manager." : "",
  ].filter(Boolean);
  const warnings = [
    story.noindex ? "Noindex is on; the story can lead the homepage, but search engines may not index it." : "",
    !hasImage ? "No image is attached; confirm the override before using it as the main lead." : "",
    qualityLabel !== "Ready" ? `Quality status is ${qualityLabel}; review before featuring.` : "",
    !editorialStatusReady ? `Editorial status is ${editorialStatus}; review before featuring.` : "",
    ...publicationIssues.slice(0, 3),
  ].filter(Boolean);
  const homepageWarnings = [
    ...warnings,
    latestEligible && !appearsOnHomepage
      ? "Eligible for the homepage latest feed, but not currently in a visible homepage slot."
      : "",
    latestEligible && appearsOnHomepage && !currentHomepageLead && !latestVisible
      ? "Appears elsewhere on the homepage rather than in Latest."
      : "",
  ].filter(Boolean);
  const blockingReasons = [
    !published ? "Story is not published." : "",
    !story.slug.trim() ? "Story has no public slug." : "",
    !story.title.trim() ? "Story has no headline." : "",
  ].filter(Boolean);

  return {
    published,
    noindex: story.noindex,
    qualityStatus: editorialStatus,
    category: story.category,
    hasImage,
    currentHomepageLead,
    appearsOnHomepage,
    latestEligible,
    latestVisible,
    homepageBlockingReasons,
    homepageWarnings,
    warnings,
    blockingReasons,
  };
}

function compactStory(story: EditorStory, context?: HomepageDiagnosticsContext) {
  const publicationIssues = validateStoryForPublication(story);
  const words = storyWordCount(story);
  const hasImage = Boolean(story.imageUrl.trim());
  const hasVideo = Boolean(story.videoUrl.trim()) || storyHasVideo(story);
  const score = Math.max(
    0,
    100 -
      publicationIssues.length * 14 -
      (words < 120 ? 16 : 0) -
      (!hasImage ? 8 : 0) -
      (story.imageUrl && !story.imageCredit ? 6 : 0)
  );
  const qualityLabel = score >= 82 ? "Ready" : score >= 62 ? "Review" : "Needs work";

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    category: story.category,
    sectionSlugs: story.sectionSlugs,
    author: story.author,
    status: story.status,
    date: story.date,
    updatedAt: story.updatedAt,
    createdAt: story.createdAt,
    publishedAt: story.publishedAt,
    scheduledPublishAt: story.scheduledPublishAt,
    imageUrl: story.imageUrl,
    imageAlt: story.imageAlt,
    imageCredit: story.imageCredit,
    imageCaption: story.imageCaption,
    videoUrl: story.videoUrl,
    videoCaption: story.videoCaption,
    videoPosition: story.videoPosition,
    summary: story.summary,
    tags: story.tags,
    readMinutes: story.readMinutes,
    isFeatured: story.isFeatured,
    sourceType: story.sourceType,
    sourceName: story.sourceName,
    sourceUrl: story.sourceUrl,
    editorialStatus: story.editorialStatus,
    statusHistory: story.statusHistory,
    noindex: story.noindex,
    homepageLeadEligible: isHomepageLeadSelectable(story),
    homepageLeadDiagnostics: buildHomepageLeadDiagnostics({
      story,
      qualityLabel,
      publicationIssues,
      hasImage,
      context,
    }),
    hasImage,
    hasVideo,
    wordCount: words,
    quality: {
      score,
      label: qualityLabel,
      issues: publicationIssues.slice(0, 3),
    },
  };
}

function addHomepageStory(
  story: EditorStory | null | undefined,
  ids: Set<string>,
  slugs: Set<string>
) {
  if (!story) return;
  if (story.id) ids.add(story.id);
  if (story.slug) slugs.add(story.slug);
}

function buildHomepageDiagnosticsContext(data: EditorData): HomepageDiagnosticsContext {
  const currentLead =
    findHomepageLeadStory(data.stories, data.settings) ??
    data.stories.find((story) => story.isFeatured && isHomepageLeadSelectable(story)) ??
    null;
  const homepageIds = new Set<string>();
  const homepageSlugs = new Set<string>();
  const latestIds = new Set<string>();
  const latestSlugs = new Set<string>();
  let hiddenIds = new Set<string>();
  try {
    const parsed = JSON.parse(data.settings.homepageHiddenStoryIds || "[]");
    hiddenIds = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    hiddenIds = new Set();
  }

  try {
    const content = new HomepageContentProvider(data.stories, data.settings).getContent();
    addHomepageStory(content.featuredStory, homepageIds, homepageSlugs);
    content.latestReviewedOrFallback.forEach((story) => {
      addHomepageStory(story, homepageIds, homepageSlugs);
      addHomepageStory(story, latestIds, latestSlugs);
    });
    content.editorPicks.forEach((story) => addHomepageStory(story, homepageIds, homepageSlugs));
    content.reviewStories.forEach((story) => addHomepageStory(story, homepageIds, homepageSlugs));
    content.practicalStories.forEach((story) => addHomepageStory(story, homepageIds, homepageSlugs));
    addHomepageStory(content.featuredPortClub?.story, homepageIds, homepageSlugs);
  } catch {
    addHomepageStory(currentLead, homepageIds, homepageSlugs);
  }

  return {
    currentLeadId: currentLead?.id ?? "",
    currentLeadSlug: currentLead?.slug ?? "",
    homepageIds,
    homepageSlugs,
    latestIds,
    latestSlugs,
    hiddenIds,
  };
}

function storyMatchesQuery(story: EditorStory, query: string) {
  if (!query) return true;
  const haystack = [
    story.title,
    story.summary,
    story.category,
    story.author,
    story.sourceName,
    story.sourceType,
    story.tags.join(" "),
  ].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function storyMatchesStatus(story: EditorStory, status: string) {
  if (!status || status === "all") return true;
  if (status === "recover") {
    return story.status === "draft" || story.status === "scheduled" || story.status === "unpublished";
  }
  return story.status === status;
}

function compactPressRelease(item: EditorPressRelease) {
  const attachmentStatus = {
    total: item.attachments.length,
    importedImages: item.attachments.filter((attachment) => String(attachment.dataUrl || "").startsWith("/api/media/")).length,
    pendingImages: item.attachments.filter((attachment) => String(attachment.dataUrl || "").startsWith("data:image/")).length,
    unsupported: item.attachments.filter((attachment) =>
      attachment.contentType.startsWith("image/") &&
      !String(attachment.dataUrl || "").startsWith("/api/media/") &&
      !String(attachment.dataUrl || "").startsWith("data:image/")
    ).length,
  };
  return {
    id: item.id,
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
    attachmentCount: item.attachments.length,
    attachmentStatus,
    attachments: item.attachments.map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
      url: String(attachment.dataUrl || "").startsWith("/api/media/") ? attachment.dataUrl : "",
      status: String(attachment.dataUrl || "").startsWith("/api/media/")
        ? "Imported"
        : String(attachment.dataUrl || "").startsWith("data:image/")
          ? "Needs Import"
          : "Unavailable",
      suggestedCredit: attachment.suggestedCredit,
      caption: attachment.caption,
      rightsNote: attachment.rightsNote,
    })),
    imageUrl: item.imageUrl,
    imageCredit: item.imageCredit,
    storyId: item.storyId,
    updatedAt: item.updatedAt,
  };
}

function compactGuide(guide: EditorGuide) {
  const words = guideWordCount(guide);
  const minimumWords = guideMinimumWordCount(guide);
  return {
    ...guide,
    wordCount: words,
    minimumWords,
    quality: words >= minimumWords ? "Ready" : `Needs ${minimumWords.toLocaleString("en-GB")} useful words`,
  };
}

function makeRecentActivity(data: EditorData) {
  return [
    ...data.stories.slice(0, 80).map((story) => ({
      id: story.id,
      kind: "Story",
      label: story.title,
      detail: `${story.status} · ${story.category}`,
      at: storyUpdatedStamp(story),
      href: `/editor/write?story=${encodeURIComponent(story.id)}`,
    })),
    ...data.pressReleases.slice(0, 40).map((item) => ({
      id: item.id,
      kind: "Email",
      label: item.subject,
      detail: `${item.status} · ${item.senderName || item.senderEmail}`,
      at: item.updatedAt || item.receivedAt,
      href: "/editor/email",
    })),
    ...data.media.slice(0, 40).map((item) => ({
      id: item.id,
      kind: "Media",
      label: item.filename,
      detail: item.contentType,
      at: item.createdAt,
      href: "/editor/media",
    })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);
}

function auditStory(story: EditorStory, stories: EditorStory[]) {
  const publicationIssues = validateStoryForPublication(story);
  const headlineReport = analyzeHeadlineQuality({
    title: story.title,
    category: story.category,
    sourceName: story.sourceName,
    sourceType: story.sourceType,
  });
  const viewQuality = oldSeaDogsViewQuality(story.oldSeaDogsView);
  const normalizedTitle = story.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const duplicate = normalizedTitle
    ? stories.find((candidate) => candidate.id !== story.id && candidate.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalizedTitle)
    : null;
  const words = storyWordCount(story);
  const flags = [
    words > 0 && words < 120 ? "Thin article" : "",
    headlineReport.isGeneric ? "Weak headline" : "",
    story.imageUrl && !story.imageCredit ? "Missing image credit" : "",
    isReviewQueueStory(story) && viewQuality.status !== "custom" ? "Missing Old Sea Dogs View" : "",
    isReviewQueueStory(story) && !story.sourceNotes.trim() && !story.sourceUrl.trim() ? "Missing sources" : "",
    duplicate ? `Duplicate title: ${duplicate.title}` : "",
    story.noindex && story.status === "published" ? "Published but noindexed" : "",
    ...publicationIssues.slice(0, 2),
  ].filter(Boolean);

  return {
    story: compactStory(story),
    flags,
    primaryFix: flags[0] || "No blocking audit flags",
  };
}

async function bridgeEditorView(request: Request) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "";
  if (!view) return null;

  const data = await getEditorData();
  const storage = await getEditorStorageStatus();
  const homepageContext = buildHomepageDiagnosticsContext(data);

  if (view === "dashboard") {
    const deployment = await getDeploymentInfo();
    const today = new Date().toISOString().slice(0, 10);
    const storiesToday = data.stories.filter((story) =>
      [story.date, story.publishedAt, story.createdAt, story.updatedAt].some((value) => value?.startsWith(today))
    ).length;
    const emailWaiting = data.pressReleases.filter((item) =>
      item.status === "new" || item.status === "reviewed" || item.status === "needsDetail"
    ).length;
    const scrapedWaiting = data.stories.filter(isReviewQueueStory).length;

    return {
      view,
      checkedAt: new Date().toISOString(),
      user: {
        email: getRequestEmail(request) || "local preview",
      },
      stats: {
        storiesToday,
        storiesPublished: data.stories.filter((story) => story.status === "published").length,
        storiesScheduled: data.stories.filter((story) => story.status === "scheduled").length,
        drafts: data.stories.filter((story) => story.status === "draft").length,
        emailsWaiting: emailWaiting,
        scrapedStoriesWaiting: scrapedWaiting,
        mediaAssets: data.media.length,
        adverts: data.ads.length,
      },
      systemHealth: {
        ok: storage.persistent,
        mode: storage.mode,
        detail: storage.detail,
        runtime: deployment.runtime,
        serverStartedAt: deployment.serverStartedAt,
        gitCommit: deployment.gitCommit,
      },
      backups: {
        mode: storage.mode,
        dataPath: storage.dataPath,
        status: storage.persistent ? "Storage is persistent. Keep normal live-data backups before deployment." : "Static runtime only.",
      },
      storage: {
        mode: storage.mode,
        dataPath: storage.dataPath,
        storyCount: data.stories.length,
        pressReleaseCount: data.pressReleases.length,
        mediaCount: data.media.length,
      },
      recentActivity: makeRecentActivity(data),
    };
  }

  if (view === "stories") {
    const query = url.searchParams.get("q")?.trim() || "";
    const status = url.searchParams.get("status") || "";
    const queue = url.searchParams.get("queue") || "";
    const workflow = url.searchParams.get("workflow")?.trim().toLowerCase() || "";
    const requestedPage = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const requestedPageSize = Number.parseInt(url.searchParams.get("pageSize") || "24", 10);
    const pageSize = Math.min(Math.max(Number.isFinite(requestedPageSize) ? requestedPageSize : 24, 10), 80);
    const filtered = data.stories
      .filter((story) => storyMatchesStatus(story, status))
      .filter((story) => queue === "scraped" ? isReviewQueueStory(story) : true)
      .filter((story) => !workflow || story.editorialStatus.trim().toLowerCase() === workflow)
      .filter((story) => storyMatchesQuery(story, query))
      .sort((a, b) => storyUpdatedStamp(b).localeCompare(storyUpdatedStamp(a)));
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), pageCount);
    const start = (page - 1) * pageSize;

    return {
      view,
      filters: { query, status, queue, workflow },
      pagination: {
        page,
        pageSize,
        pageCount,
        total: filtered.length,
      },
      stories: filtered.slice(start, start + pageSize).map((story) => compactStory(story, homepageContext)),
      media: data.media
        .slice(0, 80)
        .map((item) => ({ ...item, thumbnailUrl: `/api/media/${item.id}?variant=thumbnail` })),
    };
  }

  if (view === "story") {
    const id = url.searchParams.get("id") || "";
    const story = data.stories.find((item) => item.id === id || item.slug === id);
    return {
      view,
      story: story ?? null,
      revisions: story ? await getStoryRevisions(story.id) : [],
      media: data.media
        .slice(0, 60)
        .map((item) => ({ ...item, thumbnailUrl: `/api/media/${item.id}?variant=thumbnail` })),
    };
  }

  if (view === "audit") {
    const rows = data.stories
      .map((story) => auditStory(story, data.stories))
      .filter((row) => row.flags.length > 0)
      .sort((a, b) => b.story.updatedAt.localeCompare(a.story.updatedAt))
      .slice(0, 120);

    return {
      view,
      summary: {
        flaggedStories: rows.length,
        thinStories: rows.filter((row) => row.flags.includes("Thin article")).length,
        missingCredits: rows.filter((row) => row.flags.includes("Missing image credit")).length,
        weakHeadlines: rows.filter((row) => row.flags.includes("Weak headline")).length,
      },
      rows,
    };
  }

  if (view === "guides") {
    const guides = await getAllGuides();
    return {
      view,
      guides: guides.map(compactGuide),
      summary: {
        total: guides.length,
        published: guides.filter((guide) => guide.status === "published").length,
        homepage: guides.filter((guide) => guide.status === "published" && guide.showOnHomepage).length,
        indexed: guides.filter((guide) => guide.status === "published" && !guide.noindex).length,
        thin: guides.filter((guide) => guideWordCount(guide) < guideMinimumWordCount(guide)).length,
      },
    };
  }

  if (view === "press") {
    return {
      view,
      emailIngestion: data.emailIngestion,
      blockedSenderCount: data.blockedSenders.length,
      media: data.media
        .slice(0, 80)
        .map((item) => ({ ...item, thumbnailUrl: `/api/media/${item.id}?variant=thumbnail` })),
      items: data.pressReleases.slice(0, 80).map(compactPressRelease),
    };
  }

  if (view === "pressRaw") {
    const id = url.searchParams.get("id") || "";
    const item = data.pressReleases.find((pressRelease) => pressRelease.id === id);
    if (!item) return { view, error: "Imported email not found." };
    return { view, id: item.id, subject: item.subject, rawEmail: item.rawEmail || item.bodyText };
  }

  if (view === "media") {
    const query = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const filter = url.searchParams.get("filter") || "all";
    const requestedPage = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(60, Math.max(12, Number.parseInt(url.searchParams.get("pageSize") || "36", 10) || 36));
    const storyMediaIds = new Set(data.stories.flatMap((story) => story.body.map((block) => block.match(/\/api\/media\/([^|?\]]+)/)?.[1]).filter(Boolean)));
    const featuredMediaIds = new Set(data.stories.map((story) => story.imageUrl.match(/\/api\/media\/([^/?#]+)/)?.[1]).filter(Boolean));
    const filteredMedia = data.media.filter((item) => {
      const matchesQuery = !query || `${item.filename} ${item.displayName} ${item.internalTitle} ${item.alt} ${item.caption} ${item.credit} ${item.location} ${item.collectionsJson}`.toLowerCase().includes(query);
      const inStory = storyMediaIds.has(item.id);
      const featured = featuredMediaIds.has(item.id);
      const inGallery = Boolean(item.galleryItemId);
      const matchesFilter = filter === "all" ||
        (filter === "recent" && Date.now() - new Date(item.createdAt).getTime() < 30 * 86400000) ||
        (filter === "featured" && featured) ||
        (filter === "unused" && !inStory && !featured && !inGallery) ||
        (filter === "story" && (inStory || featured)) ||
        (filter === "gallery" && inGallery) ||
        (filter === "instagram" && item.sourceType === "instagram") ||
        (filter === "videos" && (item.contentType.startsWith("video/") || Boolean(item.externalUrl))) ||
        (filter.startsWith("ownership:") && item.copyrightOwnership === filter.slice("ownership:".length)) ||
        (filter.startsWith("collection:") && parseJsonList(item.collectionsJson).includes(filter.slice("collection:".length)));
      return matchesQuery && matchesFilter;
    });
    const pageCount = Math.max(1, Math.ceil(filteredMedia.length / pageSize));
    const page = Math.min(requestedPage, pageCount);
    const pageMedia = filteredMedia.slice((page - 1) * pageSize, page * pageSize);
    return {
      view,
      filters: { query, filter },
      media: pageMedia.map((item) => ({
        ...item,
        thumbnailUrl: `/api/media/${item.id}?variant=thumbnail`,
      })),
      stories: data.stories.map((story) => ({ id: story.id, title: story.title, status: story.status })),
      collections: [...new Set([...parseJsonList(data.settings.mediaCollectionsJson), ...data.media.flatMap((item) => parseJsonList(item.collectionsJson))])].sort(),
      pagination: { page, pageSize, pageCount, total: filteredMedia.length },
    };
  }

  if (view === "gallery") {
    const connector = await getInstagramConnectorStatus();
    const lastSyncAt = data.instagramImports.map((item) => item.updatedAt || item.importedAt).sort().at(-1) || "";
    return {
      view,
      name: "Through the Lens",
      connector: {
        ...connector,
        lastSyncAt: connector.lastSuccessfulSync || lastSyncAt,
        nextSyncAt: (connector.lastSuccessfulSync || lastSyncAt) ? new Date(new Date(connector.lastSuccessfulSync || lastSyncAt).getTime() + connector.intervalMinutes * 60000).toISOString() : "",
        importedCount: data.instagramImports.length,
        failedCount: data.instagramImports.filter((item) => item.status === "failed").length,
        skippedCount: 0,
        pendingCount: data.galleryItems.filter((item) => item.status === "pending").length,
      },
      categories: data.galleryCategories,
      items: data.galleryItems.map((item) => ({
        ...item,
        media: data.media.find((asset) => asset.id === item.mediaId) || null,
        thumbnailUrl: `/api/media/${item.mediaId}?variant=thumbnail`,
      })),
      stories: data.stories.map((story) => ({ id: story.id, title: story.title, status: story.status })),
      publicRollout: false,
    };
  }

  if (view === "video") {
    return {
      view,
      stories: data.stories.filter(storyHasVideo).slice(0, 40).map((story) => compactStory(story, homepageContext)),
      media: data.media.filter((item) => item.contentType.startsWith("video/") || Boolean(item.externalUrl)),
      posterImages: data.media.filter((item) => item.contentType.startsWith("image/")).slice(0, 100).map((item) => ({ ...item, thumbnailUrl: `/api/media/${item.id}?variant=thumbnail` })),
      storyOptions: data.stories.map((story) => ({ id: story.id, title: story.title })),
      galleryOptions: data.galleryItems.map((item) => ({ id: item.id, title: item.title || item.caption || item.id })),
      collections: [...new Set([...parseJsonList(data.settings.mediaCollectionsJson), ...data.media.flatMap((item) => parseJsonList(item.collectionsJson))])].sort(),
      maxVideoUploadMb,
      placements: ["Homepage", "Articles", "Reviews", "Race reports", "Boat tests", "Interviews", "Marinas", "Social"],
    };
  }

  if (view === "homepageLead") {
    const query = url.searchParams.get("q")?.trim() || "";
    const selectableStories = data.stories
      .filter(isHomepageLeadSelectable)
      .filter((story) => storyMatchesQuery(story, query))
      .sort((a, b) => storyUpdatedStamp(b).localeCompare(storyUpdatedStamp(a)));
    const currentLead =
      findHomepageLeadStory(data.stories, data.settings) ??
      data.stories.find((story) => story.isFeatured && isHomepageLeadSelectable(story)) ??
      null;

    return {
      view,
      settings: data.settings,
      current: currentLead ? compactStory(currentLead, homepageContext) : null,
      candidates: selectableStories.slice(0, 80).map((story) => compactStory(story, homepageContext)),
      totalCandidates: selectableStories.length,
    };
  }

  if (view === "settings") {
    return {
      view,
      settings: data.settings,
      ads: data.ads,
      sourceWatch: data.sourceWatch,
      blockedSenders: data.blockedSenders,
      socialAnalytics: data.socialAnalytics,
      media: data.media.filter((item) => item.contentType.startsWith("image/")).slice(0, 80).map((item) => ({ ...item, thumbnailUrl: `/api/media/${item.id}?variant=thumbnail` })),
    };
  }

  if (view === "analytics") {
    const runtimeEnv = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env || {};
    const measurementId = (runtimeEnv.OLDSEADOGS_GA4_ID || runtimeEnv.NEXT_PUBLIC_GA4_ID || "").trim();
    const missingCredentials = [
      ["OLDSEADOGS_GA4_PROPERTY_ID", runtimeEnv.OLDSEADOGS_GA4_PROPERTY_ID],
      ["OLDSEADOGS_GA4_CLIENT_EMAIL", runtimeEnv.OLDSEADOGS_GA4_CLIENT_EMAIL],
      ["OLDSEADOGS_GA4_PRIVATE_KEY", runtimeEnv.OLDSEADOGS_GA4_PRIVATE_KEY],
    ].filter(([, value]) => !value?.trim()).map(([key]) => key);
    return {
      view,
      measurementIdConfigured: Boolean(measurementId),
      measurementIdValid: /^G-[A-Z0-9]{4,20}$/i.test(measurementId),
      dataApiConfigured: missingCredentials.length === 0,
      missingCredentials,
      metrics: null,
    };
  }

  if (view === "health") {
    const deployment = await getDeploymentInfo();
    return {
      view,
      ok: storage.persistent,
      storage,
      deployment,
      emailIngestion: data.emailIngestion,
      counts: {
        stories: data.stories.length,
        media: data.media.length,
        ads: data.ads.length,
        pressReleases: data.pressReleases.length,
        blockedSenders: data.blockedSenders.length,
      },
    };
  }

  return {
    view,
    error: "Unknown editor view.",
  };
}

function dataUrlToImageBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  if (!allowedPhotoTypes.has(contentType)) return null;
  const base64 = match[2].replace(/\s+/g, "");
  const buffer = Buffer.from(base64, "base64");
  return {
    bytes: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    contentType,
    size: buffer.byteLength,
  };
}

async function importPressReleaseAttachmentImages(
  pressRelease: SavedPressRelease,
  request: Request
) {
  let changed = false;
  let firstStoredAttachmentId = pressRelease.selectedAttachmentId || "";
  const attachments: PressReleaseAttachment[] = [];
  const uploadLogContext = makeEditorMediaUploadLogContext("/api/editor importPressReleaseAttachmentImages");

  for (const attachment of pressRelease.attachments) {
    if (!String(attachment.dataUrl || "").startsWith("data:image/")) {
      attachments.push(attachment);
      if (!firstStoredAttachmentId && String(attachment.dataUrl || "").startsWith("/api/media/")) {
        firstStoredAttachmentId = attachment.id;
      }
      continue;
    }

    const decoded = dataUrlToImageBytes(attachment.dataUrl);
    if (!decoded) {
      attachments.push({
        ...attachment,
        rightsNote: [attachment.rightsNote, "Image attachment was not imported because the file type is not supported by the media store."]
          .filter(Boolean)
          .join(" "),
      });
      continue;
    }

    const media = await saveEditorImageAsset({
      request,
      bytes: decoded.bytes,
      contentType: decoded.contentType,
      fileName: attachment.filename || "press-release-photo.jpg",
      size: decoded.size,
      alt: attachment.caption || pressRelease.subject || "Old Sea Dogs imported image",
      logContext: uploadLogContext,
    });
    changed = true;
    const storedAttachment = {
      ...attachment,
      contentType: media.contentType,
      size: media.size,
      dataUrl: media.url,
      rightsNote: attachment.rightsNote || "Imported into Old Sea Dogs media storage.",
    };
    attachments.push(storedAttachment);
    if (!firstStoredAttachmentId) firstStoredAttachmentId = storedAttachment.id;
  }

  if (!changed) return pressRelease;

  const selectedAttachment = attachments.find((attachment) => attachment.id === firstStoredAttachmentId);
  return savePressReleaseEmail({
    id: pressRelease.id,
    attachments,
    selectedAttachmentId: firstStoredAttachmentId,
    imageUrl: pressRelease.imageUrl || selectedAttachment?.dataUrl || "",
    imageAlt: pressRelease.imageAlt || selectedAttachment?.caption || selectedAttachment?.filename || pressRelease.subject,
    imageCredit: pressRelease.imageCredit || selectedAttachment?.suggestedCredit || "",
    imageCaption: pressRelease.imageCaption || selectedAttachment?.caption || "",
    rightsNote: pressRelease.rightsNote || selectedAttachment?.rightsNote || "",
  });
}

async function createPreBulkDeleteBackup(label: string) {
  const runtimeProcess = (globalThis as typeof globalThis & {
    process?: {
      cwd?: () => string;
      execPath?: string;
      versions?: { node?: string };
    };
  }).process;
  if (!runtimeProcess?.versions?.node || !runtimeProcess.cwd) {
    throw new Error("Bulk delete requires the live Node editor runtime so a server backup can be created first.");
  }
  const childProcess = await import(/* @vite-ignore */ "node:child_process") as typeof import("node:child_process");

  return new Promise<{ backupPath: string; backupId: string }>((resolve, reject) => {
    const child = childProcess.spawn(runtimeProcess.execPath || "node", [
      "scripts/oldseadogs-ops.mjs",
      "backup:create",
      "--json",
      "--label",
      label,
    ], {
      cwd: runtimeProcess.cwd?.(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Backup before bulk delete failed. ${stderr || stdout}`.trim()));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve({
          backupPath: String(parsed.backupPath || ""),
          backupId: String(parsed.backupId || ""),
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

type SavedPressRelease = Awaited<ReturnType<typeof savePressReleaseEmail>>;
type CompactPressReleaseSaveResponse = Omit<
  SavedPressRelease & {
    attachmentsJson?: unknown;
    warningsJson?: unknown;
    generatedBodyJson?: unknown;
  },
  "rawEmail" | "attachments"
> & {
  rawEmail: string;
  attachments?: SavedPressRelease["attachments"];
};

function compactPressReleaseSaveResponse(pressRelease: SavedPressRelease) {
  const attachments = pressRelease.attachments;
  const storedAttachments = attachments.filter((attachment) =>
    String(attachment.dataUrl || "").startsWith("/api/media/")
  );
  const response: CompactPressReleaseSaveResponse = {
    ...pressRelease,
    rawEmail: "",
    attachments: storedAttachments.length > 0 ? storedAttachments : undefined,
  };
  response.attachmentsJson = undefined;
  response.warningsJson = undefined;
  response.generatedBodyJson = undefined;
  return response;
}

export async function GET(request: Request) {
  if (!await canEditSite(request)) return forbiddenResponse();

  try {
    const bridgeView = await bridgeEditorView(request);
    if (bridgeView) {
      const status = "error" in bridgeView ? 400 : 200;
      return privateJson(bridgeView, { status });
    }

    const data = await getEditorData();
    return privateJson({
      ...data,
      deployment: await getDeploymentInfo(),
      user: {
        email: getRequestEmail(request) || "local preview",
      },
    });
  } catch (error) {
    return editorErrorResponse(error, "The editor could not load its data.");
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const contentLength = request.headers.get("content-length") || "";
  const uploadLogContext = contentType.includes("multipart/form-data")
    ? makeEditorMediaUploadLogContext("/api/editor")
    : null;

  if (uploadLogContext) {
    logEditorMediaUpload(uploadLogContext, "request received", {
      contentType,
      contentLength,
    });
  }

  const authenticated = await canEditSite(request);
  if (uploadLogContext) {
    logEditorMediaUpload(uploadLogContext, "auth result", { authenticated });
  }
  if (!authenticated) {
    if (uploadLogContext) {
      logEditorMediaUpload(uploadLogContext, "response sent", { status: 403 });
    }
    return forbiddenResponse();
  }

  try {
    if (contentType.includes("multipart/form-data")) {
      return await uploadPhoto(request, uploadLogContext ?? makeEditorMediaUploadLogContext("/api/editor"));
    }

    let payload: {
      action?: string;
      story?: Parameters<typeof saveStory>[0];
      guide?: Parameters<typeof saveGuide>[0];
      expectedUpdatedAt?: string;
      settings?: Parameters<typeof saveSettings>[0];
      homepage?: Parameters<typeof saveHomepageSettings>[0];
      galleryCategory?: Parameters<typeof saveGalleryCategory>[0];
      galleryItem?: Parameters<typeof saveGalleryItem>[0];
      media?: Parameters<typeof updateMediaAsset>[1];
      mediaRightsUpdates?: Array<{ id: string; media: Parameters<typeof updateMediaAsset>[1] }>;
      ad?: Parameters<typeof saveAd>[0];
      pressRelease?: Parameters<typeof savePressReleaseEmail>[0] | Parameters<typeof importPressReleaseEmail>[0];
      pressReleaseStatus?: PressReleaseStatus;
      block?: Parameters<typeof blockPressReleaseSender>[0];
      blockId?: string;
      id?: string;
      revisionId?: string;
      ids?: string[];
      deleteMode?: "queueOnly" | "unpublishStory";
      imageUrl?: string;
      imageAlt?: string;
      imageCredit?: string;
      imageCaption?: string;
      bodyBlock?: string;
      bodyPlacement?: "top" | "bottom";
      confirm?: boolean;
      allowMissingImage?: boolean;
      backupBeforeDelete?: boolean;
      sourceWatchOptions?: {
        maxSources?: number;
        maxDraftsPerSource?: number;
        previewOnly?: boolean;
      };
      workflowStatus?: string;
      status?: "draft" | "scheduled" | "published" | "unpublished";
      collection?: string;
      replacementCollection?: string;
      homepageSource?: string;
    };
    try {
      payload = (await request.json()) as typeof payload;
    } catch (error) {
      console.error("[OldSeaDogs editor API] Could not parse editor JSON request", {
        contentLength,
        contentType,
        error,
      });
      return privateJson(
        {
          error: `The editor save request could not be read by the server${contentLength ? ` (${contentLength} bytes)` : ""}. If this came from Newsroom, the request may still contain raw email or image attachment data.`,
        },
        { status: 400 }
      );
    }

    if (payload.action === "checkSources") {
      return privateJson({ result: await runSourceWatch(payload.sourceWatchOptions) });
    }

    if (payload.action === "publishScheduledStories") {
      return privateJson({ ok: true, result: await publishDueScheduledStories() });
    }

    if (payload.action === "saveStory") {
      try {
        const editorDataAtSave = await getEditorData();
        const existingStory = payload.story?.id
          ? editorDataAtSave.stories.find((story) => story.id === payload.story?.id)
          : null;
        if (payload.story && Object.prototype.hasOwnProperty.call(payload.story, "isFeatured")) {
          const requestedFeatured = Boolean(payload.story.isFeatured);
          const storedFeatured = Boolean(existingStory?.isFeatured);
          if (requestedFeatured !== storedFeatured) {
            return privateJson({
              error: "Story Editor cannot change Homepage Lead or featured-story settings. Use Homepage Manager and press Save Homepage.",
            }, { status: 400 });
          }
        }
        if (payload.story?.status === "published" || payload.story?.status === "scheduled") {
          const editingExistingPublicState = existingStory?.status === payload.story.status;
          const technicalIssues = validateStoryForPublication(payload.story);
          if (technicalIssues.length > 0) {
            return privateJson({
              ok: false,
              error: technicalIssues.join(" "),
              validationErrors: technicalIssues,
            }, { status: 400 });
          }
          const mediaIds = storyMediaIds(payload.story);
          const existingMediaIds = new Set(existingStory ? storyMediaIds(existingStory) : []);
          const validationMediaIds = editingExistingPublicState
            ? mediaIds.filter((mediaId) => !existingMediaIds.has(mediaId))
            : mediaIds;
          const beforeSave = await getEditorData();
          const persisted = new Map<string, EditorMedia>();
          const mediaPersistenceWarnings: string[] = [];
          for (const update of payload.mediaRightsUpdates || []) {
            if (!mediaIds.includes(update.id)) continue;
            const current = beforeSave.media.find((item) => item.id === update.id);
            try {
              persisted.set(update.id, await updateMediaAsset(update.id, update.media || {}));
            } catch {
              mediaPersistenceWarnings.push(`Image rights details could not be saved for ${current?.filename || update.id}; publication continued.`);
            }
          }
          const editorData = await getEditorData();
          const referencedMedia = editorData.media.filter((item) => validationMediaIds.includes(item.id));
          const diagnostics = referencedMedia.map((item) => mediaRightsDiagnostics(item, {
            metadataSavedBeforeValidation: persisted.has(item.id),
            validationRecordMatches: !persisted.has(item.id) || JSON.stringify(persisted.get(item.id)) === JSON.stringify(item),
          }));
          for (const diagnostic of diagnostics) {
            console.info("[OldSeaDogs media rights validation]", {
              validationPath: diagnostic.validationPath,
              filename: diagnostic.filename,
              mediaId: diagnostic.mediaId,
              storedOwnership: diagnostic.copyrightOwnership,
              rightsEvidence: diagnostic.rightsEvidenceResult,
              blockingRule: diagnostic.blockingRule,
              metadataSavedBeforeValidation: diagnostic.metadataSavedBeforeValidation,
              validationRecordMatches: diagnostic.validationRecordMatches,
              homepageWorkflowInvolved: false,
            });
          }
          const incomplete = referencedMedia.filter((item) => !validateMediaRights(item).valid);
          const prohibited = referencedMedia
            .map((item) => ({ item, reason: getMediaPublicationProhibition(item) }))
            .filter((entry) => entry.reason);
          if (prohibited.length > 0) {
            const validationErrors = prohibited.map(({ item, reason }) => `${item.filename}: ${reason}`);
            return privateJson({ ok: false, error: validationErrors.join(" "), validationErrors }, { status: 400 });
          }
          const copyrightWarnings = incomplete.map((item) => ({
            message: "Image rights information is incomplete. Confirm your right to publish before continuing.",
            mediaId: item.id,
            filename: item.filename,
            missingField: validateMediaRights(item).missingField,
          }));
          const editorIdentity = getRequestEmail(request) || "Bridge editor";
          const editorialWarnings = editingExistingPublicState ? [] : getEditorialWarnings(payload.story);
          const publicationOverride = payload.story.publicationOverride;
          const needsRightsConfirmation = incomplete.length > 0 && !(
            publicationOverride?.confirm && publicationOverride.confirmImageRights
          );
          const needsEditorialConfirmation = editorialWarnings.length > 0 && !(
            publicationOverride?.confirm && publicationOverride.confirmEditorialWarnings
          );
          if (needsRightsConfirmation || needsEditorialConfirmation) {
            return privateJson({
              ok: false,
              error: "Review the publication warnings and choose Publish Anyway to continue.",
              requiresPublicationOverride: true,
              copyrightWarnings,
              editorialWarnings,
              rightsDiagnostics: diagnostics,
              mediaPersistenceWarnings,
            }, { status: 409 });
          }
          const editorRole = requestEditorRole(request);
          if (publicationOverride?.confirm && editorRole !== "Editor" && editorRole !== "Administrator") {
            return privateJson({ error: "Only Editors and Administrators may override publication warnings." }, { status: 403 });
          }
          return privateJson({
            ok: true,
            story: await saveStory({
              ...(payload.story ?? {}),
              publicationOverride,
              rightsWarningMediaIds: incomplete.map((item) => item.id),
              rightsWarningEditorIdentity: editorIdentity,
              editorialWarningEditorIdentity: editorIdentity,
              statusChangedBy: editorIdentity,
            }),
            copyrightWarnings,
            editorialWarnings,
            rightsDiagnostics: diagnostics,
            mediaPersistenceWarnings,
          });
        }
        return privateJson({
          ok: true,
          story: await saveStory({
            ...(payload.story ?? {}),
            statusChangedBy: getRequestEmail(request) || "Bridge editor",
          }),
        });
      } catch (error) {
        if (error instanceof StoryTechnicalValidationError) {
          return privateJson({ ok: false, error: error.message, validationErrors: error.issues }, { status: 400 });
        }
        if (error instanceof StoryScheduleValidationError) {
          return privateJson({ ok: false, error: error.message, validationErrors: [error.message] }, { status: 400 });
        }
        throw error;
      }
    }

    if (payload.action === "restoreStoryRevision" && payload.id && payload.revisionId) {
      return privateJson({
        ok: true,
        story: await restoreStoryRevision(
          payload.id,
          payload.revisionId,
          getRequestEmail(request) || "Bridge editor"
        ),
      });
    }

    if (payload.action === "saveGuide") {
      return privateJson({ guide: await saveGuide(payload.guide ?? {}) });
    }

    if (payload.action === "saveGuideDraft") {
      return privateJson({
        ok: true,
        guide: await saveGuideDraft(
          payload.guide ?? {},
          getRequestEmail(request) || "Bridge editor",
          payload.expectedUpdatedAt,
        ),
      });
    }

    if (payload.action === "duplicateGuide" && payload.id) {
      return privateJson({
        ok: true,
        guide: await duplicateGuideDraft(
          payload.id,
          payload.guide ?? {},
          getRequestEmail(request) || "Bridge editor",
        ),
      });
    }

    if (payload.action === "publishGuide" && payload.id) {
      return privateJson({
        ok: true,
        guide: await publishGuideRecord(
          payload.id,
          getRequestEmail(request) || "Bridge editor",
          payload.expectedUpdatedAt,
        ),
      });
    }

    if (payload.action === "unpublishGuide" && payload.id) {
      return privateJson({
        ok: true,
        guide: await unpublishGuideRecord(
          payload.id,
          getRequestEmail(request) || "Bridge editor",
          payload.expectedUpdatedAt,
        ),
      });
    }

    if (payload.action === "saveStoryImage" && payload.id && payload.imageUrl) {
      return privateJson({
        story: await saveStoryImage(
          payload.id,
          payload.imageUrl,
          payload.imageAlt ?? "",
          payload.imageCredit ?? "",
          payload.imageCaption ?? ""
        ),
      });
    }

    if (payload.action === "clearStoryImage" && payload.id) {
      return privateJson({
        story: await saveStoryImage(payload.id, "", "", "", ""),
      });
    }

    if (payload.action === "appendStoryBodyBlock" && payload.id && payload.bodyBlock) {
      const editorData = await getEditorData();
      const story = editorData.stories.find((candidate) => candidate.id === payload.id);
      if (!story) return privateJson({ error: "I could not find that story." }, { status: 404 });
      const bodyBlock = payload.bodyBlock.trim();
      if (!/^\[(?:video:https?:\/\/|image:\/api\/media\/)/.test(bodyBlock)) {
        return privateJson({ error: "Only trusted media blocks can be added here." }, { status: 400 });
      }
      const body = payload.bodyPlacement === "top"
        ? [bodyBlock, ...story.body]
        : [...story.body, bodyBlock];
      return privateJson({
        story: await saveStory({ ...story, body }),
      });
    }

    if (payload.action === "changeStoryWorkflow" && payload.id && payload.workflowStatus) {
      const allowed = new Set([
        "Imported", "Needs Review", "Needs Rewrite", "Draft", "Ready", "Scheduled",
        "Published", "Updated", "Unpublished", "Archived", "Rejected", "Recoverable",
      ]);
      const workflowStatus = payload.workflowStatus.trim();
      if (!allowed.has(workflowStatus)) {
        return privateJson({ error: "Choose a recognised newsroom workflow status." }, { status: 400 });
      }
      const editorData = await getEditorData();
      const story = editorData.stories.find((candidate) => candidate.id === payload.id);
      if (!story) return privateJson({ error: "I could not find that story." }, { status: 404 });
      if (workflowStatus === "Published" && story.status !== "published") {
        return privateJson({ error: "Use Publish Now after editorial review; workflow changes cannot publish a story." }, { status: 400 });
      }
      const nextStatus = workflowStatus === "Unpublished" || workflowStatus === "Archived" || workflowStatus === "Rejected"
        ? "unpublished"
        : workflowStatus === "Recoverable"
          ? "draft"
          : story.status;
      return privateJson({
        story: await saveStory({
          ...story,
          status: nextStatus,
          editorialStatus: workflowStatus,
          statusChangedBy: getRequestEmail(request) || "Bridge editor",
        }),
      });
    }

    if (payload.action === "setStoryStatus" && payload.id && payload.status) {
      if (!payload.confirm) {
        return privateJson({ error: "Confirm this story status change before continuing." }, { status: 400 });
      }
      const editorData = await getEditorData();
      const story = editorData.stories.find((candidate) => candidate.id === payload.id);
      if (!story) return privateJson({ error: "I could not find that story." }, { status: 404 });
      if (payload.status === "published") {
        return privateJson({
          error: "Open this story in the Story Editor to review warnings and publish.",
          requiresPublicationOverride: true,
          editorialWarnings: getEditorialWarnings({ ...story, status: "published" }),
        }, { status: 409 });
      }
      const next = { ...story, status: "draft" as const, scheduledPublishAt: "", editorialStatus: "Draft" };
      return privateJson({
        story: await saveStory({
          ...next,
          statusChangedBy: getRequestEmail(request) || "Bridge editor",
        }),
      });
    }

    if (payload.action === "deleteStory" && payload.id) {
      return privateJson({ error: "Direct deletion is disabled. Confirm deletion through the backed-up delete workflow." }, { status: 400 });
    }

    if (payload.action === "deleteStories" && Array.isArray(payload.ids)) {
      const ids = [...new Set(payload.ids.map(String).filter(Boolean))];
      if (ids.length === 0) return privateJson({ ok: true, deleted: 0 });
      if (!payload.confirm) {
        return privateJson({ error: "Confirm the bulk delete before continuing." }, { status: 400 });
      }
      if (!payload.backupBeforeDelete) {
        return privateJson({ error: "Deletion requires a verified backup first." }, { status: 400 });
      }
      const backup = await createPreBulkDeleteBackup(`pre-bulk-delete-${new Date().toISOString().slice(0, 10)}`);
      for (const id of ids) {
        await deleteStory(id);
      }
      return privateJson({ ok: true, deleted: ids.length, backup });
    }

    if (payload.action === "saveSettings") {
      const homepageKeys = new Set([
        "homepageLeadStoryId",
        "homepageLeadStorySlug",
        "homepageLatestStoryIds",
        "homepageEditorsChoiceStoryIds",
        "homepageHiddenStoryIds",
      ]);
      if (Object.keys(payload.settings || {}).some((key) => homepageKeys.has(key))) {
        return privateJson({
          error: "Homepage settings can only be changed in Homepage Manager by pressing Save Homepage.",
        }, { status: 400 });
      }
      return privateJson({ settings: await saveSettings(payload.settings ?? {}) });
    }

    if (payload.action === "saveHomepage" && payload.homepage) {
      if (payload.homepageSource !== "homepage-manager-save") {
        return privateJson({
          error: "Homepage changes are accepted only from Homepage Manager when Save Homepage is pressed.",
        }, { status: 403 });
      }
      return privateJson(await saveHomepageSettings(payload.homepage));
    }

    if (payload.action === "updateMedia" && payload.id) {
      return privateJson({ media: await updateMediaAsset(payload.id, payload.media || {}) });
    }

    if (payload.action === "saveExternalVideo" && payload.media?.externalUrl) {
      return privateJson({ media: await saveExternalVideo({ ...payload.media, externalUrl: payload.media.externalUrl }) });
    }

    if (payload.action === "bulkAddMediaCollection" && Array.isArray(payload.ids) && payload.collection?.trim()) {
      const editorData = await getEditorData();
      const collection = payload.collection.trim();
      for (const id of [...new Set(payload.ids)]) {
        const item = editorData.media.find((asset) => asset.id === id);
        if (!item) continue;
        await updateMediaAsset(id, { collectionsJson: JSON.stringify([...new Set([...parseJsonList(item.collectionsJson), collection])]) });
      }
      await saveSettings({ mediaCollectionsJson: JSON.stringify([...new Set([...parseJsonList(editorData.settings.mediaCollectionsJson), collection])]) });
      return privateJson({ ok: true, collection });
    }

    if (payload.action === "bulkRemoveMediaCollection" && Array.isArray(payload.ids) && payload.collection?.trim()) {
      const editorData = await getEditorData();
      const collection = payload.collection.trim();
      for (const id of [...new Set(payload.ids)]) {
        const item = editorData.media.find((asset) => asset.id === id);
        if (!item) continue;
        await updateMediaAsset(id, { collectionsJson: JSON.stringify(parseJsonList(item.collectionsJson).filter((name) => name !== collection)) });
      }
      return privateJson({ ok: true, collection });
    }

    if (payload.action === "createMediaCollection" && payload.collection?.trim()) {
      const editorData = await getEditorData();
      const collections = [...new Set([...parseJsonList(editorData.settings.mediaCollectionsJson), payload.collection.trim()])];
      return privateJson({ settings: await saveSettings({ mediaCollectionsJson: JSON.stringify(collections) }) });
    }

    if (payload.action === "deleteMediaCollection" && payload.collection?.trim()) {
      const editorData = await getEditorData();
      if (editorData.media.some((item) => parseJsonList(item.collectionsJson).includes(payload.collection!))) return privateJson({ error: "Only an empty collection can be deleted." }, { status: 409 });
      return privateJson({ settings: await saveSettings({ mediaCollectionsJson: JSON.stringify(parseJsonList(editorData.settings.mediaCollectionsJson).filter((name) => name !== payload.collection)) }) });
    }

    if (payload.action === "renameMediaCollection" && payload.collection?.trim() && payload.replacementCollection?.trim()) {
      const editorData = await getEditorData();
      for (const item of editorData.media) {
        const collections = parseJsonList(item.collectionsJson);
        if (!collections.includes(payload.collection)) continue;
        await updateMediaAsset(item.id, { collectionsJson: JSON.stringify([...new Set(collections.map((name) => name === payload.collection ? payload.replacementCollection!.trim() : name))]) });
      }
      await saveSettings({ mediaCollectionsJson: JSON.stringify([...new Set(parseJsonList(editorData.settings.mediaCollectionsJson).map((name) => name === payload.collection ? payload.replacementCollection!.trim() : name))]) });
      return privateJson({ ok: true });
    }

    if (payload.action === "deleteMedia" && payload.id) {
      return privateJson(await deleteMediaAsset(payload.id));
    }

    if (payload.action === "saveGalleryCategory") {
      return privateJson({ category: await saveGalleryCategory(payload.galleryCategory || {}) });
    }

    if (payload.action === "saveGalleryItem") {
      return privateJson({ item: await saveGalleryItem(payload.galleryItem || {}) });
    }

    if (payload.action === "syncInstagram") {
      return privateJson({ result: await syncInstagramGallery(request) });
    }
    if (payload.action === "testInstagram") return privateJson({ result: await testInstagramConnection() });
    if (payload.action === "refreshInstagramToken") return privateJson({ result: await refreshInstagramToken() });
    if (payload.action === "disconnectInstagram") return privateJson({ result: await disconnectInstagram() });

    if (payload.action === "saveHomepageLead" || payload.action === "clearHomepageLead") {
      return privateJson({
        error: "Homepage changes must be made in Homepage Manager and committed with Save Homepage.",
      }, { status: 400 });
    }

    if (payload.action === "saveAd") {
      return privateJson({ ad: await saveAd(payload.ad ?? {}) });
    }

    if (payload.action === "deleteAd" && payload.id) {
      await deleteAd(payload.id);
      return privateJson({ ok: true });
    }

    if (payload.action === "importPressReleaseEmail") {
      const imported = await importPressReleaseEmail(payload.pressRelease ?? {});
      const withStoredAttachments = await importPressReleaseAttachmentImages(imported, request);
      return privateJson({
        pressRelease: compactPressReleaseSaveResponse(withStoredAttachments),
      });
    }

    if (payload.action === "savePressRelease" && payload.pressRelease && "id" in payload.pressRelease) {
      console.info("[OldSeaDogs editor API] savePressRelease received", {
        id: payload.pressRelease.id,
        contentLength,
        hasRawEmail: "rawEmail" in payload.pressRelease,
        attachmentCount: Array.isArray(payload.pressRelease.attachments)
          ? payload.pressRelease.attachments.length
          : "preserve-existing",
        dataAttachmentCount: Array.isArray(payload.pressRelease.attachments)
          ? payload.pressRelease.attachments.filter((attachment) => String(attachment.dataUrl || "").startsWith("data:")).length
          : 0,
        imageUrl: payload.pressRelease.imageUrl || "",
        generatedBodyCount: Array.isArray(payload.pressRelease.generatedBody)
          ? payload.pressRelease.generatedBody.length
          : "preserve-existing",
      });
      try {
        const pressRelease = await savePressReleaseEmail(payload.pressRelease);
        console.info("[OldSeaDogs editor API] savePressRelease saved", {
          id: pressRelease.id,
          status: pressRelease.status,
          imageUrl: pressRelease.imageUrl,
          generatedBodyCount: pressRelease.generatedBody.length,
          attachmentCount: pressRelease.attachments.length,
        });
        return privateJson({ pressRelease: compactPressReleaseSaveResponse(pressRelease) });
      } catch (error) {
        console.error("[OldSeaDogs editor API] savePressRelease failed", {
          id: payload.pressRelease.id,
          contentLength,
          error,
        });
        throw error;
      }
    }

    if (payload.action === "markPressRelease" && payload.id && payload.pressReleaseStatus) {
      return privateJson({
        pressRelease: await markPressReleaseEmail(payload.id, payload.pressReleaseStatus),
      });
    }

    if (payload.action === "deletePressRelease" && payload.id) {
      return privateJson(await deletePressReleaseEmail(payload.id, payload.deleteMode));
    }

    if (payload.action === "deletePressReleases" && Array.isArray(payload.ids)) {
      const ids = [...new Set(payload.ids.map(String).filter(Boolean))];
      if (!payload.confirm) {
        return privateJson({ error: "Confirm the email delete before continuing." }, { status: 400 });
      }
      for (const id of ids) {
        await deletePressReleaseEmail(id, payload.deleteMode);
      }
      return privateJson({ ok: true, deleted: ids.length });
    }

    if (payload.action === "importPressReleaseAttachments" && payload.id) {
      const editorData = await getEditorData();
      const item = editorData.pressReleases.find((pressRelease) => pressRelease.id === payload.id);
      if (!item) return privateJson({ error: "I could not find that imported email." }, { status: 404 });
      const pressRelease = await importPressReleaseAttachmentImages(item, request);
      return privateJson({ pressRelease: compactPressReleaseSaveResponse(pressRelease) });
    }

    if (payload.action === "generatePressReleaseArticle" && payload.id) {
      return privateJson({
        pressRelease: await generatePressReleaseArticle(payload.id),
      });
    }

    if (payload.action === "savePressReleaseDraft" && payload.id) {
      return privateJson(await savePressReleaseAsDraft(payload.id));
    }

    if (payload.action === "publishPressReleaseStory" && payload.id) {
      return privateJson(await publishPressReleaseStory(payload.id));
    }

    if (payload.action === "unpublishPressReleaseStory" && payload.id) {
      return privateJson(await unpublishPressReleaseStory(payload.id));
    }

    if (payload.action === "blockPressReleaseSender" && payload.block) {
      return privateJson({
        blockedSender: await blockPressReleaseSender(payload.block),
      });
    }

    if (payload.action === "unblockPressReleaseSender" && payload.blockId) {
      await unblockPressReleaseSender(payload.blockId);
      return privateJson({ ok: true });
    }

    return privateJson({ error: "I could not recognise that editor action." }, { status: 400 });
  } catch (error) {
    if (error instanceof GuideManagementError) {
      return privateJson({ ok: false, error: error.message, validationErrors: error.issues }, { status: error.status });
    }
    if (error instanceof PublicationOverrideRequiredError) {
      return privateJson({
        ok: false,
        error: error.message,
        requiresPublicationOverride: true,
        editorialWarnings: error.editorialWarnings,
      }, { status: 409 });
    }
    if (error instanceof StoryTechnicalValidationError) {
      return privateJson({ ok: false, error: error.message, validationErrors: error.issues }, { status: 400 });
    }
    return editorErrorResponse(error, "The editor could not complete that action.");
  }
}

async function uploadPhoto(
  request: Request,
  uploadLogContext: ReturnType<typeof makeEditorMediaUploadLogContext>
) {
  try {
    const upload = await parseAndSaveEditorMediaUpload(request, uploadLogContext, {
      expectedAction: editorMediaUploadAction,
      allowMissingAction: true,
    });
    const body = editorMediaUploadResponseBody(upload);
    logEditorMediaUpload(uploadLogContext, "response sent", {
      status: 200,
      mediaId: body.mediaId,
      mediaUrl: body.mediaUrl,
    });
    return privateJson({
      ...body,
      media: upload.asset,
    });
  } catch (error) {
    const status = error instanceof EditorMediaUploadError ? error.status : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "The editor could not create a persistent media record.";
    logEditorMediaUploadError(uploadLogContext, "request failed", error, { status });
    logEditorMediaUpload(uploadLogContext, "response sent", { status });
    return privateJson({ ok: false, error: message }, { status });
  }
}
