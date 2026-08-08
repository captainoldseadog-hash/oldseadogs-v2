"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GUIDE_TYPES, type GuideType } from "../../content/flagship-guides.ts";
import { oldSeaDogsSections } from "../../content/sections";
import { analyzeOldSeaDogsStyle, findBannedPublicationPhrases, getEditorialWarnings } from "../../lib/editorial-quality";
import { saveEditorStoryRequest } from "../../lib/editor-publication.js";
import { validateMediaRights } from "../../lib/media-rights";
import { isoToUkDateTimeInput, ukDateTimeInputToIso } from "../../lib/story-schedule-time";
import {
  insertStoryBlockAtCursor,
  insertStoryBlockAtIndex,
  joinStoryBlocks,
  makeInlineImageBlock,
  moveStoryBlock,
  parseInlineImageBlock,
  splitStoryBlocks,
} from "../../lib/story-media-composer.js";

export type BridgeCmsSection =
  | "dashboard"
  | "stories"
  | "write"
  | "guides"
  | "homepage"
  | "drafts"
  | "published"
  | "scheduled"
  | "recover"
  | "audit"
  | "email"
  | "scraped"
  | "media"
  | "gallery"
  | "videos"
  | "social"
  | "analytics"
  | "advertising"
  | "backups"
  | "settings"
  | "health";

type StoryStatus = "draft" | "scheduled" | "published" | "unpublished";

type HomepageLeadDiagnostics = {
  published: boolean;
  noindex: boolean;
  qualityStatus: string;
  category: string;
  hasImage: boolean;
  currentHomepageLead: boolean;
  appearsOnHomepage: boolean;
  latestEligible: boolean;
  latestVisible: boolean;
  homepageBlockingReasons: string[];
  homepageWarnings: string[];
  warnings: string[];
  blockingReasons: string[];
};

type StorySummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  sectionSlugs: string[];
  author: string;
  status: StoryStatus;
  date: string;
  updatedAt: string;
  createdAt: string;
  publishedAt: string;
  scheduledPublishAt: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  videoUrl: string;
  videoCaption: string;
  videoPosition: "top" | "after-intro" | "bottom" | "";
  summary: string;
  tags: string[];
  readMinutes: number;
  isFeatured: boolean;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  editorialStatus: string;
  statusHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    fromWorkflow: string;
    toWorkflow: string;
    changedBy: string;
    changedAt: string;
  }>;
  noindex: boolean;
  homepageLeadEligible: boolean;
  homepageLeadDiagnostics: HomepageLeadDiagnostics;
  hasImage: boolean;
  hasVideo: boolean;
  wordCount: number;
  quality: {
    score: number;
    label: string;
    issues: string[];
  };
};

type EditorStory = StorySummary & {
  originalSourceType: string;
  originalSourceRef: string;
  originalSourceContent: string;
  imageCaption: string;
  oldSeaDogsView: string;
  sourceNotes: string;
  methodNotes: string;
  contentBasis: string;
  editorialStatus: string;
  noindex: boolean;
  body: string[];
  sortOrder: number;
};

type MediaAsset = {
  id: string;
  filename: string;
  originalFilename: string;
  displayName: string;
  internalTitle: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  caption: string;
  credit: string;
  copyright: string;
  copyrightOwnership: string;
  copyrightOwner: string;
  photographer: string;
  source: string;
  licence: string;
  permissionNote: string;
  usageRestrictions: string;
  creditLine: string;
  permissionReceivedAt: string;
  location: string;
  dateTaken: string;
  sourceType: string;
  category: string;
  tagsJson: string;
  collectionsJson: string;
  storyIdsJson: string;
  galleryItemId: string;
  originalKey: string;
  webKey: string;
  width: number;
  height: number;
  posterMediaId: string;
  externalUrl: string;
  description: string;
  storyAssociationId: string;
  galleryAssociationId: string;
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
  isActive: boolean;
  updatedAt: string;
};

type DashboardPayload = {
  checkedAt: string;
  user: { email: string };
  stats: Record<
    | "storiesToday"
    | "storiesPublished"
    | "storiesScheduled"
    | "drafts"
    | "emailsWaiting"
    | "scrapedStoriesWaiting"
    | "mediaAssets"
    | "adverts",
    number
  >;
  systemHealth: {
    ok: boolean;
    mode: string;
    detail: string;
    runtime: string;
    serverStartedAt: string;
    gitCommit: string;
  };
  backups: {
    mode: string;
    dataPath: string;
    status: string;
  };
  storage: {
    mode: string;
    dataPath: string;
    storyCount: number;
    pressReleaseCount: number;
    mediaCount: number;
  };
  recentActivity: Array<{
    id: string;
    kind: string;
    label: string;
    detail: string;
    at: string;
    href: string;
  }>;
};

type StoriesPayload = {
  stories: StorySummary[];
  media: MediaAsset[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
};

type StoryPayload = {
  story: EditorStory | null;
  media: MediaAsset[];
  revisions: Array<{
    id: string;
    storyId: string;
    reason: string;
    createdBy: string;
    createdAt: string;
    snapshot: Pick<EditorStory, "title">;
  }>;
};

type CopyrightWarning = {
  message: string;
  mediaId: string;
  filename: string;
  missingField: string;
};

type RightsDiagnostic = {
  mediaId: string;
  filename: string;
  copyrightOwnership: string;
  copyrightOwner: string;
  photographer: string;
  credit: string;
  creditLine: string;
  licence: string;
  permissionNote: string;
  usageRestrictions: string;
  permissionReceivedAt: string;
  rightsEvidenceResult: string;
  validationSource: string;
  validationPath: string;
  homepageWorkflowInvolved: boolean;
  blockingRule: string;
  metadataPersisted: boolean;
  metadataSavedBeforeValidation: boolean;
  validationRecordMatches: boolean;
  missingField: string;
};

type EditorGuide = {
  internalId: string;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  introduction: string;
  guideType: GuideType;
  regionKey: string;
  regionName: string;
  subregion: string;
  parentGuideSlug: string;
  editorialOrder: number;
  author: string;
  contributorCredits: string[];
  updatedAt: string;
  imageUrl: string;
  imageAlt: string;
  imageFocalPoint: string;
  artworkCredit: string;
  quickFacts: Array<{ label: string; value: string }>;
  sections: Array<{ heading: string; body: string[]; anchor?: string; kind?: "prose" | "callout" | "quote"; listItems?: string[]; links?: Array<{ label: string; guideSlug: string }> }>;
  checklist: string[];
  sourceLinks: Array<{ label: string; href: string }>;
  location: { latitude?: number; longitude?: number; mapZoom?: number; what3words?: string; osGridReference?: string };
  relatedGuideSlugs: string[];
  cruiseOnGuideSlugs: string[];
  previousGuideSlug: string;
  nextGuideSlug: string;
  status: "draft" | "published" | "unpublished";
  noindex: boolean;
  showOnHomepage: boolean;
  homepageOrder: number;
  seoTitle: string;
  seoDescription: string;
  socialTitle: string;
  socialDescription: string;
  canonicalPath: string;
  editorialNotes: string;
  researchNotes: string;
  reviewDue: string;
  accuracyConcerns: string;
  sourceNotes: string;
  draftComments: string;
  verifiedFacilities: Array<{ label: string; detail: string; sourceUrl: string; verifiedOn: string }>;
  facilityVerificationNotes: string;
  tags: string[];
  wordCount: number;
  minimumWords: number;
  quality: string;
  imageCaption: string;
  imageCredit: string;
  featuredMediaId: string;
  inlineImages: Array<{ id: string; mediaId: string; url: string; alt: string; caption: string; credit: string; sectionIndex: number; paragraphIndex: number; order: number }>;
};

type GuidesPayload = {
  guides: EditorGuide[];
  summary: {
    total: number;
    published: number;
    homepage: number;
    indexed: number;
    thin: number;
  };
};

type AuditPayload = {
  summary: {
    flaggedStories: number;
    thinStories: number;
    missingCredits: number;
    weakHeadlines: number;
  };
  rows: Array<{
    story: StorySummary;
    flags: string[];
    primaryFix: string;
  }>;
};

type PressPayload = {
  emailIngestion: {
    status: string;
    note: string;
    storageDetail: string;
    storageMode: string;
    connectionStatus: "configured" | "not-configured";
    connectionTest: "not-run" | "ready";
    lastFetch: string;
    lastSuccess: string;
    lastError: string;
    provider: string;
    folders: string[];
    missingEnvironmentKeys: string[];
    configuredEnvironmentKeys: string[];
    inboxConfigured: boolean;
  };
  blockedSenderCount: number;
  media: MediaAsset[];
  items: Array<{
    id: string;
    senderName: string;
    senderEmail: string;
    senderDomain: string;
    subject: string;
    receivedAt: string;
    preview: string;
    bodyText: string;
    status: string;
    category: string;
    relevanceScore: number;
    warnings: string[];
    generatedTitle: string;
    generatedExcerpt: string;
    generatedBody: string[];
    generatedWordCount: number;
    attachmentCount: number;
    attachmentStatus: {
      total: number;
      importedImages: number;
      pendingImages: number;
      unsupported: number;
    };
    attachments: Array<{
      id: string;
      filename: string;
      contentType: string;
      size: number;
      url: string;
      status: string;
      suggestedCredit: string;
      caption: string;
      rightsNote: string;
    }>;
    imageUrl: string;
    imageCredit: string;
    imageCaption: string;
    storyId: string;
    updatedAt: string;
  }>;
};

type SourceWatchDiagnostics = {
  checkedAt: string;
  created: number;
  previewed: number;
  needsDetail: number;
  skipped: number;
  failed: number;
  sources: Array<{
    id: string;
    name: string;
    group: string;
    found: number;
    created: number;
    skipped: number;
    needsDetail: number;
    failed: boolean;
    message: string;
  }>;
};

type MediaPayload = {
  media: MediaAsset[];
  filters?: { query: string; filter: string };
  stories: Array<{ id: string; title: string; status: StoryStatus }>;
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
  collections: string[];
};

type GalleryItem = {
  id: string;
  mediaId: string;
  sourceType: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  caption: string;
  alt: string;
  credit: string;
  copyright: string;
  location: string;
  dateTaken: string;
  tags: string[];
  categoryIds: string[];
  storyIds: string[];
  boatId: string;
  marinaId: string;
  yachtClubId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  thumbnailUrl: string;
  media: MediaAsset | null;
  createdAt: string;
  updatedAt: string;
};

type GalleryPayload = {
  name: string;
  publicRollout: false;
  connector: {
    configured: boolean; connected: boolean; accountIdConfigured: boolean; tokenConfigured: boolean; mode: string; accountId: string; username: string;
    connectedAt: string; tokenExpiry: string; tokenExpiryStatus: { state: string; daysRemaining: number | null }; lastTokenRefresh: string;
    lastConnectionTest: string; connectionError: string; skippedCount: number; lastSyncAt: string; nextSyncAt: string; importedCount: number;
    failedCount: number; pendingCount: number; intervalMinutes: number; scheduleEnabled: boolean; setup: string[];
    syncLog: Array<{ at: string; ok: boolean; checked: number; imported: number; skipped: number; failed: number; error: string }>;
  };
  categories: Array<{ id: string; name: string; slug: string; description: string; sortOrder: number }>;
  items: GalleryItem[];
  stories: Array<{ id: string; title: string; status: StoryStatus }>;
};

type VideoPayload = {
  stories: StorySummary[];
  placements: string[];
  media: MediaAsset[];
  posterImages: MediaAsset[];
  storyOptions: Array<{ id: string; title: string }>;
  galleryOptions: Array<{ id: string; title: string }>;
  collections: string[];
  maxVideoUploadMb: number;
};

type SettingsPayload = {
  settings: Record<string, string>;
  media: MediaAsset[];
  ads: Advert[];
  sourceWatch: Array<{
    id: string;
    name: string;
    group: string;
    status: string;
    url: string;
  }>;
  blockedSenders: Array<{
    id: string;
    value: string;
    kind: string;
    reason: string;
  }>;
  socialAnalytics: {
    socialClicks: number;
    outboundClicks: number;
    generatedPostUsage: number;
    byPlatform: Array<{ platform: string; count: number }>;
  };
};

type HomepageLeadPayload = {
  settings: Record<string, string>;
  current: StorySummary | null;
  candidates: StorySummary[];
  totalCandidates: number;
};

function parseSettingStoryIds(value = "") {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function HomepageSlotsManager({ data, leadStoryId, reload }: { data: HomepageLeadPayload; leadStoryId: string; reload: () => void }) {
  const [latestIds, setLatestIds] = useState(() => parseSettingStoryIds(data.settings.homepageLatestStoryIds));
  const [editorsChoiceIds, setEditorsChoiceIds] = useState(() => parseSettingStoryIds(data.settings.homepageEditorsChoiceStoryIds));
  const [hiddenIds, setHiddenIds] = useState(() => parseSettingStoryIds(data.settings.homepageHiddenStoryIds));
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const byId = new Map(data.candidates.map((story) => [story.id, story]));
  if (data.current) byId.set(data.current.id, data.current);
  const selectedStories = (ids: string[]) => ids.map((id) => byId.get(id)).filter((story): story is StorySummary => Boolean(story));
  const selectedLeadStory = leadStoryId ? byId.get(leadStoryId) ?? null : null;

  const addTo = (target: "latest" | "editors" | "hidden", id: string) => {
    if (id === leadStoryId) {
      setMessage(target === "hidden" ? "Replace or remove the Homepage Lead before hiding it." : "The Homepage Lead cannot be duplicated in another homepage section.");
      return;
    }
    if (target !== "hidden" && (latestIds.includes(id) || editorsChoiceIds.includes(id))) {
      setMessage("That story is already selected for the homepage. Duplicate cards are blocked.");
      return;
    }
    if (target === "latest") setLatestIds((current) => [...current, id].slice(0, 8));
    if (target === "editors") setEditorsChoiceIds((current) => [...current, id].slice(0, 8));
    if (target === "hidden") {
      setHiddenIds((current) => [...new Set([...current, id])]);
      setLatestIds((current) => current.filter((item) => item !== id));
      setEditorsChoiceIds((current) => current.filter((item) => item !== id));
    }
    setMessage("");
  };

  const move = (ids: string[], setIds: (ids: string[]) => void, index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= ids.length) return;
    const next = [...ids];
    [next[index], next[to]] = [next[to], next[index]];
    setIds(next);
  };

  const save = async () => {
    const selectedLead = leadStoryId ? byId.get(leadStoryId) ?? null : null;
    if (leadStoryId && !selectedLead) {
      setMessage("The selected Homepage Lead Story is no longer available. Choose it again before saving.");
      return;
    }
    if (selectedLead && !canSelectHomepageLead(selectedLead)) {
      setMessage("Only published stories with public story URLs can be selected as the Homepage Lead Story.");
      return;
    }
    const allowMissingImage = Boolean(selectedLead && !selectedLead.homepageLeadDiagnostics.hasImage);
    if (allowMissingImage && selectedLead && !window.confirm(homepageLeadConfirmText(selectedLead, "Save"))) return;
    setBusy(true);
    setMessage("");
    try {
      await postBridgeAction({
        action: "saveHomepage",
        homepageSource: "homepage-manager-save",
        homepage: {
          leadStoryId,
          homepageLatestStoryIds: JSON.stringify(latestIds.filter((id) => id !== leadStoryId && !hiddenIds.includes(id))),
          homepageEditorsChoiceStoryIds: JSON.stringify(editorsChoiceIds.filter((id) => id !== leadStoryId && !hiddenIds.includes(id))),
          homepageHiddenStoryIds: JSON.stringify(hiddenIds),
          allowMissingImage,
        },
      });
      setMessage("Homepage Lead, Latest, Editor’s Choice, order and visibility saved together.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Homepage selections could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const renderOrderedList = (title: string, ids: string[], setIds: (ids: string[]) => void) => (
    <article className="bridge-homepage-slot-list">
      <h3>{title}</h3>
      {selectedStories(ids).map((story, index) => <div key={story.id}><span><strong>{index + 1}. {story.title}</strong><small>{story.category} · Published</small></span><div className="bridge-row-actions"><button type="button" disabled={index === 0} onClick={() => move(ids, setIds, index, -1)}>Up</button><button type="button" disabled={index === ids.length - 1} onClick={() => move(ids, setIds, index, 1)}>Down</button><button type="button" onClick={() => setIds(ids.filter((id) => id !== story.id))}>Remove</button></div></div>)}
      {ids.length === 0 ? <p className="bridge-muted">Automatic recent published stories will fill this section.</p> : null}
    </article>
  );

  return <section className="bridge-panel bridge-homepage-manager">
    <div className="bridge-panel-heading"><div><p className="bridge-eyebrow">Step 3 — commit the front page</p><h2>Save Homepage</h2><p className="bridge-muted">Headline story: <strong>{selectedLeadStory?.title || "Automatic published story"}</strong>. Nothing changes publicly until you press Save Homepage.</p></div><button className="bridge-primary-action" type="button" disabled={busy} onClick={() => void save()}>Save Homepage</button></div>
    <div className="bridge-homepage-slot-grid">{renderOrderedList("Latest", latestIds, setLatestIds)}{renderOrderedList("Editor’s Choice", editorsChoiceIds, setEditorsChoiceIds)}</div>
    <details><summary>Choose and hide published stories</summary><div className="bridge-homepage-candidates">{data.candidates.map((story) => <article key={story.id}><strong>{story.title}</strong><small>{story.category} · {formatDateTime(story.publishedAt || story.date)}</small><HomepageVisibilitySummary story={story} /><div className="bridge-row-actions"><button type="button" onClick={() => addTo("latest", story.id)}>Add to Latest</button><button type="button" onClick={() => addTo("editors", story.id)}>Add to Editor’s Choice</button><button type="button" onClick={() => addTo("hidden", story.id)}>Hide from homepage</button></div></article>)}</div></details>
    <div className="bridge-panel-heading"><h3>Homepage preview</h3><div className="bridge-segmented">{(["desktop", "tablet", "mobile"] as const).map((item) => <button type="button" className={device === item ? "active" : ""} onClick={() => setDevice(item)} key={item}>{item}</button>)}</div></div>
    <div className={`bridge-homepage-preview ${device}`}><article className="lead"><span>Homepage Headline Story</span><strong>{selectedLeadStory?.title || "Automatic published story"}</strong></article><div>{selectedStories(latestIds).map((story) => <article key={story.id}><span>Latest</span><strong>{story.title}</strong></article>)}</div><div>{selectedStories(editorsChoiceIds).map((story) => <article key={story.id}><span>Editor’s Choice</span><strong>{story.title}</strong></article>)}</div></div>
    {hiddenIds.length > 0 ? <p className="bridge-muted">Hidden from homepage: {selectedStories(hiddenIds).map((story) => story.title).join(" · ") || `${hiddenIds.length} selected stories`}</p> : null}
    {message ? <p className="bridge-save-message">{message}</p> : null}
  </section>;
}

type HealthPayload = {
  ok: boolean;
  storage: {
    mode: string;
    persistent: boolean;
    detail: string;
    dataPath: string;
  };
  deployment: {
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
  emailIngestion: PressPayload["emailIngestion"];
  counts: {
    stories: number;
    media: number;
    ads: number;
    pressReleases: number;
    blockedSenders: number;
  };
};

type AnalyticsPayload = {
  measurementIdConfigured: boolean;
  measurementIdValid: boolean;
  dataApiConfigured: boolean;
  missingCredentials: string[];
  metrics: null | {
    pageViews: number; users: number; topStories: Array<{ label: string; value: number }>;
    trafficSources: Array<{ label: string; value: number }>; landingPages: Array<{ label: string; value: number }>;
    devices: Array<{ label: string; value: number }>; countries: Array<{ label: string; value: number }>;
    searchTerms: Array<{ label: string; value: number }>;
  };
};

type BridgeCmsProps = {
  section: BridgeCmsSection;
  storyId?: string;
  mediaId?: string;
  galleryView?: GalleryView;
};

type GalleryView = "dashboard" | "pending" | "approved" | "rejected" | "categories" | "instagram" | "settings";

const navGroups: Array<{
  label: string;
  items: Array<{ section: BridgeCmsSection; label: string; href: string }>;
}> = [
  {
    label: "Newsroom",
    items: [
      { section: "dashboard", label: "Dashboard", href: "/editor" },
      { section: "stories", label: "Stories", href: "/editor/stories" },
      { section: "write", label: "Write Story", href: "/editor/write" },
      { section: "guides", label: "Guides", href: "/editor/guides" },
      { section: "homepage", label: "Homepage Manager", href: "/editor/homepage" },
    ],
  },
  {
    label: "Queues",
    items: [
      { section: "drafts", label: "Draft Stories", href: "/editor/drafts" },
      { section: "published", label: "Published Stories", href: "/editor/published" },
      { section: "scheduled", label: "Scheduled Stories", href: "/editor/scheduled" },
      { section: "recover", label: "Recovered Stories", href: "/editor/recover" },
      { section: "audit", label: "Editorial Audit", href: "/editor/audit" },
    ],
  },
  {
    label: "Inputs",
    items: [
      { section: "email", label: "Email Import", href: "/editor/email" },
      { section: "scraped", label: "Scraped Stories", href: "/editor/scraped" },
      { section: "media", label: "Media Library", href: "/editor/media" },
      { section: "gallery", label: "Through the Lens", href: "/editor/through-the-lens" },
      { section: "videos", label: "Video Library", href: "/editor/videos" },
    ],
  },
  {
    label: "Business",
    items: [
      { section: "social", label: "Social", href: "/editor/social" },
      { section: "analytics", label: "Analytics", href: "/editor/analytics" },
      { section: "advertising", label: "Advertising", href: "/editor/advertising" },
      { section: "backups", label: "Backups", href: "/editor/backups" },
      { section: "settings", label: "Site Settings", href: "/editor/settings" },
      { section: "health", label: "System Health", href: "/editor/health" },
    ],
  },
];

function bridgeTitle(section: BridgeCmsSection) {
  return navGroups.flatMap((group) => group.items).find((item) => item.section === section)?.label ?? "Dashboard";
}

function useBridgeView<T>(view: string, query = "") {
  const [state, setState] = useState<{
    data: T | null;
    error: string;
    loading: boolean;
    url: string;
  }>({
    data: null,
    error: "",
    loading: true,
    url: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const url = `/api/editor?view=${view}${query}`;

  useEffect(() => {
    let active = true;

    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const text = await response.text();
        const payload = text ? JSON.parse(text) : null;
        if (!response.ok) {
          throw new Error(payload?.error || `Editor view failed with ${response.status}`);
        }
        return payload as T;
      })
      .then((payload) => {
        if (active) {
          setState({
            data: payload,
            error: "",
            loading: false,
            url,
          });
        }
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setState({
            data: null,
            error: fetchError instanceof Error ? fetchError.message : "The editor view could not load.",
            loading: false,
            url,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [url, refreshKey]);

  const activeUrl = state.url === url;

  return {
    data: activeUrl ? state.data : null,
    loading: !activeUrl || state.loading,
    error: activeUrl ? state.error : "",
    reload: () => setRefreshKey((value) => value + 1),
  };
}

function formatNumber(value: number) {
  return value.toLocaleString("en-GB");
}

function formatDateTime(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatUkDateTime(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London",
    timeZoneName: "short",
  }).format(date);
}

function displayStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  const labels: Record<string, string> = {
    accepted: "Ready",
    archived: "Archived",
    converted: "Draft",
    draft: "Draft",
    new: "Imported",
    needsdetail: "Needs Rewrite",
    "needs detail": "Needs Rewrite",
    "needs improvement": "Needs Rewrite",
    "needs review": "Needs Review",
    "needs rewrite": "Needs Rewrite",
    published: "Published",
    recoverable: "Recoverable",
    ready: "Ready",
    rejected: "Rejected",
    reviewed: "Needs Review",
    scheduled: "Scheduled",
    spam: "Rejected",
    unpublished: "Unpublished",
    updated: "Updated",
  };
  return labels[normalized.replace(/\s+/g, "")] || labels[normalized] || value || "Imported";
}

function statusTone(status: string) {
  const label = displayStatus(status);
  if (label === "Published" || label === "Ready" || label === "Imported" || status === "Live") return "good";
  if (label === "Scheduled" || label === "Needs Review" || label === "Draft") return "warn";
  if (label === "Unpublished" || label === "Archived" || label === "Rejected" || label === "Needs Rewrite" || status === "Needs work") return "bad";
  return "neutral";
}

function storyVisibilityLabel(story: StorySummary) {
  if (story.noindex) return "Noindex";
  if (story.status === "published") return story.editorialStatus === "Updated" ? "Published · Updated" : "Live";
  if (story.status === "draft") return "Draft";
  if (story.status === "scheduled") return "Scheduled";
  if (story.status === "unpublished") return "Unpublished";
  return displayStatus(story.status);
}

function canSelectHomepageLead(story: StorySummary) {
  return story.homepageLeadEligible;
}

function homepageLeadConfirmText(story: StorySummary, action: "Make" | "Save") {
  const warnings = story.homepageLeadDiagnostics.warnings;
  const blockingReasons = story.homepageLeadDiagnostics.blockingReasons;
  const warningText = warnings.length > 0
    ? `\n\nWarnings:\n- ${warnings.join("\n- ")}`
    : "";
  const blockingText = blockingReasons.length > 0
    ? `\n\nBlocked:\n- ${blockingReasons.join("\n- ")}`
    : "";
  return `${action} "${story.title}" as the Homepage Lead Story?${warningText}${blockingText}`;
}

function HomepageLeadDiagnostics({ story, compact = false }: { story: StorySummary; compact?: boolean }) {
  const diagnostics = story.homepageLeadDiagnostics;
  const rows = [
    ["Published", diagnostics.published ? "Yes" : "No"],
    ["Noindex", diagnostics.noindex ? "Yes" : "No"],
    ["Quality", diagnostics.qualityStatus || story.quality.label],
    ["Category", diagnostics.category || story.category],
    ["Image", diagnostics.hasImage ? "Yes" : "No"],
    ["Current lead", diagnostics.currentHomepageLead ? "Yes" : "No"],
    ["Appears on homepage", diagnostics.appearsOnHomepage ? "Yes" : "No"],
    ["Latest eligible", diagnostics.latestEligible ? "Yes" : "No"],
    ["In Latest", diagnostics.latestVisible ? "Yes" : "No"],
  ];
  const blockingReasons = diagnostics.homepageBlockingReasons.length > 0
    ? diagnostics.homepageBlockingReasons
    : diagnostics.blockingReasons;
  const warnings = diagnostics.homepageWarnings.length > 0
    ? diagnostics.homepageWarnings
    : diagnostics.warnings;

  return (
    <div className={compact ? "bridge-lead-diagnostics compact" : "bridge-lead-diagnostics"}>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {blockingReasons.length > 0 ? (
        <p className="bridge-lead-blocked">{blockingReasons.join(" ")}</p>
      ) : null}
      {warnings.length > 0 ? (
        <p className="bridge-lead-warnings">{warnings.join(" ")}</p>
      ) : null}
    </div>
  );
}

function HomepageVisibilitySummary({ story }: { story: StorySummary }) {
  const diagnostics = story.homepageLeadDiagnostics;
  const status = diagnostics.appearsOnHomepage
    ? diagnostics.latestVisible
      ? "Homepage: in Latest"
      : diagnostics.currentHomepageLead
        ? "Homepage: lead"
        : "Homepage: visible"
    : diagnostics.latestEligible
      ? "Homepage: eligible, not in visible slots"
      : `Homepage: ${diagnostics.homepageBlockingReasons[0] || diagnostics.blockingReasons[0] || "not visible"}`;

  return <small className="bridge-homepage-visibility">{status}</small>;
}

function scrapedStoryStatus(story: StorySummary) {
  const sourceType = story.sourceType.toLowerCase();
  const editorialStatus = story.editorialStatus || "";
  if (displayStatus(editorialStatus) === "Rejected") return "Rejected";
  if (sourceType.includes("insufficient source detail") || displayStatus(editorialStatus) === "Needs Rewrite") {
    return "Needs Rewrite";
  }
  if (sourceType.includes("automatic watch") || sourceType.includes("source watch") || sourceType.includes("scrape")) {
    return "Needs Review";
  }
  return "Imported";
}

function isRejectedOrUnusableScrapedStory(story: StorySummary) {
  const queueStatus = scrapedStoryStatus(story);
  return queueStatus === "Rejected" || queueStatus === "Needs Rewrite" || story.quality.label === "Needs work";
}

function LoadingBlock({ label = "Loading newsroom view" }: { label?: string }) {
  return <div className="bridge-loading">{label}</div>;
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bridge-error">
      <strong>Editor view could not load</strong>
      <span>{message}</span>
    </div>
  );
}

function BridgeNav({ activeSection }: { activeSection: BridgeCmsSection }) {
  return (
    <aside className="bridge-sidebar" aria-label="Bridge CMS navigation">
      <Link href="/editor" className="bridge-brand">
        <span className="brand-mark" aria-hidden="true" />
        <span>
          <strong>Old Sea Dogs</strong>
          <small>Bridge CMS</small>
        </span>
      </Link>
      {navGroups.map((group) => (
        <nav key={group.label} aria-label={group.label}>
          <p>{group.label}</p>
          {group.items.map((item) => (
            <Link
              className={item.section === activeSection ? "active" : ""}
              href={item.href}
              key={item.section}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ))}
      <Link className="bridge-legacy-link" href="/editor/legacy">
        Classic editor
      </Link>
    </aside>
  );
}

function BridgeHeader({
  section,
  eyebrow,
  children,
}: {
  section: BridgeCmsSection;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="bridge-header">
      <div>
        <p className="bridge-eyebrow">{eyebrow ?? "Professional newsroom CMS"}</p>
        <h1>{bridgeTitle(section)}</h1>
      </div>
      <div className="bridge-header-actions">
        {children}
        <Link href="/editor/write" className="bridge-primary-action">
          Write Story
        </Link>
      </div>
    </header>
  );
}

function DashboardPage() {
  const { data, loading, error } = useBridgeView<DashboardPayload>("dashboard");

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  const stats = [
    ["Stories today", data.stats.storiesToday],
    ["Stories published", data.stats.storiesPublished],
    ["Stories scheduled", data.stats.storiesScheduled],
    ["Drafts", data.stats.drafts],
    ["Emails waiting", data.stats.emailsWaiting],
    ["Scraped Stories waiting", data.stats.scrapedStoriesWaiting],
    ["Media assets", data.stats.mediaAssets],
    ["Adverts", data.stats.adverts],
  ] as const;

  return (
    <>
      <BridgeHeader section="dashboard">
        <Link href="/editor/health" className={`bridge-health-pill ${data.systemHealth.ok ? "good" : "bad"}`}>
          {data.systemHealth.ok ? "Healthy" : "Needs attention"}
        </Link>
      </BridgeHeader>
      <section className="bridge-stat-grid" aria-label="Newsroom summary">
        {stats.map(([label, value]) => (
          <article className="bridge-stat" key={label}>
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
          </article>
        ))}
      </section>

      <section className="bridge-dashboard-grid">
        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Recent Activity</h2>
            <Link href="/editor/stories">Open stories</Link>
          </div>
          <div className="bridge-activity-list">
            {data.recentActivity.map((item) => (
              <Link href={item.href} key={`${item.kind}-${item.id}`}>
                <span>{item.kind}</span>
                <strong>{item.label}</strong>
                <small>{item.detail} · {formatDateTime(item.at)}</small>
              </Link>
            ))}
          </div>
        </article>

        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Storage Usage</h2>
            <Link href="/editor/backups">Backups</Link>
          </div>
          <dl className="bridge-definition-list">
            <div>
              <dt>Mode</dt>
              <dd>{data.storage.mode}</dd>
            </div>
            <div>
              <dt>Stories</dt>
              <dd>{formatNumber(data.storage.storyCount)}</dd>
            </div>
            <div>
              <dt>Press releases</dt>
              <dd>{formatNumber(data.storage.pressReleaseCount)}</dd>
            </div>
            <div>
              <dt>Media</dt>
              <dd>{formatNumber(data.storage.mediaCount)}</dd>
            </div>
          </dl>
          <p className="bridge-muted">{data.backups.status}</p>
        </article>

        <article className="bridge-panel bridge-system-panel">
          <div className="bridge-panel-heading">
            <h2>System Health</h2>
            <Link href="/editor/health">Details</Link>
          </div>
          <p>{data.systemHealth.detail}</p>
          <dl className="bridge-definition-list compact">
            <div>
              <dt>Runtime</dt>
              <dd>{data.systemHealth.runtime || "Unknown"}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatDateTime(data.systemHealth.serverStartedAt)}</dd>
            </div>
            <div>
              <dt>Commit</dt>
              <dd>{data.systemHealth.gitCommit || "Not recorded"}</dd>
            </div>
          </dl>
        </article>
      </section>
    </>
  );
}

function StoryImage({ story }: { story: StorySummary }) {
  if (!story.imageUrl) {
    return <span className="bridge-story-thumb empty">No image</span>;
  }

  return (
    <span className="bridge-story-thumb">
      <img src={story.imageUrl} alt={story.imageAlt || ""} loading="lazy" />
    </span>
  );
}

function StoryListPage({
  section,
  title,
  status,
  queue,
}: {
  section: BridgeCmsSection;
  title: string;
  status?: string;
  queue?: string;
}) {
  const [query, setQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mediaStoryId, setMediaStoryId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [scrapeDiagnostics, setScrapeDiagnostics] = useState<SourceWatchDiagnostics | null>(null);
  const isScrapedQueue = queue === "scraped";
  const viewQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (queue) params.set("queue", queue);
    if (query.trim()) params.set("q", query.trim());
    if (workflowFilter) params.set("workflow", workflowFilter);
    params.set("page", String(page));
    params.set("pageSize", "24");
    return `&${params.toString()}`;
  }, [page, query, queue, status, workflowFilter]);
  const { data, loading, error, reload } = useBridgeView<StoriesPayload>("stories", viewQuery);
  const mediaAssets = data?.media ?? [];

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds((current) =>
      selected ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  };

  const runScrape = async () => {
    setActionBusy(true);
    setActionMessage("");
    try {
      const payload = await postBridgeAction<{ result: SourceWatchDiagnostics }>({
        action: "checkSources",
        sourceWatchOptions: {
          maxSources: 12,
          maxDraftsPerSource: 4,
          previewOnly: false,
        },
      });
      setScrapeDiagnostics(payload.result);
      setActionMessage("Scrape finished. Review drafts were added only to the private queue.");
      reload();
    } catch (error: unknown) {
      setActionMessage(error instanceof Error ? error.message : "Scrape could not run.");
    } finally {
      setActionBusy(false);
    }
  };

  const deleteScrapedStory = async (id: string) => {
    if (!window.confirm("Delete this scraped story from the review queue? A verified timestamped backup will be created first.")) return;
    setActionBusy(true);
    setActionMessage("");
    try {
      await postBridgeAction({ action: "deleteStories", ids: [id], confirm: true, backupBeforeDelete: true });
      setSelectedIds((current) => current.filter((item) => item !== id));
      setActionMessage("Scraped story deleted.");
      reload();
    } catch (error: unknown) {
      setActionMessage(error instanceof Error ? error.message : "Story could not be deleted.");
    } finally {
      setActionBusy(false);
    }
  };

  const setScrapedWorkflow = async (story: StorySummary, workflowStatus: "Needs Review" | "Needs Rewrite" | "Draft") => {
    setActionBusy(true);
    setActionMessage("");
    try {
      await postBridgeAction({ action: "changeStoryWorkflow", id: story.id, workflowStatus });
      setActionMessage(workflowStatus === "Draft" ? "Scraped item converted to a private Draft. It was not published." : `Scraped item marked ${workflowStatus}.`);
      reload();
    } catch (error: unknown) {
      setActionMessage(error instanceof Error ? error.message : "Scraped story workflow could not be updated.");
    } finally {
      setActionBusy(false);
    }
  };

  const deleteScrapedStories = async (ids: string[], label: string) => {
    if (ids.length === 0) {
      setActionMessage("No scraped stories are selected.");
      return;
    }
    if (!window.confirm(`${label}? A backup will be created before the bulk delete runs.`)) return;
    setActionBusy(true);
    setActionMessage("");
    try {
      const payload = await postBridgeAction<{ deleted: number; backup?: { backupPath?: string } }>({
        action: "deleteStories",
        ids,
        confirm: true,
        backupBeforeDelete: true,
      });
      setSelectedIds([]);
      setActionMessage(`Deleted ${payload.deleted} scraped stories after backup${payload.backup?.backupPath ? `: ${payload.backup.backupPath}` : "."}`);
      reload();
    } catch (error: unknown) {
      setActionMessage(error instanceof Error ? error.message : "Bulk delete could not be completed.");
    } finally {
      setActionBusy(false);
    }
  };

  const saveStoryImageFromPicker = async (story: StorySummary, selection: MediaSelection, placement: ImagePlacement) => {
    if (placement === "inline") {
      await postBridgeAction({
        action: "appendStoryBodyBlock",
        id: story.id,
        bodyBlock: inlineImageBlock(selection),
        bodyPlacement: "bottom",
      });
      setActionMessage("Inline image added.");
      reload();
      return "Inline image saved in the story body.";
    }
    await postBridgeAction({
      action: "saveStoryImage",
      id: story.id,
      imageUrl: selection.url,
      imageAlt: selection.alt,
      imageCaption: selection.caption,
      imageCredit: selection.credit,
    });
    setActionMessage("Featured image updated.");
    reload();
    return "Featured image saved on this story.";
  };

  const addStoryVideoFromPicker = async (story: StorySummary, selection: VideoSelection) => {
    await postBridgeAction({
      action: "appendStoryBodyBlock",
      id: story.id,
      bodyBlock: videoBlock(selection),
      bodyPlacement: selection.placement === "featured video" ? "top" : "bottom",
    });
    setActionMessage("Video metadata saved.");
    reload();
  };

  const clearStoryImage = async (story: StorySummary) => {
    await postBridgeAction({
      action: "clearStoryImage",
      id: story.id,
    });
    setActionMessage("Image removed.");
    reload();
  };

  const unusableScrapedIds = data?.stories.filter(isRejectedOrUnusableScrapedStory).map((story) => story.id) ?? [];

  return (
    <>
      <BridgeHeader section={section} eyebrow={title}>
        {isScrapedQueue ? (
          <>
            <button className="bridge-secondary-action" disabled={actionBusy} onClick={() => void runScrape()} type="button">Run Scrape</button>
            <button className="bridge-secondary-action" disabled={actionBusy} onClick={reload} type="button">Refresh Queue</button>
            <button className="bridge-secondary-action" disabled={actionBusy || selectedIds.length === 0} onClick={() => void deleteScrapedStories(selectedIds, "Delete selected scraped stories")} type="button">Delete selected scraped stories</button>
            <button className="bridge-secondary-action" disabled={actionBusy || unusableScrapedIds.length === 0} onClick={() => void deleteScrapedStories(unusableScrapedIds, "Clear rejected/unusable scraped stories")} type="button">Clear rejected/unusable scraped stories</button>
          </>
        ) : null}
      </BridgeHeader>
      {actionMessage ? <p className="bridge-save-message">{actionMessage}</p> : null}
      {isScrapedQueue && scrapeDiagnostics ? (
        <section className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Last scrape diagnostics</h2>
            <span>{formatDateTime(scrapeDiagnostics.checkedAt)}</span>
          </div>
          <div className="bridge-stat-grid compact">
            <article className="bridge-stat"><span>Found</span><strong>{formatNumber(scrapeDiagnostics.sources.reduce((total, source) => total + source.found, 0))}</strong></article>
            <article className="bridge-stat"><span>Added</span><strong>{formatNumber(scrapeDiagnostics.created)}</strong></article>
            <article className="bridge-stat"><span>Skipped</span><strong>{formatNumber(scrapeDiagnostics.skipped)}</strong></article>
            <article className="bridge-stat"><span>Needs Rewrite</span><strong>{formatNumber(scrapeDiagnostics.needsDetail)}</strong></article>
            <article className="bridge-stat"><span>Failed</span><strong>{formatNumber(scrapeDiagnostics.failed)}</strong></article>
          </div>
          <div className="bridge-diagnostics-table">
            <div><strong>Source</strong><strong>Found</strong><strong>Added</strong><strong>Skipped</strong></div>
            {scrapeDiagnostics.sources.map((source) => (
              <div key={source.id}>
                <span>{source.name}</span>
                <span>{formatNumber(source.found)}</span>
                <span>{formatNumber(source.created)}</span>
                <span>{formatNumber(source.skipped)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="bridge-panel">
        <div className="bridge-story-toolbar">
          <label>
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search title, category, source or tags"
            />
          </label>
          <label>
            <span>Workflow</span>
            <select value={workflowFilter} onChange={(event) => { setWorkflowFilter(event.target.value); setPage(1); }}>
              <option value="">All workflow statuses</option>
              {storyWorkflowStatuses.map((workflow) => <option key={workflow} value={workflow}>{workflow}</option>)}
            </select>
          </label>
          {data ? (
            <p>
              {formatNumber(data.pagination.total)} stories · page {data.pagination.page} of {data.pagination.pageCount}
            </p>
          ) : null}
        </div>
        {loading ? <LoadingBlock label="Loading story summaries" /> : null}
        {error ? <ErrorBlock message={error} /> : null}
        {data && data.stories.length > 0 ? (
          <div className="bridge-story-table" role="table" aria-label="Story summaries">
            <div className="bridge-story-table-head" role="row">
              <span>Story</span>
              <span>Status</span>
              <span>Quality</span>
              <span>Date</span>
              <span>Media</span>
              <span>Open</span>
            </div>
            {data.stories.map((story) => {
              const queueStatus = isScrapedQueue ? scrapedStoryStatus(story) : storyVisibilityLabel(story);
              return (
                <div className="bridge-story-row-wrap" key={story.id}>
                  <article className="bridge-story-row" role="row">
                    <span className="bridge-story-select-thumb">
                      {isScrapedQueue ? (
                        <input
                          aria-label={`Select ${story.title}`}
                          checked={selectedIds.includes(story.id)}
                          onChange={(event) => toggleSelected(story.id, event.target.checked)}
                          type="checkbox"
                        />
                      ) : null}
                      <StoryImage story={story} />
                    </span>
                    <div>
                      <strong>{story.title}</strong>
                      <small>{story.category} · {story.author} · {story.wordCount} words</small>
                      <HomepageVisibilitySummary story={story} />
                      <p>{story.summary}</p>
                    </div>
                    <span className={`bridge-status ${statusTone(queueStatus)}`}>{queueStatus}</span>
                    <span className={`bridge-status ${statusTone(story.quality.label)}`}>{story.quality.label}</span>
                    <span>{formatDateTime(story.updatedAt || story.date)}</span>
                    <span>{story.hasImage ? "Image" : "No image"}{story.hasVideo ? " · Video" : ""}</span>
                    <div className="bridge-row-actions">
                      <Link href={`/editor/write?story=${encodeURIComponent(story.id)}`}>Edit</Link>
                      {story.id ? <Link href={`/editor/preview/${story.id}`} target="_blank">Preview</Link> : null}
                      {isScrapedQueue && story.sourceUrl ? <a href={story.sourceUrl} rel="noreferrer" target="_blank">View source</a> : null}
                      <button type="button" onClick={() => setMediaStoryId((current) => current === story.id ? "" : story.id)}>Upload Image</button>
                      {isScrapedQueue ? <button type="button" disabled={actionBusy} onClick={() => void setScrapedWorkflow(story, "Needs Review")}>Needs Review</button> : null}
                      {isScrapedQueue ? <button type="button" disabled={actionBusy} onClick={() => void setScrapedWorkflow(story, "Needs Rewrite")}>Needs Rewrite</button> : null}
                      {isScrapedQueue ? <button type="button" disabled={actionBusy} onClick={() => void setScrapedWorkflow(story, "Draft")}>Convert to Draft</button> : null}
                      {isScrapedQueue ? <button type="button" disabled={actionBusy} onClick={() => void deleteScrapedStory(story.id)}>Delete</button> : null}
                    </div>
                  </article>
                  {mediaStoryId === story.id ? (
                    <article className="bridge-story-media-row">
                      <BridgeMediaPicker
                        assets={mediaAssets}
                        context={`${story.title} media`}
                        currentAlt={story.imageAlt}
                        currentCaption={story.imageCaption}
                        currentCredit={story.imageCredit}
                        currentImage={story.imageUrl}
                        onAddVideo={(selection) => addStoryVideoFromPicker(story, selection)}
                        onRemoveImage={() => clearStoryImage(story)}
                        onSelectImage={(selection, placement) => saveStoryImageFromPicker(story, selection, placement)}
                      />
                    </article>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
        {data && data.stories.length === 0 ? (
          <div className="bridge-empty-state">
            <h2>No matching stories</h2>
            <p>The current filters did not return any story summaries.</p>
          </div>
        ) : null}
        {data && data.pagination.pageCount > 1 ? (
          <div className="bridge-pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </button>
            <span>{page} / {data.pagination.pageCount}</span>
            <button type="button" disabled={page >= data.pagination.pageCount} onClick={() => setPage((value) => value + 1)}>
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}

function ScheduledStoriesPage() {
  const { data, loading, error, reload } = useBridgeView<StoriesPayload>("stories", "&status=scheduled&page=1&pageSize=100");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const changeStatus = async (story: StorySummary, status: "published" | "draft") => {
    const prompt = status === "published"
      ? `Publish “${story.title}” now? This bypasses its scheduled time and makes it public immediately.`
      : `Cancel the schedule for “${story.title}”? It will return to Draft and will not be published automatically.`;
    if (!window.confirm(prompt)) return;
    setBusyId(story.id);
    setMessage("");
    try {
      await postBridgeAction({ action: "setStoryStatus", id: story.id, status, confirm: true });
      setMessage(status === "published" ? "Story published now." : "Schedule cancelled. Story returned to Draft.");
      reload();
    } catch (actionError: unknown) {
      setMessage(actionError instanceof Error ? actionError.message : "The scheduled story could not be updated.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <BridgeHeader section="scheduled" eyebrow="Scheduled Stories" />
      {message ? <p className="bridge-save-message">{message}</p> : null}
      <section className="bridge-panel">
        <div className="bridge-panel-heading"><div><h2>Release queue</h2><p className="bridge-muted">Times are shown in UK local time and persist with the story record.</p></div><span>{data?.pagination.total ?? 0} scheduled</span></div>
        {loading ? <LoadingBlock label="Loading scheduled stories" /> : null}
        {error ? <ErrorBlock message={error} /> : null}
        {data?.stories.length ? (
          <div className="bridge-scheduled-list">
            {data.stories.map((story) => (
              <article key={story.id}>
                <div><span className="bridge-status warn">Scheduled</span><h3>{story.title}</h3><p>{story.category}</p></div>
                <dl>
                  <div><dt>Release</dt><dd>{formatUkDateTime(story.scheduledPublishAt)}</dd></div>
                  <div><dt>Image</dt><dd>{story.hasImage ? "Yes" : "No"}</dd></div>
                  <div><dt>Tags</dt><dd>{story.tags.length ? story.tags.join(", ") : "None"}</dd></div>
                </dl>
                <div className="bridge-row-actions">
                  <Link href={`/editor/write?story=${encodeURIComponent(story.id)}`}>Edit</Link>
                  <Link href={`/editor/preview/${story.id}`} target="_blank">Preview</Link>
                  <Link href={`/editor/write?story=${encodeURIComponent(story.id)}`}>Review &amp; Publish</Link>
                  <button disabled={busyId === story.id} onClick={() => void changeStatus(story, "draft")} type="button">Cancel Schedule</button>
                </div>
              </article>
            ))}
          </div>
        ) : !loading && !error ? <div className="bridge-empty-state"><h2>No scheduled stories</h2><p>Stories scheduled for a future release will appear here.</p></div> : null}
      </section>
    </>
  );
}

function blankStory(): EditorStory {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: "",
    slug: "",
    title: "",
    category: "News",
    sectionSlugs: ["news"],
    author: "Old Sea Dogs",
    status: "draft",
    date: today,
    updatedAt: "",
    createdAt: "",
    publishedAt: "",
    scheduledPublishAt: "",
    imageUrl: "",
    imageAlt: "",
    imageCredit: "",
    imageCaption: "",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    summary: "",
    tags: [],
    readMinutes: 3,
    isFeatured: false,
    sourceType: "Original",
    sourceName: "Old Sea Dogs desk",
    sourceUrl: "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    statusHistory: [],
    oldSeaDogsView: "",
    sourceNotes: "",
    methodNotes: "",
    contentBasis: "Old Sea Dogs observation and editorial research",
    editorialStatus: "Needs improvement",
    noindex: false,
    homepageLeadEligible: false,
    homepageLeadDiagnostics: {
      published: false,
      noindex: false,
      qualityStatus: "Draft",
      category: "News",
      hasImage: false,
      currentHomepageLead: false,
      appearsOnHomepage: false,
      latestEligible: false,
      latestVisible: false,
      homepageBlockingReasons: ["Status is draft."],
      homepageWarnings: [],
      warnings: [],
      blockingReasons: ["Story is not published."],
    },
    body: [],
    sortOrder: 0,
    hasImage: false,
    hasVideo: false,
    wordCount: 0,
    quality: {
      score: 0,
      label: "Draft",
      issues: [],
    },
  };
}

function dateTimeInputValue(value: string) {
  return isoToUkDateTimeInput(value);
}

function dateTimeInputToIso(value: string) {
  return ukDateTimeInputToIso(value);
}

async function postBridgeAction<T>(payload: Record<string, unknown>) {
  const response = await fetch("/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error || "The Bridge action could not be completed.");
  }
  return result as T;
}

function cleanMediaTokenPart(value: string) {
  return value.replace(/[\[\]|]/g, " ").replace(/\s+/g, " ").trim();
}

function inlineImageBlock(selection: MediaSelection) {
  return makeInlineImageBlock(selection);
}

function videoBlock(input: VideoSelection) {
  const placement = cleanMediaTokenPart(input.placement);
  const caption = cleanMediaTokenPart(input.caption);
  const credit = cleanMediaTokenPart(input.credit);
  return `[video:${input.url}|${placement}${caption || credit ? `|${caption}` : ""}${credit ? `|${credit}` : ""}]`;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} bytes`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function parseJsonStringList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

type MediaSelection = {
  id?: string;
  filename?: string;
  thumbnailUrl?: string;
  url: string;
  alt: string;
  caption: string;
  credit: string;
  creditLine: string;
  copyright: string;
  copyrightOwnership: string;
  copyrightOwner: string;
  photographer: string;
  licence: string;
  permissionNote: string;
  permissionReceivedAt: string;
  usageRestrictions: string;
  location: string;
  dateTaken: string;
};

type ImagePlacement = "featured" | "inline";

type VideoSelection = {
  url: string;
  placement: "featured video" | "inline video" | "bottom of story";
  caption: string;
  credit: string;
};

type MediaUploadDiagnostics = {
  selectedFileName: string;
  mimeType: string;
  fileSize: string;
  uploadRequestStarted: string;
  apiRoute: string;
  httpStatus: string;
  responseBody: string;
  mediaId: string;
  mediaUrl: string;
  saveResult: string;
  previewResult: string;
  error: string;
};

const bridgePhotoUploadAccept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const bridgeMediaUploadEndpoint = "/api/editor/media/upload";
const bridgeMediaUploadAction = "uploadMedia";
const bridgeMediaUploadTimeoutMs = 45_000;
const bridgeMaxPhotoUploadMb = 25;
const bridgeMaxPhotoUploadBytes = bridgeMaxPhotoUploadMb * 1024 * 1024;
const storyWorkflowStatuses = [
  "Imported", "Needs Review", "Needs Rewrite", "Draft", "Ready", "Scheduled",
  "Published", "Updated", "Unpublished", "Archived", "Rejected", "Recoverable",
] as const;

function blankMediaUploadDiagnostics(): MediaUploadDiagnostics {
  return {
    selectedFileName: "",
    mimeType: "",
    fileSize: "",
    uploadRequestStarted: "No",
    apiRoute: bridgeMediaUploadEndpoint,
    httpStatus: "",
    responseBody: "",
    mediaId: "",
    mediaUrl: "",
    saveResult: "",
    previewResult: "",
    error: "",
  };
}

function photoContentType(file: File) {
  const declaredType = file.type.toLowerCase();
  if (declaredType === "image/jpeg" || declaredType === "image/png" || declaredType === "image/webp") return declaredType;

  const fileName = file.name.toLowerCase();
  if (/\.(jpe?g)$/.test(fileName)) return "image/jpeg";
  if (/\.png$/.test(fileName)) return "image/png";
  if (/\.webp$/.test(fileName)) return "image/webp";

  return "";
}

function mediaSelectionMessage(result: string | void, fallback: string) {
  return typeof result === "string" && result.trim() ? result : fallback;
}

function mergeMediaAssets(primary: MediaAsset[], secondary: MediaAsset[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((asset) => {
    if (!asset.id || seen.has(asset.id)) return false;
    seen.add(asset.id);
    return true;
  });
}

function BridgeMediaPicker({
  assets,
  context,
  currentImage,
  currentAlt = "",
  currentCaption = "",
  currentCredit = "",
  onSelectImage,
  onRemoveImage,
  onAddVideo,
  initialPlacement = "featured",
  panelId,
  storyComposer = false,
  canInsertInline = true,
  initialMediaId = "",
  onSelectedMediaChange,
}: {
  assets: MediaAsset[];
  context: string;
  currentImage?: string;
  currentAlt?: string;
  currentCaption?: string;
  currentCredit?: string;
  onSelectImage?: (selection: MediaSelection, placement: ImagePlacement) => Promise<string | void> | string | void;
  onRemoveImage?: () => Promise<void> | void;
  onAddVideo?: (selection: VideoSelection) => Promise<void> | void;
  initialPlacement?: ImagePlacement;
  panelId?: string;
  storyComposer?: boolean;
  canInsertInline?: boolean;
  initialMediaId?: string;
  onSelectedMediaChange?: (selection: MediaSelection) => void;
}) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const uploadAbortReasonRef = useRef<"cancel" | "timeout" | "">("");
  const [uploadedAssets, setUploadedAssets] = useState<MediaAsset[]>([]);
  const mediaAssets = useMemo(() => mergeMediaAssets(uploadedAssets, assets), [uploadedAssets, assets]);
  const [selectedMediaId, setSelectedMediaId] = useState(initialMediaId);
  const [imagePlacement, setImagePlacement] = useState<ImagePlacement>(initialPlacement);
  const initialRightsAsset = initialMediaId
    ? assets.find((candidate) => candidate.id === initialMediaId)
    : undefined;
  const [alt, setAlt] = useState(currentAlt || initialRightsAsset?.alt || "");
  const [caption, setCaption] = useState(currentCaption || initialRightsAsset?.caption || "");
  const [credit, setCredit] = useState(
    currentCredit || initialRightsAsset?.credit || initialRightsAsset?.creditLine || ""
  );
  const [copyright, setCopyright] = useState(initialRightsAsset?.copyright || "");
  const [copyrightOwnership, setCopyrightOwnership] = useState(initialRightsAsset?.copyrightOwnership || "unknown");
  const [copyrightOwner, setCopyrightOwner] = useState(initialRightsAsset?.copyrightOwner || "");
  const [photographer, setPhotographer] = useState(initialRightsAsset?.photographer || "");
  const [licence, setLicence] = useState(initialRightsAsset?.licence || "");
  const [permissionNote, setPermissionNote] = useState(initialRightsAsset?.permissionNote || "");
  const [permissionReceivedAt, setPermissionReceivedAt] = useState(initialRightsAsset?.permissionReceivedAt || "");
  const [usageRestrictions, setUsageRestrictions] = useState(initialRightsAsset?.usageRestrictions || "");
  const [location, setLocation] = useState(initialRightsAsset?.location || "");
  const [dateTaken, setDateTaken] = useState(initialRightsAsset?.dateTaken || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [uploadDiagnostics, setUploadDiagnostics] = useState<MediaUploadDiagnostics>(() => blankMediaUploadDiagnostics());
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [videoCredit, setVideoCredit] = useState("");
  const [videoPlacement, setVideoPlacement] = useState<VideoSelection["placement"]>("inline video");
  const [uploading, setUploading] = useState(false);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const selectionInFlightRef = useRef(false);
  const [message, setMessage] = useState("");
  const [savedRightsSignature, setSavedRightsSignature] = useState(() => JSON.stringify({
    id: initialRightsAsset?.id || "",
    copyrightOwnership: initialRightsAsset?.copyrightOwnership || "unknown",
    copyrightOwner: initialRightsAsset?.copyrightOwner || "",
    photographer: initialRightsAsset?.photographer || "",
    credit: initialRightsAsset?.credit || initialRightsAsset?.creditLine || "",
    copyright: initialRightsAsset?.copyright || "",
    licence: initialRightsAsset?.licence || "",
    permissionNote: initialRightsAsset?.permissionNote || "",
    permissionReceivedAt: initialRightsAsset?.permissionReceivedAt || "",
    usageRestrictions: initialRightsAsset?.usageRestrictions || "",
  }));

  const selectedAsset = selectedMediaId
    ? mediaAssets.find((asset) => asset.id === selectedMediaId) ?? null
    : null;
  const selectedMediaValue = selectedAsset?.id ?? "";
  const canUseImage = Boolean(onSelectImage);
  const previewSrc = currentImage || previewAsset?.url || "";
  const previewAlt = currentImage ? currentAlt : previewAsset?.alt || selectedFile?.name || "";
  const currentRightsSignature = JSON.stringify({
    id: selectedAsset?.id || "",
    copyrightOwnership,
    copyrightOwner: copyrightOwner.trim(),
    photographer: photographer.trim(),
    credit: credit.trim(),
    copyright: copyright.trim(),
    licence: licence.trim(),
    permissionNote: permissionNote.trim(),
    permissionReceivedAt: permissionReceivedAt.trim(),
    usageRestrictions: usageRestrictions.trim(),
  });
  const currentRightsResult = validateMediaRights({
    copyrightOwnership, copyrightOwner, photographer, credit, creditLine: credit,
    copyright, licence, permissionNote, permissionReceivedAt, usageRestrictions,
  });

  useEffect(() => {
    if (!selectedAsset || !onSelectedMediaChange) return;
    onSelectedMediaChange({
      id: selectedAsset.id,
      filename: selectedAsset.filename,
      thumbnailUrl: selectedAsset.thumbnailUrl,
      url: selectedAsset.url,
      alt: alt.trim() || selectedAsset.alt || selectedAsset.filename,
      caption: caption.trim(),
      credit: credit.trim(),
      creditLine: credit.trim(),
      copyright: copyright.trim(),
      copyrightOwnership,
      copyrightOwner: copyrightOwner.trim(),
      photographer: photographer.trim(),
      licence: licence.trim(),
      permissionNote: permissionNote.trim(),
      permissionReceivedAt: permissionReceivedAt.trim(),
      usageRestrictions: usageRestrictions.trim(),
      location: location.trim(),
      dateTaken: dateTaken.trim(),
    });
  }, [alt, caption, copyright, copyrightOwner, copyrightOwnership, credit, dateTaken, licence, location, onSelectedMediaChange, permissionNote, permissionReceivedAt, photographer, selectedAsset, usageRestrictions]);

  const makeSelection = (asset: MediaAsset): MediaSelection => ({
    id: asset.id,
    filename: asset.filename,
    thumbnailUrl: asset.thumbnailUrl,
    url: asset.url,
    alt: alt.trim() || asset.alt || asset.filename,
    caption: caption.trim(),
    credit: credit.trim(),
    creditLine: credit.trim(),
    copyright: copyright.trim() || asset.copyright,
    copyrightOwnership: copyrightOwnership || asset.copyrightOwnership || "unknown",
    copyrightOwner: copyrightOwner.trim() || asset.copyrightOwner,
    photographer: photographer.trim() || asset.photographer,
    licence: licence.trim() || asset.licence,
    permissionNote: permissionNote.trim() || asset.permissionNote,
    permissionReceivedAt: permissionReceivedAt.trim() || asset.permissionReceivedAt,
    usageRestrictions: usageRestrictions.trim() || asset.usageRestrictions,
    location: location.trim() || asset.location,
    dateTaken: dateTaken.trim() || asset.dateTaken,
  });

  const selectAsset = (asset: MediaAsset) => {
    setSelectedMediaId(asset.id);
    setAlt(asset.alt || "");
    setCaption(asset.caption || "");
    setCredit(asset.credit || asset.creditLine || "");
    setCopyright(asset.copyright || "");
    setCopyrightOwnership(asset.copyrightOwnership || "unknown");
    setCopyrightOwner(asset.copyrightOwner || "");
    setPhotographer(asset.photographer || "");
    setLicence(asset.licence || "");
    setPermissionNote(asset.permissionNote || "");
    setPermissionReceivedAt(asset.permissionReceivedAt || "");
    setUsageRestrictions(asset.usageRestrictions || "");
    setLocation(asset.location || "");
    setDateTaken(asset.dateTaken || "");
    onSelectedMediaChange?.({
      id: asset.id,
      filename: asset.filename,
      thumbnailUrl: asset.thumbnailUrl,
      url: asset.url,
      alt: asset.alt || asset.filename,
      caption: asset.caption,
      credit: asset.credit || asset.creditLine,
      creditLine: asset.creditLine || asset.credit,
      copyright: asset.copyright,
      copyrightOwnership: asset.copyrightOwnership || "unknown",
      copyrightOwner: asset.copyrightOwner,
      photographer: asset.photographer,
      licence: asset.licence,
      permissionNote: asset.permissionNote,
      permissionReceivedAt: asset.permissionReceivedAt,
      usageRestrictions: asset.usageRestrictions,
      location: asset.location,
      dateTaken: asset.dateTaken,
    });
    setSavedRightsSignature(JSON.stringify({
      id: asset.id,
      copyrightOwnership: asset.copyrightOwnership || "unknown",
      copyrightOwner: asset.copyrightOwner || "",
      photographer: asset.photographer || "",
      credit: asset.credit || asset.creditLine || "",
      copyright: asset.copyright || "",
      licence: asset.licence || "",
      permissionNote: asset.permissionNote || "",
      permissionReceivedAt: asset.permissionReceivedAt || "",
      usageRestrictions: asset.usageRestrictions || "",
    }));
  };

  const persistMediaMetadata = async (asset: MediaAsset) => {
    const payload = await postBridgeAction<{ media: MediaAsset }>({
      action: "updateMedia",
      id: asset.id,
      media: {
        alt: alt.trim() || asset.alt || asset.filename,
        caption: caption.trim(),
        credit: credit.trim(),
        creditLine: credit.trim(),
        copyright: copyright.trim(),
        copyrightOwnership,
        copyrightOwner: copyrightOwner.trim(),
        photographer: photographer.trim(),
        licence: licence.trim(),
        permissionNote: permissionNote.trim(),
        permissionReceivedAt: permissionReceivedAt.trim(),
        usageRestrictions: usageRestrictions.trim(),
        location: location.trim(),
        dateTaken: dateTaken.trim(),
      },
    });
    setUploadedAssets((current) => mergeMediaAssets([payload.media], current));
    setSavedRightsSignature(JSON.stringify({
      id: payload.media.id,
      copyrightOwnership: payload.media.copyrightOwnership,
      copyrightOwner: payload.media.copyrightOwner,
      photographer: payload.media.photographer,
      credit: payload.media.credit || payload.media.creditLine,
      copyright: payload.media.copyright,
      licence: payload.media.licence,
      permissionNote: payload.media.permissionNote,
      permissionReceivedAt: payload.media.permissionReceivedAt,
      usageRestrictions: payload.media.usageRestrictions,
    }));
    return payload.media;
  };

  const chooseFromLibrary = async (placement: ImagePlacement = imagePlacement) => {
    if (!selectedAsset || !onSelectImage || selectionInFlightRef.current) return;
    if (placement === "inline" && storyComposer && !canInsertInline) {
      setMessage("Place the article cursor between two paragraphs, or drag the photograph to an insertion line.");
      return;
    }
    selectionInFlightRef.current = true;
    setSelectionBusy(true);
    setMessage("");
    try {
      const savedAsset = await persistMediaMetadata(selectedAsset);
      const result = await onSelectImage(makeSelection(savedAsset), placement);
      const saveResult = mediaSelectionMessage(
        result,
        placement === "featured" ? "Selected image attached as the featured image." : "Selected image inserted inline."
      );
      setPreviewAsset(savedAsset);
      setUploadDiagnostics((current) => ({
        ...current,
        mediaId: savedAsset.id,
        mediaUrl: savedAsset.url,
        saveResult,
        previewResult: "Stored media URL selected for preview.",
        error: "",
      }));
      setMessage(saveResult);
    } finally {
      selectionInFlightRef.current = false;
      setSelectionBusy(false);
    }
  };

  const uploadImage = async (file: File | null = selectedFile) => {
    if (uploading) {
      setMessage("Upload already in progress.");
      return;
    }

    if (!file || !onSelectImage) {
      setMessage("Choose an image before uploading.");
      return;
    }

    const detectedContentType = photoContentType(file);
    const nextDiagnostics: MediaUploadDiagnostics = {
      selectedFileName: file.name,
      mimeType: file.type || detectedContentType || "Unknown",
      fileSize: `${formatBytes(file.size)} (${file.size} bytes)`,
      uploadRequestStarted: "No",
      apiRoute: bridgeMediaUploadEndpoint,
      httpStatus: "No server response yet",
      responseBody: "",
      mediaId: "",
      mediaUrl: "",
      saveResult: "",
      previewResult: "",
      error: "",
    };
    setSelectedFile(file);
    setUploadDiagnostics(nextDiagnostics);

    if (!detectedContentType) {
      const error = "Unsupported file type. Please upload a JPG, JPEG, PNG or WebP image.";
      setUploadDiagnostics((current) => ({ ...current, error }));
      setMessage(error);
      return;
    }

    if (file.size > bridgeMaxPhotoUploadBytes) {
      const error = `File too large. Please upload an image under ${bridgeMaxPhotoUploadMb} MB.`;
      setUploadDiagnostics((current) => ({
        ...current,
        httpStatus: "Blocked by Bridge before upload",
        error,
      }));
      setMessage(error);
      return;
    }

    setUploading(true);
    setMessage("Uploading image...");
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    uploadAbortReasonRef.current = "";
    let timeoutId: number | null = null;
    try {
      const form = new FormData();
      form.append("action", bridgeMediaUploadAction);
      form.append("photo", file);
      form.append("alt", alt);
      setUploadDiagnostics((current) => ({
        ...current,
        uploadRequestStarted: "Yes",
        apiRoute: bridgeMediaUploadEndpoint,
      }));
      timeoutId = window.setTimeout(() => {
        uploadAbortReasonRef.current = "timeout";
        controller.abort();
      }, bridgeMediaUploadTimeoutMs);
      const response = await fetch(bridgeMediaUploadEndpoint, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const text = await response.text();
      let payload: {
        error?: string;
        mediaId?: string;
        mediaUrl?: string;
        filename?: string;
        mimeType?: string;
        sizeBytes?: number;
        thumbnailUrl?: string;
        media?: MediaAsset;
      } = {};
      if (text) {
        try {
          payload = JSON.parse(text) as typeof payload;
        } catch {
          payload = {};
        }
      }
      const responseBody = text.trim().slice(0, 2000);
      setUploadDiagnostics((current) => ({
        ...current,
        httpStatus: `${response.status} ${response.statusText || ""}`.trim(),
        responseBody,
      }));
      if (!response.ok) throw new Error(payload.error || responseBody || "Image upload failed.");
      const media = payload.media ?? (
        payload.mediaId && payload.mediaUrl
          ? {
              id: payload.mediaId,
              filename: payload.filename || file.name,
              originalFilename: payload.filename || file.name,
              displayName: (payload.filename || file.name).replace(/\.[^.]+$/, ""),
              internalTitle: (payload.filename || file.name).replace(/\.[^.]+$/, ""),
              contentType: payload.mimeType || detectedContentType,
              size: payload.sizeBytes || file.size,
              url: payload.mediaUrl,
              thumbnailUrl: payload.thumbnailUrl,
              alt,
              caption: "",
              credit: "",
              copyright: "",
              copyrightOwnership: "unknown",
              copyrightOwner: "",
              photographer: "",
              source: "",
              licence: "",
              permissionNote: "",
              usageRestrictions: "",
              creditLine: "",
              permissionReceivedAt: "",
              location: "",
              dateTaken: "",
              sourceType: "upload",
              category: "",
              tagsJson: "[]",
              collectionsJson: "[]",
              storyIdsJson: "[]",
              galleryItemId: "",
              originalKey: "",
              webKey: "",
              width: 0,
              height: 0,
              posterMediaId: "",
              externalUrl: "",
              description: alt,
              storyAssociationId: "",
              galleryAssociationId: "",
              createdAt: new Date().toISOString(),
            }
          : undefined
      );
      if (!media?.id || !media.url) throw new Error("The upload completed, but no media URL was returned.");
      if (!media.url.startsWith("/api/media/")) throw new Error("The upload returned an unexpected media URL.");

      const storedMedia: MediaAsset = {
        ...media,
        thumbnailUrl: media.thumbnailUrl || `/api/media/${media.id}?variant=thumbnail`,
      };
      const persistedMedia = await persistMediaMetadata(storedMedia);
      setUploadedAssets((current) => mergeMediaAssets([persistedMedia], current));
      setPreviewAsset(persistedMedia);
      setSelectedMediaId(persistedMedia.id);
      onSelectedMediaChange?.(makeSelection(persistedMedia));
      setUploadDiagnostics((current) => ({
        ...current,
        mediaId: persistedMedia.id,
        mediaUrl: persistedMedia.url,
        previewResult: "Stored URL returned; loading preview.",
      }));

      let saveResult = "Photo uploaded to the Media Library. Now choose Set as Featured Image, Insert at Cursor, or drag it into the article.";
      if (!storyComposer) {
        const result = await onSelectImage({
          id: persistedMedia.id,
          filename: persistedMedia.filename,
          thumbnailUrl: persistedMedia.thumbnailUrl,
          url: persistedMedia.url,
          alt: alt.trim() || persistedMedia.alt || persistedMedia.filename,
          caption: caption.trim(),
          credit: credit.trim(),
          creditLine: credit.trim(),
          copyright: copyright.trim(),
          copyrightOwnership,
          copyrightOwner: copyrightOwner.trim(),
          photographer: photographer.trim(),
          licence: licence.trim(),
          permissionNote: permissionNote.trim(),
          permissionReceivedAt: permissionReceivedAt.trim(),
          usageRestrictions: usageRestrictions.trim(),
          location: location.trim(),
          dateTaken: dateTaken.trim(),
        }, imagePlacement);
        saveResult = mediaSelectionMessage(
          result,
          imagePlacement === "featured" ? "Image uploaded and attached as the featured image." : "Image uploaded and inserted inline."
        );
      }
      setUploadDiagnostics((current) => ({
        ...current,
        saveResult,
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(saveResult);
    } catch (error: unknown) {
      const aborted = error instanceof Error && error.name === "AbortError";
      const abortReason = uploadAbortReasonRef.current as string;
      const errorMessage = aborted && abortReason === "timeout"
        ? `Upload timed out after ${Math.round(bridgeMediaUploadTimeoutMs / 1000)} seconds with no server response. Please retry.`
        : aborted && abortReason === "cancel"
          ? "Upload cancelled before the server response arrived."
          : error instanceof Error ? error.message : "Image upload failed.";
      setUploadDiagnostics((current) => ({
        ...current,
        httpStatus: aborted
          ? abortReason === "timeout"
            ? `Timed out after ${Math.round(bridgeMediaUploadTimeoutMs / 1000)} seconds`
            : "Cancelled before server response"
          : current.httpStatus,
        error: errorMessage,
      }));
      setMessage(errorMessage);
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
      uploadAbortReasonRef.current = "";
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (!uploadAbortRef.current) return;
    uploadAbortReasonRef.current = "cancel";
    uploadAbortRef.current.abort();
  };

  const openFilePicker = () => {
    setMessage("");
    fileInputRef.current?.click();
  };

  const onPreviewLoad = () => {
    if (!previewSrc.startsWith("/api/media/")) return;
    setUploadDiagnostics((current) =>
      current.previewResult === "Preview loaded from stored URL."
        ? current
        : { ...current, previewResult: "Preview loaded from stored URL." }
    );
  };

  const onPreviewError = () => {
    if (!previewSrc.startsWith("/api/media/")) return;
    setUploadDiagnostics((current) => ({
      ...current,
      previewResult: "Preview could not load from the stored URL.",
    }));
  };

  const addVideo = async () => {
    if (!onAddVideo) return;
    const trimmedUrl = videoUrl.trim();
    if (!/^https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be|vimeo\.com|tiktok\.com)\//i.test(trimmedUrl) && !trimmedUrl.startsWith("/api/media/")) {
      setMessage("Use a YouTube, TikTok, Vimeo or uploaded /api/media/ video URL.");
      return;
    }
    await onAddVideo({
      url: trimmedUrl,
      placement: videoPlacement,
      caption: videoCaption.trim(),
      credit: videoCredit.trim(),
    });
    setVideoUrl("");
    setVideoCaption("");
    setVideoCredit("");
    setMessage("Video metadata saved. It will remain click-to-play with no autoplay.");
  };

  return (
    <section className="bridge-media-picker" id={panelId} aria-label={`${context} media`}>
      <div className="bridge-media-picker-heading">
        <div><p className="eyebrow">Choose from Media Library or upload</p><strong>{context}</strong></div>
        {previewSrc ? <span className="bridge-status good">{currentImage ? "Image set" : "Uploaded"}</span> : <span className="bridge-status neutral">No image</span>}
      </div>
      {previewSrc ? (
        <figure className="bridge-current-media">
          <img src={previewSrc} alt={previewAlt || ""} loading="lazy" onError={onPreviewError} onLoad={onPreviewLoad} />
          {caption || credit ? (
            <figcaption>
              {caption ? <span>{caption}</span> : null}
              {credit ? <span>{credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      {canUseImage ? (
        <>
          <div className="bridge-field-row thirds">
            {!storyComposer ? (
              <label>
                <span>Placement</span>
                <select value={imagePlacement} onChange={(event) => setImagePlacement(event.target.value as ImagePlacement)}>
                  <option value="featured">Featured image</option>
                  <option value="inline">Inline image</option>
                </select>
              </label>
            ) : null}
            <label>
              <span>Alt text</span>
              <input value={alt} onChange={(event) => setAlt(event.target.value)} />
            </label>
            <label>
              <span>Credit</span>
              <input value={credit} onChange={(event) => setCredit(event.target.value)} />
            </label>
          </div>
          <label>
            <span>Caption</span>
            <input value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>
          <div className="bridge-field-row thirds">
            <label><span>Copyright</span><input value={copyright} onChange={(event) => setCopyright(event.target.value)} /></label>
            <label><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
            <label><span>Date taken</span><input type="date" value={dateTaken} onChange={(event) => setDateTaken(event.target.value)} /></label>
          </div>
          <div className="bridge-field-row thirds">
            <label>
              <span>Copyright ownership</span>
              <select value={copyrightOwnership} onChange={(event) => setCopyrightOwnership(event.target.value)}>
                <option value="unknown">Unknown rights</option>
                <option value="michael-hodges">© Michael Hodges</option>
                <option value="third-party">Third-party</option>
                <option value="press-supplied">Press / supplied</option>
                <option value="licensed">Licensed</option>
                <option value="public-domain">Public domain</option>
                <option value="do-not-publish">Do Not Publish</option>
              </select>
            </label>
            <label><span>Copyright owner</span><input value={copyrightOwner} onChange={(event) => setCopyrightOwner(event.target.value)} /></label>
            <label><span>Photographer</span><input value={photographer} onChange={(event) => setPhotographer(event.target.value)} /></label>
          </div>
          <div className="bridge-field-row thirds">
            <label><span>Licence</span><input value={licence} onChange={(event) => setLicence(event.target.value)} /></label>
            <label><span>Permission note</span><input value={permissionNote} onChange={(event) => setPermissionNote(event.target.value)} /></label>
            <label><span>Usage restrictions</span><input value={usageRestrictions} onChange={(event) => setUsageRestrictions(event.target.value)} /></label>
          </div>
          <label><span>Date permission received</span><input type="date" value={permissionReceivedAt.slice(0, 10)} onChange={(event) => setPermissionReceivedAt(event.target.value)} /></label>
          {storyComposer && selectedAsset ? (
            <details className="bridge-editor-details">
              <summary>Selected image rights diagnostics</summary>
              <dl className="bridge-diagnostics-grid">
                <div><dt>Media ID</dt><dd>{selectedAsset.id}</dd></div>
                <div><dt>Filename</dt><dd>{selectedAsset.filename}</dd></div>
                <div><dt>Copyright ownership</dt><dd>{copyrightOwnership || "unknown"}</dd></div>
                <div><dt>Copyright owner</dt><dd>{copyrightOwner || "Not entered"}</dd></div>
                <div><dt>Photographer</dt><dd>{photographer || "Not entered"}</dd></div>
                <div><dt>Credit</dt><dd>{credit || "Not entered"}</dd></div>
                <div><dt>Credit line</dt><dd>{credit || "Not entered"}</dd></div>
                <div><dt>Licence</dt><dd>{licence || "Not entered"}</dd></div>
                <div><dt>Permission note</dt><dd>{permissionNote || "Not entered"}</dd></div>
                <div><dt>Usage restrictions</dt><dd>{usageRestrictions || "Not entered"}</dd></div>
                <div><dt>Permission date</dt><dd>{permissionReceivedAt || "Not entered"}</dd></div>
                <div><dt>Rights evidence result</dt><dd>{currentRightsResult.valid ? currentRightsResult.evidence.join(", ") : "No valid rights evidence"}</dd></div>
                <div><dt>Metadata persisted</dt><dd>{currentRightsSignature === savedRightsSignature ? "Yes" : "No — save or publish to persist"}</dd></div>
                <div><dt>Publication record</dt><dd>Media ID {selectedAsset.id}</dd></div>
                <div><dt>Blocking field</dt><dd>{currentRightsResult.missingField || "None"}</dd></div>
              </dl>
            </details>
          ) : null}
          <div className="bridge-field-row">
            <label>
              <span>Media Library</span>
              <select value={selectedMediaValue} onChange={(event) => {
                const asset = mediaAssets.find((candidate) => candidate.id === event.target.value);
                if (asset) selectAsset(asset);
              }}>
                {mediaAssets.length === 0 ? <option value="">No media assets yet</option> : null}
                {mediaAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.filename}
                  </option>
                ))}
              </select>
              {selectedAsset ? <small>{selectedAsset.contentType} · {formatBytes(selectedAsset.size)}</small> : null}
            </label>
          </div>
          {storyComposer && mediaAssets.length > 0 ? (
            <div className="bridge-story-media-library" aria-label="Photographs available for this story">
              <div className="bridge-panel-heading">
                <div><strong>Photographs available to add</strong><span>Click a photograph, then choose an action—or drag it to an insertion line in Story Media.</span></div>
                <span>{mediaAssets.length} reusable</span>
              </div>
              <div className="bridge-story-media-shelf">
                {mediaAssets.slice(0, 24).map((asset) => (
                  <button
                    className={asset.id === selectedAsset?.id ? "selected" : ""}
                    draggable
                    key={asset.id}
                    onClick={() => selectAsset(asset)}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "copy";
                      event.dataTransfer.setData("application/x-oldseadogs-media", JSON.stringify(makeSelection(asset)));
                    }}
                    type="button"
                  >
                    <img src={asset.thumbnailUrl || asset.url} alt={asset.alt || asset.filename} />
                    <span>{asset.filename}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <input
            className="bridge-hidden-file-input"
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept={bridgePhotoUploadAccept}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              setSelectedFile(file);
              if (file) void uploadImage(file);
            }}
          />
          <div className="bridge-row-actions">
            <button type="button" disabled={uploading || selectionBusy} onClick={openFilePicker}>Upload New Photo</button>
            <button
              type="button"
              disabled={uploading || selectionBusy || !selectedAsset}
              onClick={() => void (async () => {
                if (!selectedAsset) return;
                setSelectionBusy(true);
                try {
                  await persistMediaMetadata(selectedAsset);
                  setMessage(`Media metadata saved for ${selectedAsset.filename}.`);
                } catch {
                  setMessage(`Could not save image rights details for ${selectedAsset.filename}.`);
                } finally {
                  setSelectionBusy(false);
                }
              })()}
            >
              Save Media Metadata
            </button>
            {storyComposer ? (
              <>
                <button type="button" disabled={uploading || selectionBusy || !selectedAsset} onClick={() => void chooseFromLibrary("featured")}>Set as Featured Image</button>
                <button className="bridge-primary-action" type="button" disabled={uploading || selectionBusy || !selectedAsset || !canInsertInline} onClick={() => void chooseFromLibrary("inline")}>Insert at Cursor</button>
              </>
            ) : (
              <button type="button" disabled={uploading || selectionBusy || !selectedAsset} onClick={() => void chooseFromLibrary()}>
                {imagePlacement === "featured" ? "Use as Featured Image" : "Insert at Cursor"}
              </button>
            )}
            {uploading ? (
              <button type="button" onClick={cancelUpload}>Cancel upload</button>
            ) : null}
            {uploadDiagnostics.error && selectedFile && !uploading ? (
              <button type="button" onClick={() => void uploadImage(selectedFile)}>Retry Upload</button>
            ) : null}
            {currentImage && onRemoveImage ? <button type="button" onClick={() => void onRemoveImage()}>Remove image</button> : null}
          </div>
          {selectedFile || uploadDiagnostics.uploadRequestStarted === "Yes" || uploadDiagnostics.error ? (
            <div className="bridge-upload-diagnostics" aria-live="polite">
              <strong>Upload diagnostics</strong>
              <dl>
                <div>
                  <dt>Selected file</dt>
                  <dd>{uploadDiagnostics.selectedFileName || selectedFile?.name || "No file selected"}</dd>
                </div>
                <div>
                  <dt>MIME type</dt>
                  <dd>{uploadDiagnostics.mimeType || "Not detected"}</dd>
                </div>
                <div>
                  <dt>File size</dt>
                  <dd>{uploadDiagnostics.fileSize || "Not detected"}</dd>
                </div>
                <div>
                  <dt>Upload request started</dt>
                  <dd>{uploadDiagnostics.uploadRequestStarted}</dd>
                </div>
                <div>
                  <dt>API route</dt>
                  <dd>{uploadDiagnostics.apiRoute}</dd>
                </div>
                <div>
                  <dt>HTTP status</dt>
                  <dd>{uploadDiagnostics.httpStatus || "No server response yet"}</dd>
                </div>
                {uploadDiagnostics.responseBody ? (
                  <div>
                    <dt>HTTP response body</dt>
                    <dd>{uploadDiagnostics.responseBody}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Returned media ID</dt>
                  <dd>{uploadDiagnostics.mediaId || "No media ID yet"}</dd>
                </div>
                <div>
                  <dt>Returned media URL</dt>
                  <dd>{uploadDiagnostics.mediaUrl || "No stored URL yet"}</dd>
                </div>
                <div>
                  <dt>Save result</dt>
                  <dd>{uploadDiagnostics.saveResult || "No story save yet"}</dd>
                </div>
                <div>
                  <dt>Preview result</dt>
                  <dd>{uploadDiagnostics.previewResult || "No preview loaded yet"}</dd>
                </div>
                {uploadDiagnostics.error ? (
                  <div>
                    <dt>Error</dt>
                    <dd>{uploadDiagnostics.error}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </>
      ) : null}
      {onAddVideo ? (
        <div className="bridge-video-controls">
          <div className="bridge-field-row thirds">
            <label>
              <span>Video placement</span>
              <select value={videoPlacement} onChange={(event) => setVideoPlacement(event.target.value as VideoSelection["placement"])}>
                <option value="featured video">Featured video</option>
                <option value="inline video">Inline video</option>
                <option value="bottom of story">Bottom of story</option>
              </select>
            </label>
            <label>
              <span>YouTube or Vimeo URL</span>
              <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} />
            </label>
            <label>
              <span>Video credit</span>
              <input value={videoCredit} onChange={(event) => setVideoCredit(event.target.value)} />
            </label>
          </div>
          <label>
            <span>Video caption</span>
            <input value={videoCaption} onChange={(event) => setVideoCaption(event.target.value)} />
          </label>
          <p className="bridge-muted">External video recommended. Local MP4 upload is not enabled yet; Bridge saves video metadata only.</p>
          <div className="bridge-row-actions">
            <button type="button" onClick={() => void addVideo()}>Add Video</button>
          </div>
        </div>
      ) : null}
      {message ? <p className="bridge-save-message">{message}</p> : null}
    </section>
  );
}

function WriteStoryPage({ storyId, mediaId }: { storyId?: string; mediaId?: string }) {
  const query = storyId ? `&id=${encodeURIComponent(storyId)}` : "";
  const { data, loading, error, reload } = useBridgeView<StoryPayload>("story", query);
  const initialStory = storyId ? data?.story ?? null : blankStory();
  const referencedMediaId = initialStory
    ? [initialStory.imageUrl, ...initialStory.body]
        .map((value) => String(value || "").match(/\/api\/media\/([^|?\]#]+)/)?.[1] || "")
        .find(Boolean)
    : "";

  return (
    <>
      <BridgeHeader section="write" eyebrow={storyId ? "Editing story" : "New Story"}>
        {initialStory?.id ? <Link href={`/editor/preview/${initialStory.id}`} target="_blank" className="bridge-secondary-action">Preview</Link> : null}
        {initialStory?.slug ? <Link href={`/stories/${initialStory.slug}`} target="_blank" className="bridge-secondary-action">Preview live</Link> : null}
      </BridgeHeader>
      {loading && storyId ? <LoadingBlock label="Loading full story" /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {storyId && !loading && !initialStory ? (
        <div className="bridge-empty-state">
          <h2>Story not found</h2>
          <p>The requested story could not be loaded into the editor.</p>
        </div>
      ) : null}
      {(!storyId || initialStory) ? (
        <WriteStoryEditor
          initialStory={initialStory ?? blankStory()}
          key={storyId ? initialStory?.id ?? "missing" : "new"}
          media={data?.media ?? []}
          revisions={data?.revisions ?? []}
          initialMediaId={mediaId || referencedMediaId}
          reload={reload}
        />
      ) : null}
    </>
  );
}

function WriteStoryEditor({
  initialStory,
  media,
  revisions,
  initialMediaId,
  reload,
}: {
  initialStory: EditorStory;
  media: MediaAsset[];
  revisions: StoryPayload["revisions"];
  initialMediaId?: string;
  reload: () => void;
}) {
  const [story, setStory] = useState<EditorStory>(() => initialStory);
  const [bodyText, setBodyText] = useState(() => initialStory.body.join("\n\n"));
  const [tagText, setTagText] = useState(() => initialStory.tags.join(", "));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [split, setSplit] = useState(52);
  const [editorialWarnings, setEditorialWarnings] = useState<string[]>([]);
  const [copyrightWarnings, setCopyrightWarnings] = useState<CopyrightWarning[]>([]);
  const [rightsDiagnostics, setRightsDiagnostics] = useState<RightsDiagnostic[]>([]);
  const [rightsOverrideConfirmed, setRightsOverrideConfirmed] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [pendingPublicStatus, setPendingPublicStatus] = useState<"published" | "scheduled">("published");
  const [replaceBlockIndex, setReplaceBlockIndex] = useState<number | null>(null);
  const [selectedStoryMedia, setSelectedStoryMedia] = useState<MediaSelection | null>(() => {
    const asset = initialMediaId
      ? media.find((candidate) => candidate.id === initialMediaId)
      : undefined;
    return asset ? {
      id: asset.id, filename: asset.filename, thumbnailUrl: asset.thumbnailUrl, url: asset.url,
      alt: asset.alt || asset.filename, caption: asset.caption, credit: asset.credit, creditLine: asset.creditLine || asset.credit,
      copyright: asset.copyright, copyrightOwnership: asset.copyrightOwnership || "unknown",
      copyrightOwner: asset.copyrightOwner, photographer: asset.photographer, licence: asset.licence,
      permissionNote: asset.permissionNote, permissionReceivedAt: asset.permissionReceivedAt, usageRestrictions: asset.usageRestrictions,
      location: asset.location, dateTaken: asset.dateTaken,
    } : null;
  });
  const [bodyCursor, setBodyCursor] = useState<number | null>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyCursorRef = useRef<number | null>(null);
  const styleReport = useMemo(() => analyzeOldSeaDogsStyle({
    headline: story.title,
    excerpt: story.summary,
    body: bodyText,
    category: story.category,
  }), [bodyText, story.category, story.summary, story.title]);
  const publicationJunk = useMemo(() => findBannedPublicationPhrases({
    title: story.title,
    summary: story.summary,
    body: bodyText,
  }), [bodyText, story.summary, story.title]);
  const localEditorialWarnings = useMemo(() => getEditorialWarnings({
    ...story,
    body: bodyText,
    status: "published",
  }), [bodyText, story]);
  const displayedEditorialWarnings = editorialWarnings.length ? editorialWarnings : localEditorialWarnings;
  const localCopyrightWarnings = useMemo<CopyrightWarning[]>(() => {
    if (!selectedStoryMedia?.id) return [];
    const result = validateMediaRights(selectedStoryMedia);
    return result.valid ? [] : [{
      message: "Image rights information is incomplete. Confirm your right to publish before continuing.",
      mediaId: selectedStoryMedia.id,
      filename: selectedStoryMedia.filename || selectedStoryMedia.id,
      missingField: result.missingField,
    }];
  }, [selectedStoryMedia]);
  const displayedCopyrightWarnings = copyrightWarnings.length ? copyrightWarnings : localCopyrightWarnings;
  const rewritten = !/\b(press release|email|scrape|generated|automatic watch)\b/i.test(story.sourceType)
    || (styleReport.oldSeaDogsStyleScore >= 55 && styleReport.prLanguageRemaining < 35 && publicationJunk.length === 0);

  const captureBodyCursor = (position: number) => {
    bodyCursorRef.current = position;
    setBodyCursor(position);
  };

  const formatBodySelection = (kind: "bold" | "italic" | "heading" | "bullets" | "numbers" | "link") => {
    const input = bodyInputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    const selected = bodyText.slice(start, end);
    let replacement = selected;
    if (kind === "bold") replacement = `<strong>${selected || "bold text"}</strong>`;
    if (kind === "italic") replacement = `<em>${selected || "italic text"}</em>`;
    if (kind === "heading") replacement = `<h2>${selected || "Section heading"}</h2>`;
    if (kind === "bullets") replacement = `<ul>${(selected || "List item").split(/\n+/).map((line) => `<li>${line}</li>`).join("")}</ul>`;
    if (kind === "numbers") replacement = `<ol>${(selected || "List item").split(/\n+/).map((line) => `<li>${line}</li>`).join("")}</ol>`;
    if (kind === "link") {
      const href = window.prompt("Link URL", "https://");
      if (!href || !/^(https?:\/\/|\/)/i.test(href.trim())) {
        setMessage("Enter a complete http(s) URL or a site path beginning with /.");
        return;
      }
      replacement = `<a href="${href.trim().replaceAll('"', "")}">${selected || "link text"}</a>`;
    }
    const next = `${bodyText.slice(0, start)}${replacement}${bodyText.slice(end)}`;
    setBodyText(next);
    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start, start + replacement.length);
      captureBodyCursor(start + replacement.length);
    });
  };

  const updateStory = (patch: Partial<EditorStory>) => {
    setStory((current) => ({ ...current, ...patch }));
  };

  const toggleSection = (slug: string) => {
    setStory((current) => {
      const primarySlug = oldSeaDogsSections.find((section) => section.label === current.category)?.slug || "news";
      const selected = new Set(current.sectionSlugs?.length ? current.sectionSlugs : [primarySlug]);
      if (selected.has(slug) && slug !== primarySlug) selected.delete(slug);
      else selected.add(slug);
      selected.add(primarySlug);
      return { ...current, sectionSlugs: Array.from(selected) };
    });
  };

  const saveStory = async (status: StoryStatus, confirmOverride = false) => {
    const preservingCurrentStatus = status === story.status;
    setSaving(true);
    setMessage("");
    const body = bodyText
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const tags = tagText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const mediaRightsUpdates = selectedStoryMedia?.id ? [{
            id: selectedStoryMedia.id,
            media: {
              alt: selectedStoryMedia.alt,
              caption: selectedStoryMedia.caption,
              credit: selectedStoryMedia.credit,
              creditLine: selectedStoryMedia.creditLine,
              copyright: selectedStoryMedia.copyright,
              copyrightOwnership: selectedStoryMedia.copyrightOwnership,
              copyrightOwner: selectedStoryMedia.copyrightOwner,
              photographer: selectedStoryMedia.photographer,
              licence: selectedStoryMedia.licence,
              permissionNote: selectedStoryMedia.permissionNote,
              permissionReceivedAt: selectedStoryMedia.permissionReceivedAt,
              usageRestrictions: selectedStoryMedia.usageRestrictions,
              location: selectedStoryMedia.location,
              dateTaken: selectedStoryMedia.dateTaken,
            },
          }] : [];
      const featuredMedia = selectedStoryMedia?.url === story.imageUrl
        ? selectedStoryMedia
        : null;
      const featuredCredit = featuredMedia
        ? [...new Set([
            featuredMedia.credit || featuredMedia.creditLine,
            featuredMedia.copyright,
            featuredMedia.copyrightOwner,
            featuredMedia.photographer,
            featuredMedia.location,
            featuredMedia.dateTaken,
          ]
            .map((value) => String(value || "").trim())
            .filter(Boolean))].join(" · ")
        : story.imageCredit;

      const storyToSave = {
            ...story,
            ...(featuredMedia ? {
              imageAlt: featuredMedia.alt,
              imageCaption: featuredMedia.caption,
              imageCredit: featuredCredit,
            } : {}),
            status,
            body,
            tags,
            publicationOverride: confirmOverride ? {
              confirm: true,
              confirmImageRights: displayedCopyrightWarnings.length > 0 ? rightsOverrideConfirmed : false,
              confirmEditorialWarnings: displayedEditorialWarnings.length > 0,
              editorNote: overrideReason,
            } : undefined,
          };
      const { response, payload } = await saveEditorStoryRequest<{
        story?: EditorStory;
        error?: string;
        editorialWarnings?: string[];
        copyrightWarnings?: CopyrightWarning[];
        rightsDiagnostics?: RightsDiagnostic[];
        mediaPersistenceWarnings?: string[];
        requiresPublicationOverride?: boolean;
      }, EditorStory>({ story: storyToSave, mediaRightsUpdates });
      if (response.status === 409 && payload.requiresPublicationOverride) {
        setEditorialWarnings(Array.isArray(payload.editorialWarnings) ? payload.editorialWarnings : []);
        setCopyrightWarnings(Array.isArray(payload.copyrightWarnings) ? payload.copyrightWarnings : []);
        setRightsDiagnostics(Array.isArray(payload.rightsDiagnostics) ? payload.rightsDiagnostics : []);
        setPendingPublicStatus(status === "scheduled" ? "scheduled" : "published");
        setMessage("Review the publication warnings below, then choose Publish Anyway if you want to continue.");
        return;
      }
      if (!response.ok) throw new Error(payload?.error || "Story could not be saved.");
      if (!payload.story) throw new Error("The story was saved, but the editor did not receive the updated story.");
      setStory(payload.story);
      setBodyText(payload.story.body.join("\n\n"));
      setTagText(payload.story.tags.join(", "));
      setEditorialWarnings(Array.isArray(payload.editorialWarnings) ? payload.editorialWarnings : []);
      setCopyrightWarnings(Array.isArray(payload.copyrightWarnings) ? payload.copyrightWarnings : []);
      setRightsDiagnostics(Array.isArray(payload.rightsDiagnostics) ? payload.rightsDiagnostics : []);
      setRightsOverrideConfirmed(false);
      setOverrideReason("");
      const advisory = payload.editorialWarnings?.length ? " Editorial suggestions were recorded; the story text was not changed." : "";
      setMessage(`${preservingCurrentStatus ? `Changes saved. Story remains ${displayStatus(status)}.` : status === "published" ? "Story published." : status === "scheduled" ? "Story scheduled." : status === "unpublished" ? "Story unpublished." : "Story saved as Draft."}${advisory}`);
      reload();
    } catch (saveError: unknown) {
      setMessage(saveError instanceof Error ? saveError.message : "Story could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const applyWorkflowStatus = async () => {
    const workflow = story.editorialStatus || "Draft";
    if (workflow === "Published" && story.status !== "published") {
      setMessage("Use Publish Now after review; changing workflow cannot publish a story.");
      return;
    }
    const nextStatus: StoryStatus = workflow === "Unpublished" || workflow === "Archived" || workflow === "Rejected"
      ? "unpublished"
      : workflow === "Recoverable"
        ? "draft"
        : workflow === "Scheduled"
          ? "scheduled"
          : story.status;
    if (nextStatus === "unpublished" && story.status === "published" && !window.confirm("Unpublish this live story? This is an explicit public-site visibility change.")) return;
    await saveStory(nextStatus);
  };

  const restoreRevision = async (revisionId: string) => {
    if (!story.id || !window.confirm("Restore this revision? The current published version will be saved as another revision first.")) return;
    setSaving(true);
    setMessage("Restoring revision...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "restoreStoryRevision", id: story.id, revisionId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.story) throw new Error(payload.error || "The revision could not be restored.");
      setStory(payload.story);
      setBodyText(payload.story.body.join("\n\n"));
      setTagText(payload.story.tags.join(", "));
      setMessage("Revision restored. The story remains published at its existing URL.");
      reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The revision could not be restored.");
    } finally {
      setSaving(false);
    }
  };

  const addMediaToStory = (selection: MediaSelection, placement: ImagePlacement) => {
    if (placement === "featured") {
      updateStory({
        imageUrl: selection.url,
        imageAlt: selection.alt,
        imageCaption: selection.caption,
        imageCredit: selection.credit,
      });
      return "Featured image attached locally. Save the story to persist it.";
    }
    const block = inlineImageBlock(selection);
    if (replaceBlockIndex !== null) {
      const next = [...previewParagraphs];
      next[replaceBlockIndex] = block;
      setBodyText(joinStoryBlocks(next));
      setReplaceBlockIndex(null);
      setBodyCursor(null);
      bodyCursorRef.current = null;
      return "Inline image replaced. Save the story to persist it.";
    }
    const insertion = insertStoryBlockAtCursor(bodyText, block, bodyCursorRef.current);
    if (insertion.error) return insertion.error;
    if (insertion.duplicate) return "That photograph is already at this insertion point; no duplicate was added.";
    setBodyText(insertion.value);
    setBodyCursor(null);
    bodyCursorRef.current = null;
    return `Photo inserted after paragraph ${insertion.index}. Save the story to persist it.`;
  };

  const addDraggedMediaToStory = (selection: MediaSelection, index: number) => {
    const insertion = insertStoryBlockAtIndex(bodyText, inlineImageBlock(selection), index);
    if (insertion.duplicate) {
      setMessage("That photograph is already at this insertion line; no duplicate was added.");
      return;
    }
    setBodyText(insertion.value);
    setBodyCursor(null);
    bodyCursorRef.current = null;
    setMessage(`Photo inserted after paragraph ${insertion.index}. Save the story to persist it.`);
  };

  const dropMediaAt = (event: React.DragEvent<HTMLElement>, index: number) => {
    const raw = event.dataTransfer.getData("application/x-oldseadogs-media");
    if (!raw) return;
    event.preventDefault();
    try {
      const selection = JSON.parse(raw) as MediaSelection;
      if (selection.url?.startsWith("/api/media/") || selection.url?.startsWith("data:image/")) addDraggedMediaToStory(selection, index);
    } catch {
      setMessage("That photograph could not be read from the Media Library drag operation.");
    }
  };

  const addVideoToStory = (selection: VideoSelection) => {
    const block = videoBlock(selection);
    setBodyText((current) => {
      const body = current.trim();
      if (selection.placement === "featured video") return [block, body].filter(Boolean).join("\n\n");
      return [body, block].filter(Boolean).join("\n\n");
    });
  };

  const previewParagraphs = splitStoryBlocks(bodyText);

  const setBodyBlocks = (blocks: string[]) => setBodyText(joinStoryBlocks(blocks));
  const moveBodyBlock = (from: number, to: number) => {
    if (to < 0 || to >= previewParagraphs.length) return;
    setBodyText(moveStoryBlock(bodyText, from, to));
    setMessage("Story block moved. Save the story to persist the new order.");
  };

  return (
    <section className="bridge-write-shell" style={{ ["--bridge-editor-width" as string]: `${split}%` }}>
        <div className="bridge-write-toolbar">
          <div className="bridge-segmented" aria-label="Preview size">
            {(["desktop", "tablet", "mobile"] as const).map((device) => (
              <button
                className={previewDevice === device ? "active" : ""}
                key={device}
                onClick={() => setPreviewDevice(device)}
                type="button"
              >
                {device}
              </button>
            ))}
          </div>
          <div className="bridge-segmented" aria-label="Preview theme">
            {(["light", "dark"] as const).map((theme) => (
              <button
                className={previewTheme === theme ? "active" : ""}
                key={theme}
                onClick={() => setPreviewTheme(theme)}
                type="button"
              >
                {theme}
              </button>
            ))}
          </div>
          <label className="bridge-resize-control">
            <span>Split</span>
            <input
              max="68"
              min="38"
              onChange={(event) => setSplit(Number(event.target.value))}
              type="range"
              value={split}
            />
          </label>
        </div>

        <div className="bridge-write-grid">
          <form className="bridge-editor-form" onSubmit={(event) => event.preventDefault()}>
            <div className="bridge-field-row">
              <label>
                <span>Title</span>
                <input value={story.title} onChange={(event) => updateStory({ title: event.target.value })} />
              </label>
              <label>
                <span>Slug</span>
                <input value={story.slug} onChange={(event) => updateStory({ slug: event.target.value })} />
              </label>
            </div>

            <div className="bridge-field-row thirds">
              <label>
                <span>Category</span>
                <select value={story.category} onChange={(event) => {
                  const category = event.target.value;
                  const primarySlug = oldSeaDogsSections.find((section) => section.label === category)?.slug || "news";
                  updateStory({ category, sectionSlugs: Array.from(new Set([primarySlug, ...(story.sectionSlugs || [])])) });
                }}>
                  {oldSeaDogsSections.map((section) => (
                    <option key={section.slug} value={section.label}>{section.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Author</span>
                <input value={story.author} onChange={(event) => updateStory({ author: event.target.value })} />
              </label>
              <label>
                <span>Date</span>
                <input type="date" value={story.date} onChange={(event) => updateStory({ date: event.target.value })} />
              </label>
            </div>

            <fieldset className="bridge-section-selector">
              <legend>Publishing sections</legend>
              <p>Choose every section where this one story should appear. Its URL and story ID stay the same. Front Page placement is controlled only in Homepage Manager.</p>
              <div>
                {oldSeaDogsSections.map((section) => {
                  const primarySlug = oldSeaDogsSections.find((item) => item.label === story.category)?.slug || "news";
                  const checked = (story.sectionSlugs?.length ? story.sectionSlugs : [primarySlug]).includes(section.slug);
                  return <label key={section.slug}><input checked={checked} disabled={section.slug === primarySlug} onChange={() => toggleSection(section.slug)} type="checkbox" /><span>{section.label}{section.slug === primarySlug ? " (primary)" : ""}</span></label>;
                })}
              </div>
            </fieldset>

            <label>
              <span>Strapline</span>
              <textarea
                className="bridge-summary-input"
                value={story.summary}
                onChange={(event) => updateStory({ summary: event.target.value })}
              />
            </label>

            <div className="bridge-article-field">
              <span className="bridge-article-label">Article</span>
              <div className="bridge-formatting-toolbar" aria-label="Story formatting">
                <button onClick={() => formatBodySelection("bold")} type="button"><strong>Bold</strong></button>
                <button onClick={() => formatBodySelection("italic")} type="button"><em>Italic</em></button>
                <button onClick={() => formatBodySelection("heading")} type="button">Heading</button>
                <button onClick={() => formatBodySelection("bullets")} type="button">Bulleted list</button>
                <button onClick={() => formatBodySelection("numbers")} type="button">Numbered list</button>
                <button onClick={() => formatBodySelection("link")} type="button">Link</button>
              </div>
              <label aria-label="Article body">
              <textarea
                className="bridge-body-input"
                ref={bodyInputRef}
                value={bodyText}
                onChange={(event) => { captureBodyCursor(event.currentTarget.selectionStart); setBodyText(event.target.value); }}
                onSelect={(event) => captureBodyCursor(event.currentTarget.selectionStart)}
                onClick={(event) => captureBodyCursor(event.currentTarget.selectionStart)}
                onKeyUp={(event) => captureBodyCursor(event.currentTarget.selectionStart)}
                onBlur={(event) => captureBodyCursor(event.currentTarget.selectionStart)}
                placeholder="Write the story here..."
              />
              </label>
            </div>

            <div className="bridge-story-media-actions">
              <div><strong>Add photographs anywhere in this story</strong><span>Place the article cursor between paragraphs, then upload or choose a reusable image.</span></div>
              <div className="bridge-row-actions">
                <button className="bridge-primary-action" type="button" onClick={() => document.getElementById("story-media-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Add Photo</button>
                <button type="button" onClick={() => document.getElementById("story-media-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Upload New Photo</button>
                <button type="button" onClick={() => document.getElementById("story-media-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Choose from Media Library</button>
              </div>
            </div>

            <section className="bridge-story-blocks" aria-label="Article block order">
              <div className="bridge-panel-heading"><div><p className="eyebrow">Story Media</p><h2>{previewParagraphs.filter((block) => block.startsWith("[image:")).length} inline photo blocks · article order</h2></div><span>Drag to Reorder, Move Up, Move Down, Replace or Remove</span></div>
              {previewParagraphs.map((block, index) => {
                const isMedia = /^\[(?:image|video):/.test(block);
                const image = parseInlineImageBlock(block);
                return <div className="bridge-story-block-wrap" key={`${block}-${index}`}>
                  <div
                    className="bridge-story-drop-line"
                    onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-oldseadogs-media")) event.preventDefault(); }}
                    onDrop={(event) => dropMediaAt(event, index)}
                  >
                    <span>Drop photograph here</span>
                    <button disabled={!selectedStoryMedia} onClick={() => selectedStoryMedia && addDraggedMediaToStory(selectedStoryMedia, index)} type="button">Insert selected photo here</button>
                  </div>
                  <article
                    className={isMedia ? "bridge-story-block media" : "bridge-story-block"}
                    draggable={isMedia}
                    onDragStart={(event) => {
                      if (!isMedia) return;
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("application/x-oldseadogs-story-block", String(index));
                    }}
                    onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-oldseadogs-story-block")) event.preventDefault(); }}
                    onDrop={(event) => {
                      const from = event.dataTransfer.getData("application/x-oldseadogs-story-block");
                      if (!from) return;
                      event.preventDefault();
                      moveBodyBlock(Number(from), index);
                    }}
                  >
                    <span className="bridge-drag-handle" aria-hidden="true">{isMedia ? "⋮⋮" : "¶"}</span>
                    {image ? <img className="bridge-story-block-thumb" src={image.url} alt={image.alt || ""} /> : null}
                    <div>
                      <strong>{isMedia ? image ? "Photograph" : "Video" : `Paragraph ${index + 1}`}</strong>
                      <p>{image ? image.caption || image.alt || "Inline story photograph" : isMedia ? block.replace(/^\[(?:image|video):/, "").replace(/\]$/, "") : block.slice(0, 140)}</p>
                      {image ? <small>{[image.credit, image.copyright, image.location, image.dateTaken].filter(Boolean).join(" · ") || "No credit or location entered"}</small> : null}
                    </div>
                    <div className="bridge-row-actions"><button type="button" disabled={index === 0} onClick={() => moveBodyBlock(index, index - 1)}>Move Up</button><button type="button" disabled={index === previewParagraphs.length - 1} onClick={() => moveBodyBlock(index, index + 1)}>Move Down</button>{image ? <button type="button" onClick={() => { setReplaceBlockIndex(index); setMessage("Choose a Media Library photograph below, then click Insert at Cursor to replace this photograph."); document.getElementById("story-media-panel")?.scrollIntoView({ behavior: "smooth" }); }}>Replace Photo</button> : null}{isMedia ? <button type="button" onClick={() => { setBodyBlocks(previewParagraphs.filter((_, blockIndex) => blockIndex !== index)); setMessage("Media block removed locally. Save the story to persist it."); }}>{image ? "Remove Photo" : "Remove Video"}</button> : null}</div>
                  </article>
                </div>;
              })}
              <div
                className="bridge-story-drop-line"
                onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-oldseadogs-media")) event.preventDefault(); }}
                onDrop={(event) => dropMediaAt(event, previewParagraphs.length)}
              >
                <span>Drop photograph at the end</span>
                <button disabled={!selectedStoryMedia} onClick={() => selectedStoryMedia && addDraggedMediaToStory(selectedStoryMedia, previewParagraphs.length)} type="button">Insert selected photo at the end</button>
              </div>
            </section>

            <div className="bridge-field-row">
              <label>
                <span>Featured image URL</span>
                <input value={story.imageUrl} onChange={(event) => updateStory({ imageUrl: event.target.value })} />
              </label>
              <label>
                <span>Image credit</span>
                <input value={story.imageCredit} onChange={(event) => updateStory({ imageCredit: event.target.value })} />
              </label>
            </div>

            <section className="bridge-editor-details bridge-video-fields" aria-label="Story video">
              <div className="bridge-panel-heading">
                <div><p className="eyebrow">Video</p><h2>Optional story video</h2></div>
                <span className={`bridge-status ${story.videoUrl ? "good" : "neutral"}`}>{story.videoUrl ? "Video set" : "No video"}</span>
              </div>
              <label>
                <span>Video URL</span>
                <input
                  value={story.videoUrl}
                  onChange={(event) => updateStory({ videoUrl: event.target.value })}
                  placeholder="YouTube, TikTok, Vimeo or /api/media/... uploaded video"
                />
              </label>
              <div className="bridge-field-row">
                <label>
                  <span>Video caption</span>
                  <input value={story.videoCaption} onChange={(event) => updateStory({ videoCaption: event.target.value })} />
                </label>
                <label>
                  <span>Video position</span>
                  <select value={story.videoPosition} onChange={(event) => updateStory({ videoPosition: event.target.value as EditorStory["videoPosition"] })}>
                    <option value="">Do not show</option>
                    <option value="top">Top of story</option>
                    <option value="after-intro">After first three paragraphs</option>
                    <option value="bottom">Bottom of story</option>
                  </select>
                </label>
              </div>
              <p className="bridge-muted">Videos never autoplay. Embeds and uploaded-video placeholders resize for phones and tablets.</p>
            </section>

            <div className="bridge-field-row">
              <label>
                <span>Image alt</span>
                <input value={story.imageAlt} onChange={(event) => updateStory({ imageAlt: event.target.value })} />
              </label>
              <label>
                <span>Image caption</span>
                <input value={story.imageCaption} onChange={(event) => updateStory({ imageCaption: event.target.value })} />
              </label>
            </div>

            <BridgeMediaPicker
              assets={media}
              context="Story Media — Add Photo"
              currentAlt={story.imageAlt}
              currentCaption={story.imageCaption}
              currentCredit={story.imageCredit}
              currentImage={story.imageUrl}
              onAddVideo={(selection) => addVideoToStory(selection)}
              onRemoveImage={() => updateStory({ imageUrl: "", imageAlt: "", imageCaption: "", imageCredit: "" })}
              onSelectImage={(selection, placement) => addMediaToStory(selection, placement)}
              initialPlacement="inline"
              initialMediaId={initialMediaId}
              onSelectedMediaChange={setSelectedStoryMedia}
              storyComposer
              canInsertInline={bodyCursor !== null || replaceBlockIndex !== null}
              panelId="story-media-panel"
            />

            <section className="bridge-quality-panel" id="editorial-suggestions" aria-label="Old Sea Dogs editorial quality check">
              <div className="bridge-panel-heading">
                <div><p className="bridge-eyebrow">Pre-publish check</p><h2>Old Sea Dogs writing style</h2></div>
                <span className={`bridge-status ${rewritten ? "good" : "bad"}`}>{rewritten ? "Rewritten: Yes" : "Rewritten: No"}</span>
              </div>
              <div className="bridge-quality-grid">
                <div><span>Word count</span><strong>{styleReport.generatedWordCount}</strong></div>
                <div><span>Style confidence</span><strong>{styleReport.oldSeaDogsStyleScore}%</strong></div>
                <div><span>PR language</span><strong>{styleReport.prLanguageRemaining}%</strong></div>
                <div><span>Email/press junk</span><strong>{publicationJunk.length ? "Warning" : "Clear"}</strong></div>
              </div>
              {styleReport.warnings.length || publicationJunk.length ? (
                <ul className="bridge-quality-warnings">
                  {styleReport.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  {publicationJunk.map((warning) => <li key={warning}>Review “{warning}” before or after publishing.</li>)}
                </ul>
              ) : <p className="bridge-muted">No press-release or email-junk warnings found.</p>}
              {!rewritten ? <p className="bridge-muted">Editorial suggestions are available. You may publish now or review them first.</p> : null}
            </section>

            <section className="bridge-workflow-panel" aria-label="Story workflow">
              <div className="bridge-panel-heading">
                <div><p className="bridge-eyebrow">Newsroom workflow</p><h2>{displayStatus(story.editorialStatus || story.status)}</h2></div>
                <span className={`bridge-status ${statusTone(story.editorialStatus || story.status)}`}>{displayStatus(story.editorialStatus || story.status)}</span>
              </div>
              <div className="bridge-field-row">
                <label>
                  <span>Workflow status</span>
                  <select value={story.editorialStatus || "Draft"} onChange={(event) => updateStory({ editorialStatus: event.target.value })}>
                    {storyWorkflowStatuses.map((workflow) => <option key={workflow} value={workflow}>{workflow}</option>)}
                  </select>
                </label>
                <div className="bridge-workflow-explainer">
                  <strong>Public status: {displayStatus(story.status)}</strong>
                  <span>Workflow changes never publish automatically. Unpublish, Archive and Reject require an explicit visibility change.</span>
                </div>
              </div>
              <div className="bridge-row-actions">
                <button type="button" disabled={saving} onClick={() => void applyWorkflowStatus()}>Apply Workflow Status</button>
              </div>
              <details>
                <summary>Status history ({story.statusHistory.length})</summary>
                <div className="bridge-status-history">
                  {story.statusHistory.map((entry) => (
                    <div key={entry.id}><strong>{entry.toWorkflow || displayStatus(entry.toStatus)}</strong><span>{entry.changedBy} · {formatDateTime(entry.changedAt)}</span><small>{entry.fromWorkflow || entry.fromStatus || "New story"} → {entry.toWorkflow || entry.toStatus}</small></div>
                  ))}
                  {story.statusHistory.length === 0 ? <p className="bridge-muted">No recorded status changes yet.</p> : null}
                </div>
              </details>
              <details>
                <summary>Published revisions ({revisions.length})</summary>
                <div className="bridge-status-history">
                  {revisions.map((revision) => (
                    <div key={revision.id}>
                      <strong>{revision.snapshot.title}</strong>
                      <span>{revision.createdBy} · {formatDateTime(revision.createdAt)}</span>
                      <small>{revision.reason}</small>
                      <button disabled={saving} onClick={() => void restoreRevision(revision.id)} type="button">Restore this revision</button>
                    </div>
                  ))}
                  {revisions.length === 0 ? <p className="bridge-muted">A revision is created automatically before each published-story edit.</p> : null}
                </div>
              </details>
            </section>

            <div className="bridge-field-row">
              <label>
                <span>Tags</span>
                <input value={tagText} onChange={(event) => setTagText(event.target.value)} />
              </label>
              <label>
                <span>Status</span>
                <select value={story.status} onChange={(event) => updateStory({ status: event.target.value as StoryStatus })}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </label>
            </div>

            <details className="bridge-editor-details">
              <summary>Editorial notes</summary>
              <label>
                <span>Old Sea Dogs View</span>
                <textarea value={story.oldSeaDogsView} onChange={(event) => updateStory({ oldSeaDogsView: event.target.value })} />
              </label>
              <label>
                <span>Sources</span>
                <textarea value={story.sourceNotes} onChange={(event) => updateStory({ sourceNotes: event.target.value })} />
              </label>
              <label>
                <span>Source URL</span>
                <input value={story.sourceUrl} onChange={(event) => updateStory({ sourceUrl: event.target.value })} />
              </label>
            </details>

            <details className="bridge-editor-details">
              <summary>SEO and search preview</summary>
              <p className="bridge-muted">The public site continues to use the existing headline, excerpt and noindex fields. These controls edit those same canonical fields without introducing a second SEO record.</p>
              <label>
                <span>SEO title / headline</span>
                <input value={story.title} onChange={(event) => updateStory({ title: event.target.value })} />
              </label>
              <label>
                <span>SEO description / excerpt</span>
                <textarea value={story.summary} onChange={(event) => updateStory({ summary: event.target.value })} />
              </label>
              <label className="bridge-check-row">
                <input checked={story.noindex} onChange={(event) => updateStory({ noindex: event.target.checked })} type="checkbox" />
                Prevent search indexing
              </label>
            </details>

            {story.originalSourceType || story.originalSourceRef || story.originalSourceContent ? (
              <details className="bridge-editor-details">
                <summary>Private original source</summary>
                <p className="bridge-muted">Private newsroom provenance. This content is retained with the story record and is never rendered on public story pages.</p>
                <dl>
                  <div><dt>Format</dt><dd>{story.originalSourceType || "Unspecified"}</dd></div>
                  <div><dt>Reference</dt><dd>{story.originalSourceRef || "Unspecified"}</dd></div>
                </dl>
                <label>
                  <span>Original payload (read-only)</span>
                  <textarea readOnly rows={8} value={story.originalSourceContent} />
                </label>
              </details>
            ) : null}

            <div className="bridge-publish-strip">
              <label>
                <span>Schedule</span>
                <input
                  type="datetime-local"
                  value={dateTimeInputValue(story.scheduledPublishAt)}
                  onChange={(event) => updateStory({ scheduledPublishAt: dateTimeInputToIso(event.target.value) })}
                />
              </label>
              <label className="bridge-check-row">
                <input checked={story.noindex} onChange={(event) => updateStory({ noindex: event.target.checked })} type="checkbox" />
                Noindex
              </label>
              <div className="bridge-save-actions">
                <button className="bridge-primary-action" disabled={saving} onClick={() => void saveStory(story.status)} type="button">Save Changes</button>
                {story.status !== "published" ? <button disabled={saving} onClick={() => void saveStory("draft")} type="button">Save as Draft</button> : null}
                <button disabled={saving || !story.scheduledPublishAt} onClick={() => void saveStory("scheduled")} type="button">Schedule</button>
                <button disabled={saving} onClick={() => void saveStory("published")} type="button">Publish Now</button>
                {story.status === "published" ? <button disabled={saving} onClick={() => { if (window.confirm("Unpublish this story? It will be removed from public pages until explicitly republished.")) void saveStory("unpublished"); }} type="button">Unpublish</button> : null}
              </div>
            </div>
            {displayedEditorialWarnings.length ? (
              <div className="press-warning-box" role="status">
                <strong>Editorial suggestions are available. You may publish now or review them first.</strong>
                <ul className="bridge-quality-warnings">
                  {displayedEditorialWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
                <div className="bridge-row-actions">
                  <button type="button" onClick={() => document.getElementById("editorial-suggestions")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Review Suggestions</button>
                </div>
              </div>
            ) : null}
            {displayedCopyrightWarnings.length ? (
              <div className="press-warning-box" role="status">
                <strong>Image rights warning</strong>
                <span>Image rights information is incomplete.</span>
                {displayedCopyrightWarnings.map((warning) => (
                  <p key={warning.mediaId}>{warning.filename} · media ID {warning.mediaId} · missing: {warning.missingField}</p>
                ))}
                <label className="bridge-check-row">
                  <input
                    checked={rightsOverrideConfirmed}
                    onChange={(event) => setRightsOverrideConfirmed(event.target.checked)}
                    type="checkbox"
                  />
                  I confirm I have the rights to publish this image.
                </label>
                {rightsDiagnostics.map((diagnostic) => (
                  <details key={diagnostic.mediaId}>
                    <summary>Persisted validation record for {diagnostic.filename}</summary>
                    <dl className="bridge-diagnostics-grid">
                      <div><dt>Media ID</dt><dd>{diagnostic.mediaId}</dd></div>
                      <div><dt>Ownership</dt><dd>{diagnostic.copyrightOwnership}</dd></div>
                      <div><dt>Copyright owner</dt><dd>{diagnostic.copyrightOwner || "Not entered"}</dd></div>
                      <div><dt>Photographer</dt><dd>{diagnostic.photographer || "Not entered"}</dd></div>
                      <div><dt>Credit / credit line</dt><dd>{diagnostic.creditLine || diagnostic.credit || "Not entered"}</dd></div>
                      <div><dt>Licence</dt><dd>{diagnostic.licence || "Not entered"}</dd></div>
                      <div><dt>Permission note</dt><dd>{diagnostic.permissionNote || "Not entered"}</dd></div>
                      <div><dt>Usage restrictions</dt><dd>{diagnostic.usageRestrictions || "Not entered"}</dd></div>
                      <div><dt>Permission date</dt><dd>{diagnostic.permissionReceivedAt || "Not entered"}</dd></div>
                      <div><dt>Rights evidence</dt><dd>{diagnostic.rightsEvidenceResult}</dd></div>
                      <div><dt>Validation source</dt><dd>{diagnostic.validationSource}</dd></div>
                      <div><dt>Validation path</dt><dd>{diagnostic.validationPath}</dd></div>
                      <div><dt>Homepage workflow involved</dt><dd>{diagnostic.homepageWorkflowInvolved ? "Yes" : "No"}</dd></div>
                      <div><dt>Persisted</dt><dd>{diagnostic.metadataPersisted ? "Yes" : "No"}</dd></div>
                      <div><dt>Saved before validation</dt><dd>{diagnostic.metadataSavedBeforeValidation ? "Yes" : "No changes submitted"}</dd></div>
                      <div><dt>Validation read same record</dt><dd>{diagnostic.validationRecordMatches ? "Yes" : "No"}</dd></div>
                      <div><dt>Publication rule</dt><dd>{diagnostic.blockingRule || "None (advisory only)"}</dd></div>
                    </dl>
                  </details>
                ))}
              </div>
            ) : null}
            {displayedEditorialWarnings.length || displayedCopyrightWarnings.length ? (
              <div className="press-warning-box" role="group" aria-label="Publication warning override">
                <label>
                  <span>Reason for publishing anyway (optional)</span>
                  <textarea
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                    placeholder="Optional note for the audit trail"
                  />
                </label>
                <button
                  className="bridge-primary-action"
                  disabled={saving || (displayedCopyrightWarnings.length > 0 && !rightsOverrideConfirmed)}
                  onClick={() => void saveStory(pendingPublicStatus, true)}
                  type="button"
                >
                  Publish Anyway
                </button>
              </div>
            ) : null}
            {message ? <p className="bridge-save-message">{message}</p> : null}
          </form>

          <aside className={`bridge-live-preview ${previewDevice} ${previewTheme}`}>
            <article>
              {story.imageUrl ? <img src={story.imageUrl} alt={story.imageAlt || ""} /> : null}
              <p>{story.category || "News"}</p>
              <h2>{story.title || "Untitled story"}</h2>
              <strong>{story.summary || "Standfirst will appear here."}</strong>
              {previewParagraphs.length > 0 ? (
                previewParagraphs.map((paragraph, index) => <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>)
              ) : (
                <p>Article copy will appear here as you write.</p>
              )}
            </article>
          </aside>
        </div>
    </section>
  );
}

function guideSectionsToText(guide: EditorGuide) {
  return guide.sections
    .map((section) => [
      `## ${section.heading}`,
      ...section.body,
      ...(section.links || []).map((link) => `=> ${link.label} | ${link.guideSlug}`),
    ].join("\n\n"))
    .join("\n\n");
}

function guideTextToSections(value: string) {
  const sections: EditorGuide["sections"] = [];
  let current: EditorGuide["sections"][number] | null = null;

  for (const block of value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)) {
    const heading = block.match(/^##\s+(.+)$/);
    if (heading) {
      if (current) sections.push(current);
      const title = heading[1].trim();
      current = {
        heading: title,
        body: [],
        anchor: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        kind: title === "Old Sea Dogs View" ? "callout" : "prose",
        listItems: [],
        links: [],
      };
      continue;
    }
    if (!current) current = { heading: "Guide notes", body: [], anchor: "guide-notes", kind: "prose", listItems: [], links: [] };
    const link = block.match(/^=>\s*(.+?)\s*\|\s*([a-z0-9-]+)$/i);
    if (link) {
      current.links = [...(current.links || []), { label: link[1].trim(), guideSlug: link[2].trim() }];
      continue;
    }
    current.body.push(block);
  }

  if (current) sections.push(current);
  return sections.filter((section) => section.heading && section.body.length > 0);
}

function blankEditorGuide(guideType: GuideType = "Destination"): EditorGuide {
  return {
    internalId: "",
    slug: "",
    title: "",
    eyebrow: "Old Sea Dogs Guides",
    summary: "",
    introduction: "",
    guideType,
    regionKey: "",
    regionName: "",
    subregion: "",
    parentGuideSlug: "",
    editorialOrder: 0,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: new Date().toISOString().slice(0, 10),
    imageUrl: "/images/section-heroes/oldseadogs-destinations.webp",
    imageAlt: "",
    imageFocalPoint: "50% 50%",
    artworkCredit: "",
    quickFacts: [],
    sections: [],
    checklist: [],
    sourceLinks: [],
    location: {},
    relatedGuideSlugs: [],
    cruiseOnGuideSlugs: [],
    previousGuideSlug: "",
    nextGuideSlug: "",
    status: "draft",
    noindex: true,
    showOnHomepage: false,
    homepageOrder: 0,
    seoTitle: "",
    seoDescription: "",
    socialTitle: "",
    socialDescription: "",
    canonicalPath: "",
    editorialNotes: "",
    researchNotes: "",
    reviewDue: "",
    accuracyConcerns: "",
    sourceNotes: "",
    draftComments: "",
    verifiedFacilities: [],
    facilityVerificationNotes: "",
    tags: [],
    wordCount: 0,
    minimumWords: 80,
    quality: "Draft",
    imageCaption: "",
    imageCredit: "",
    featuredMediaId: "",
    inlineImages: [],
  };
}

function guideFactsToText(guide: EditorGuide) {
  return guide.quickFacts.map((fact) => `${fact.label}: ${fact.value}`).join("\n");
}

function guideTextToFacts(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), value: rest.join(":").trim() };
    })
    .filter((fact) => fact.label && fact.value);
}

function guideFacilitiesToText(guide: EditorGuide) {
  return guide.verifiedFacilities
    .map((facility) => `${facility.label} | ${facility.detail} | ${facility.sourceUrl} | ${facility.verifiedOn}`)
    .join("\n");
}

function guideTextToFacilities(value: string) {
  return value.split(/\n+/).map((line) => {
    const [label, detail, sourceUrl, verifiedOn] = line.split("|").map((part) => part.trim());
    return { label, detail, sourceUrl, verifiedOn };
  }).filter((item) => item.label && item.detail && /^https?:\/\//i.test(item.sourceUrl));
}

function GuideEditor({
  guide,
  reload,
  onSaved,
}: {
  guide: EditorGuide;
  reload: () => void;
  onSaved: (slug: string) => void;
}) {
  const [draft, setDraft] = useState<EditorGuide>(() => guide);
  const { data: guideMedia } = useBridgeView<MediaPayload>("media", "&filter=all&page=1&pageSize=60");
  const [bodyText, setBodyText] = useState(() => guideSectionsToText(guide));
  const [factsText, setFactsText] = useState(() => guideFactsToText(guide));
  const [facilitiesText, setFacilitiesText] = useState(() => guideFacilitiesToText(guide));
  const [checklistText, setChecklistText] = useState(() => guide.checklist.join("\n"));
  const [tagText, setTagText] = useState(() => guide.tags.join(", "));
  const [contributorsText, setContributorsText] = useState(() => guide.contributorCredits.join("\n"));
  const [relatedText, setRelatedText] = useState(() => guide.relatedGuideSlugs.join("\n"));
  const [cruiseOnText, setCruiseOnText] = useState(() => guide.cruiseOnGuideSlugs.join("\n"));
  const [sourcesText, setSourcesText] = useState(() => guide.sourceLinks.map((item) => `${item.label} | ${item.href}`).join("\n"));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  const updateGuide = (patch: Partial<EditorGuide>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };
  const setFeaturedGuideImage = (asset: MediaAsset) => updateGuide({ imageUrl: asset.url, imageAlt: asset.alt || asset.displayName, imageCaption: asset.caption, imageCredit: asset.creditLine || asset.credit, featuredMediaId: asset.id });
  const insertGuideImage = (asset: MediaAsset) => updateGuide({ inlineImages: [...draft.inlineImages, { id: `guide-image-${Date.now()}`, mediaId: asset.id, url: asset.url, alt: asset.alt || asset.displayName, caption: asset.caption, credit: asset.creditLine || asset.credit, sectionIndex: 0, paragraphIndex: 0, order: draft.inlineImages.length }] });
  const updateInlineImage = (id: string, patch: Partial<EditorGuide["inlineImages"][number]>) => updateGuide({ inlineImages: draft.inlineImages.map((image) => image.id === id ? { ...image, ...patch } : image) });
  const moveInlineImage = (index: number, offset: number) => { const next = [...draft.inlineImages]; const target = index + offset; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; updateGuide({ inlineImages: next.map((image, order) => ({ ...image, order })) }); };
  const replaceGuideImage = (id: string, mediaId: string) => { const asset = guideMedia?.media.find((item) => item.id === mediaId); if (!asset) return; updateInlineImage(id, { mediaId: asset.id, url: asset.url, alt: asset.alt || asset.displayName, caption: asset.caption, credit: asset.creditLine || asset.credit }); setMessage("Inline guide image replaced. Save Changes to persist it."); };
  const dropGuideImage = (targetIndex: number) => { if (draggedImageIndex === null || draggedImageIndex === targetIndex) return; const next = [...draft.inlineImages]; const [moved] = next.splice(draggedImageIndex, 1); next.splice(targetIndex, 0, moved); updateGuide({ inlineImages: next.map((image, order) => ({ ...image, order })) }); setDraggedImageIndex(null); };
  const previewSections = guideTextToSections(bodyText);

  const saveGuide = async (status = draft.status) => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "saveGuide",
          guide: {
            ...draft,
            status,
            quickFacts: guideTextToFacts(factsText),
            sections: guideTextToSections(bodyText),
            checklist: checklistText.split(/\n+/).map((item) => item.trim()).filter(Boolean),
            tags: tagText.split(",").map((item) => item.trim()).filter(Boolean),
            contributorCredits: contributorsText.split(/\n+/).map((item) => item.trim()).filter(Boolean),
            relatedGuideSlugs: relatedText.split(/\n+/).map((item) => item.trim()).filter(Boolean),
            cruiseOnGuideSlugs: cruiseOnText.split(/\n+/).map((item) => item.trim()).filter(Boolean),
            sourceLinks: sourcesText.split(/\n+/).map((item) => {
              const [label, ...href] = item.split("|");
              return { label: label.trim(), href: href.join("|").trim() };
            }).filter((item) => item.label && item.href),
            verifiedFacilities: guideTextToFacilities(facilitiesText),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Guide could not be saved.");
      setDraft(payload.guide);
      setMessage(status === "published" ? "Guide published." : status === "unpublished" ? "Guide hidden from public pages." : "Guide draft saved.");
      onSaved(payload.guide.slug);
      reload();
    } catch (saveError: unknown) {
      setMessage(saveError instanceof Error ? saveError.message : "Guide could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="bridge-editor-form" onSubmit={(event) => event.preventDefault()}>
      <div className="bridge-field-row">
        <label>
          <span>Title</span>
          <input value={draft.title} onChange={(event) => updateGuide({ title: event.target.value })} />
        </label>
        <label>
          <span>Slug</span>
          <input value={draft.slug} onChange={(event) => updateGuide({ slug: event.target.value })} />
        </label>
      </div>
      <section className="bridge-panel">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Identity</p><h2>Guide identity and collection</h2></div></div>
        <div className="bridge-field-row thirds">
          <label><span>Internal Guide ID</span><input readOnly value={draft.internalId || "Assigned on first save"} /></label>
          <label><span>Guide type</span><select value={draft.guideType} onChange={(event) => updateGuide({ guideType: event.target.value as GuideType })}>{GUIDE_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
          <label><span>Editorial order</span><input min="0" type="number" value={draft.editorialOrder} onChange={(event) => updateGuide({ editorialOrder: Number(event.target.value) })} /></label>
          <label><span>Region key</span><input placeholder="solent" value={draft.regionKey} onChange={(event) => updateGuide({ regionKey: event.target.value })} /></label>
          <label><span>Region name</span><input placeholder="The Solent" value={draft.regionName} onChange={(event) => updateGuide({ regionName: event.target.value })} /></label>
          <label><span>Subregion</span><input value={draft.subregion} onChange={(event) => updateGuide({ subregion: event.target.value })} /></label>
          <label><span>Parent Guide or collection</span><input value={draft.parentGuideSlug} onChange={(event) => updateGuide({ parentGuideSlug: event.target.value })} /></label>
          <label><span>Author</span><input value={draft.author} onChange={(event) => updateGuide({ author: event.target.value })} /></label>
          <label><span>Contributor credits</span><textarea value={contributorsText} onChange={(event) => setContributorsText(event.target.value)} placeholder="One contributor per line" /></label>
        </div>
      </section>
      <section className="bridge-panel">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Guide images</p><h2>Upload or choose guide images</h2></div><Link href="/editor/media">Open full Media Library</Link></div>
        <p className="bridge-muted">The featured image remains separate. Inline images are stored with their exact section and paragraph position.</p>
        <MediaLibraryUploader onUploaded={(assets) => { const asset = assets[0]; if (asset) { setFeaturedGuideImage(asset); setMessage("Featured image uploaded and selected. It was not inserted into the guide body."); } }} />
        <div className="bridge-media-grid">{guideMedia?.media.filter((item) => item.contentType.startsWith("image/")).slice(0, 12).map((asset) => <article key={asset.id}><img src={asset.thumbnailUrl || asset.url} alt={asset.alt || asset.displayName} /><strong>{asset.displayName}</strong><div className="bridge-row-actions"><button type="button" onClick={() => setFeaturedGuideImage(asset)}>Use as Featured Image</button><button type="button" onClick={() => insertGuideImage(asset)}>Insert Here</button></div></article>)}</div>
        {draft.inlineImages.map((image, index) => <article className="bridge-panel" draggable key={image.id} onDragStart={() => setDraggedImageIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropGuideImage(index)}><img src={image.url} alt={image.alt} /><div className="bridge-field-row thirds"><label><span>Section</span><input type="number" min={0} value={image.sectionIndex} onChange={(event) => updateInlineImage(image.id, { sectionIndex: Number(event.target.value) })} /></label><label><span>After paragraph</span><input type="number" min={0} value={image.paragraphIndex} onChange={(event) => updateInlineImage(image.id, { paragraphIndex: Number(event.target.value) })} /></label><label><span>Alt text</span><input value={image.alt} onChange={(event) => updateInlineImage(image.id, { alt: event.target.value })} /></label><label><span>Caption</span><input value={image.caption} onChange={(event) => updateInlineImage(image.id, { caption: event.target.value })} /></label><label><span>Credit</span><input value={image.credit} onChange={(event) => updateInlineImage(image.id, { credit: event.target.value })} /></label><label><span>Replace image</span><select defaultValue="" onChange={(event) => { replaceGuideImage(image.id, event.target.value); event.currentTarget.value = ""; }}><option value="">Choose replacement</option>{guideMedia?.media.filter((item) => item.contentType.startsWith("image/")).map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName || asset.filename}</option>)}</select></label></div><div className="bridge-row-actions"><button type="button" disabled={index === 0} onClick={() => moveInlineImage(index, -1)}>Move Up</button><button type="button" disabled={index === draft.inlineImages.length - 1} onClick={() => moveInlineImage(index, 1)}>Move Down</button><button type="button" onClick={() => updateGuide({ inlineImages: draft.inlineImages.filter((item) => item.id !== image.id) })}>Remove</button></div></article>)}
        <section className="bridge-guide-placement-preview"><div className="bridge-panel-heading"><div><p className="eyebrow">Exact placement preview</p><h2>{draft.title || "Guide preview"}</h2></div><span>Featured image remains above the body</span></div>{previewSections.map((section, sectionIndex) => <section key={`${section.heading}-${sectionIndex}`}><h3>{section.heading}</h3>{section.body.map((paragraph, paragraphIndex) => <div key={`${sectionIndex}-${paragraphIndex}`}><p>{paragraph}</p>{draft.inlineImages.filter((image) => image.sectionIndex === sectionIndex && image.paragraphIndex === paragraphIndex).sort((a, b) => a.order - b.order).map((image) => <figure key={image.id}><img src={image.url} alt={image.alt} /><figcaption>{image.caption}{image.credit ? ` · ${image.credit}` : ""}</figcaption></figure>)}</div>)}</section>)}</section>
      </section>

      <label>
        <span>Strapline</span>
        <textarea className="bridge-summary-input" value={draft.summary} onChange={(event) => updateGuide({ summary: event.target.value })} />
      </label>

      <label>
        <span>Introduction</span>
        <textarea className="bridge-summary-input" value={draft.introduction} onChange={(event) => updateGuide({ introduction: event.target.value })} />
      </label>

      <label>
        <span>Body</span>
        <textarea
          className="bridge-body-input"
          value={bodyText}
          onChange={(event) => setBodyText(event.target.value)}
          placeholder="Use ## headings, paragraphs, and => Link label | guide-slug for Guide links."
        />
      </label>

      {draft.guideType === "Marina" ? (
        <section className="bridge-panel">
          <div className="bridge-panel-heading"><div><p className="eyebrow">Marina verification</p><h2>Verified facilities and open checks</h2></div></div>
          <p className="bridge-muted">
            One verified facility per line: Facility | Stable public detail | Official source URL | YYYY-MM-DD.
            Only entries with an official source URL are saved.
          </p>
          <label><span>Verified facility information</span><textarea value={facilitiesText} onChange={(event) => setFacilitiesText(event.target.value)} /></label>
          <label><span>Internal facility verification notes</span><textarea value={draft.facilityVerificationNotes} onChange={(event) => updateGuide({ facilityVerificationNotes: event.target.value })} placeholder="Not shown publicly. Record omitted facts and checks needed before publication." /></label>
        </section>
      ) : null}

      <section className="bridge-panel">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Location</p><h2>Guide orientation</h2></div></div>
        <p className="bridge-muted">Coordinates are optional for drafts. Published Guides require both values when either is supplied. The public map is click-to-load and for general orientation only.</p>
        <div className="bridge-field-row thirds">
          <label><span>Latitude</span><input min="-90" max="90" step="any" type="number" value={draft.location.latitude ?? ""} onChange={(event) => updateGuide({ location: { ...draft.location, latitude: event.target.value === "" ? undefined : Number(event.target.value) } })} /></label>
          <label><span>Longitude</span><input min="-180" max="180" step="any" type="number" value={draft.location.longitude ?? ""} onChange={(event) => updateGuide({ location: { ...draft.location, longitude: event.target.value === "" ? undefined : Number(event.target.value) } })} /></label>
          <label><span>Map zoom</span><input min="1" max="20" step="1" type="number" value={draft.location.mapZoom ?? ""} onChange={(event) => updateGuide({ location: { ...draft.location, mapZoom: event.target.value === "" ? undefined : Number(event.target.value) } })} /></label>
          <label><span>What3Words</span><input value={draft.location.what3words || ""} onChange={(event) => updateGuide({ location: { ...draft.location, what3words: event.target.value } })} /></label>
          <label><span>OS Grid Reference</span><input value={draft.location.osGridReference || ""} onChange={(event) => updateGuide({ location: { ...draft.location, osGridReference: event.target.value } })} /></label>
        </div>
      </section>

      <section className="bridge-panel">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Relationships</p><h2>Routes onward</h2></div></div>
        <div className="bridge-field-row">
          <label><span>Related Guide slugs</span><textarea value={relatedText} onChange={(event) => setRelatedText(event.target.value)} placeholder="One Guide slug per line" /></label>
          <label><span>Cruise On Guide slugs</span><textarea value={cruiseOnText} onChange={(event) => setCruiseOnText(event.target.value)} placeholder="One Guide slug per line" /></label>
        </div>
        <div className="bridge-field-row">
          <label><span>Previous Guide override</span><input value={draft.previousGuideSlug} onChange={(event) => updateGuide({ previousGuideSlug: event.target.value })} /></label>
          <label><span>Next Guide override</span><input value={draft.nextGuideSlug} onChange={(event) => updateGuide({ nextGuideSlug: event.target.value })} /></label>
        </div>
      </section>

      <div className="bridge-field-row">
        <label>
          <span>SEO title</span>
          <input value={draft.seoTitle} onChange={(event) => updateGuide({ seoTitle: event.target.value })} />
        </label>
        <label>
          <span>Last updated</span>
          <input type="date" value={draft.updatedAt} onChange={(event) => updateGuide({ updatedAt: event.target.value })} />
        </label>
      </div>

      <label>
        <span>SEO description</span>
        <textarea value={draft.seoDescription} onChange={(event) => updateGuide({ seoDescription: event.target.value })} />
      </label>

      <div className="bridge-field-row">
        <label><span>Canonical path</span><input placeholder="/guides/solent/example" value={draft.canonicalPath} onChange={(event) => updateGuide({ canonicalPath: event.target.value })} /></label>
        <label><span>Social title</span><input value={draft.socialTitle} onChange={(event) => updateGuide({ socialTitle: event.target.value })} /></label>
      </div>
      <label><span>Social description</span><textarea value={draft.socialDescription} onChange={(event) => updateGuide({ socialDescription: event.target.value })} /></label>

      <div className="bridge-field-row">
        <label>
          <span>Image URL</span>
          <input value={draft.imageUrl} onChange={(event) => updateGuide({ imageUrl: event.target.value })} />
        </label>
        <label>
          <span>Image alt</span>
          <input value={draft.imageAlt} onChange={(event) => updateGuide({ imageAlt: event.target.value })} />
        </label>
      </div>
      <div className="bridge-field-row thirds">
        <label><span>Hero focal point</span><input placeholder="50% 50%" value={draft.imageFocalPoint} onChange={(event) => updateGuide({ imageFocalPoint: event.target.value })} /></label>
        <label><span>Artwork credit</span><input value={draft.artworkCredit} onChange={(event) => updateGuide({ artworkCredit: event.target.value })} /></label>
        <label><span>Artwork caption</span><input value={draft.imageCaption} onChange={(event) => updateGuide({ imageCaption: event.target.value })} /></label>
      </div>

      <div className="bridge-field-row">
        <label>
          <span>Quick facts</span>
          <textarea value={factsText} onChange={(event) => setFactsText(event.target.value)} />
        </label>
        <label>
          <span>Checklist</span>
          <textarea value={checklistText} onChange={(event) => setChecklistText(event.target.value)} />
        </label>
      </div>

      <div className="bridge-field-row thirds">
        <label>
          <span>Status</span>
          <select value={draft.status} onChange={(event) => updateGuide({ status: event.target.value as EditorGuide["status"] })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </label>
        <label>
          <span>Tags</span>
          <input value={tagText} onChange={(event) => setTagText(event.target.value)} />
        </label>
      </div>

      <section className="bridge-panel">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Internal notes</p><h2>Not shown publicly</h2></div></div>
        <div className="bridge-field-row">
          <label><span>Editorial notes</span><textarea value={draft.editorialNotes} onChange={(event) => updateGuide({ editorialNotes: event.target.value })} /></label>
          <label><span>Research notes</span><textarea value={draft.researchNotes} onChange={(event) => updateGuide({ researchNotes: event.target.value })} /></label>
          <label><span>Accuracy concerns</span><textarea value={draft.accuracyConcerns} onChange={(event) => updateGuide({ accuracyConcerns: event.target.value })} /></label>
          <label><span>Source notes</span><textarea value={draft.sourceNotes} onChange={(event) => updateGuide({ sourceNotes: event.target.value })} /></label>
          <label><span>Draft comments</span><textarea value={draft.draftComments} onChange={(event) => updateGuide({ draftComments: event.target.value })} /></label>
          <label><span>Review due</span><input type="date" value={draft.reviewDue} onChange={(event) => updateGuide({ reviewDue: event.target.value })} /></label>
        </div>
        <label><span>Source links</span><textarea value={sourcesText} onChange={(event) => setSourcesText(event.target.value)} placeholder="Label | https://example.com" /></label>
      </section>

      <div className="bridge-publish-strip">
        <span className={`bridge-status ${draft.wordCount >= draft.minimumWords ? "good" : "bad"}`}>{draft.wordCount} words · {draft.quality}</span>
        <label className="bridge-check-row">
          <input checked={draft.noindex} onChange={(event) => updateGuide({ noindex: event.target.checked })} type="checkbox" />
          Noindex
        </label>
        <div className="bridge-save-actions">
          <button disabled={saving} onClick={() => void saveGuide("draft")} type="button">Save as Draft</button>
          <button disabled={saving} onClick={() => void saveGuide("unpublished")} type="button">Unpublish</button>
          <button disabled={saving} onClick={() => void saveGuide("published")} type="button">Publish Now</button>
        </div>
      </div>

      <div className="bridge-row-actions">
        <Link href={`/editor/preview/guide/${draft.slug}`} target="_blank">Preview</Link>
        {draft.status === "published" ? <Link href={draft.regionKey ? `/guides/${draft.regionKey}/${draft.slug}` : `/guides/${draft.slug}`} target="_blank">Live Guide</Link> : null}
      </div>
      {message ? <p className="bridge-save-message">{message}</p> : null}
    </form>
  );
}

function GuidesPage() {
  const { data, loading, error, reload } = useBridgeView<GuidesPayload>("guides");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [creatingType, setCreatingType] = useState<GuideType>("Destination");

  if (loading) return <LoadingBlock label="Loading guides" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  const activeSlug = selectedSlug || data.guides[0]?.slug || "";
  const selectedGuide = creating
    ? blankEditorGuide(creatingType)
    : data.guides.find((guide) => guide.slug === activeSlug) ?? data.guides[0] ?? null;

  return (
    <>
      <BridgeHeader section="guides" eyebrow="Useful pages for real days afloat" />
      <section className="bridge-stat-grid compact" aria-label="Guide summary">
        <article className="bridge-stat"><span>Guides</span><strong>{formatNumber(data.summary.total)}</strong></article>
        <article className="bridge-stat"><span>Published</span><strong>{formatNumber(data.summary.published)}</strong></article>
        <article className="bridge-stat"><span>Homepage</span><strong>{formatNumber(data.summary.homepage)}</strong></article>
        <article className="bridge-stat"><span>Indexed</span><strong>{formatNumber(data.summary.indexed)}</strong></article>
        <article className="bridge-stat"><span>Thin</span><strong>{formatNumber(data.summary.thin)}</strong></article>
      </section>
      <section className="bridge-dashboard-grid two">
        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Guides</h2>
          </div>
          <div className="bridge-guide-create-actions" aria-label="Create a Guide">
            <button type="button" onClick={() => { setCreatingType("Marina"); setCreating(true); setSelectedSlug(""); }}>Create Marina Guide</button>
            <button type="button" onClick={() => { setCreatingType("Harbour"); setCreating(true); setSelectedSlug(""); }}>Create Harbour Guide</button>
            <button type="button" onClick={() => { setCreatingType("Cruising Area"); setCreating(true); setSelectedSlug(""); }}>Create Cruising Area Guide</button>
            <button type="button" onClick={() => { setCreatingType("Destination"); setCreating(true); setSelectedSlug(""); }}>Create another Guide type</button>
          </div>
          <div className="bridge-activity-list">
            {data.guides.map((guide) => (
              <button
                className={guide.slug === activeSlug ? "active" : ""}
                key={guide.slug}
                onClick={() => { setCreating(false); setSelectedSlug(guide.slug); }}
                type="button"
              >
                <span>{guide.status}{guide.noindex ? " · noindex" : ""}{guide.showOnHomepage ? " · homepage" : ""}</span>
                <strong>{guide.title}</strong>
                <small>{guide.guideType} · {guide.regionName || "No region"} · {guide.author}</small>
                <small>Modified {guide.updatedAt} · editorial order {guide.editorialOrder} · {guide.wordCount} words</small>
              </button>
            ))}
          </div>
        </article>
        <article className="bridge-panel">
          {selectedGuide ? <GuideEditor
            guide={selectedGuide}
            key={`${creating ? `create-${creatingType}` : selectedGuide.slug}-${selectedGuide.updatedAt}-${selectedGuide.wordCount}`}
            reload={reload}
            onSaved={(slug) => { setCreating(false); setSelectedSlug(slug); }}
          /> : null}
        </article>
      </section>
    </>
  );
}

function AuditPage() {
  const { data, loading, error } = useBridgeView<AuditPayload>("audit");
  if (loading) return <LoadingBlock label="Loading editorial audit" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <>
      <BridgeHeader section="audit" />
      <section className="bridge-stat-grid compact" aria-label="Audit summary">
        <article className="bridge-stat"><span>Flagged stories</span><strong>{formatNumber(data.summary.flaggedStories)}</strong></article>
        <article className="bridge-stat"><span>Thin articles</span><strong>{formatNumber(data.summary.thinStories)}</strong></article>
        <article className="bridge-stat"><span>Missing credits</span><strong>{formatNumber(data.summary.missingCredits)}</strong></article>
        <article className="bridge-stat"><span>Weak headlines</span><strong>{formatNumber(data.summary.weakHeadlines)}</strong></article>
      </section>
      <section className="bridge-panel">
        <div className="bridge-audit-list">
          {data.rows.map((row) => (
            <article key={row.story.id}>
              <div>
                <h2>{row.story.title}</h2>
                <p>{row.primaryFix}</p>
                <div className="bridge-flag-list">
                  {row.flags.map((flag) => <span key={flag}>{flag}</span>)}
                </div>
              </div>
              <Link href={`/editor/write?story=${encodeURIComponent(row.story.id)}`}>Fix</Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function EmailPage() {
  const { data, loading, error, reload } = useBridgeView<PressPayload>("press");
  const [rawEmail, setRawEmail] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [rawPreview, setRawPreview] = useState<{ id: string; subject: string; rawEmail: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [folderFilter, setFolderFilter] = useState("Inbox");
  const [dateFilter, setDateFilter] = useState("");

  if (loading) return <LoadingBlock label="Loading email import queue" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  const filteredItems = data.items.filter((item) => {
    const haystack = `${item.subject} ${item.generatedTitle} ${item.senderName} ${item.senderEmail} ${item.preview} ${item.bodyText} ${item.category} ${item.attachments.map((attachment) => attachment.filename).join(" ")}`.toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchesDate = !dateFilter || item.receivedAt.startsWith(dateFilter);
    const matchesFolder =
      folderFilter === "Inbox" ||
      (folderFilter === "Unread" && item.status === "new") ||
      (folderFilter === "Read" && item.status !== "new") ||
      (folderFilter === "Archive" && item.status === "archived") ||
      (folderFilter === "Rejected" && ["rejected", "spam"].includes(item.status));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !["archived", "rejected", "spam"].includes(item.status)) ||
      item.status === statusFilter;
    return matchesSearch && matchesDate && matchesFolder && matchesStatus;
  });
  const activePreview = filteredItems.find((item) => item.id === previewId) ?? filteredItems[0] ?? data.items.find((item) => item.id === previewId) ?? data.items[0] ?? null;
  const unreadCount = data.items.filter((item) => item.status === "new").length;
  const archivedCount = data.items.filter((item) => item.status === "archived").length;

  const importEmail = async () => {
    if (!rawEmail.trim()) {
      setMessage("Paste a press release or upload a .eml file first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await postBridgeAction({
        action: "importPressReleaseEmail",
        pressRelease: {
          rawEmail,
        },
      });
      setRawEmail("");
      setMessage("Email imported for review.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Email could not be imported.");
    } finally {
      setBusy(false);
    }
  };

  const uploadEml = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".eml")) {
      setMessage("Upload a .eml file.");
      return;
    }
    setRawEmail(await file.text());
    setMessage(`${file.name} loaded. Press Import to add it to the queue.`);
  };

  const archiveEmail = async (id: string) => {
    if (!window.confirm("Archive this imported email? It will stay in the private editor store and backups.")) return;
    setBusy(true);
    setMessage("");
    try {
      await postBridgeAction({ action: "markPressRelease", id, pressReleaseStatus: "archived" });
      setSelectedIds((current) => current.filter((item) => item !== id));
      setMessage("Imported email archived. It remains recoverable in the private store and backups.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Imported email could not be archived.");
    } finally {
      setBusy(false);
    }
  };

  const archiveSelectedEmails = async () => {
    if (selectedIds.length === 0) {
      setMessage("No imported emails selected.");
      return;
    }
    if (!window.confirm("Archive selected imported emails? They will stay in the private editor store and backups.")) return;
    setBusy(true);
    setMessage("");
    try {
      const archivedIds = [...selectedIds];
      for (const id of archivedIds) {
        await postBridgeAction({ action: "markPressRelease", id, pressReleaseStatus: "archived" });
      }
      setSelectedIds([]);
      setMessage(`Archived ${archivedIds.length} imported email${archivedIds.length === 1 ? "" : "s"}.`);
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Selected emails could not be archived.");
    } finally {
      setBusy(false);
    }
  };

  const convertToStory = async (id: string) => {
    setBusy(true);
    setMessage("");
    try {
      await postBridgeAction({ action: "generatePressReleaseArticle", id });
      const result = await postBridgeAction<{ story: { id: string; title: string } }>({ action: "savePressReleaseDraft", id });
      window.location.assign(`/editor/write?story=${encodeURIComponent(result.story.id)}`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Imported email could not be converted to a story.");
    } finally {
      setBusy(false);
    }
  };

  const importAttachments = async (id: string) => {
    setBusy(true);
    setMessage("");
    try {
      await postBridgeAction({ action: "importPressReleaseAttachments", id });
      setMessage("Image attachments imported into the Media Library.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Image attachments could not be imported.");
    } finally {
      setBusy(false);
    }
  };

  const previewRawEmail = async (id: string) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/editor?view=pressRaw&id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error || "Raw email could not be loaded.");
      setRawPreview(payload);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Raw email could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  const markProcessed = async (id: string) => {
    setBusy(true);
    try {
      await postBridgeAction({ action: "markPressRelease", id, pressReleaseStatus: "accepted" });
      setMessage("Imported email marked processed. It remains private.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Email status could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const rejectEmail = async (id: string) => {
    if (!window.confirm("Reject this imported email? It stays in the private queue for audit and recovery.")) return;
    setBusy(true);
    try {
      await postBridgeAction({ action: "markPressRelease", id, pressReleaseStatus: "rejected" });
      setMessage("Imported email rejected. It remains private and recoverable.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Email status could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const saveEmailImage = async (item: PressPayload["items"][number], selection: MediaSelection) => {
    await postBridgeAction({
      action: "savePressRelease",
      pressRelease: {
        id: item.id,
        imageUrl: selection.url,
        imageAlt: selection.alt,
        imageCaption: selection.caption,
        imageCredit: selection.credit,
      },
    });
    setMessage("Email image metadata saved.");
    reload();
    return "Email image metadata saved.";
  };

  const addEmailVideo = async (item: PressPayload["items"][number], selection: VideoSelection) => {
    await postBridgeAction({
      action: "savePressRelease",
      pressRelease: {
        id: item.id,
        generatedBody: [...item.generatedBody, videoBlock(selection)],
      },
    });
    setMessage("Video metadata added to the converted story draft.");
    reload();
  };

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds((current) =>
      selected ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  };

  return (
    <>
      <BridgeHeader section="email" />
      <section className="bridge-panel bridge-email-status">
        <div className="bridge-panel-heading">
          <div>
            <p className="eyebrow">Newsroom inbox</p>
            <h2>Email Import</h2>
          </div>
          <span className={`bridge-status ${data.emailIngestion.inboxConfigured ? "good" : "warn"}`}>{data.emailIngestion.inboxConfigured ? "Configured" : "Not Configured"}</span>
        </div>
        <p>{data.emailIngestion.note}</p>
        <dl className="bridge-definition-list compact">
          <div><dt>Connection Status</dt><dd>{data.emailIngestion.connectionStatus === "configured" ? "Configured" : "Not Configured"}</dd></div>
          <div><dt>Connection Test</dt><dd>{data.emailIngestion.connectionTest === "ready" ? "Ready to test" : "Not run"}</dd></div>
          <div><dt>Last Fetch</dt><dd>{formatDateTime(data.emailIngestion.lastFetch)}</dd></div>
          <div><dt>Last Success</dt><dd>{formatDateTime(data.emailIngestion.lastSuccess)}</dd></div>
          <div><dt>Last Error</dt><dd>{data.emailIngestion.lastError || "None recorded"}</dd></div>
          <div><dt>Provider</dt><dd>{data.emailIngestion.provider}</dd></div>
          <div><dt>Folder</dt><dd>{folderFilter}</dd></div>
          <div><dt>Emails Imported</dt><dd>{data.items.length}</dd></div>
          <div><dt>Unread</dt><dd>{unreadCount}</dd></div>
          <div><dt>Archived</dt><dd>{archivedCount}</dd></div>
        </dl>
        <small>{data.emailIngestion.storageDetail}</small>
        <div className="bridge-flag-list">
          <span>Manual paste: ready</span>
          <span>.eml upload: ready</span>
          <span>Inbox fetch: {data.emailIngestion.inboxConfigured ? "configured" : "setup required"}</span>
          <span>{data.emailIngestion.inboxConfigured ? "Server inbox fetch available when connector is active" : `Missing: ${data.emailIngestion.missingEnvironmentKeys.join(", ")}`}</span>
        </div>
        <div className="bridge-row-actions">
          <button type="button" disabled={!data.emailIngestion.inboxConfigured || busy} onClick={() => setMessage("Inbox credentials are present. Live fetch is deliberately disabled in local development until the server connector is tested.")}>Fetch Inbox</button>
          <button type="button" disabled={!data.emailIngestion.inboxConfigured || busy} onClick={() => setMessage("Connection test requires the private server inbox settings; no credentials are needed for paste/upload testing.")}>Connection Test</button>
        </div>
      </section>
      {message ? <p className="bridge-save-message">{message}</p> : null}
      <section className="bridge-panel bridge-email-toolbar">
        <div className="bridge-field-row quarters">
          <label><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Subject, sender, attachment or body" /></label>
          <label><span>Folder</span><select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>{data.emailIngestion.folders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}</select></label>
          <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">Active</option><option value="all">All</option><option value="new">Imported</option><option value="reviewed">Needs Review</option><option value="accepted">Ready</option><option value="converted">Draft</option><option value="published">Published</option><option value="archived">Archived</option><option value="rejected">Rejected</option></select></label>
          <label><span>Date</span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
        </div>
        <div className="bridge-row-actions">
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("active"); setFolderFilter("Inbox"); setDateFilter(""); }}>Clear Filters</button>
          <button type="button" disabled={busy || selectedIds.length === 0} onClick={() => void archiveSelectedEmails()}>Archive selected</button>
        </div>
      </section>
      <section className="bridge-dashboard-grid two">
        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Paste email</h2>
            <button className="bridge-secondary-action" disabled={busy} onClick={() => void importEmail()} type="button">Import email</button>
          </div>
          <label>
            <span>Paste email or press-release text</span>
            <textarea className="bridge-body-input compact" value={rawEmail} onChange={(event) => setRawEmail(event.target.value)} />
          </label>
          <label>
            <span>Upload .eml</span>
            <input type="file" accept=".eml,message/rfc822" onChange={(event) => void uploadEml(event.target.files?.[0])} />
          </label>
        </article>
        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Preview imported email</h2>
            <button className="bridge-secondary-action" disabled={busy || selectedIds.length === 0} onClick={() => void archiveSelectedEmails()} type="button">Archive selected emails</button>
          </div>
          {activePreview ? (
            <div className="bridge-email-preview">
              <span className={`bridge-status ${statusTone(activePreview.status)}`}>{displayStatus(activePreview.status)}</span>
              <h3>{activePreview.generatedTitle || activePreview.subject}</h3>
              <p>{activePreview.generatedExcerpt || activePreview.preview}</p>
              <div className="bridge-flag-list">
                <span>{activePreview.attachmentStatus.importedImages}/{activePreview.attachmentStatus.total} images imported</span>
                <span>{activePreview.generatedWordCount} rewrite words</span>
                <span>{activePreview.category}</span>
              </div>
              <div className="bridge-email-body-preview">
                {(activePreview.generatedBody.length > 0 ? activePreview.generatedBody : [activePreview.bodyText || activePreview.preview]).slice(0, 6).map((paragraph, index) => (
                  <p key={`${activePreview.id}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : <p className="bridge-muted">No imported email selected.</p>}
        </article>
      </section>
      <section className="bridge-card-grid">
        {filteredItems.length === 0 ? <article className="bridge-panel"><h2>No emails match these filters</h2><p className="bridge-muted">Clear filters or import a new email. Nothing in this queue is public.</p></article> : null}
        {filteredItems.map((item) => (
          <article className="bridge-queue-card" key={item.id}>
            <div>
              <label className="bridge-check-row">
                <input checked={selectedIds.includes(item.id)} onChange={(event) => toggleSelected(item.id, event.target.checked)} type="checkbox" />
                <span className={`bridge-status ${statusTone(item.status)}`}>{displayStatus(item.status)}</span>
              </label>
              <span>{item.attachmentStatus.importedImages}/{item.attachmentStatus.total} images</span>
            </div>
            <h2>{item.generatedTitle || item.subject}</h2>
            <p>{item.generatedExcerpt || item.preview}</p>
            <small>{item.senderName || item.senderEmail} · {formatDateTime(item.receivedAt)}</small>
            {item.storyId ? <small>Linked to a full Bridge story editor draft.</small> : <small>Convert to story to use the full headline, strapline, body, media, SEO, author, category, preview and publishing workflow.</small>}
            {item.attachments.length > 0 ? (
              <div className="bridge-attachment-list">
                {item.attachments.map((attachment) => (
                  <span key={attachment.id}>
                    <strong>{attachment.filename}</strong>
                    {attachment.contentType || "attachment"} · {attachment.status}
                    {attachment.url ? <a href={attachment.url} target="_blank" rel="noreferrer">Preview / Download</a> : null}
                  </span>
                ))}
              </div>
            ) : null}
            <BridgeMediaPicker
              assets={data.media}
              context="Email media"
              currentCredit={item.imageCredit}
              currentImage={item.imageUrl}
              onAddVideo={(selection) => addEmailVideo(item, selection)}
              onSelectImage={(selection) => saveEmailImage(item, selection)}
            />
            <div className="bridge-row-actions">
              <button type="button" onClick={() => setPreviewId(item.id)}>Preview</button>
              <button type="button" disabled={busy} onClick={() => void previewRawEmail(item.id)}>Preview Raw Email</button>
              <button type="button" disabled={busy || item.attachmentStatus.pendingImages === 0} onClick={() => void importAttachments(item.id)}>Import image attachments</button>
              <button type="button" disabled={busy} onClick={() => void convertToStory(item.id)}>Convert to story</button>
              <button type="button" disabled={busy} onClick={() => void markProcessed(item.id)}>Mark Processed</button>
              <button type="button" disabled={busy} onClick={() => void rejectEmail(item.id)}>Reject</button>
              <button type="button" disabled={busy} onClick={() => void archiveEmail(item.id)}>Archive</button>
              {item.storyId ? <Link href={`/editor/write?story=${encodeURIComponent(item.storyId)}`}>Open linked story</Link> : null}
            </div>
          </article>
        ))}
      </section>
      {rawPreview ? <section className="bridge-panel"><div className="bridge-panel-heading"><h2>Raw email: {rawPreview.subject}</h2><button type="button" onClick={() => setRawPreview(null)}>Close</button></div><pre className="bridge-raw-email">{rawPreview.rawEmail}</pre></section> : null}
    </>
  );
}

type LibraryUploadRow = { name: string; status: "waiting" | "uploading" | "complete" | "failed"; message: string };

function MediaLibraryUploader({ onUploaded }: { onUploaded: (assets: MediaAsset[]) => void | Promise<void> }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<LibraryUploadRow[]>([]);
  const [busy, setBusy] = useState(false);

  const uploadFiles = async (files: File[]) => {
    const accepted = files.filter((file) => photoContentType(file) && file.size > 0 && file.size <= bridgeMaxPhotoUploadBytes);
    const rejected = files.filter((file) => !accepted.includes(file));
    setRows([
      ...accepted.map((file) => ({ name: file.name, status: "waiting" as const, message: "Waiting" })),
      ...rejected.map((file) => ({ name: file.name, status: "failed" as const, message: `Use JPG, PNG or WebP under ${bridgeMaxPhotoUploadMb} MB.` })),
    ]);
    if (accepted.length === 0) return;
    setBusy(true);
    const uploaded: MediaAsset[] = [];
    for (let index = 0; index < accepted.length; index += 1) {
      const file = accepted[index];
      setRows((current) => current.map((row) => row.name === file.name ? { ...row, status: "uploading", message: `Uploading ${index + 1} of ${accepted.length}` } : row));
      try {
        const form = new FormData();
        form.append("action", bridgeMediaUploadAction);
        form.append("photo", file);
        form.append("alt", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
        const response = await fetch(bridgeMediaUploadEndpoint, { method: "POST", body: form });
        const payload = await response.json() as { error?: string; media?: MediaAsset };
        if (!response.ok || !payload.media) throw new Error(payload.error || "Upload failed.");
        uploaded.push({ ...payload.media, thumbnailUrl: payload.media.thumbnailUrl || `/api/media/${payload.media.id}?variant=thumbnail` });
        setRows((current) => current.map((row) => row.name === file.name ? { ...row, status: "complete", message: "Uploaded successfully" } : row));
        await onUploaded([uploaded[uploaded.length - 1]]);
      } catch (error) {
        setRows((current) => current.map((row) => row.name === file.name ? { ...row, status: "failed", message: error instanceof Error ? error.message : "Upload failed." } : row));
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const completed = rows.filter((row) => row.status === "complete").length;
  return <section className="bridge-panel bridge-library-upload">
    <div className="bridge-panel-heading">
      <div><p className="eyebrow">Add to Media Library</p><h2>Upload photographs</h2></div>
      <button className="bridge-primary-action" disabled={busy} type="button" onClick={() => inputRef.current?.click()}>Upload Photos</button>
    </div>
    <div
      className={`bridge-upload-dropzone ${dragging ? "dragging" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(Array.from(event.dataTransfer.files)); }}
    >
      <strong>Drag and drop photos here</strong>
      <span>Upload several JPG, PNG or WebP files at once. Originals are preserved.</span>
      <button disabled={busy} type="button" onClick={() => inputRef.current?.click()}>Choose Files</button>
      <input ref={inputRef} id={inputId} className="bridge-hidden-file-input" type="file" accept={bridgePhotoUploadAccept} multiple onChange={(event) => void uploadFiles(Array.from(event.currentTarget.files || []))} />
    </div>
    {rows.length > 0 ? <div className="bridge-upload-queue" aria-live="polite">
      <progress max={rows.length} value={completed} />
      {rows.map((row, index) => <div key={`${row.name}-${index}`}><strong>{row.name}</strong><span className={`bridge-status ${row.status === "complete" ? "good" : row.status === "failed" ? "bad" : "neutral"}`}>{row.message}</span></div>)}
    </div> : null}
  </section>;
}

function MediaPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [message, setMessage] = useState("");
  const [uploaded, setUploaded] = useState<MediaAsset[]>([]);
  const [storyId, setStoryId] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collectionName, setCollectionName] = useState("");
  const [renameCollection, setRenameCollection] = useState("");
  const ownershipFilters = [
    ["ownership:michael-hodges", "Michael Hodges Photos"],
    ["ownership:third-party", "Third-Party Photos"],
    ["ownership:press-supplied", "Press / Supplied"],
    ["ownership:licensed", "Licensed"],
    ["ownership:public-domain", "Public Domain"],
    ["ownership:unknown", "Unknown Rights"],
  ] as const;
  const suggestedCollections = ["Michael Hodges Originals", "Cowes Week", "Round the Island Race", "Classic Yachts", "Motor Yachts", "Marinas", "Yacht Clubs", "Boat Shows", "Through the Lens", "Press Images"];
  const viewQuery = `&q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}&page=${page}&pageSize=36`;
  const { data, loading, error, reload } = useBridgeView<MediaPayload>("media", viewQuery);
  const saveMetadata = async () => {
    if (!selected) return;
    await postBridgeAction({ action: "updateMedia", id: selected.id, media: selected });
    setMessage("Save Changes confirmed. The stored media URL and physical file were not changed.");
    reload();
  };
  const addToGallery = async () => {
    if (!selected) return;
    await postBridgeAction({ action: "saveGalleryItem", galleryItem: {
      mediaId: selected.id, sourceType: selected.sourceType || "upload", title: selected.filename,
      caption: selected.caption, alt: selected.alt, credit: selected.credit, copyright: selected.copyright,
      location: selected.location, dateTaken: selected.dateTaken, status: "pending",
    } });
    setMessage("Added to Through the Lens for review. Nothing has been published.");
    reload();
  };
  const attachToStory = async () => {
    if (!selected || !storyId) { setMessage("Choose a story first."); return; }
    await postBridgeAction({ action: "saveStoryImage", id: storyId, imageUrl: selected.url, imageAlt: selected.alt, imageCredit: selected.credit, imageCaption: selected.caption });
    setMessage("Photograph set as the selected story's featured image. It was not inserted into the article.");
  };
  const deleteSelected = async () => {
    if (!selected || !window.confirm(`Delete “${selected.filename}” permanently? This is allowed only when it is unused.`)) return;
    try {
      await postBridgeAction({ action: "deleteMedia", id: selected.id });
      setUploaded((current) => current.filter((item) => item.id !== selected.id));
      setSelected(null); setMessage("Unused media item deleted."); reload();
    } catch (deleteError) { setMessage(deleteError instanceof Error ? deleteError.message : "Media item could not be deleted."); }
  };
  if (loading) return <LoadingBlock label="Loading media library" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;
  const visibleMedia = mergeMediaAssets(uploaded, data.media);
  const createCollection = async () => { if (!collectionName.trim()) return; await postBridgeAction({ action: "createMediaCollection", collection: collectionName.trim() }); setMessage("Collection created."); setCollectionName(""); reload(); };
  const addSelectedToCollection = async () => { if (!collectionName.trim() || selectedIds.length === 0) { setMessage("Select media and enter a collection name first."); return; } await postBridgeAction({ action: "bulkAddMediaCollection", ids: selectedIds, collection: collectionName.trim() }); setMessage(`${selectedIds.length} selected item(s) added without duplicating files.`); setSelectedIds([]); reload(); };
  const removeSelectedFromCollection = async () => { const collection = filter.startsWith("collection:") ? filter.slice("collection:".length) : collectionName.trim(); if (!collection || selectedIds.length === 0) { setMessage("Filter by a collection and select the media to remove first."); return; } await postBridgeAction({ action: "bulkRemoveMediaCollection", ids: selectedIds, collection }); setMessage(`${selectedIds.length} selected item(s) removed from ${collection}. No files were deleted.`); setSelectedIds([]); reload(); };
  const renameExistingCollection = async () => { if (!filter.startsWith("collection:") || !renameCollection.trim()) { setMessage("Filter by the collection you want to rename first."); return; } await postBridgeAction({ action: "renameMediaCollection", collection: filter.slice("collection:".length), replacementCollection: renameCollection.trim() }); setFilter(`collection:${renameCollection.trim()}`); setRenameCollection(""); setMessage("Collection renamed."); reload(); };
  const deleteEmptyCollection = async () => { if (!filter.startsWith("collection:")) { setMessage("Filter by an empty collection first."); return; } try { await postBridgeAction({ action: "deleteMediaCollection", collection: filter.slice("collection:".length) }); setFilter("all"); setMessage("Empty collection deleted."); reload(); } catch (deleteError) { setMessage(deleteError instanceof Error ? deleteError.message : "Collection could not be deleted."); } };

  return (
    <>
      <BridgeHeader section="media" />
      <MediaLibraryUploader onUploaded={(assets) => { setUploaded((current) => mergeMediaAssets(assets, current)); setMessage(`${assets.length} photo${assets.length === 1 ? "" : "s"} uploaded and ready to use.`); }} />
      <section className="bridge-panel bridge-media-toolbar">
        <label><span>Search</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Filename, caption, credit, location…" /></label>
        <label><span>Filter</span><select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
          <option value="all">All media</option><option value="recent">Recently uploaded</option><option value="featured">Featured images</option>
          <option value="unused">Unused images</option><option value="story">Story images</option><option value="gallery">Gallery images</option>
          <option value="instagram">Instagram images</option><option value="videos">Videos</option>
          <option value="ownership:michael-hodges">My Photos — © Michael Hodges</option><option value="ownership:third-party">Third-Party Photos</option>
          <option value="ownership:press-supplied">Press / Supplied Images</option><option value="ownership:unknown">Unknown Rights</option>
          <option value="ownership:licensed">Licensed Images</option><option value="ownership:public-domain">Public Domain</option>
          {data.collections.map((name) => <option key={name} value={`collection:${name}`}>{name}</option>)}
        </select></label>
      </section>
      <section className="bridge-panel"><div className="bridge-panel-heading"><div><p className="eyebrow">Copyright Ownership</p><h2>Photo ownership filters</h2></div><span>Required on every photograph</span></div><div className="bridge-filter-tabs" role="group" aria-label="Copyright ownership filters">{ownershipFilters.map(([value, label]) => <button className={filter === value ? "active" : ""} key={value} onClick={() => { setFilter(value); setPage(1); }} type="button">{label}</button>)}</div></section>
      <section className="bridge-panel bridge-media-toolbar"><label><span>Collection name</span><input list="bridge-suggested-collections" value={collectionName} onChange={(event) => setCollectionName(event.target.value)} placeholder="Cowes Week" /><datalist id="bridge-suggested-collections">{suggestedCollections.map((name) => <option key={name} value={name} />)}</datalist></label><div className="bridge-row-actions"><button type="button" onClick={() => void createCollection()}>Create Collection</button><button type="button" onClick={() => void addSelectedToCollection()}>Add selected to Collection</button><button type="button" onClick={() => void removeSelectedFromCollection()}>Remove selected from Collection</button></div><label><span>Rename filtered collection</span><input value={renameCollection} onChange={(event) => setRenameCollection(event.target.value)} /></label><div className="bridge-row-actions"><button type="button" onClick={() => void renameExistingCollection()}>Rename Collection</button><button type="button" onClick={() => void deleteEmptyCollection()}>Delete Empty Collection</button></div><div className="bridge-collection-suggestions"><strong>Suggested collections</strong>{suggestedCollections.map((name) => <button key={name} onClick={() => setCollectionName(name)} type="button">{name}</button>)}</div></section>
      <div className="bridge-pager"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>{data.pagination.total} media · {data.pagination.page} / {data.pagination.pageCount}</span><button type="button" disabled={page >= data.pagination.pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      <section className="bridge-media-grid">
        {visibleMedia.map((item) => (
          <article key={item.id} onClick={() => setSelected(item)} role="button" tabIndex={0}>
            <label className="bridge-check-row" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} /> Select</label>
            <img src={item.thumbnailUrl || item.url} alt={item.alt || item.filename} loading="lazy" />
            <div>
              <strong>{item.displayName || item.filename}</strong>
              <small>{item.sourceType} · {item.width && item.height ? `${item.width}×${item.height} · ` : ""}{formatBytes(item.size)}</small>
            </div>
            <button type="button" onClick={(event) => { event.stopPropagation(); setSelected(item); }}>Rename / Edit</button>
          </article>
        ))}
      </section>
      {selected ? <section className="bridge-panel bridge-media-details">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Rename</p><h2>Edit media details</h2></div><button type="button" onClick={() => setSelected(null)}>Cancel</button></div>
        <div className="bridge-field-row thirds">
          <label><span>Display name</span><input value={selected.displayName} onChange={(event) => setSelected({ ...selected, displayName: event.target.value })} /></label>
          <label><span>Original filename (audit)</span><input readOnly value={selected.originalFilename} /></label>
          <label><span>Original filename metadata</span><input value={selected.filename} onChange={(event) => setSelected({ ...selected, filename: event.target.value })} /></label>
          <label><span>Internal title</span><input value={selected.internalTitle} onChange={(event) => setSelected({ ...selected, internalTitle: event.target.value })} /></label>
          <label><span>Alt text</span><input value={selected.alt} onChange={(event) => setSelected({ ...selected, alt: event.target.value })} /></label>
          <label><span>Caption</span><input value={selected.caption} onChange={(event) => setSelected({ ...selected, caption: event.target.value })} /></label>
          <label><span>Copyright Ownership (required)</span><select required value={selected.copyrightOwnership} onChange={(event) => setSelected({ ...selected, copyrightOwnership: event.target.value })}><option value="michael-hodges">© Michael Hodges</option><option value="third-party">Third-party / not owned by Michael Hodges</option><option value="press-supplied">Press / supplied image</option><option value="licensed">Licensed</option><option value="public-domain">Public domain</option><option value="unknown">Unknown rights</option><option value="do-not-publish">Do Not Publish</option></select></label>
          <label><span>Copyright Owner</span><input value={selected.copyrightOwner} onChange={(event) => setSelected({ ...selected, copyrightOwner: event.target.value })} /></label>
          <label><span>Photographer</span><input value={selected.photographer} onChange={(event) => setSelected({ ...selected, photographer: event.target.value })} /></label>
          <label><span>Source</span><input value={selected.source} onChange={(event) => setSelected({ ...selected, source: event.target.value })} /></label>
          <label><span>Licence</span><input value={selected.licence} onChange={(event) => setSelected({ ...selected, licence: event.target.value })} /></label>
          <label><span>Credit Line</span><input value={selected.creditLine} onChange={(event) => setSelected({ ...selected, creditLine: event.target.value, credit: event.target.value })} /></label>
          <label><span>Permission note</span><input value={selected.permissionNote} onChange={(event) => setSelected({ ...selected, permissionNote: event.target.value })} /></label>
          <label><span>Usage restrictions</span><input value={selected.usageRestrictions} onChange={(event) => setSelected({ ...selected, usageRestrictions: event.target.value })} /></label>
          <label><span>Date permission received</span><input type="date" value={selected.permissionReceivedAt.slice(0, 10)} onChange={(event) => setSelected({ ...selected, permissionReceivedAt: event.target.value })} /></label>
          <label><span>Location</span><input value={selected.location} onChange={(event) => setSelected({ ...selected, location: event.target.value })} /></label>
          <label><span>Date taken</span><input type="date" value={selected.dateTaken.slice(0, 10)} onChange={(event) => setSelected({ ...selected, dateTaken: event.target.value })} /></label>
          <label><span>Category</span><input value={selected.category} onChange={(event) => setSelected({ ...selected, category: event.target.value })} placeholder="Classic Yachts, Regattas…" /></label>
          <label><span>Tags</span><input value={parseJsonStringList(selected.tagsJson).join(", ")} onChange={(event) => setSelected({ ...selected, tagsJson: JSON.stringify(event.target.value.split(",").map((value) => value.trim()).filter(Boolean)) })} /></label>
          <label><span>Collections</span><input value={parseJsonStringList(selected.collectionsJson).join(", ")} onChange={(event) => setSelected({ ...selected, collectionsJson: JSON.stringify(event.target.value.split(",").map((value) => value.trim()).filter(Boolean)) })} /></label>
          {selected.contentType.startsWith("video/") || selected.externalUrl ? <>
            <label><span>Alt / description text</span><input value={selected.description} onChange={(event) => setSelected({ ...selected, description: event.target.value, alt: event.target.value })} /></label>
            <label><span>Poster image</span><select value={selected.posterMediaId} onChange={(event) => setSelected({ ...selected, posterMediaId: event.target.value })}><option value="">No poster selected</option>{visibleMedia.filter((item) => item.contentType.startsWith("image/")).map((item) => <option key={item.id} value={item.id}>{item.displayName || item.filename}</option>)}</select></label>
            <label><span>Story association</span><select value={selected.storyAssociationId} onChange={(event) => setSelected({ ...selected, storyAssociationId: event.target.value })}><option value="">No story</option>{data.stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}</select></label>
            <label><span>Gallery association</span><input value={selected.galleryAssociationId} onChange={(event) => setSelected({ ...selected, galleryAssociationId: event.target.value })} placeholder="Gallery record ID" /></label>
          </> : null}
        </div>
        <div className="bridge-story-attach-controls">
          <label><span>Use in story</span><select value={storyId} onChange={(event) => setStoryId(event.target.value)}><option value="">Choose a story</option>{data.stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}</select></label>
          <div className="bridge-row-actions">
            {storyId ? <Link className="bridge-primary-action" href={`/editor/write?story=${encodeURIComponent(storyId)}&media=${encodeURIComponent(selected.id)}`}>Open Story to Place Photo</Link> : <button disabled type="button">Open Story to Place Photo</button>}
            <button disabled={!storyId} type="button" onClick={() => void attachToStory()}>Set as Featured Image</button>
          </div>
        </div>
        <div className="bridge-row-actions"><button type="button" onClick={() => void saveMetadata()}>Save Changes</button><button type="button" onClick={() => setSelected(null)}>Cancel</button><button type="button" disabled={Boolean(selected.galleryItemId)} onClick={() => void addToGallery()}>{selected.galleryItemId ? "Already in gallery review" : "Add to Through the Lens review"}</button><button className="bridge-danger-action" type="button" onClick={() => void deleteSelected()}>Delete Photo</button></div>
        {message ? <p className="bridge-save-message">{message}</p> : null}
      </section> : null}
    </>
  );
}

const galleryTabs: Array<{ view: GalleryView; label: string; href: string }> = [
  { view: "dashboard", label: "Gallery Dashboard", href: "/editor/through-the-lens" },
  { view: "pending", label: "Pending Review", href: "/editor/through-the-lens/pending" },
  { view: "approved", label: "Approved", href: "/editor/through-the-lens/approved" },
  { view: "rejected", label: "Rejected", href: "/editor/through-the-lens/rejected" },
  { view: "categories", label: "Categories", href: "/editor/through-the-lens/categories" },
  { view: "instagram", label: "Instagram Imports", href: "/editor/through-the-lens/instagram" },
  { view: "settings", label: "Gallery Settings", href: "/editor/through-the-lens/settings" },
];

function GalleryPage({ view = "dashboard" }: { view?: GalleryView }) {
  const { data, loading, error, reload } = useBridgeView<GalleryPayload>("gallery");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [connectionConfirmed, setConnectionConfirmed] = useState(false);
  if (loading) return <LoadingBlock label="Loading Through the Lens" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;
  const visibleItems = view === "pending" || view === "approved" || view === "rejected"
    ? data.items.filter((item) => item.status === view)
    : data.items;
  const syncInstagram = async () => {
    setBusy(true); setMessage("");
    try {
      const result = await postBridgeAction<{ result: { imported: number; skipped: number } }>({ action: "syncInstagram" });
      setMessage(`${result.result.imported} new Instagram image(s) added to the review queue; ${result.result.skipped} skipped.`);
      reload();
    } catch (syncError) { setMessage(syncError instanceof Error ? syncError.message : "Instagram sync failed."); }
    finally { setBusy(false); }
  };
  const testInstagram = async () => {
    setBusy(true); setMessage("");
    try { const response = await postBridgeAction<{ result: { username: string } }>({ action: "testInstagram" }); setConnectionConfirmed(true); setMessage(`Connection confirmed${response.result.username ? ` for @${response.result.username}` : ""}. No images were imported.`); }
    catch (testError) { setConnectionConfirmed(false); setMessage(testError instanceof Error ? testError.message : "Connection test failed."); }
    finally { setBusy(false); }
  };
  const refreshInstagram = async () => {
    setBusy(true); setMessage("");
    try { await postBridgeAction({ action: "refreshInstagramToken" }); setMessage("Instagram token refreshed securely."); reload(); }
    catch (refreshError) { setMessage(refreshError instanceof Error ? refreshError.message : "Token refresh failed."); }
    finally { setBusy(false); }
  };
  const disconnectInstagram = async () => {
    if (!window.confirm("Disconnect this account? Existing imports and gallery records will be kept.")) return;
    setBusy(true); setMessage("");
    try { await postBridgeAction({ action: "disconnectInstagram" }); setConnectionConfirmed(false); setMessage("Instagram disconnected. Existing imports were preserved."); reload(); }
    catch (disconnectError) { setMessage(disconnectError instanceof Error ? disconnectError.message : "Disconnect failed."); }
    finally { setBusy(false); }
  };
  const addCategory = async () => {
    if (!categoryName.trim()) return;
    await postBridgeAction({ action: "saveGalleryCategory", galleryCategory: { name: categoryName } });
    setCategoryName(""); reload();
  };
  const addUploadsToGallery = async (assets: MediaAsset[]) => {
    setBusy(true);
    try {
      for (const asset of assets) {
        await postBridgeAction({ action: "saveGalleryItem", galleryItem: { mediaId: asset.id, sourceType: "upload", title: asset.filename, alt: asset.alt, status: "pending" } });
      }
      setMessage(`${assets.length} uploaded photo${assets.length === 1 ? "" : "s"} added to Pending Review.`);
      reload();
    } finally { setBusy(false); }
  };
  const saveItem = async (item: GalleryItem) => {
    setBusy(true);
    try { await postBridgeAction({ action: "saveGalleryItem", galleryItem: item }); setMessage("Gallery review item saved."); setEditing(null); reload(); }
    catch (saveError) { setMessage(saveError instanceof Error ? saveError.message : "Gallery item could not be saved."); }
    finally { setBusy(false); }
  };
  return <>
    <BridgeHeader section="gallery" eyebrow="CMS review only — no public rollout">
      <button type="button" disabled={busy || !data.connector.configured} onClick={() => void testInstagram()}>Test Connection</button>
    </BridgeHeader>
    <nav className="bridge-gallery-tabs" aria-label="Through the Lens sections">{galleryTabs.map((tab) => <Link className={view === tab.view ? "active" : ""} href={tab.href} key={tab.view}>{tab.label}</Link>)}</nav>
    {view === "dashboard" || view === "pending" ? <MediaLibraryUploader onUploaded={(assets) => void addUploadsToGallery(assets)} /> : null}
    {view === "dashboard" ? <section className="bridge-stat-grid">
      <article className="bridge-stat"><span>Pending Review</span><strong>{data.items.filter((item) => item.status === "pending").length}</strong></article>
      <article className="bridge-stat"><span>Approved</span><strong>{data.items.filter((item) => item.status === "approved").length}</strong></article>
      <article className="bridge-stat"><span>Rejected</span><strong>{data.items.filter((item) => item.status === "rejected").length}</strong></article>
      <article className="bridge-stat"><span>Categories</span><strong>{data.categories.length}</strong></article>
    </section> : null}
    {view === "dashboard" || view === "instagram" ? <section className="bridge-panel bridge-instagram-panel">
      <div className="bridge-panel-heading"><div><p className="eyebrow">Review-only connector</p><h2>Instagram Connection</h2></div><span className={`bridge-status ${connectionConfirmed || data.connector.connected ? "good" : "neutral"}`}>{connectionConfirmed || data.connector.connected ? "Connected: Yes" : "Connected: No"}</span></div>
      <div className="bridge-row-actions"><Link className="bridge-primary-action" href="/api/editor/instagram/connect">Connect Instagram Account</Link>{data.connector.configured ? <Link href="/api/editor/instagram/connect">Reconnect Account</Link> : null}</div>
      <dl className="bridge-definition-list settings">
        <div><dt>Connected</dt><dd>{connectionConfirmed || data.connector.connected ? "Yes" : "No"}</dd></div>
        <div><dt>Connector mode</dt><dd>{data.connector.mode === "instagram-login" ? "Instagram Login" : "Facebook Login / Page-linked Graph"}</dd></div>
        <div><dt>Account username</dt><dd>{data.connector.username ? `@${data.connector.username}` : "Not confirmed"}</dd></div>
        <div><dt>Account ID configured</dt><dd>{data.connector.accountIdConfigured ? "Yes" : "No"}</dd></div>
        <div><dt>Instagram account ID</dt><dd>{data.connector.accountId || "Not configured"}</dd></div>
        <div><dt>Access token configured</dt><dd>{data.connector.tokenConfigured ? "Yes" : "No"}</dd></div>
        <div><dt>Token expiry</dt><dd>{data.connector.tokenExpiry ? `${formatDateTime(data.connector.tokenExpiry)}${data.connector.tokenExpiryStatus.daysRemaining !== null ? ` · ${data.connector.tokenExpiryStatus.daysRemaining} days` : ""}` : "Not supplied"}</dd></div>
        <div><dt>Last token refresh</dt><dd>{data.connector.lastTokenRefresh ? formatDateTime(data.connector.lastTokenRefresh) : "Not refreshed yet"}</dd></div>
        <div><dt>Last connection test</dt><dd>{data.connector.lastConnectionTest ? formatDateTime(data.connector.lastConnectionTest) : "Not tested yet"}</dd></div>
        <div><dt>Connection error</dt><dd>{data.connector.connectionError || "None"}</dd></div>
        <div><dt>Last successful sync</dt><dd>{data.connector.lastSyncAt ? formatDateTime(data.connector.lastSyncAt) : "Not run yet"}</dd></div>
        <div><dt>Next scheduled sync</dt><dd>{data.connector.scheduleEnabled && data.connector.nextSyncAt ? formatDateTime(data.connector.nextSyncAt) : `Not enabled · proposed every ${data.connector.intervalMinutes} minutes after approval`}</dd></div>
        <div><dt>Imported count</dt><dd>{data.connector.importedCount}</dd></div><div><dt>Skipped count</dt><dd>{data.connector.skippedCount}</dd></div>
        <div><dt>Failed count</dt><dd>{data.connector.failedCount}</dd></div><div><dt>Pending review count</dt><dd>{data.connector.pendingCount}</dd></div>
      </dl>
      {!data.connector.configured ? <div className="bridge-setup-instructions"><strong>Private server setup</strong><ol>{data.connector.setup.map((step) => <li key={step}>{step}</li>)}</ol><p>No token value is displayed or stored in The Bridge.</p></div> : null}
      <div className="bridge-row-actions"><button type="button" disabled={busy || !data.connector.configured} onClick={() => void testInstagram()}>Test Connection</button><button className="bridge-primary-action" type="button" disabled={busy || !data.connector.configured} onClick={() => void syncInstagram()}>Run Sync Now</button><button type="button" disabled={busy || !data.connector.configured || data.connector.mode !== "instagram-login"} onClick={() => void refreshInstagram()}>Refresh Token</button><button className="bridge-danger-action" type="button" disabled={busy || !data.connector.configured} onClick={() => void disconnectInstagram()}>Disconnect</button></div>
      <details><summary>View Sync Log</summary>{data.connector.syncLog.length ? <div className="bridge-definition-list">{data.connector.syncLog.map((entry) => <div key={entry.at}><dt>{formatDateTime(entry.at)} · {entry.ok ? "Success" : "Failed"}</dt><dd>Checked {entry.checked}; imported {entry.imported}; skipped {entry.skipped}; failed {entry.failed}{entry.error ? ` · ${entry.error}` : ""}</dd></div>)}</div> : <p>No sync runs recorded.</p>}</details>
      <p className="bridge-muted">Access tokens and app secrets are stored server-side and are never displayed here.</p>
      {message ? <p className="bridge-save-message">{message}</p> : null}
    </section> : null}
    {view === "dashboard" || view === "categories" ? <section className="bridge-panel"><div className="bridge-panel-heading"><h2>Gallery Categories</h2><span>Unlimited categories</span></div><div className="bridge-flag-list large">{data.categories.map((category) => <span key={category.id}>{category.name}</span>)}</div><div className="bridge-row-actions"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category" /><button type="button" onClick={() => void addCategory()}>Add Category</button></div></section> : null}
    {view === "settings" ? <section className="bridge-dashboard-grid two"><article className="bridge-panel"><h2>Gallery Settings</h2><dl className="bridge-definition-list"><div><dt>Name</dt><dd>Through the Lens</dd></div><div><dt>Public rollout</dt><dd>Disabled — approval required</dd></div><div><dt>Default import status</dt><dd>Pending Review</dd></div></dl></article><article className="bridge-panel"><h2>Designed for future additions</h2><div className="bridge-flag-list large">{["Video", "360 images", "Drone video", "Boat walkthroughs", "Virtual marina tours", "Interactive maps", "Photographer profiles", "Reader uploads", "Competitions", "Photo of the Day"].map((item) => <span key={item}>{item}</span>)}</div></article></section> : null}
    {message ? <p className="bridge-save-message">{message}</p> : null}
    {view !== "categories" && view !== "instagram" && view !== "settings" ? <section className="bridge-card-grid">
      {visibleItems.map((item) => <article className="bridge-queue-card" key={item.id}>
        <img className="bridge-gallery-thumb" src={item.thumbnailUrl} alt={item.alt || item.title} />
        <div><span className={`bridge-status ${statusTone(item.status)}`}>{item.status}</span><span>{item.sourceType}</span></div>
        <h2>{item.title || item.media?.filename || "Untitled photograph"}</h2><p>{item.caption}</p>
        <small>{item.credit || "Credit needed"}{item.location ? ` · ${item.location}` : ""}</small>
        <div className="bridge-row-actions"><button type="button" onClick={() => setEditing(item)}>Edit</button><button disabled={busy} type="button" onClick={() => void saveItem({ ...item, status: "approved" })}>Approve</button><button disabled={busy} type="button" onClick={() => void saveItem({ ...item, status: "rejected" })}>Reject</button></div>
      </article>)}
      {visibleItems.length === 0 ? <div className="bridge-empty-state"><h2>No {view === "dashboard" ? "gallery" : view} items</h2><p>Upload photographs to the Media Library or connect Instagram, then add them for review.</p><Link className="bridge-primary-action" href="/editor/media">Upload Photos in Media Library</Link></div> : null}
    </section> : null}
    {editing ? <section className="bridge-panel bridge-gallery-editor"><div className="bridge-panel-heading"><h2>Edit gallery item</h2><button onClick={() => setEditing(null)} type="button">Close</button></div>
      <div className="bridge-gallery-preview"><img src={editing.thumbnailUrl} alt={editing.alt || editing.title} /><div><p className="eyebrow">Eventual gallery preview — not public</p><h3>{editing.title || "Untitled photograph"}</h3><p>{editing.caption}</p><small>{editing.credit}{editing.location ? ` · ${editing.location}` : ""}</small></div></div><div className="bridge-field-row thirds">
        <label><span>Title</span><input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
        <label><span>Caption</span><input value={editing.caption} onChange={(event) => setEditing({ ...editing, caption: event.target.value })} /></label>
        <label><span>Alt text</span><input value={editing.alt} onChange={(event) => setEditing({ ...editing, alt: event.target.value })} /></label>
        <label><span>Photographer credit</span><input value={editing.credit} onChange={(event) => setEditing({ ...editing, credit: event.target.value })} /></label>
        <label><span>Copyright</span><input value={editing.copyright} onChange={(event) => setEditing({ ...editing, copyright: event.target.value })} /></label>
        <label><span>Location</span><input value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} /></label>
        <label><span>Tags</span><input value={editing.tags.join(", ")} onChange={(event) => setEditing({ ...editing, tags: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} /></label>
        <label><span>Categories</span><select multiple value={editing.categoryIds} onChange={(event) => setEditing({ ...editing, categoryIds: Array.from(event.currentTarget.selectedOptions).map((option) => option.value) })}>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label><span>Link to story</span><select multiple value={editing.storyIds} onChange={(event) => setEditing({ ...editing, storyIds: Array.from(event.currentTarget.selectedOptions).map((option) => option.value) })}>{data.stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}</select></label>
        <label><span>Boat</span><input value={editing.boatId} onChange={(event) => setEditing({ ...editing, boatId: event.target.value })} /></label>
        <label><span>Marina</span><input value={editing.marinaId} onChange={(event) => setEditing({ ...editing, marinaId: event.target.value })} /></label>
        <label><span>Yacht club</span><input value={editing.yachtClubId} onChange={(event) => setEditing({ ...editing, yachtClubId: event.target.value })} /></label>
        <label><span>Event</span><input value={editing.eventId} onChange={(event) => setEditing({ ...editing, eventId: event.target.value })} /></label>
      </div><button disabled={busy} onClick={() => void saveItem(editing)} type="button">Save review item</button>
    </section> : null}
  </>;
}

function VideoPage() {
  const { data, loading, error, reload } = useBridgeView<VideoPayload>("video");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [copyright, setCopyright] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [collection, setCollection] = useState("");
  const [posterMediaId, setPosterMediaId] = useState("");
  const [storyAssociationId, setStoryAssociationId] = useState("");
  const [galleryAssociationId, setGalleryAssociationId] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);
  const uploadVideo = (file?: File) => {
    if (!file) return;
    setLastFile(file);
    setUploading(true); setProgress(0); setMessage("");
    const form = new FormData(); form.append("video", file);
    const xhr = new XMLHttpRequest(); requestRef.current = xhr;
    xhr.upload.onprogress = (event) => event.lengthComputable && setProgress(Math.round(event.loaded / event.total * 100));
    xhr.onload = async () => { setUploading(false); const payload = JSON.parse(xhr.responseText || "{}"); if (xhr.status >= 200 && xhr.status < 300 && payload.media?.id) { try { await postBridgeAction({ action: "updateMedia", id: payload.media.id, media: { displayName: title || file.name.replace(/\.[^.]+$/, ""), internalTitle: title || file.name.replace(/\.[^.]+$/, ""), caption, credit, creditLine: credit, copyright, description, alt: description || title, tagsJson: JSON.stringify(tags.split(",").map((value) => value.trim()).filter(Boolean)), collectionsJson: JSON.stringify(collection ? [collection] : []), posterMediaId, storyAssociationId, galleryAssociationId } }); setMessage("Video uploaded successfully with its metadata. Autoplay remains off."); reload(); } catch (metadataError) { setMessage(metadataError instanceof Error ? metadataError.message : "Video uploaded, but its metadata could not be saved."); } } else setMessage(payload.error || "Video upload failed. Retry or use YouTube/Vimeo."); };
    xhr.onerror = () => { setUploading(false); setMessage("Video upload failed. Retry or use YouTube/Vimeo."); };
    xhr.open("POST", "/api/editor/media/video"); xhr.send(form);
  };
  const saveExternal = async () => {
    try {
      await postBridgeAction({ action: "saveExternalVideo", media: { externalUrl, displayName: title, internalTitle: title, caption, credit, creditLine: credit, copyright, alt: description || title, description: description || caption, copyrightOwnership: "unknown", tagsJson: JSON.stringify(tags.split(",").map((value) => value.trim()).filter(Boolean)), collectionsJson: JSON.stringify(collection ? [collection] : []), posterMediaId, storyAssociationId, galleryAssociationId } });
      setMessage("External video saved. It will never autoplay."); setExternalUrl(""); setTitle(""); setCaption(""); setCredit(""); setCopyright(""); setDescription(""); setTags(""); reload();
    } catch (saveError) { setMessage(saveError instanceof Error ? saveError.message : "Video could not be saved."); }
  };
  if (loading) return <LoadingBlock label="Loading video library" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <>
      <BridgeHeader section="videos" />
      <section className="bridge-panel bridge-library-upload">
        <div className="bridge-panel-heading"><div><p className="eyebrow">Video Library</p><h2>Upload Video</h2></div><button className="bridge-primary-action" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>Upload Video</button></div>
        <div className="bridge-upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadVideo(event.dataTransfer.files[0]); }}><strong>Drag and drop MP4 or WebM here</strong><span>Configured upload limit: {data.maxVideoUploadMb} MB. MOV is accepted only when OLDSEADOGS_ALLOW_MOV=true. YouTube/Vimeo is recommended for larger files.</span><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>Choose File</button><input ref={inputRef} className="bridge-hidden-file-input" type="file" accept="video/mp4,video/webm,.mp4,.webm,.mov" onChange={(event) => uploadVideo(event.currentTarget.files?.[0])} />{uploading ? <><progress max={100} value={progress} /><span>{progress}% uploaded</span><button type="button" onClick={() => { requestRef.current?.abort(); setUploading(false); setMessage("Upload cancelled."); }}>Cancel</button></> : null}</div>
        <div className="bridge-field-row thirds"><label><span>YouTube, Vimeo or TikTok URL</span><input value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /></label><label><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span>Caption</span><input value={caption} onChange={(event) => setCaption(event.target.value)} /></label><label><span>Credit</span><input value={credit} onChange={(event) => setCredit(event.target.value)} /></label><label><span>Copyright</span><input value={copyright} onChange={(event) => setCopyright(event.target.value)} /></label><label><span>Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label><span>Tags</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Comma separated" /></label><label><span>Collection</span><input list="video-collections" value={collection} onChange={(event) => setCollection(event.target.value)} /><datalist id="video-collections">{data.collections.map((name) => <option key={name} value={name} />)}</datalist></label><label><span>Poster / thumbnail</span><select value={posterMediaId} onChange={(event) => setPosterMediaId(event.target.value)}><option value="">No poster selected</option>{data.posterImages.map((image) => <option key={image.id} value={image.id}>{image.displayName || image.filename}</option>)}</select></label><label><span>Story link</span><select value={storyAssociationId} onChange={(event) => setStoryAssociationId(event.target.value)}><option value="">No story</option>{data.storyOptions.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}</select></label><label><span>Gallery link</span><select value={galleryAssociationId} onChange={(event) => setGalleryAssociationId(event.target.value)}><option value="">No gallery item</option>{data.galleryOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
        {posterMediaId ? <img className="bridge-video-poster-preview" src={data.posterImages.find((image) => image.id === posterMediaId)?.thumbnailUrl || data.posterImages.find((image) => image.id === posterMediaId)?.url} alt="Selected video poster preview" /> : null}
        <div className="bridge-row-actions"><button type="button" disabled={!externalUrl || !title} onClick={() => void saveExternal()}>Save External Video</button>{message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? <button type="button" disabled={!lastFile} onClick={() => lastFile && uploadVideo(lastFile)}>Retry Upload</button> : null}</div>
        {message ? <p className="bridge-save-message" aria-live="polite">{message}</p> : null}
      </section>
      <section className="bridge-dashboard-grid two">
        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Video Placements</h2>
          </div>
          <div className="bridge-flag-list large">
            {data.placements.map((placement) => <span key={placement}>{placement}</span>)}
          </div>
        </article>
        <article className="bridge-panel">
          <div className="bridge-panel-heading">
            <h2>Detected Video Stories</h2>
          </div>
          <div className="bridge-activity-list">
            {data.stories.map((story) => (
              <Link href={`/editor/write?story=${encodeURIComponent(story.id)}`} key={story.id}>
                <span>{story.category}</span>
                <strong>{story.title}</strong>
                <small>{story.status} · {story.wordCount} words</small>
              </Link>
            ))}
            {data.stories.length === 0 ? <p className="bridge-muted">No video-tagged stories detected yet.</p> : null}
          </div>
        </article>
        <article className="bridge-panel"><h2>Saved videos</h2><div className="bridge-activity-list">{data.media.map((item) => <article key={item.id}><strong>{item.displayName || item.filename}</strong><small>{item.externalUrl ? item.sourceType : `${formatBytes(item.size)} local upload`} · autoplay off</small></article>)}</div></article>
      </section>
    </>
  );
}

function HomepageLeadControl() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const viewQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    return params.toString() ? `&${params.toString()}` : "";
  }, [query]);
  const { data, loading, error, reload } = useBridgeView<HomepageLeadPayload>("homepageLead", viewQuery);
  const selectedStory = data?.candidates.find((story) => story.id === selectedId) ?? null;

  if (loading) return <LoadingBlock label="Loading homepage lead control" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <section className="bridge-panel bridge-homepage-lead">
      <div className="bridge-panel-heading">
        <div>
          <h2>Homepage Headline Story</h2>
          <p className="bridge-muted">This is the large main story shown at the top of the front page.</p>
          <ol className="bridge-muted"><li>Search for a published story.</li><li>Press Choose as Headline Story.</li><li>Review the preview, then press Save Homepage.</li></ol>
        </div>
        <Link className="bridge-secondary-action" href="/" target="_blank">Preview front page</Link>
      </div>

      <div className="bridge-dashboard-grid two">
        <article className="bridge-lead-current">
          <h3>Current homepage headline story</h3>
          {data.current ? (
            <div className="bridge-lead-story">
              <StoryImage story={data.current} />
              <div>
                <span className={`bridge-status ${statusTone(storyVisibilityLabel(data.current))}`}>
                  {storyVisibilityLabel(data.current)}
                </span>
                <h4>{data.current.title}</h4>
                <p>{data.current.category} · {formatDateTime(data.current.date)}</p>
                <small>{data.current.imageUrl ? "Image selected" : "No image"}</small>
                <HomepageLeadDiagnostics story={data.current} />
                <div className="bridge-row-actions">
                  <Link href={`/editor/preview/${data.current.id}`} target="_blank">Preview</Link>
                  <Link href={`/stories/${data.current.slug}`} target="_blank">Open live story</Link>
                  <button onClick={() => { setPendingLeadId(""); setMessage("Headline story removal is pending. Press Save Homepage to apply it."); }} type="button">Use automatic headline story</button>
                </div>
              </div>
            </div>
          ) : (
            <p className="bridge-muted">No manual headline story is selected. The homepage uses its normal automatic published story.</p>
          )}
        </article>

        <article className="bridge-lead-search">
          <label>
            <span>Search published stories</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, category, author, source or tags" />
          </label>
          <p className="bridge-muted">{formatNumber(data.totalCandidates)} published matches available.</p>
          {selectedStory ? (
            <div className="bridge-lead-selected">
              <strong>{selectedStory.title}</strong>
              <span>{selectedStory.category} · {formatDateTime(selectedStory.date)} · {selectedStory.imageUrl ? "Image" : "No image"}</span>
              <HomepageLeadDiagnostics story={selectedStory} />
              <div className="bridge-row-actions">
                <Link href={`/editor/preview/${selectedStory.id}`} target="_blank">Preview</Link>
                <Link href={`/stories/${selectedStory.slug}`} target="_blank">Open live story</Link>
                <button className="bridge-primary-action" onClick={() => { setPendingLeadId(selectedStory.id); setMessage(`“${selectedStory.title}” is selected as the Homepage Headline Story. Press Save Homepage to make it live.`); }} type="button">
                  Choose as Headline Story
                </button>
              </div>
            </div>
          ) : null}
          <div className="bridge-activity-list bridge-lead-results">
            {data.candidates.map((story) => (
              <article className={selectedId === story.id ? "active" : ""} key={story.id}>
                <button className="bridge-lead-select-button" onClick={() => setSelectedId(story.id)} type="button">
                  <span>{story.category} · {formatDateTime(story.date)} · {story.imageUrl ? "Image" : "No image"}</span>
                  <strong>{story.title}</strong>
                  <small>{story.summary || story.slug}</small>
                </button>
                <button className="bridge-primary-action" onClick={() => { setSelectedId(story.id); setPendingLeadId(story.id); setMessage(`“${story.title}” is selected as the Homepage Headline Story. Press Save Homepage to make it live.`); }} type="button">Choose as Headline Story</button>
                <HomepageLeadDiagnostics story={story} compact />
              </article>
            ))}
          </div>
        </article>
      </div>
      {message ? <p className="bridge-save-message">{message}</p> : null}
      <HomepageSlotsManager
        data={data}
        leadStoryId={pendingLeadId ?? data.current?.id ?? ""}
        key={`${data.settings.homepageLatestStoryIds}-${data.settings.homepageEditorsChoiceStoryIds}-${data.settings.homepageHiddenStoryIds}-${data.current?.id || "auto"}`}
        reload={reload}
      />
    </section>
  );
}

function HomepagePage() {
  return (
    <>
      <BridgeHeader section="homepage" eyebrow="Front Page control" />
      <HomepageLeadControl />
    </>
  );
}

function DefaultSocialImageControl({ data, reload }: { data: SettingsPayload; reload: () => void }) {
  const selected = data.media.find((item) => item.id === data.settings.defaultSocialImageMediaId) || data.media.find((item) => item.url === data.settings.defaultSocialImageUrl) || null;
  const [message, setMessage] = useState("");
  const choose = async (asset: MediaAsset | null) => {
    await postBridgeAction({ action: "saveSettings", settings: { defaultSocialImageMediaId: asset?.id || "", defaultSocialImageUrl: asset?.url || "/images/old-sea-dogs-logo.png" } });
    setMessage(asset ? "Default social-sharing image saved and validated in the Media Library." : "Default social-sharing image reset to the deterministic Old Sea Dogs logo."); reload();
  };
  return <section className="bridge-panel"><div className="bridge-panel-heading"><div><p className="eyebrow">Link previews</p><h2>Default Social Sharing Image</h2></div><span className={`bridge-status ${selected ? "good" : "neutral"}`}>{selected ? "Media Library image validated" : "Deterministic logo fallback"}</span></div><p>Recommended dimensions: 1200 × 630 pixels. Precedence: story-specific image, guide-specific image, configured homepage image, then this default. Media Library stock is never selected randomly.</p><MediaLibraryUploader onUploaded={(assets) => { const asset = assets[0]; if (asset) void choose(asset); }} />{selected ? <figure className="bridge-social-image-preview"><img src={selected.thumbnailUrl || selected.url} alt={selected.alt || selected.displayName} /><figcaption>{selected.displayName || selected.filename} · publicly served at {selected.url}</figcaption></figure> : null}<div className="bridge-media-grid">{data.media.slice(0, 18).map((asset) => <article key={asset.id}><img src={asset.thumbnailUrl || asset.url} alt={asset.alt || asset.displayName} /><strong>{asset.displayName}</strong><button type="button" onClick={() => void choose(asset)}>{selected?.id === asset.id ? "Selected" : "Choose / Replace"}</button></article>)}</div><div className="bridge-row-actions"><button type="button" onClick={() => void choose(null)}>Remove / reset</button><Link href="/editor/media">Open full Media Library</Link></div>{message ? <p className="bridge-save-message">{message}</p> : null}</section>;
}

function SettingsPage({ section }: { section: "social" | "advertising" | "backups" | "settings" }) {
  const { data, loading, error, reload } = useBridgeView<SettingsPayload>("settings");
  if (loading) return <LoadingBlock label="Loading settings" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  if (section === "advertising") {
    return (
      <>
        <BridgeHeader section="advertising" />
        <section className="bridge-card-grid">
          {data.ads.map((ad) => (
            <article className="bridge-queue-card" key={ad.id}>
              <div>
                <span className={`bridge-status ${ad.isActive ? "good" : "neutral"}`}>{ad.isActive ? "active" : "inactive"}</span>
                <span>{ad.placement}</span>
              </div>
              <h2>{ad.title || ad.label}</h2>
              <p>{ad.body}</p>
              <small>{ad.kind} · {ad.linkUrl}</small>
            </article>
          ))}
        </section>
      </>
    );
  }

  if (section === "social") {
    return (
      <>
        <BridgeHeader section="social" />
        <section className="bridge-stat-grid compact">
          <article className="bridge-stat"><span>Social clicks</span><strong>{formatNumber(data.socialAnalytics.socialClicks)}</strong></article>
          <article className="bridge-stat"><span>Outbound clicks</span><strong>{formatNumber(data.socialAnalytics.outboundClicks)}</strong></article>
          <article className="bridge-stat"><span>Post usage</span><strong>{formatNumber(data.socialAnalytics.generatedPostUsage)}</strong></article>
        </section>
        <section className="bridge-panel">
          <div className="bridge-flag-list large">
            {data.socialAnalytics.byPlatform.map((item) => <span key={item.platform}>{item.platform}: {item.count}</span>)}
          </div>
        </section>
      </>
    );
  }

  if (section === "backups") {
    return (
      <>
        <BridgeHeader section="backups" />
        <section className="bridge-dashboard-grid two">
          <article className="bridge-panel">
            <h2>Backup Position</h2>
            <p>The live data store remains the existing server-side store. This page does not run backup or restore actions.</p>
            <dl className="bridge-definition-list">
              <div><dt>Blocked senders</dt><dd>{formatNumber(data.blockedSenders.length)}</dd></div>
              <div><dt>Source watch sites</dt><dd>{formatNumber(data.sourceWatch.length)}</dd></div>
            </dl>
          </article>
          <article className="bridge-panel">
            <h2>Source Watch</h2>
            <div className="bridge-activity-list">
              {data.sourceWatch.slice(0, 12).map((source) => (
                <a href={source.url} key={source.id} target="_blank">
                  <span>{source.group}</span>
                  <strong>{source.name}</strong>
                  <small>{source.status}</small>
                </a>
              ))}
            </div>
          </article>
        </section>
      </>
    );
  }

  return (
    <>
      <BridgeHeader section="settings" />
      <HomepageLeadControl />
      <DefaultSocialImageControl data={data} reload={reload} />
      <section className="bridge-panel">
        <dl className="bridge-definition-list settings">
          {Object.entries(data.settings).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function HealthPage() {
  const { data, loading, error } = useBridgeView<HealthPayload>("health");
  if (loading) return <LoadingBlock label="Loading system health" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <>
      <BridgeHeader section="health">
        <span className={`bridge-health-pill ${data.ok ? "good" : "bad"}`}>{data.ok ? "Healthy" : "Needs attention"}</span>
      </BridgeHeader>
      <section className="bridge-dashboard-grid two">
        <article className="bridge-panel">
          <h2>Runtime</h2>
          <dl className="bridge-definition-list">
            <div><dt>Mode</dt><dd>{data.storage.mode}</dd></div>
            <div><dt>Persistent</dt><dd>{data.storage.persistent ? "Yes" : "No"}</dd></div>
            <div><dt>Runtime</dt><dd>{data.deployment.runtime}</dd></div>
            <div><dt>Host</dt><dd>{data.deployment.serverHostname || "Not recorded"}</dd></div>
            <div><dt>Branch</dt><dd>{data.deployment.gitBranch || "Not recorded"}</dd></div>
            <div><dt>Commit</dt><dd>{data.deployment.gitCommit || "Not recorded"}</dd></div>
          </dl>
          <p className="bridge-muted">{data.storage.detail}</p>
        </article>
        <article className="bridge-panel">
          <h2>Records</h2>
          <dl className="bridge-definition-list">
            <div><dt>Stories</dt><dd>{formatNumber(data.counts.stories)}</dd></div>
            <div><dt>Media</dt><dd>{formatNumber(data.counts.media)}</dd></div>
            <div><dt>Ads</dt><dd>{formatNumber(data.counts.ads)}</dd></div>
            <div><dt>Press releases</dt><dd>{formatNumber(data.counts.pressReleases)}</dd></div>
            <div><dt>Blocked senders</dt><dd>{formatNumber(data.counts.blockedSenders)}</dd></div>
          </dl>
        </article>
      </section>
    </>
  );
}

function AnalyticsPage() {
  const { data, loading, error } = useBridgeView<AnalyticsPayload>("analytics");
  const [range, setRange] = useState("28");
  if (loading) return <LoadingBlock label="Loading analytics status" />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;
  const cards = [["Page views", data.metrics?.pageViews], ["Users", data.metrics?.users], ["Top stories", data.metrics?.topStories.length], ["Traffic sources", data.metrics?.trafficSources.length]] as const;
  return <><BridgeHeader section="analytics" /><section className="bridge-panel"><div className="bridge-panel-heading"><div><h2>Google Analytics 4</h2><p className="bridge-muted">Private connection and reporting status. Credentials never appear in the browser.</p></div><label><span>Date range</span><select value={range} onChange={(event) => setRange(event.target.value)}><option value="7">Last 7 days</option><option value="28">Last 28 days</option><option value="90">Last 90 days</option></select></label></div><div className="bridge-flag-list large"><span>Measurement ID: {data.measurementIdValid ? "Valid and ready" : data.measurementIdConfigured ? "Configured but invalid" : "Not configured"}</span><span>GA4 Data API: {data.dataApiConfigured ? "Credentials available" : "Settings required"}</span><span>Editor tracking: Disabled</span><span>Cookie consent: Required</span></div>{!data.dataApiConfigured ? <div className="bridge-error"><strong>Analytics reporting credentials are missing</strong><span>Add {data.missingCredentials.join(", ")} to the private server environment. Add the public Measurement ID as OLDSEADOGS_GA4_ID (NEXT_PUBLIC_GA4_ID remains supported). Restart through safe deployment; never paste credentials into this screen.</span></div> : null}</section><section className="bridge-stat-grid">{cards.map(([label, value]) => <article className="bridge-stat" key={label}><span>{label}</span><strong>{value ?? "—"}</strong></article>)}</section><section className="bridge-dashboard-grid two">{["Top stories", "Traffic sources", "Top landing pages", "Devices", "Countries", "Search terms where available"].map((title) => <article className="bridge-panel" key={title}><h2>{title}</h2><p className="bridge-muted">{data.metrics ? `Reporting for the last ${range} days.` : "Connect the GA4 Data API to show private reporting data here."}</p></article>)}</section></>;
}

function BridgeBody({ section, storyId, mediaId, galleryView }: BridgeCmsProps) {
  if (section === "dashboard") return <DashboardPage />;
  if (section === "stories") return <StoryListPage section="stories" title="All story summaries" />;
  if (section === "write") return <WriteStoryPage storyId={storyId} mediaId={mediaId} />;
  if (section === "guides") return <GuidesPage />;
  if (section === "homepage") return <HomepagePage />;
  if (section === "drafts") return <StoryListPage section="drafts" title="Draft queue" status="draft" />;
  if (section === "published") return <StoryListPage section="published" title="Published stories" status="published" />;
  if (section === "scheduled") return <ScheduledStoriesPage />;
  if (section === "recover") return <StoryListPage section="recover" title="Recovery centre" status="recover" />;
  if (section === "audit") return <AuditPage />;
  if (section === "email") return <EmailPage />;
  if (section === "scraped") return <StoryListPage section="scraped" title="Scraped Stories" queue="scraped" />;
  if (section === "media") return <MediaPage />;
  if (section === "gallery") return <GalleryPage view={galleryView} />;
  if (section === "videos") return <VideoPage />;
  if (section === "social") return <SettingsPage section="social" />;
  if (section === "analytics") return <AnalyticsPage />;
  if (section === "advertising") return <SettingsPage section="advertising" />;
  if (section === "backups") return <SettingsPage section="backups" />;
  if (section === "settings") return <SettingsPage section="settings" />;
  if (section === "health") return <HealthPage />;
  return <DashboardPage />;
}

export default function BridgeCms({ section, storyId, mediaId, galleryView }: BridgeCmsProps) {
  return (
    <main className="bridge-cms">
      <BridgeNav activeSection={section} />
      <section className="bridge-main">
        <BridgeBody section={section} storyId={storyId} mediaId={mediaId} galleryView={galleryView} />
      </section>
    </main>
  );
}
