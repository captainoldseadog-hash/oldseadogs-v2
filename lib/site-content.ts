import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getD1BindingOrNull, getDbOrNull } from "../db";
import {
  ads,
  galleryCategories,
  galleryItems,
  instagramImports,
  mediaAssets,
  pressReleaseBlockedSenders,
  pressReleaseEmails,
  siteSettings,
  socialEvents,
  storyRevisions,
  storyStatusHistory,
  stories as storyRows,
} from "../db/schema";
import { oldSeaDogsSocialLinks } from "../content/social-links";
import { toPublicGalleryPhoto, type PublicGalleryPhoto } from "./gallery-public.js";
import { sourceWatchSites } from "../content/source-watch";
import { stories as seedStories } from "../content/stories";
import {
  flagshipGuides,
  GUIDE_TYPES,
  type FlagshipGuide,
  type GuideType,
} from "../content/flagship-guides";
import { guideProductSeeds } from "../content/guide-product-seeds.ts";
import { solentMarinaGuideSeeds } from "../content/solent-marina-guides.ts";
import { validateGuideInput } from "./guide-validation.ts";
import { storyCreatedAt } from "./story-list";
import { makeStoryManagementIndex } from "./story-management";
import { publicImageAlt } from "./public-image-alt";
export { validateGuideInput } from "./guide-validation.ts";
import { normalizeManagedGuideFields, type ManagedGuideFields } from "./guide-contract.ts";
import legacyStories from "../content/legacy-stories.json";
import {
  getSectionForCategory,
  normalizeStoryCategory,
  oldSeaDogsSections,
  sectionPathForCategory,
  storyMatchesSection,
} from "../content/sections";
import {
  analyzeHeadlineQuality,
  getEditorialWarnings,
  oldSeaDogsViewQuality,
  validateStoryForPublication,
} from "./editorial-quality";
import {
  classifyPressRelease,
  cleanPressReleaseHeadline,
  cleanPressReleaseText,
  detectDuplicatePressRelease,
  generateOldSeaDogsPressArticle,
  getEmailIngestionSettings,
  parsePressReleaseEmail,
  senderDomain,
  suggestPressReleaseCategory,
  type PressReleaseAttachment,
  type PressReleaseStatus,
} from "./press-release-utils";
import { createSafeId } from "./safe-id";
import { cleanStoryTags } from "./tags";
import { deleteLocalMediaUpload } from "./local-media-storage";
import { findMediaAssetAcrossStores } from "./media-asset-lookup";
import {
  DEVELOPMENT_HOMEPAGE_FIXTURE_ENV,
  developmentHomepageFixturePolicy,
  type DevelopmentHomepageFixturePolicy,
} from "./homepage-fixture-policy.js";
import { isScheduledPublishDue, validateScheduledPublishAt } from "./story-schedule-time";

export type EditableStory = {
  id: string;
  slug: string;
  title: string;
  category: string;
  sectionSlugs: string[];
  date: string;
  author: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  originalSourceType: string;
  originalSourceRef: string;
  originalSourceContent: string;
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
  status: "draft" | "scheduled" | "published" | "unpublished";
  publishedAt: string;
  scheduledPublishAt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  statusHistory: StoryStatusHistoryEntry[];
};

export type StoryStatusHistoryEntry = {
  id: string;
  storyId: string;
  fromStatus: string;
  toStatus: string;
  fromWorkflow: string;
  toWorkflow: string;
  changedBy: string;
  changedAt: string;
};

export type StoryRevision = {
  id: string;
  storyId: string;
  snapshot: EditableStory;
  reason: string;
  createdBy: string;
  createdAt: string;
};

export type GuideStatus = "draft" | "published" | "unpublished";

export type EditableGuide = FlagshipGuide & ManagedGuideFields & {
  internalId: string;
  introduction: string;
  guideType: GuideType;
  regionKey: string;
  regionName: string;
  subregion: string;
  parentGuideSlug: string;
  editorialOrder: number;
  author: string;
  contributorCredits: string[];
  imageFocalPoint: string;
  artworkCredit: string;
  location: {
    latitude?: number;
    longitude?: number;
    mapZoom?: number;
    what3words?: string;
    osGridReference?: string;
  };
  relatedGuideSlugs: string[];
  cruiseOnGuideSlugs: string[];
  previousGuideSlug: string;
  nextGuideSlug: string;
  socialTitle: string;
  socialDescription: string;
  canonicalPath: string;
  editorialNotes: string;
  researchNotes: string;
  reviewDue: string;
  accuracyConcerns: string;
  sourceNotes: string;
  draftComments: string;
  verifiedFacilities: Array<{
    label: string;
    detail: string;
    sourceUrl: string;
    verifiedOn: string;
  }>;
  facilityVerificationNotes: string;
  status: GuideStatus;
  noindex: boolean;
  showOnHomepage: boolean;
  homepageOrder: number;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  imageCaption: string;
  imageCredit: string;
  featuredMediaId: string;
  inlineImages: Array<{
    id: string; mediaId: string; url: string; alt: string; caption: string; credit: string;
    sectionIndex: number; paragraphIndex: number; order: number;
  }>;
};

export type GuideRevision = {
  id: string;
  guideId: string;
  snapshot: EditableGuide;
  actor: string;
  reason: string;
  source: "cms" | "skill-import" | "bulk-import";
  createdAt: string;
};

const guideSeeds: FlagshipGuide[] = [...guideProductSeeds, ...solentMarinaGuideSeeds, ...flagshipGuides];
const blankGuideSeed: FlagshipGuide = {
  slug: "untitled-guide",
  title: "Untitled Guide",
  eyebrow: "Old Sea Dogs Guides",
  summary: "",
  updatedAt: "",
  imageUrl: "/images/section-heroes/oldseadogs-destinations.webp",
  imageAlt: "",
  quickFacts: [],
  sections: [],
  checklist: [],
  sourceLinks: [],
  guideType: "Destination",
  author: "Michael Hodges",
};

export type PublicationOverrideLog = {
  id: string;
  storyId: string;
  kind: "wording" | "media-rights" | "editorial";
  mediaId: string;
  editorIdentity: string;
  wording: string;
  paragraph: string;
  editorNote: string;
  warnings: string[];
  headline: string;
  storyStatus: string;
  action: string;
  timestamp: string;
  user: string;
  time: string;
  validationOverridden: string;
  reason: string;
};

export type PublicationOverrideInput = {
  confirm: boolean;
  editorNote: string;
  kind?: "wording" | "media-rights" | "editorial";
  mediaId?: string;
  editorIdentity?: string;
  wording?: string;
  paragraph?: string;
  confirmImageRights?: boolean;
  confirmEditorialWarnings?: boolean;
};

export class StoryTechnicalValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "StoryTechnicalValidationError";
    this.issues = issues;
  }
}

export class StoryScheduleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoryScheduleValidationError";
  }
}

export class PublicationOverrideRequiredError extends Error {
  readonly editorialWarnings: string[];

  constructor(editorialWarnings: string[]) {
    super("Review the publication warnings and choose Publish Anyway to continue.");
    this.name = "PublicationOverrideRequiredError";
    this.editorialWarnings = editorialWarnings;
  }
}

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type GalleryCategory = typeof galleryCategories.$inferSelect;
export type GalleryItemRow = typeof galleryItems.$inferSelect;
export type GalleryItem = Omit<GalleryItemRow, "tagsJson" | "categoryIdsJson" | "storyIdsJson"> & {
  tags: string[];
  categoryIds: string[];
  storyIds: string[];
};
export type InstagramImport = typeof instagramImports.$inferSelect;
export type Advert = typeof ads.$inferSelect;

export type PressReleaseEmail = Omit<
  typeof pressReleaseEmails.$inferSelect,
  "attachmentsJson" | "warningsJson" | "generatedBodyJson" | "status"
> & {
  status: PressReleaseStatus;
  attachments: PressReleaseAttachment[];
  warnings: string[];
  generatedBody: string[];
};

export type PressReleaseBlockedSender = typeof pressReleaseBlockedSenders.$inferSelect;

export type SiteSettings = {
  brandName: string;
  kicker: string;
  footerText: string;
  siteDescription: string;
  homepageLeadStoryId: string;
  homepageLeadStorySlug: string;
  homepageLatestStoryIds: string;
  homepageEditorsChoiceStoryIds: string;
  homepageHiddenStoryIds: string;
  socialFacebook: string;
  socialInstagram: string;
  socialX: string;
  socialYouTube: string;
  socialTikTok: string;
  socialThreads: string;
  socialLinkedIn: string;
  defaultSocialImageUrl: string;
  defaultSocialImageMediaId: string;
  homepageSocialImageUrl: string;
  mediaCollectionsJson: string;
  galleryPublicRollout: string;
};

export type SocialEvent = typeof socialEvents.$inferSelect;

export type SocialAnalyticsSummary = {
  socialClicks: number;
  outboundClicks: number;
  generatedPostUsage: number;
  byPlatform: Array<{
    platform: string;
    count: number;
  }>;
  recentEvents: SocialEvent[];
};

const placeholderStoryImages = new Set(["", "/images/marina-hero.png"]);

export const defaultSettings: SiteSettings = {
  brandName: "Old Sea Dogs",
  kicker: "Boating news, reviews, and sea stories",
  footerText:
    "Boating, yachting, boat reviews, and the practical business of life afloat.",
  siteDescription:
    "Boating, yachting, boat reviews, and practical sea stories from Old Sea Dogs.",
  homepageLeadStoryId: "",
  homepageLeadStorySlug: "",
  homepageLatestStoryIds: "[]",
  homepageEditorsChoiceStoryIds: "[]",
  homepageHiddenStoryIds: "[]",
  socialFacebook: oldSeaDogsSocialLinks.facebook,
  socialInstagram: oldSeaDogsSocialLinks.instagram,
  socialX: oldSeaDogsSocialLinks.x,
  socialYouTube: oldSeaDogsSocialLinks.youtube,
  socialTikTok: oldSeaDogsSocialLinks.tiktok,
  socialThreads: oldSeaDogsSocialLinks.threads,
  socialLinkedIn: oldSeaDogsSocialLinks.linkedin,
  defaultSocialImageUrl: "/images/old-sea-dogs-logo.png",
  defaultSocialImageMediaId: "",
  homepageSocialImageUrl: "",
  mediaCollectionsJson: "[]",
  galleryPublicRollout: "false",
};

const defaultGalleryCategoryNames = [
  "Boats", "Classic Yachts", "Motor Yachts", "Superyachts", "Working Boats", "Fishing Boats",
  "Powerboats", "RIBs", "Tall Ships", "Historic Boats", "Boat Builders", "Boat Shows", "Marinas",
  "Anchorages", "Harbours", "Regattas", "Cowes Week", "Round the Island", "Fastnet", "Admiral's Cup",
  "SailGP", "Around the World", "Sunsets", "Crew", "Marine Wildlife", "Drone Photography", "Readers Gallery",
];

function defaultGalleryCategories(): GalleryCategory[] {
  const stamp = "2026-07-13T00:00:00.000Z";
  return defaultGalleryCategoryNames.map((name, sortOrder) => ({
    id: `gallery-category-${makeSlug(name)}`,
    name,
    slug: makeSlug(name),
    description: "",
    sortOrder,
    createdAt: stamp,
    updatedAt: stamp,
  }));
}

const anewFnAdvertTitle = "aNewFN – Market Intelligence for Serious Investors";
const anewFnAdvertBody =
  "London Stock Exchange prices, FTSE 100 data, AIM shares, live trades, bid-offer depth, market liquidity signals, breakout charts and real-time price discovery.\n\nTrack UK equities, US markets and FX from a platform built for traders, contrarian investors, value seekers and momentum hunters.\n\nBecause investing is hard enough without flying blind when FOMO is prowling the streets.";
const anewFnAdvertImage = "/ads/anewfn-register-real-time-market-data.png";
const anewFnAdvertLink = "https://www.anewfn.com";

const defaultAds: Array<Omit<Advert, "createdAt" | "updatedAt">> = [
  {
    id: "default_homepage_featured_club_anewfn",
    placement: "homepage-featured-club",
    kind: "sponsor",
    label: "aNewFN",
    title: anewFnAdvertTitle,
    body: anewFnAdvertBody,
    imageUrl: anewFnAdvertImage,
    linkUrl: anewFnAdvertLink,
    code: "",
    startDate: "",
    endDate: "",
    isActive: true,
  },
  {
    id: "default_homepage_bottom_anewfn",
    placement: "homepage-bottom",
    kind: "manual",
    label: "aNewFN",
    title: anewFnAdvertTitle,
    body: anewFnAdvertBody,
    imageUrl: anewFnAdvertImage,
    linkUrl: anewFnAdvertLink,
    code: "",
    startDate: "",
    endDate: "",
    isActive: true,
  },
];

type RuntimeNodeProcessLike = {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
  kill?: (pid: number, signal: 0) => void;
  pid?: number;
  versions?: {
    node?: string;
  };
};

export type LocalEditorStore = {
  version: 1;
  stories: EditableStory[];
  guides: EditableGuide[];
  media: MediaAsset[];
  galleryCategories: GalleryCategory[];
  galleryItems: GalleryItem[];
  instagramImports: InstagramImport[];
  ads: Advert[];
  settings: Partial<SiteSettings>;
  socialEvents: SocialEvent[];
  pressReleases: PressReleaseEmail[];
  blockedSenders: PressReleaseBlockedSender[];
  publicationOverrides: PublicationOverrideLog[];
  storyRevisions: StoryRevision[];
  guideRevisions: GuideRevision[];
  updatedAt: string;
};

let localEditorStoreWriteQueue: Promise<unknown> = Promise.resolve();
let localEditorStoreActiveWrite = false;

export type EditorStorageStatus = {
  mode: "database" | "local-file" | "static";
  persistent: boolean;
  detail: string;
  dataPath: string;
};

export type StoryImagePublishDiagnostics = {
  storyImageUrl: string;
  featuredImageUrl: string;
  thumbnailUrl: string;
  caption: string;
  credit: string;
  alt: string;
  mediaId: string;
  imageVisibleOnPublicStory: boolean;
};

export type PressReleasePublishDiagnostics = {
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

function runtimeNodeProcess() {
  return (globalThis as typeof globalThis & { process?: RuntimeNodeProcessLike }).process;
}

function localEditorStoreAvailable() {
  const process = runtimeNodeProcess();
  return Boolean(process?.versions?.node && process.cwd);
}

function emptyLocalEditorStore(): LocalEditorStore {
  return {
    version: 1,
    stories: [],
    guides: [],
    media: [],
    galleryCategories: defaultGalleryCategories(),
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {},
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    storyRevisions: [],
    guideRevisions: [],
    updatedAt: nowIso(),
  };
}

async function localEditorStorePaths() {
  const process = runtimeNodeProcess();
  if (!process?.versions?.node || !process.cwd) return null;

  const fsSpecifier = "node:fs/promises";
  const pathSpecifier = "node:path";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    access(path: string): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ pathSpecifier) as {
    join(...parts: string[]): string;
  };
  const dataDir = process.env?.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  try { await fs.access(dataDir); } catch {
    try { await fs.mkdir(dataDir, { recursive: true }); } catch (error) {
      if ((error as { code?: string }).code !== "EPERM") throw error;
    }
  }

  return {
    dataDir,
    filePath: path.join(dataDir, "editor-store.json"),
  };
}

async function readLocalEditorStoreUncached(): Promise<LocalEditorStore> {
  const paths = await localEditorStorePaths();
  if (!paths) return emptyLocalEditorStore();
  const process = runtimeNodeProcess();

  const fsSpecifier = "node:fs/promises";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    readFile(path: string, encoding: "utf8"): Promise<string>;
  };

  try {
    const parsed = JSON.parse(await fs.readFile(paths.filePath, "utf8")) as Partial<LocalEditorStore>;
    return {
      version: 1,
      stories: Array.isArray(parsed.stories) ? parsed.stories.map(normalizeStoredStory) : [],
      guides: Array.isArray(parsed.guides) ? parsed.guides.map(normalizeStoredGuide) : [],
      media: Array.isArray(parsed.media) ? parsed.media.map(normalizeMediaAsset) : [],
      galleryCategories: Array.isArray(parsed.galleryCategories) && parsed.galleryCategories.length > 0 ? parsed.galleryCategories : defaultGalleryCategories(),
      galleryItems: Array.isArray(parsed.galleryItems) ? parsed.galleryItems.map(normalizeGalleryItem) : [],
      instagramImports: Array.isArray(parsed.instagramImports) ? parsed.instagramImports : [],
      ads: Array.isArray(parsed.ads) ? parsed.ads : [],
      settings: parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {},
      socialEvents: Array.isArray(parsed.socialEvents) ? parsed.socialEvents : [],
      pressReleases: Array.isArray(parsed.pressReleases)
        ? parsed.pressReleases.map(normalizePressRelease)
        : [],
      blockedSenders: Array.isArray(parsed.blockedSenders) ? parsed.blockedSenders : [],
      publicationOverrides: Array.isArray(parsed.publicationOverrides)
        ? parsed.publicationOverrides.map(normalizePublicationOverrideLog)
        : [],
      storyRevisions: Array.isArray(parsed.storyRevisions)
        ? parsed.storyRevisions.map(normalizeStoryRevision).filter((revision): revision is StoryRevision => Boolean(revision))
        : [],
      guideRevisions: Array.isArray(parsed.guideRevisions)
        ? parsed.guideRevisions.map(normalizeGuideRevision).filter((revision): revision is GuideRevision => Boolean(revision))
        : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
    };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const productionStoreRequired = process?.env?.OLDSEADOGS_ENV === "production" || process?.env?.OLDSEADOGS_REQUIRE_EXISTING_STORE === "true";
    if (code === "ENOENT" && !productionStoreRequired) return emptyLocalEditorStore();
    console.error("[OldSeaDogs storage] refusing to replace an unreadable editor store", {
      dataPath: paths.filePath,
      code,
      errorName: error instanceof Error ? error.name : "",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      code === "ENOENT"
        ? `The configured editor story store is missing at ${paths.filePath}. Restore it from /var/www/Oldseadogsbackups before continuing.`
        : `The editor story store at ${paths.filePath} could not be read safely. No empty replacement was created.`,
      { cause: error }
    );
  }
}


let localEditorStoreReadCache: {
  signature: string;
  store: LocalEditorStore;
} | null = null;

let localEditorStoreReadInFlight: {
  signature: string;
  promise: Promise<LocalEditorStore>;
} | null = null;

async function readLocalEditorStore():
  Promise<LocalEditorStore> {
  const paths = await localEditorStorePaths();
  if (!paths) return emptyLocalEditorStore();

  const fsSpecifier = "node:fs/promises";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    stat(path: string): Promise<{
      ino: number | bigint;
      mtimeMs: number;
      size: number;
    }>;
  };

  let signature: string;
  try {
    const details = await fs.stat(paths.filePath);
    signature = `${details.ino}:${details.size}:${details.mtimeMs}`;
  } catch {
    return readLocalEditorStoreUncached();
  }

  if (localEditorStoreReadCache?.signature === signature) {
    return localEditorStoreReadCache.store;
  }

  if (localEditorStoreReadInFlight?.signature === signature) {
    return localEditorStoreReadInFlight.promise;
  }

  const promise = readLocalEditorStoreUncached();
  localEditorStoreReadInFlight = { signature, promise };

  try {
    const store = await promise;
    localEditorStoreReadCache = { signature, store };
    return store;
  } finally {
    if (localEditorStoreReadInFlight?.promise === promise) {
      localEditorStoreReadInFlight = null;
    }
  }
}

async function writeLocalEditorStoreNow(store: LocalEditorStore) {
  const paths = await localEditorStorePaths();
  if (!paths) throw new Error("DigitalOcean staging storage is not available in this runtime.");

  const fsSpecifier = "node:fs/promises";
  const process = runtimeNodeProcess();
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    access(path: string): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    stat(path: string): Promise<{ size: number }>;
    writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
  };
  const nextStore: LocalEditorStore = {
    ...store,
    updatedAt: nowIso(),
  };
  const payload = JSON.stringify(nextStore, null, 2);
  const tempPath = `${paths.filePath}.${process?.pid ?? "node"}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2)}.tmp`;
  const writeStartedAt = nowIso();
  const concurrentWriteDetected = localEditorStoreActiveWrite;

  try {
    localEditorStoreActiveWrite = true;
    await fs.mkdir(paths.dataDir, { recursive: true });
    await fs.writeFile(tempPath, payload, "utf8");
    const tempStat = await fs.stat(tempPath);
    const tempPayload = await fs.readFile(tempPath, "utf8");
    JSON.parse(tempPayload);
    let destinationExists = false;
    try {
      await fs.access(paths.filePath);
      destinationExists = true;
    } catch {
      destinationExists = false;
    }
    console.info("[OldSeaDogs storage] editor-store write prepared", {
      writeStartedAt,
      tempPath,
      tempExistsBeforeRename: true,
      tempSize: tempStat.size,
      destinationPath: paths.filePath,
      destinationExists,
      concurrentWriteDetected,
    });
    await fs.rename(tempPath, paths.filePath);
  } catch (error) {
    let tempExistsBeforeRename = false;
    let tempSize = 0;
    let destinationExists = false;
    try {
      const stat = await fs.stat(tempPath);
      tempExistsBeforeRename = true;
      tempSize = stat.size;
    } catch {
      tempExistsBeforeRename = false;
    }
    try {
      await fs.access(paths.filePath);
      destinationExists = true;
    } catch {
      destinationExists = false;
    }
    console.error("[OldSeaDogs storage] editor-store write failed", {
      writeStartedAt,
      tempPath,
      tempExistsBeforeRename,
      tempSize,
      destinationPath: paths.filePath,
      destinationExists,
      concurrentWriteDetected,
      errorName: error instanceof Error ? error.name : "",
      errorMessage: error instanceof Error ? error.message : String(error),
      errno: typeof error === "object" && error && "errno" in error ? String(error.errno) : "",
      code: typeof error === "object" && error && "code" in error ? String(error.code) : "",
      syscall: typeof error === "object" && error && "syscall" in error ? String(error.syscall) : "",
    });
    throw error;
  } finally {
    localEditorStoreActiveWrite = false;
  }
}

async function localEditorStoreLockOwner(lockPath: string) {
  const fsSpecifier = "node:fs/promises";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    readFile(path: string, encoding: "utf8"): Promise<string>;
    stat(path: string): Promise<{ mtimeMs: number }>;
  };
  try {
    const owner = JSON.parse(await fs.readFile(`${lockPath}/owner.json`, "utf8")) as {
      pid?: number;
      token?: string;
    };
    return {
      ageMs: Date.now() - (await fs.stat(lockPath)).mtimeMs,
      pid: Number(owner.pid || 0),
      token: String(owner.token || ""),
    };
  } catch {
    try {
      return {
        ageMs: Date.now() - (await fs.stat(lockPath)).mtimeMs,
        pid: 0,
        token: "",
      };
    } catch {
      return null;
    }
  }
}

function localProcessIsRunning(pid: number) {
  const process = runtimeNodeProcess();
  if (!pid || !process?.kill) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as { code?: string }).code !== "ESRCH";
  }
}

async function withLocalEditorStoreFileLock<T>(operation: () => Promise<T>): Promise<T> {
  const paths = await localEditorStorePaths();
  if (!paths) throw new Error("DigitalOcean staging storage is not available in this runtime.");

  const fsSpecifier = "node:fs/promises";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    mkdir(path: string, options?: { mode?: number; recursive?: boolean }): Promise<void>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    rename(oldPath: string, newPath: string): Promise<void>;
    rm(path: string, options: { force: boolean; recursive: boolean }): Promise<void>;
    writeFile(
      path: string,
      data: string,
      options: { encoding: "utf8"; flag?: "wx"; mode: number }
    ): Promise<void>;
  };
  const process = runtimeNodeProcess();
  const lockPath = `${paths.filePath}.lock`;
  const token = `${process?.pid ?? "node"}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startedAt = Date.now();
  const timeoutMs = Math.max(5_000, Number(process?.env?.OLDSEADOGS_STORE_LOCK_TIMEOUT_MS || 30_000));
  const incompleteOwnerGraceMs = 30_000;

  while (true) {
    try {
      await fs.mkdir(lockPath, { mode: 0o700 });
      try {
        await fs.writeFile(
          `${lockPath}/owner.json`,
          JSON.stringify({ pid: process?.pid ?? 0, token, acquiredAt: nowIso() }),
          { encoding: "utf8", mode: 0o600 }
        );
      } catch (ownerWriteError) {
        await fs.rm(lockPath, { recursive: true, force: true });
        throw ownerWriteError;
      }
      break;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "EEXIST") throw error;

      const owner = await localEditorStoreLockOwner(lockPath);
      const ownerIsDead = owner !== null && owner.pid > 0 && !localProcessIsRunning(owner.pid);
      const incompleteOwnerIsStale =
        owner !== null && owner.pid === 0 && owner.ageMs >= incompleteOwnerGraceMs;
      if (ownerIsDead) {
        try {
          // Renaming the owner file claims stale-lock cleanup without creating
          // a gap in which another process could acquire and then have its new
          // lock mistaken for the old one.
          await fs.rename(`${lockPath}/owner.json`, `${lockPath}/reaping-${token}.json`);
          await fs.rm(lockPath, { recursive: true, force: true });
          continue;
        } catch (staleError) {
          if ((staleError as { code?: string }).code !== "ENOENT") throw staleError;
        }
      }
      if (incompleteOwnerIsStale) {
        try {
          // A fixed exclusive marker ensures only one waiter reaps a lock left
          // by a crash before owner.json was completely written.
          await fs.writeFile(`${lockPath}/reaping`, token, {
            encoding: "utf8",
            flag: "wx",
            mode: 0o600,
          });
          await fs.rm(lockPath, { recursive: true, force: true });
          continue;
        } catch (staleError) {
          const staleCode = (staleError as { code?: string }).code;
          if (staleCode !== "EEXIST" && staleCode !== "ENOENT") throw staleError;
        }
      }

      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(
          `Timed out waiting for the editor store lock at ${lockPath}. ` +
          "Another editor or scheduler process may still be writing."
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 25 + Math.floor(Math.random() * 50)));
    }
  }

  try {
    return await operation();
  } finally {
    try {
      const owner = JSON.parse(await fs.readFile(`${lockPath}/owner.json`, "utf8")) as { token?: string };
      if (owner.token === token) {
        await fs.rm(lockPath, { recursive: true, force: true });
      }
    } catch (error) {
      if ((error as { code?: string }).code !== "ENOENT") throw error;
    }
  }
}

async function runLocalEditorStoreWriteTransaction<T>(operation: () => Promise<T>) {
  const writeJob = localEditorStoreWriteQueue.then(() => withLocalEditorStoreFileLock(operation));
  localEditorStoreWriteQueue = writeJob.catch(() => undefined);
  return writeJob;
}

async function updateLocalEditorStoreUnlocked(
  mutator: (store: LocalEditorStore) => LocalEditorStore | Promise<LocalEditorStore>
) {
  const store = await readLocalEditorStore();
  const nextStore = await mutator(store);
  if (nextStore === store) return store;
  await writeLocalEditorStoreNow(nextStore);
  return nextStore;
}

export async function updateLocalEditorStore(
  mutator: (store: LocalEditorStore) => LocalEditorStore | Promise<LocalEditorStore>,
  lockAlreadyHeld = false
) {
  if (lockAlreadyHeld) {
    return updateLocalEditorStoreUnlocked(mutator);
  }
  return runLocalEditorStoreWriteTransaction(() => updateLocalEditorStoreUnlocked(mutator));
}

export async function getEditorStorageStatus(): Promise<EditorStorageStatus> {
  if (getDbOrNull()) {
    return {
      mode: "database",
      persistent: true,
      detail: "Persistent database storage is available for stories, adverts, media records and newsroom review items.",
      dataPath: "database",
    };
  }

  if (localEditorStoreAvailable()) {
    const paths = await localEditorStorePaths();
    return {
      mode: "local-file",
      persistent: true,
      detail:
        "DigitalOcean staging is using a private server-side JSON store for editor data. It survives PM2 restarts, but it should be backed up and replaced with the production database before final launch.",
      dataPath: paths?.filePath || "",
    };
  }

  return {
    mode: "static",
    persistent: false,
    detail: "No writable editor storage is available in this runtime.",
    dataPath: "",
  };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeStoryStatus(value: string): EditableStory["status"] {
  if (value === "draft" || value === "scheduled" || value === "published" || value === "unpublished") {
    return value;
  }
  return value === "private" ? "unpublished" : "published";
}

function basisFromSourceType(value: string) {
  const sourceType = value.trim().toLowerCase();
  if (sourceType.includes("press release")) return "Press release";
  if (sourceType.includes("organiser")) return "Organiser statement";
  if (sourceType.includes("notice")) return "Official notice";
  if (sourceType.includes("interview")) return "Interview";
  if (sourceType.includes("site visit")) return "Site visit";
  if (sourceType.includes("automatic watch")) return "Official notice or organiser statement";
  return "Old Sea Dogs observation and editorial research";
}

export function isPublicStoryNow(
  story: Pick<EditableStory, "status" | "publishedAt" | "scheduledPublishAt">
) {
  return story.status === "published";
}

function normalizeStoredStory(story: Partial<EditableStory>): EditableStory {
  const status = normalizeStoryStatus(String(story.status || "published"));
  const createdAt = storyCreatedAt({
    id: String(story.id || "legacy-story"),
    slug: story.slug,
    status,
    editorialStatus: story.editorialStatus,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    publishedAt: story.publishedAt,
    scheduledPublishAt: story.scheduledPublishAt,
    date: story.date,
    statusHistory: story.statusHistory,
  });
  const publishedAt =
    status === "published"
      ? story.publishedAt || story.updatedAt || createdAt
      : story.publishedAt || "";
  const category = normalizeStoryCategory(story.category || "News");
  const primarySection = getSectionForCategory(category)?.slug || "news";
  const sectionSlugs = Array.from(new Set([
    primarySection,
    ...(Array.isArray(story.sectionSlugs) ? story.sectionSlugs : []),
  ].map((slug) => String(slug).trim().toLowerCase()).filter((slug) => oldSeaDogsSections.some((section) => section.slug === slug))));
  return {
    id: story.id || makeId("story"),
    slug: story.slug || makeSlug(story.title || "untitled-story"),
    title: story.title || "Untitled story",
    category,
    sectionSlugs,
    date: story.date || publishedAt.slice(0, 10) || createdAt.slice(0, 10),
    author: story.author || "Old Sea Dogs",
    sourceType: story.sourceType || "Original",
    sourceName: story.sourceName || "Old Sea Dogs desk",
    sourceUrl: story.sourceUrl || "",
    originalSourceType: story.originalSourceType || "",
    originalSourceRef: story.originalSourceRef || "",
    originalSourceContent: story.originalSourceContent || "",
    imageUrl: story.imageUrl || "",
    imageAlt: story.imageAlt || story.title || "Old Sea Dogs story image",
    imageCredit: story.imageCredit || "",
    imageCaption: story.imageCaption || "",
    videoUrl: story.videoUrl || "",
    videoCaption: story.videoCaption || "",
    videoPosition: story.videoPosition === "top" || story.videoPosition === "after-intro" || story.videoPosition === "bottom"
      ? story.videoPosition
      : "",
    oldSeaDogsView: story.oldSeaDogsView || "",
    sourceNotes: story.sourceNotes || "",
    methodNotes: story.methodNotes || "",
    contentBasis: story.contentBasis || basisFromSourceType(story.sourceType || "Original"),
    editorialStatus: story.editorialStatus || "Needs improvement",
    noindex: Boolean(story.noindex),
    summary: story.summary || "",
    body: Array.isArray(story.body) ? story.body.map(String) : [],
    tags: cleanStoryTags(Array.isArray(story.tags) ? story.tags.map(String) : []),
    readMinutes: Number(story.readMinutes || 3),
    isFeatured: Boolean(story.isFeatured),
    status,
    publishedAt,
    scheduledPublishAt: story.scheduledPublishAt || "",
    sortOrder: Number(story.sortOrder || 0),
    createdAt,
    updatedAt: story.updatedAt || createdAt,
    statusHistory: Array.isArray(story.statusHistory) ? story.statusHistory : [],
  };
}

function normalizeStoryRevision(item: Partial<StoryRevision>): StoryRevision | null {
  if (!item || typeof item !== "object" || !item.snapshot || typeof item.snapshot !== "object") return null;
  const snapshot = normalizeStoredStory(item.snapshot);
  const storyId = String(item.storyId || snapshot.id || "");
  if (!storyId) return null;
  return {
    id: String(item.id || makeId("story-revision")),
    storyId,
    snapshot: { ...snapshot, id: storyId },
    reason: String(item.reason || "Published story edit"),
    createdBy: String(item.createdBy || "Bridge editor"),
    createdAt: String(item.createdAt || nowIso()),
  };
}

function normalizePublicationOverrideLog(item: Partial<PublicationOverrideLog>): PublicationOverrideLog {
  const editorIdentity = String(item.editorIdentity || item.user || "Bridge editor");
  const timestamp = String(item.timestamp || item.time || nowIso());
  const editorNote = String(item.editorNote || item.reason || "");
  return {
    id: item.id || makeId("override"),
    storyId: String(item.storyId || ""),
    kind: item.kind === "media-rights" ? "media-rights" : item.kind === "editorial" ? "editorial" : "wording",
    mediaId: String(item.mediaId || ""),
    editorIdentity,
    wording: String(item.wording || ""),
    paragraph: String(item.paragraph || ""),
    editorNote,
    warnings: Array.isArray(item.warnings) ? item.warnings.map(String).filter(Boolean) : [],
    headline: String(item.headline || ""),
    storyStatus: String(item.storyStatus || ""),
    action: String(item.action || ""),
    timestamp,
    user: editorIdentity,
    time: timestamp,
    validationOverridden: String(item.validationOverridden || item.wording || ""),
    reason: editorNote,
  };
}

function normalizeGuideStatus(value: string): GuideStatus {
  if (value === "draft" || value === "published" || value === "unpublished") return value;
  return "draft";
}

export function guideWordCount(guide: Pick<EditableGuide, "summary" | "sections" | "checklist">) {
  return [
    guide.summary,
    ...guide.sections.flatMap((section) => [section.heading, ...section.body]),
    ...guide.checklist,
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function guideMinimumWordCount(guide: Pick<EditableGuide, "internalId">) {
  return /^OSD-G\d+$/i.test(guide.internalId) ? 80 : 1000;
}

function guideAnchor(value: string) {
  return makeSlug(value) || "guide-section";
}

function optionalGuideSlug(value: unknown) {
  const candidate = String(value || "").trim();
  return candidate ? makeSlug(candidate) : "";
}

function staticGuideDefaults(guide: FlagshipGuide, index: number): EditableGuide {
  const editable: EditableGuide = {
    ...guide,
    internalId: guide.internalId || "",
    introduction: guide.introduction || guide.summary,
    guideType: guide.guideType || "Destination",
    regionKey: guide.regionKey || "",
    regionName: guide.regionName || "",
    subregion: guide.subregion || "",
    parentGuideSlug: guide.parentGuideSlug || "",
    editorialOrder: guide.editorialOrder ?? index + 1,
    author: guide.author || "Michael Hodges",
    contributorCredits: guide.contributorCredits || [],
    imageFocalPoint: guide.imageFocalPoint || "50% 50%",
    artworkCredit: guide.artworkCredit || "",
    location: guide.location || {},
    relatedGuideSlugs: guide.relatedGuideSlugs || [],
    cruiseOnGuideSlugs: guide.cruiseOnGuideSlugs || [],
    previousGuideSlug: guide.previousGuideSlug || "",
    nextGuideSlug: guide.nextGuideSlug || "",
    socialTitle: guide.socialTitle || guide.title,
    socialDescription: guide.socialDescription || guide.summary,
    canonicalPath: guide.canonicalPath || `/guides/${guide.slug}`,
    editorialNotes: guide.editorialNotes || "",
    researchNotes: guide.researchNotes || "",
    reviewDue: guide.reviewDue || "",
    accuracyConcerns: guide.accuracyConcerns || "",
    sourceNotes: guide.sourceNotes || "",
    draftComments: guide.draftComments || "",
    verifiedFacilities: guide.verifiedFacilities || [],
    facilityVerificationNotes: guide.facilityVerificationNotes || "",
    status: "published",
    noindex: false,
    showOnHomepage: true,
    homepageOrder: index + 1,
    seoTitle: guide.seoTitle || guide.title,
    seoDescription: guide.seoDescription || guide.summary,
    tags: [],
    imageCaption: guide.imageCaption || "",
    imageCredit: guide.imageCredit || "",
    featuredMediaId: "",
    inlineImages: [],
  };
  if (guideWordCount(editable) < guideMinimumWordCount(editable)) {
    editable.status = "draft";
    editable.noindex = true;
    editable.showOnHomepage = false;
  }
  return editable;
}

function normalizeGuideSections(value: unknown): EditableGuide["sections"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section) => {
      const input = section as {
        heading?: unknown;
        body?: unknown;
        anchor?: unknown;
        kind?: unknown;
        listItems?: unknown;
        links?: unknown;
      };
      const heading = cleanPressReleaseHeadline(String(input.heading || "")).trim();
      return {
        heading,
        body: Array.isArray(input.body)
          ? input.body.map((paragraph) => cleanPressReleaseText(String(paragraph || ""))).filter(Boolean)
          : [],
        anchor: guideAnchor(String(input.anchor || heading)),
        kind: (input.kind === "callout" || input.kind === "quote" ? input.kind : "prose") as
          "prose" | "callout" | "quote",
        listItems: Array.isArray(input.listItems)
          ? input.listItems.map((item) => cleanPressReleaseText(String(item || ""))).filter(Boolean)
          : [],
        links: Array.isArray(input.links)
          ? input.links.map((item) => {
              const link = item as { label?: unknown; guideSlug?: unknown };
              return {
                label: cleanPressReleaseHeadline(String(link.label || "")).trim(),
                guideSlug: makeSlug(String(link.guideSlug || "")),
              };
            }).filter((item) => item.label && item.guideSlug)
          : [],
      };
    })
    .filter((section) => section.heading && section.body.length > 0);
}

function normalizeGuideFacts(value: unknown): EditableGuide["quickFacts"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((fact) => {
      const input = fact as { label?: unknown; value?: unknown };
      return {
        label: cleanPressReleaseHeadline(String(input.label || "")).trim(),
        value: cleanPressReleaseHeadline(String(input.value || "")).trim(),
      };
    })
    .filter((fact) => fact.label && fact.value);
}

function normalizeGuideLinks(value: unknown): EditableGuide["sourceLinks"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((source) => {
      const input = source as { label?: unknown; href?: unknown };
      return {
        label: cleanPressReleaseHeadline(String(input.label || "")).trim(),
        href: String(input.href || "").trim(),
      };
    })
    .filter((source) => source.label && source.href);
}

export function normalizeStoredGuide(guide: Partial<EditableGuide>, index = 0): EditableGuide {
  const matchedSeed = guideSeeds.find((item) => item.slug === guide.slug);
  const staticMatch = matchedSeed
    ?? (guide.internalId ? blankGuideSeed : guideSeeds[index] ?? guideSeeds[0]);
  const seedIndex = guideSeeds.findIndex((item) => item.slug === staticMatch.slug);
  const fallback = staticGuideDefaults(staticMatch, seedIndex >= 0 ? seedIndex : index);
  const managed = normalizeManagedGuideFields(guide);
  const sections = normalizeGuideSections(guide.sections).length > 0 ? normalizeGuideSections(guide.sections) : fallback.sections;
  const checklist = Array.isArray(guide.checklist)
    ? guide.checklist.map((item) => cleanPressReleaseText(String(item || ""))).filter(Boolean)
    : fallback.checklist;
  const next: EditableGuide = {
    ...fallback,
    ...managed,
    internalId: String(guide.internalId || fallback.internalId),
    slug: guide.slug || fallback.slug,
    title: cleanPressReleaseHeadline(guide.title || fallback.title),
    eyebrow: cleanPressReleaseHeadline(guide.eyebrow || fallback.eyebrow),
    summary: cleanPressReleaseText(guide.summary || fallback.summary),
    introduction: cleanPressReleaseText(guide.introduction || fallback.introduction),
    guideType: GUIDE_TYPES.includes(guide.guideType as GuideType)
      ? guide.guideType as GuideType
      : fallback.guideType,
    regionKey: makeSlug(guide.regionKey || fallback.regionKey),
    regionName: cleanPressReleaseHeadline(guide.regionName || fallback.regionName),
    subregion: cleanPressReleaseHeadline(guide.subregion || fallback.subregion),
    parentGuideSlug: optionalGuideSlug(guide.parentGuideSlug || fallback.parentGuideSlug),
    editorialOrder: Math.max(0, Number(guide.editorialOrder ?? fallback.editorialOrder)),
    author: cleanPressReleaseHeadline(guide.author || fallback.author),
    contributorCredits: Array.isArray(guide.contributorCredits)
      ? guide.contributorCredits.map((item) => cleanPressReleaseHeadline(String(item))).filter(Boolean)
      : fallback.contributorCredits,
    updatedAt: guide.updatedAt || fallback.updatedAt,
    imageUrl: String(guide.imageUrl !== undefined ? guide.imageUrl : fallback.imageUrl).trim(),
    imageAlt: cleanPressReleaseHeadline(guide.imageAlt !== undefined ? guide.imageAlt : fallback.imageAlt),
    imageFocalPoint: String(guide.imageFocalPoint || fallback.imageFocalPoint).trim(),
    artworkCredit: cleanPressReleaseHeadline(guide.artworkCredit || fallback.artworkCredit),
    quickFacts: normalizeGuideFacts(guide.quickFacts).length > 0 ? normalizeGuideFacts(guide.quickFacts) : fallback.quickFacts,
    sections,
    checklist,
    sourceLinks: normalizeGuideLinks(guide.sourceLinks).length > 0 ? normalizeGuideLinks(guide.sourceLinks) : fallback.sourceLinks,
    status: normalizeGuideStatus(String(guide.status || fallback.status)),
    noindex: Boolean(guide.noindex ?? fallback.noindex),
    showOnHomepage: Boolean(guide.showOnHomepage ?? fallback.showOnHomepage),
    homepageOrder: Number(guide.homepageOrder ?? fallback.homepageOrder),
    seoTitle: cleanPressReleaseHeadline(guide.seoTitle || guide.title || fallback.seoTitle),
    seoDescription: cleanPressReleaseText(guide.seoDescription || guide.summary || fallback.seoDescription),
    tags: cleanStoryTags(Array.isArray(guide.tags) ? guide.tags.map(String) : fallback.tags),
    imageCaption: cleanPressReleaseText(guide.imageCaption || ""),
    imageCredit: cleanPressReleaseHeadline(guide.imageCredit || ""),
    location: {
      latitude: guide.location?.latitude,
      longitude: guide.location?.longitude,
      mapZoom: guide.location?.mapZoom,
      what3words: cleanPressReleaseHeadline(guide.location?.what3words || ""),
      osGridReference: cleanPressReleaseHeadline(guide.location?.osGridReference || ""),
    },
    relatedGuideSlugs: Array.isArray(guide.relatedGuideSlugs)
      ? guide.relatedGuideSlugs.map((item) => makeSlug(String(item))).filter(Boolean)
      : fallback.relatedGuideSlugs,
    cruiseOnGuideSlugs: Array.isArray(guide.cruiseOnGuideSlugs)
      ? guide.cruiseOnGuideSlugs.map((item) => makeSlug(String(item))).filter(Boolean)
      : fallback.cruiseOnGuideSlugs,
    previousGuideSlug: makeSlug(guide.previousGuideSlug || fallback.previousGuideSlug),
    nextGuideSlug: makeSlug(guide.nextGuideSlug || fallback.nextGuideSlug),
    socialTitle: cleanPressReleaseHeadline(guide.socialTitle || guide.title || fallback.socialTitle),
    socialDescription: cleanPressReleaseText(guide.socialDescription || guide.summary || fallback.socialDescription),
    canonicalPath: String(guide.canonicalPath || fallback.canonicalPath).trim(),
    editorialNotes: cleanPressReleaseText(guide.editorialNotes || ""),
    researchNotes: cleanPressReleaseText(guide.researchNotes || ""),
    reviewDue: String(guide.reviewDue || ""),
    accuracyConcerns: cleanPressReleaseText(guide.accuracyConcerns || ""),
    sourceNotes: cleanPressReleaseText(guide.sourceNotes || ""),
    draftComments: cleanPressReleaseText(guide.draftComments || ""),
    verifiedFacilities: Array.isArray(guide.verifiedFacilities)
      ? guide.verifiedFacilities.map((item) => ({
          label: cleanPressReleaseHeadline(String(item.label || "")).trim(),
          detail: cleanPressReleaseText(String(item.detail || "")).trim(),
          sourceUrl: String(item.sourceUrl || "").trim(),
          verifiedOn: String(item.verifiedOn || "").trim(),
        })).filter((item) => item.label && item.detail && /^https?:\/\//i.test(item.sourceUrl))
      : fallback.verifiedFacilities,
    facilityVerificationNotes: cleanPressReleaseText(guide.facilityVerificationNotes || ""),
    featuredMediaId: String(guide.featuredMediaId || ""),
    inlineImages: Array.isArray(guide.inlineImages) ? guide.inlineImages.map((item, inlineIndex) => ({
      id: String(item.id || `guide-image-${inlineIndex + 1}`),
      mediaId: String(item.mediaId || ""),
      url: String(item.url || ""),
      alt: cleanPressReleaseHeadline(item.alt || ""),
      caption: cleanPressReleaseText(item.caption || ""),
      credit: cleanPressReleaseHeadline(item.credit || ""),
      sectionIndex: Math.max(0, Number(item.sectionIndex || 0)),
      paragraphIndex: Math.max(0, Number(item.paragraphIndex || 0)),
      order: Number(item.order ?? inlineIndex),
    })).filter((item) => item.url) : [],
  };

  if (guideWordCount(next) < guideMinimumWordCount(next)) {
    next.status = next.status === "published" ? "draft" : next.status;
    next.noindex = true;
    next.showOnHomepage = false;
  }

  return next;
}

function normalizeGuideRevision(item: Partial<GuideRevision>): GuideRevision | null {
  if (!item || typeof item !== "object" || !item.snapshot || typeof item.snapshot !== "object") return null;
  const snapshot = normalizeStoredGuide(item.snapshot);
  const guideId = String(item.guideId || snapshot.id || snapshot.internalId || "");
  if (!guideId) return null;
  return {
    id: String(item.id || makeId("guide-revision")),
    guideId,
    snapshot,
    actor: cleanPressReleaseHeadline(String(item.actor || "Bridge editor")),
    reason: cleanPressReleaseText(String(item.reason || "Guide edit")),
    source: item.source === "skill-import" || item.source === "bulk-import" ? item.source : "cms",
    createdAt: String(item.createdAt || nowIso()),
  };
}

function staticGuideRows() {
  return guideSeeds.map(staticGuideDefaults);
}

export function mergeLocalGuidesWithStatic(localGuides: Partial<EditableGuide>[] = []) {
  const localBySlug = new Map(localGuides.map((guide, index) => [String(guide.slug || guideSeeds[index]?.slug || ""), normalizeStoredGuide(guide, index)]));
  const merged = staticGuideRows().map((guide, index) => {
    const local = localBySlug.get(guide.slug);
    return local ? normalizeStoredGuide({ ...guide, ...local }, index) : guide;
  });
  for (const guide of localBySlug.values()) {
    if (!merged.some((item) => item.slug === guide.slug)) merged.push(guide);
  }
  return merged.sort((a, b) => a.homepageOrder - b.homepageOrder || a.title.localeCompare(b.title));
}

function defaultAdvertRows(): Advert[] {
  const stamp = nowIso();
  return defaultAds.map((ad) => ({
    ...ad,
    createdAt: stamp,
    updatedAt: stamp,
  }));
}

function activeAdvertRows(adverts: Advert[]) {
  const today = new Date().toISOString().slice(0, 10);
  return adverts.filter((ad) => {
    const starts = !ad.startDate || ad.startDate <= today;
    const hasNotEnded = !ad.endDate || ad.endDate >= today;
    return ad.isActive && starts && hasNotEnded;
  });
}

export function makeId(prefix: string) {
  return createSafeId(prefix);
}

export function makeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `story-${Date.now()}`
  );
}

function makeUniqueSlug(baseSlug: string, usedSlugs: Set<string>) {
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function makeUniqueStorySlug(baseSlug: string, id: string, db: ReturnType<typeof getDbOrNull>) {
  const usedSlugs = new Set(
    staticStories()
      .filter((story) => story.id !== id)
      .map((story) => story.slug)
  );

  if (!db) {
    const store = await readLocalEditorStore();
    for (const story of store.stories) {
      if (story.id !== id) usedSlugs.add(story.slug);
    }
    return makeUniqueSlug(baseSlug, usedSlugs);
  }

  await ensureContentSchema();
  const rows = await db.select({ id: storyRows.id, slug: storyRows.slug }).from(storyRows);
  for (const row of rows) {
    if (row.id !== id) usedSlugs.add(row.slug);
  }

  return makeUniqueSlug(baseSlug, usedSlugs);
}

let contentSchemaPromise: Promise<boolean> | null = null;

async function runSchemaStatement(statement: string) {
  const d1 = getD1BindingOrNull();
  if (!d1) return false;

  await d1.prepare(statement).run();
  return true;
}

async function runOptionalSchemaStatement(statement: string) {
  try {
    return await runSchemaStatement(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("duplicate column")) return true;
    throw error;
  }
}

export async function ensureContentSchema() {
  if (!contentSchemaPromise) {
    contentSchemaPromise = (async () => {
      // Keep these as separate statements so local D1 can prepare them safely.
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS stories (
          id text PRIMARY KEY NOT NULL,
          slug text NOT NULL,
          title text NOT NULL,
          category text NOT NULL,
          section_slugs_json text DEFAULT '[]' NOT NULL,
          date text NOT NULL,
          author text NOT NULL,
          source_type text NOT NULL,
          source_name text NOT NULL,
          source_url text,
          original_source_type text DEFAULT '' NOT NULL,
          original_source_ref text DEFAULT '' NOT NULL,
          original_source_content text DEFAULT '' NOT NULL,
          image_url text NOT NULL,
          image_alt text NOT NULL,
          image_credit text DEFAULT '' NOT NULL,
          image_caption text DEFAULT '' NOT NULL,
          video_url text DEFAULT '' NOT NULL,
          video_caption text DEFAULT '' NOT NULL,
          video_position text DEFAULT '' NOT NULL,
          old_sea_dogs_view text DEFAULT '' NOT NULL,
          source_notes text DEFAULT '' NOT NULL,
          method_notes text DEFAULT '' NOT NULL,
          content_basis text DEFAULT '' NOT NULL,
          editorial_status text DEFAULT 'Needs improvement' NOT NULL,
          noindex integer DEFAULT 0 NOT NULL,
          summary text NOT NULL,
          body_json text NOT NULL,
          tags_json text NOT NULL,
          read_minutes integer NOT NULL,
          is_featured integer DEFAULT 0 NOT NULL,
          status text DEFAULT 'published' NOT NULL,
          published_at text DEFAULT '' NOT NULL,
          scheduled_publish_at text DEFAULT '' NOT NULL,
          sort_order integer DEFAULT 0 NOT NULL,
          created_at text NOT NULL,
          updated_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        "CREATE UNIQUE INDEX IF NOT EXISTS stories_slug_unique ON stories (slug)"
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS story_status_history (
          id text PRIMARY KEY NOT NULL,
          story_id text NOT NULL,
          from_status text DEFAULT '' NOT NULL,
          to_status text NOT NULL,
          from_workflow text DEFAULT '' NOT NULL,
          to_workflow text DEFAULT '' NOT NULL,
          changed_by text DEFAULT 'Bridge editor' NOT NULL,
          changed_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        "CREATE INDEX IF NOT EXISTS story_status_history_story_idx ON story_status_history (story_id, changed_at)"
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS story_revisions (
          id text PRIMARY KEY NOT NULL,
          story_id text NOT NULL,
          snapshot_json text NOT NULL,
          reason text DEFAULT 'Published story edit' NOT NULL,
          created_by text DEFAULT 'Bridge editor' NOT NULL,
          created_at text NOT NULL
        )`
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD section_slugs_json text DEFAULT '[]' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD original_source_type text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD original_source_ref text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD original_source_content text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD image_credit text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD image_caption text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD video_url text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD video_caption text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD video_position text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD old_sea_dogs_view text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD source_notes text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD method_notes text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD content_basis text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD editorial_status text DEFAULT 'Needs improvement' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD noindex integer DEFAULT 0 NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD published_at text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE stories ADD scheduled_publish_at text DEFAULT '' NOT NULL"
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS media_assets (
          id text PRIMARY KEY NOT NULL,
          filename text NOT NULL,
          content_type text NOT NULL,
          size integer NOT NULL,
          r2_key text NOT NULL,
          url text NOT NULL,
          alt text DEFAULT '' NOT NULL,
          created_at text NOT NULL
        )`
      );
      for (const statement of [
        "ALTER TABLE media_assets ADD original_filename text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD display_name text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD internal_title text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD caption text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD credit text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD copyright text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD copyright_ownership text DEFAULT 'unknown' NOT NULL",
        "ALTER TABLE media_assets ADD copyright_owner text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD photographer text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD source text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD licence text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD permission_note text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD usage_restrictions text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD credit_line text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD permission_received_at text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD location text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD date_taken text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD source_type text DEFAULT 'upload' NOT NULL",
        "ALTER TABLE media_assets ADD category text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD tags_json text DEFAULT '[]' NOT NULL",
        "ALTER TABLE media_assets ADD collections_json text DEFAULT '[]' NOT NULL",
        "ALTER TABLE media_assets ADD story_ids_json text DEFAULT '[]' NOT NULL",
        "ALTER TABLE media_assets ADD gallery_item_id text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD original_key text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD web_key text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD width integer DEFAULT 0 NOT NULL",
        "ALTER TABLE media_assets ADD height integer DEFAULT 0 NOT NULL",
        "ALTER TABLE media_assets ADD poster_media_id text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD external_url text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD description text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD story_association_id text DEFAULT '' NOT NULL",
        "ALTER TABLE media_assets ADD gallery_association_id text DEFAULT '' NOT NULL",
      ]) await runOptionalSchemaStatement(statement);
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS gallery_categories (
          id text PRIMARY KEY NOT NULL, name text NOT NULL, slug text NOT NULL UNIQUE,
          description text DEFAULT '' NOT NULL, sort_order integer DEFAULT 0 NOT NULL,
          created_at text NOT NULL, updated_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS gallery_items (
          id text PRIMARY KEY NOT NULL, media_id text NOT NULL,
          source_type text DEFAULT 'upload' NOT NULL, source_id text DEFAULT '' NOT NULL,
          source_url text DEFAULT '' NOT NULL, title text DEFAULT '' NOT NULL,
          caption text DEFAULT '' NOT NULL, alt text DEFAULT '' NOT NULL,
          credit text DEFAULT '' NOT NULL, copyright text DEFAULT '' NOT NULL,
          location text DEFAULT '' NOT NULL, date_taken text DEFAULT '' NOT NULL,
          tags_json text DEFAULT '[]' NOT NULL, category_ids_json text DEFAULT '[]' NOT NULL,
          story_ids_json text DEFAULT '[]' NOT NULL, boat_id text DEFAULT '' NOT NULL,
          marina_id text DEFAULT '' NOT NULL, yacht_club_id text DEFAULT '' NOT NULL,
          event_id text DEFAULT '' NOT NULL, status text DEFAULT 'pending' NOT NULL,
          rejection_reason text DEFAULT '' NOT NULL, created_at text NOT NULL, updated_at text NOT NULL
        )`
      );
      await runSchemaStatement("CREATE INDEX IF NOT EXISTS gallery_items_status_idx ON gallery_items (status)");
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS instagram_imports (
          id text PRIMARY KEY NOT NULL, instagram_media_id text NOT NULL UNIQUE,
          permalink text DEFAULT '' NOT NULL, media_type text DEFAULT 'IMAGE' NOT NULL,
          caption text DEFAULT '' NOT NULL, timestamp text DEFAULT '' NOT NULL,
          media_id text DEFAULT '' NOT NULL, gallery_item_id text DEFAULT '' NOT NULL,
          status text DEFAULT 'pending' NOT NULL, imported_at text NOT NULL, updated_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS ads (
          id text PRIMARY KEY NOT NULL,
          placement text NOT NULL,
          kind text DEFAULT 'manual' NOT NULL,
          label text NOT NULL,
          title text DEFAULT '' NOT NULL,
          body text DEFAULT '' NOT NULL,
          image_url text DEFAULT '' NOT NULL,
          link_url text DEFAULT '' NOT NULL,
          code text DEFAULT '' NOT NULL,
          start_date text DEFAULT '' NOT NULL,
          end_date text DEFAULT '' NOT NULL,
          is_active integer DEFAULT 1 NOT NULL,
          created_at text NOT NULL,
          updated_at text NOT NULL
        )`
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE ads ADD start_date text DEFAULT '' NOT NULL"
      );
      await runOptionalSchemaStatement(
        "ALTER TABLE ads ADD end_date text DEFAULT '' NOT NULL"
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS site_settings (
          key text PRIMARY KEY NOT NULL,
          value text NOT NULL,
          updated_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS social_events (
          id text PRIMARY KEY NOT NULL,
          type text NOT NULL,
          platform text DEFAULT '' NOT NULL,
          target text DEFAULT '' NOT NULL,
          story_slug text DEFAULT '' NOT NULL,
          created_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        "CREATE INDEX IF NOT EXISTS social_events_type_idx ON social_events (type)"
      );
      await runSchemaStatement(
        "CREATE INDEX IF NOT EXISTS social_events_created_at_idx ON social_events (created_at)"
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS press_release_emails (
          id text PRIMARY KEY NOT NULL,
          message_id text DEFAULT '' NOT NULL,
          sender_name text DEFAULT '' NOT NULL,
          sender_email text DEFAULT '' NOT NULL,
          sender_domain text DEFAULT '' NOT NULL,
          subject text NOT NULL,
          received_at text NOT NULL,
          preview text DEFAULT '' NOT NULL,
          body_text text DEFAULT '' NOT NULL,
          raw_email text DEFAULT '' NOT NULL,
          attachments_json text DEFAULT '[]' NOT NULL,
          status text DEFAULT 'new' NOT NULL,
          category text DEFAULT 'News' NOT NULL,
          relevance_score integer DEFAULT 0 NOT NULL,
          duplicate_of text DEFAULT '' NOT NULL,
          duplicate_score integer DEFAULT 0 NOT NULL,
          warnings_json text DEFAULT '[]' NOT NULL,
          generated_title text DEFAULT '' NOT NULL,
          generated_excerpt text DEFAULT '' NOT NULL,
          generated_body_json text DEFAULT '[]' NOT NULL,
          generated_word_count integer DEFAULT 0 NOT NULL,
          selected_attachment_id text DEFAULT '' NOT NULL,
          image_url text DEFAULT '' NOT NULL,
          image_alt text DEFAULT '' NOT NULL,
          image_credit text DEFAULT '' NOT NULL,
          image_caption text DEFAULT '' NOT NULL,
          rights_note text DEFAULT '' NOT NULL,
          story_id text DEFAULT '' NOT NULL,
          created_at text NOT NULL,
          updated_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        "CREATE INDEX IF NOT EXISTS press_release_emails_status_idx ON press_release_emails (status)"
      );
      await runSchemaStatement(
        "CREATE INDEX IF NOT EXISTS press_release_emails_sender_idx ON press_release_emails (sender_email)"
      );
      await runSchemaStatement(
        `CREATE TABLE IF NOT EXISTS press_release_blocked_senders (
          id text PRIMARY KEY NOT NULL,
          value text NOT NULL,
          kind text DEFAULT 'sender' NOT NULL,
          reason text DEFAULT '' NOT NULL,
          created_at text NOT NULL
        )`
      );
      await runSchemaStatement(
        "CREATE UNIQUE INDEX IF NOT EXISTS press_release_blocked_value_unique ON press_release_blocked_senders (value)"
      );

      return true;
    })().catch((error) => {
      contentSchemaPromise = null;
      throw error;
    });
  }

  return contentSchemaPromise;
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonList(value: string, fallback: string[] = []) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeMediaAsset(input: Partial<MediaAsset>): MediaAsset {
  return {
    id: String(input.id || ""),
    filename: String(input.filename || "media"),
    originalFilename: String(input.originalFilename || input.filename || "media"),
    displayName: String(input.displayName || input.filename || "media"),
    internalTitle: String(input.internalTitle || input.displayName || input.filename || "media"),
    contentType: String(input.contentType || "application/octet-stream"),
    size: Number(input.size || 0),
    r2Key: String(input.r2Key || ""),
    url: String(input.url || ""),
    alt: String(input.alt || ""),
    caption: String(input.caption || ""),
    credit: String(input.credit || ""),
    copyright: String(input.copyright || ""),
    copyrightOwnership: String(input.copyrightOwnership || "unknown"),
    copyrightOwner: String(input.copyrightOwner || ""),
    photographer: String(input.photographer || input.credit || ""),
    source: String(input.source || ""),
    licence: String(input.licence || ""),
    permissionNote: String(input.permissionNote || ""),
    usageRestrictions: String(input.usageRestrictions || ""),
    creditLine: String(input.creditLine || input.credit || ""),
    permissionReceivedAt: String(input.permissionReceivedAt || ""),
    location: String(input.location || ""),
    dateTaken: String(input.dateTaken || ""),
    sourceType: String(input.sourceType || "upload"),
    category: String(input.category || ""),
    tagsJson: String(input.tagsJson || "[]"),
    collectionsJson: String(input.collectionsJson || "[]"),
    storyIdsJson: String(input.storyIdsJson || "[]"),
    galleryItemId: String(input.galleryItemId || ""),
    originalKey: String(input.originalKey || input.r2Key || ""),
    webKey: String(input.webKey || ""),
    width: Number(input.width || 0),
    height: Number(input.height || 0),
    posterMediaId: String(input.posterMediaId || ""),
    externalUrl: String(input.externalUrl || ""),
    description: String(input.description || input.alt || ""),
    storyAssociationId: String(input.storyAssociationId || ""),
    galleryAssociationId: String(input.galleryAssociationId || input.galleryItemId || ""),
    createdAt: String(input.createdAt || nowIso()),
  };
}

function normalizeGalleryItem(input: Partial<GalleryItem> & Partial<GalleryItemRow>): GalleryItem {
  const list = (value: unknown) => Array.isArray(value) ? value.map(String) : parseJsonList(String(value || "[]"));
  return {
    id: String(input.id || makeId("gallery")),
    mediaId: String(input.mediaId || ""),
    sourceType: String(input.sourceType || "upload"),
    sourceId: String(input.sourceId || ""),
    sourceUrl: String(input.sourceUrl || ""),
    title: String(input.title || ""),
    caption: String(input.caption || ""),
    alt: String(input.alt || ""),
    credit: String(input.credit || ""),
    copyright: String(input.copyright || ""),
    location: String(input.location || ""),
    dateTaken: String(input.dateTaken || ""),
    tags: list("tags" in input ? input.tags : input.tagsJson),
    categoryIds: list("categoryIds" in input ? input.categoryIds : input.categoryIdsJson),
    storyIds: list("storyIds" in input ? input.storyIds : input.storyIdsJson),
    boatId: String(input.boatId || ""),
    marinaId: String(input.marinaId || ""),
    yachtClubId: String(input.yachtClubId || ""),
    eventId: String(input.eventId || ""),
    status: String(input.status || "pending"),
    rejectionReason: String(input.rejectionReason || ""),
    createdAt: String(input.createdAt || nowIso()),
    updatedAt: String(input.updatedAt || nowIso()),
  };
}

function rowToGalleryItem(row: GalleryItemRow): GalleryItem {
  return normalizeGalleryItem(row);
}

function rowToStory(row: typeof storyRows.$inferSelect): EditableStory {
  const status = normalizeStoryStatus(row.status);
  const publishedAt = row.publishedAt || (status === "published" ? row.updatedAt || row.createdAt : "");
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    sectionSlugs: normalizeStoredStory({ category: row.category, sectionSlugs: parseJsonList(row.sectionSlugsJson) }).sectionSlugs,
    date: row.date,
    author: row.author,
    sourceType: row.sourceType,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl ?? "",
    originalSourceType: row.originalSourceType ?? "",
    originalSourceRef: row.originalSourceRef ?? "",
    originalSourceContent: row.originalSourceContent ?? "",
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    imageCredit: row.imageCredit ?? "",
    imageCaption: row.imageCaption ?? "",
    videoUrl: row.videoUrl ?? "",
    videoCaption: row.videoCaption ?? "",
    videoPosition: row.videoPosition === "top" || row.videoPosition === "after-intro" || row.videoPosition === "bottom"
      ? row.videoPosition
      : "",
    oldSeaDogsView: row.oldSeaDogsView ?? "",
    sourceNotes: row.sourceNotes ?? "",
    methodNotes: row.methodNotes ?? "",
    contentBasis: row.contentBasis || basisFromSourceType(row.sourceType),
    editorialStatus: row.editorialStatus || "Needs improvement",
    noindex: Boolean(row.noindex),
    summary: row.summary,
    body: parseJsonList(row.bodyJson),
    tags: cleanStoryTags(parseJsonList(row.tagsJson)),
    readMinutes: row.readMinutes,
    isFeatured: row.isFeatured,
    status,
    publishedAt,
    scheduledPublishAt: row.scheduledPublishAt || "",
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    statusHistory: [],
  };
}

function parsePressAttachmentList(value: string): PressReleaseAttachment[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((attachment) => ({
      id: String(attachment.id || makeId("att")),
      filename: String(attachment.filename || "press-release-photo.jpg"),
      contentType: String(attachment.contentType || "image/jpeg"),
      size: Number(attachment.size || 0),
      dataUrl: String(attachment.dataUrl || ""),
      suggestedCredit: String(attachment.suggestedCredit || ""),
      caption: String(attachment.caption || ""),
      rightsNote: String(attachment.rightsNote || ""),
    }));
  } catch {
    return [];
  }
}

function rowToPressRelease(row: typeof pressReleaseEmails.$inferSelect): PressReleaseEmail {
  const {
    attachmentsJson,
    warningsJson,
    generatedBodyJson,
    status,
    ...pressReleaseFields
  } = row;

  return {
    ...pressReleaseFields,
    status: normalizePressReleaseStatus(status),
    attachments: parsePressAttachmentList(attachmentsJson),
    warnings: parseJsonList(warningsJson),
    generatedBody: parseJsonList(generatedBodyJson),
  };
}

function normalizePressRelease(item: PressReleaseEmail): PressReleaseEmail {
  return {
    ...item,
    status: normalizePressReleaseStatus(item.status),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    warnings: Array.isArray(item.warnings) ? item.warnings.map(String) : [],
    generatedBody: Array.isArray(item.generatedBody) ? item.generatedBody.map(String) : [],
  };
}

function normalizePressReleaseStatus(value: string): PressReleaseStatus {
  const allowed = new Set<PressReleaseStatus>([
    "new",
    "reviewed",
    "accepted",
    "archived",
    "rejected",
    "spam",
    "converted",
    "published",
    "needsDetail",
  ]);
  return allowed.has(value as PressReleaseStatus) ? (value as PressReleaseStatus) : "new";
}

function mediaIdFromImageUrl(value: string) {
  const match = value.match(/\/api\/media\/([^/?#]+)/);
  return match?.[1] || "";
}

function thumbnailUrlFromImageUrl(value: string) {
  const mediaId = mediaIdFromImageUrl(value);
  return mediaId ? `/api/media/${mediaId}?variant=thumbnail` : "";
}

function selectedMediaAttachment(item: PressReleaseEmail) {
  return item.attachments.find((attachment) => attachment.id === item.selectedAttachmentId && attachment.dataUrl.startsWith("/api/media/"));
}

function pressReleaseImageFields(item: PressReleaseEmail, title: string) {
  const selectedAttachment = selectedMediaAttachment(item);
  const imageUrl = item.imageUrl?.trim() || selectedAttachment?.dataUrl || "";
  return {
    imageUrl,
    imageAlt: item.imageAlt?.trim() || selectedAttachment?.caption || selectedAttachment?.filename || title,
    imageCredit: item.imageCredit?.trim() || selectedAttachment?.suggestedCredit || "",
    imageCaption: item.imageCaption?.trim() || selectedAttachment?.caption || "",
  };
}

function storyImageDiagnostics(story: EditableStory, publicStory: EditableStory | null = story): StoryImagePublishDiagnostics {
  const storyImageUrl = story.imageUrl.trim();
  const publicImageUrl = publicStory?.imageUrl.trim() || "";
  return {
    storyImageUrl,
    featuredImageUrl: storyImageUrl,
    thumbnailUrl: thumbnailUrlFromImageUrl(storyImageUrl),
    caption: story.imageCaption,
    credit: story.imageCredit,
    alt: story.imageAlt,
    mediaId: mediaIdFromImageUrl(storyImageUrl),
    imageVisibleOnPublicStory: Boolean(storyImageUrl && publicImageUrl === storyImageUrl),
  };
}

function storyInlineImageCount(body: string[]) {
  return body.filter((paragraph) =>
    paragraph.includes("article-inline-image") || paragraph.includes("[image:/api/media/")
  ).length;
}

function pressReleaseToRow(
  input: Partial<PressReleaseEmail> & {
    id: string;
    subject: string;
    receivedAt: string;
    createdAt?: string;
  }
): typeof pressReleaseEmails.$inferInsert {
  const stamp = nowIso();
  const attachments = input.attachments ?? [];
  const warnings = input.warnings ?? [];
  const generatedBody = (input.generatedBody ?? []).map(cleanPressReleaseText).filter(Boolean);
  const subject = cleanPressReleaseHeadline(input.subject);
  const bodyText = cleanPressReleaseText(input.bodyText || "");
  const generatedTitle = cleanPressReleaseHeadline(input.generatedTitle || "");
  const generatedExcerpt = cleanPressReleaseText(input.generatedExcerpt || "");

  return {
    id: input.id,
    messageId: input.messageId || "",
    senderName: input.senderName || "",
    senderEmail: input.senderEmail || "",
    senderDomain: input.senderDomain || senderDomain(input.senderEmail || ""),
    subject,
    receivedAt: input.receivedAt,
    preview: cleanPressReleaseText(input.preview || bodyText).slice(0, 220),
    bodyText,
    rawEmail: input.rawEmail || "",
    attachmentsJson: JSON.stringify(attachments),
    status: normalizePressReleaseStatus(input.status || "new"),
    category: normalizeStoryCategory(input.category || "News"),
    relevanceScore: Number(input.relevanceScore ?? 0),
    duplicateOf: input.duplicateOf || "",
    duplicateScore: Number(input.duplicateScore ?? 0),
    warningsJson: JSON.stringify(warnings),
    generatedTitle,
    generatedExcerpt,
    generatedBodyJson: JSON.stringify(generatedBody),
    generatedWordCount: Number(input.generatedWordCount ?? 0),
    selectedAttachmentId: input.selectedAttachmentId || "",
    imageUrl: input.imageUrl || "",
    imageAlt: input.imageAlt || "",
    imageCredit: input.imageCredit || "",
    imageCaption: input.imageCaption || "",
    rightsNote: input.rightsNote || "",
    storyId: input.storyId || "",
    createdAt: input.createdAt || stamp,
    updatedAt: stamp,
  };
}

async function getPressReleaseById(id: string) {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    const item = store.pressReleases.find((pressRelease) => pressRelease.id === id);
    if (!item) throw new Error("I could not find that press-release item.");
    return normalizePressRelease(item);
  }

  await ensureContentSchema();
  const [row] = await db.select().from(pressReleaseEmails).where(eq(pressReleaseEmails.id, id)).limit(1);
  if (!row) throw new Error("I could not find that press-release item.");
  return rowToPressRelease(row);
}

function pressReleaseStoryInput(item: PressReleaseEmail, status: "draft" | "published"): Partial<EditableStory> {
  const title = item.generatedTitle.trim() || item.subject.trim() || "Untitled press-release story";
  const body = item.generatedBody.length > 0 ? item.generatedBody : [item.generatedExcerpt || item.preview || item.bodyText];
  const imageFields = pressReleaseImageFields(item, title);
  return {
    id: item.storyId || "",
    slug: makeSlug(title),
    title,
    category: normalizeStoryCategory(item.category || "News"),
    date: item.receivedAt.slice(0, 10),
    author: "Michael Hodges",
    sourceType: "Press release",
    sourceName: "Private newsroom email",
    sourceUrl: "",
    originalSourceType: "email/rfc822",
    originalSourceRef: item.messageId || item.id,
    originalSourceContent: item.rawEmail || item.bodyText,
    oldSeaDogsView:
      `${title} began as a newsroom email, so its value depends on the hard details that survive the polish: named people, dates, places, boats, notices, results or practical changes readers can act on. The useful question is whether a sailor, owner, club, crew or marina visitor can enter, attend, inspect, compare, avoid a problem or plan a better day afloat because of it. What is new should be the specific fact in the report, not the sender's enthusiasm. What remains uncertain is anything the email does not prove: final entries, weather, availability, pricing, delivery claims or performance that needs testing on the water. Treat this as an edited pointer, then check the named source before making plans.`,
    sourceNotes: `Newsroom email from ${item.senderName || item.senderEmail || "press contact"}.`,
    methodNotes: "Email text cleaned for boilerplate, duplicate wording and promotional claims, then edited for Old Sea Dogs readers before publication.",
    contentBasis: "Press release",
    editorialStatus: "Needs improvement",
    noindex: false,
    imageUrl: imageFields.imageUrl,
    imageAlt: imageFields.imageAlt,
    imageCredit: imageFields.imageCredit,
    imageCaption: imageFields.imageCaption,
    summary: item.generatedExcerpt || item.preview,
    body,
    tags: cleanStoryTags(pressReleaseSeoTags(item, title, body)),
    readMinutes: Math.max(3, Math.ceil(body.join(" ").split(/\s+/).filter(Boolean).length / 220)),
    isFeatured: false,
    status,
    sortOrder: 0,
  };
}

function pressReleaseSeoTags(item: PressReleaseEmail, title: string, body: string[]) {
  const category = normalizeStoryCategory(item.category || "News");
  const text = [title, item.generatedExcerpt, ...body].join(" ").toLowerCase();
  const tags = [category];
  const keywordRules: Array<[RegExp, string]> = [
    [/\bcowes week\b/, "Cowes Week"],
    [/\bfastnet\b/, "Rolex Fastnet"],
    [/\btranspac\b/, "Transpac"],
    [/\bvendee|vendée\b/, "Vendee Globe"],
    [/\bsailgp\b/, "SailGP"],
    [/\bregatta|race|racing|line honours|start line|finish line\b/, "Sailing Races"],
    [/\byacht club|clubhouse|commodore|burgee\b/, "Yacht Clubs"],
    [/\bmarina|harbour|harbor|port|berth|anchorage\b/, "Ports and Marinas"],
    [/\bsuperyacht|motor yacht|flybridge|cruiser\b/, "Yachts"],
    [/\bboat show|yacht show|metstrade|southampton|monaco|cannes\b/, "Boat Shows"],
    [/\bcrew|skipper|sailor|helm\b/, "Sailing Community"],
    [/\bweather|breeze|wind|tide|offshore\b/, "Seamanship"],
  ];

  for (const [pattern, tag] of keywordRules) {
    if (pattern.test(text)) tags.push(tag);
  }

  return tags;
}

function seedToStoryRow(
  story: (typeof seedStories)[number],
  index: number
): typeof storyRows.$inferInsert {
  const stamp = nowIso();
  return {
    id: `seed_${story.slug}`,
    slug: story.slug,
    title: story.title,
    category: story.category,
    sectionSlugsJson: JSON.stringify([getSectionForCategory(story.category)?.slug || "news"]),
    date: story.date,
    author: story.author,
    sourceType: story.sourceType,
    sourceName: story.sourceName,
    sourceUrl: story.sourceUrl ?? null,
    imageUrl: story.image,
    imageAlt: story.imageAlt,
    imageCredit: "",
    imageCaption: "",
    oldSeaDogsView: "",
    sourceNotes: story.sourceName || "Old Sea Dogs static story archive.",
    methodNotes: "Seed story carried in source-controlled editorial content.",
    contentBasis: basisFromSourceType(story.sourceType),
    editorialStatus: story.featured ? "Keep live" : "Needs improvement",
    noindex: false,
    summary: story.summary,
    bodyJson: JSON.stringify(story.body),
    tagsJson: JSON.stringify(cleanStoryTags(story.tags)),
    readMinutes: story.readMinutes,
    isFeatured: Boolean(story.featured),
    status: "published",
    publishedAt: stamp,
    scheduledPublishAt: "",
    sortOrder: index,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

type LegacyStoryRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  summary: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  featured?: boolean;
};

const legacyStoryRecords = legacyStories as LegacyStoryRecord[];

type DevelopmentHomepageFixtureStory = {
  slug: string;
  title: string;
  category: string;
  date: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  summary: string;
  body: string[];
  readMinutes: number;
  featured: boolean;
};

type DevelopmentHomepageFixtureModule = {
  homepageProductionSnapshotStories: DevelopmentHomepageFixtureStory[];
  homepageProductionSnapshot: {
    capturedAt: string;
    leadSlug: string;
    latestSlugs: readonly string[];
  };
};

function homepageSnapshotToStory(
  story: DevelopmentHomepageFixtureStory,
  index: number,
  capturedAt: string,
): EditableStory {
  const stamp = `${story.date}T00:00:00.000Z`;
  return {
    id: `live_homepage_${story.slug}`,
    slug: story.slug,
    title: story.title,
    category: story.category,
    sectionSlugs: [getSectionForCategory(story.category)?.slug || "news"],
    date: story.date,
    author: "Michael Hodges",
    sourceType: "Original",
    sourceName: story.sourceName,
    sourceUrl: story.sourceUrl,
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: story.imageUrl,
    imageAlt: story.imageAlt,
    imageCredit: story.imageCredit,
    imageCaption: story.imageCaption,
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "Development-only preview fixture. Current live story content may differ and remains controlled by production data.",
    sourceNotes: `Stale development-only homepage preview fixture captured on ${capturedAt}.`,
    methodNotes: "Optional localhost fixture; never a production or release baseline.",
    contentBasis: "Development-only homepage preview fixture",
    editorialStatus: "Keep live",
    noindex: false,
    summary: story.summary,
    body: story.body,
    tags: cleanStoryTags([story.category, "Homepage snapshot"]),
    readMinutes: story.readMinutes,
    isFeatured: story.featured,
    status: "published",
    publishedAt: stamp,
    scheduledPublishAt: "",
    sortOrder: -100 + index,
    createdAt: stamp,
    updatedAt: stamp,
    statusHistory: [],
  };
}

function legacyToStory(story: LegacyStoryRecord, index: number): EditableStory {
  const stamp = `${story.date || "2025-01-01"}T00:00:00.000Z`;
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    category: story.category,
    sectionSlugs: [getSectionForCategory(story.category)?.slug || "news"],
    date: story.date || "2025-01-01",
    author: story.author || "Old Sea Dogs",
    sourceType: "Original",
    sourceName: story.sourceName || "Old Sea Dogs archive",
    sourceUrl: story.sourceUrl || "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: story.imageUrl || "",
    imageAlt: story.imageAlt || story.title,
    imageCredit: story.imageCredit || "",
    imageCaption: story.imageCaption || "",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "",
    sourceNotes: story.sourceName || "Old Sea Dogs legacy archive.",
    methodNotes: "Legacy archive story retained for continuity and queued for editorial audit.",
    contentBasis: "Old Sea Dogs archive",
    editorialStatus: "Needs improvement",
    noindex: false,
    summary: story.summary || story.body[0] || "",
    body: story.body.length > 0 ? story.body : [story.summary || story.title],
    tags: cleanStoryTags(story.tags),
    readMinutes: story.readMinutes || 3,
    isFeatured: Boolean(story.featured),
    status: "published",
    publishedAt: stamp,
    scheduledPublishAt: "",
    sortOrder: index,
    createdAt: stamp,
    updatedAt: stamp,
    statusHistory: [],
  };
}

export function hasStoryPhoto(story: Pick<EditableStory, "imageUrl">) {
  return !placeholderStoryImages.has(story.imageUrl.trim());
}

function storyBodyWordCount(story: Pick<EditableStory, "body">) {
  return story.body.join(" ").split(/\s+/).filter(Boolean).length;
}

export function isEditoriallyApprovedStory(story: Pick<EditableStory, "editorialStatus">) {
  const status = story.editorialStatus.trim().toLowerCase();
  return status === "ready" || status === "keep live";
}

export function isWeakEditorialStory(story: Pick<
  EditableStory,
  | "title"
  | "category"
  | "sourceType"
  | "sourceName"
  | "sourceNotes"
  | "imageUrl"
  | "imageCredit"
  | "oldSeaDogsView"
  | "body"
  | "editorialStatus"
>) {
  if (isEditoriallyApprovedStory(story)) return false;

  const sourceType = story.sourceType.trim().toLowerCase();
  const reviewQueueStory = /\b(automatic watch|press release|generated|scrape|source detail|newsroom email)\b/i.test(sourceType);
  const wordCount = storyBodyWordCount(story);
  const viewQuality = oldSeaDogsViewQuality(story.oldSeaDogsView);
  const headlineReport = analyzeHeadlineQuality({
    title: story.title,
    category: story.category,
    sourceName: story.sourceName,
    sourceType: story.sourceType,
  });

  return (
    reviewQueueStory ||
    wordCount < 300 ||
    !story.sourceNotes.trim() ||
    viewQuality.status !== "custom" ||
    (hasStoryPhoto(story) && !story.imageCredit.trim()) ||
    headlineReport.isGeneric
  );
}

export function isStorySearchIndexable(story: Pick<
  EditableStory,
  | "status"
  | "publishedAt"
  | "scheduledPublishAt"
  | "noindex"
>) {
  return isPublicStoryNow(story) && !story.noindex;
}

export function isPromotedStory(story: Pick<EditableStory, "sortOrder">) {
  return story.sortOrder < 0;
}

function legacyStaticStories() {
  return legacyStoryRecords.map(legacyToStory);
}

function homepageFixturePolicy(authoritativeStoryCount: number) {
  const process = runtimeNodeProcess();
  return developmentHomepageFixturePolicy({
    nodeEnv: process?.env?.NODE_ENV || "",
    oldSeaDogsEnv: process?.env?.OLDSEADOGS_ENV || "",
    explicitlyEnabled: process?.env?.[DEVELOPMENT_HOMEPAGE_FIXTURE_ENV] || "",
    authoritativeStoryCount,
  });
}

let homepageFixtureDiagnosticLogged = false;

async function loadDevelopmentHomepageFixture(authoritativeStoryCount: number): Promise<{
  policy: DevelopmentHomepageFixturePolicy;
  settings: Partial<SiteSettings>;
  stories: EditableStory[];
}> {
  const policy = homepageFixturePolicy(authoritativeStoryCount);
  if (!policy.active) return { policy, settings: {}, stories: [] };

  // Deliberately kept behind the positive, fail-closed development policy.
  // Production execution never imports or reads the fixture module.
  const fixture = await import("../content/homepage-production-snapshot") as DevelopmentHomepageFixtureModule;
  const snapshot = fixture.homepageProductionSnapshot;
  const stories = fixture.homepageProductionSnapshotStories.map((story, index) =>
    homepageSnapshotToStory(story, index, snapshot.capturedAt)
  );
  if (!homepageFixtureDiagnosticLogged) {
    homepageFixtureDiagnosticLogged = true;
    console.warn(
      `[OldSeaDogs homepage] Development-only fixture active (${snapshot.capturedAt}). ` +
      "Current live story content remains controlled by production data and may differ from localhost."
    );
  }

  return {
    policy,
    stories,
    settings: {
      homepageLeadStoryId: `live_homepage_${snapshot.leadSlug}`,
      homepageLeadStorySlug: snapshot.leadSlug,
      homepageLatestStoryIds: JSON.stringify(
        snapshot.latestSlugs.map((slug) => `live_homepage_${slug}`)
      ),
    },
  };
}

export async function getDevelopmentHomepageFixtureStatus() {
  const db = getDbOrNull();
  if (db) {
    return {
      ...homepageFixturePolicy(1),
      source: "database",
      message: "Database-backed editor data is authoritative; the development homepage fixture is not used.",
    };
  }
  const store = await readLocalEditorStore();
  const policy = homepageFixturePolicy(store.stories.length);
  return {
    ...policy,
    source: policy.active ? "development-only-fixture" : "local-editor-store",
    message: policy.active
      ? "Development-only fixture data is active. Current live story content remains controlled by production data and may differ from localhost."
      : "Local editor data is authoritative; the development homepage fixture is not used.",
  };
}

export function getLegacyArchiveStats() {
  const photoUrls = new Set(
    legacyStoryRecords
      .map((story) => story.imageUrl)
      .filter((url) => url.startsWith("/legacy-photos/"))
  );

  return {
    storyCount: legacyStoryRecords.length,
    photoCount: photoUrls.size,
  };
}

async function ensureSeedData() {
  const db = getDbOrNull();
  if (!db) return false;

  await ensureContentSchema();
  const existing = await db.select({ id: storyRows.id }).from(storyRows).limit(1);
  const stamp = nowIso();

  if (existing.length === 0) {
    for (const [index, story] of seedStories.entries()) {
      await db
        .insert(storyRows)
        .values(seedToStoryRow(story, index))
        .onConflictDoNothing({ target: storyRows.id });
    }
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    await db
      .insert(siteSettings)
      .values({
        key,
        value,
        updatedAt: stamp,
      })
      .onConflictDoNothing({ target: siteSettings.key });
  }

  for (const ad of defaultAds) {
    await db
      .insert(ads)
      .values({
        ...ad,
        createdAt: stamp,
        updatedAt: stamp,
      })
      .onConflictDoUpdate({
        target: ads.id,
        set: {
          placement: ad.placement,
          kind: ad.kind,
          label: ad.label,
          title: ad.title,
          body: ad.body,
          imageUrl: ad.imageUrl,
          linkUrl: ad.linkUrl,
          code: ad.code,
          startDate: ad.startDate,
          endDate: ad.endDate,
          updatedAt: stamp,
        },
      });
  }

  return true;
}

function seedStaticStories() {
  return seedStories.map((story, index) =>
    rowToStory(seedToStoryRow(story, index) as typeof storyRows.$inferSelect)
  );
}

let baseStaticStoriesCache: EditableStory[] | null = null;

function staticStories(developmentFixtureStories: EditableStory[] = []) {
  if (!baseStaticStoriesCache) {
    const legacy = legacyStaticStories();
    baseStaticStoriesCache = legacy.length > 0 ? legacy : seedStaticStories();
  }
  return developmentFixtureStories.length > 0
    ? [...developmentFixtureStories, ...baseStaticStoriesCache]
    : baseStaticStoriesCache;
}

function mergeLocalStoriesWithStatic(
  localStories: EditableStory[],
  includeDrafts = false,
  developmentFixtureStories: EditableStory[] = [],
) {
  const hasSavedFeaturedStory = localStories.some((story) => isPublicStoryNow(story) && story.isFeatured);
  const baseStories = staticStories(developmentFixtureStories).map((story) =>
    hasSavedFeaturedStory && story.isFeatured ? { ...story, isFeatured: false } : story
  );
  const merged = new Map(baseStories.map((story) => [story.id, story]));

  for (const story of localStories) {
    if (includeDrafts) {
      merged.set(story.id, story);
      continue;
    }
    if (story.status === "unpublished") {
      merged.delete(story.id);
      continue;
    }
    if (!isPublicStoryNow(story)) {
      continue;
    }
    merged.set(story.id, story);
  }

  return sortStories([...merged.values()].filter((story) => includeDrafts || isPublicStoryNow(story)));
}

function sortStories(stories: EditableStory[]) {
  return [...stories].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    const aPromoted = isPromotedStory(a);
    const bPromoted = isPromotedStory(b);
    if (aPromoted !== bPromoted) return aPromoted ? -1 : 1;
    if (aPromoted && bPromoted && a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.sortOrder - b.sortOrder;
  });
}

const localPublishedStoriesCache = new WeakMap<LocalEditorStore, EditableStory[]>();

async function getLocalPublishedStories(store: LocalEditorStore) {
  const fixture = await loadDevelopmentHomepageFixture(store.stories.length);
  if (fixture.policy.active) {
    return mergeLocalStoriesWithStatic(store.stories, false, fixture.stories);
  }
  const cached = localPublishedStoriesCache.get(store);
  if (cached) return cached;
  const stories = mergeLocalStoriesWithStatic(store.stories);
  localPublishedStoriesCache.set(store, stories);
  return stories;
}

function dateToTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function storyHomepageTime(story: Pick<EditableStory, "date" | "createdAt" | "updatedAt">) {
  return (
    dateToTime(story.updatedAt) ||
    dateToTime(story.createdAt) ||
    dateToTime(`${story.date}T00:00:00.000Z`)
  );
}

export function isHomepageEligibleStory(story: Pick<EditableStory, "status" | "slug" | "sourceType" | "publishedAt" | "scheduledPublishAt">) {
  const sourceType = story.sourceType.trim().toLowerCase();
  return (
    isPublicStoryNow(story) &&
    Boolean(story.slug.trim()) &&
    sourceType !== "insufficient source detail for publication" &&
    sourceType !== "needs more source detail"
  );
}

export function isStaticArchiveStory(story: Pick<EditableStory, "id">) {
  return story.id.startsWith("legacy_") || story.id.startsWith("seed_");
}

export function sortStoriesByHomepageRecency(stories: EditableStory[]) {
  return [...stories]
    .filter(isHomepageEligibleStory)
    .sort((a, b) => {
      const timeCompare = storyHomepageTime(b) - storyHomepageTime(a);
      if (timeCompare !== 0) return timeCompare;
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      const updateCompare = b.updatedAt.localeCompare(a.updatedAt);
      if (updateCompare !== 0) return updateCompare;
      return a.sortOrder - b.sortOrder;
    });
}

export function getHomepageLatestStories(
  stories: EditableStory[],
  options: { excludeSlug?: string; limit?: number } = {}
) {
  const excludeSlug = options.excludeSlug || "";
  const limit = options.limit ?? 4;
  const eligibleStories = sortStoriesByHomepageRecency(stories)
    .filter((story) => story.slug !== excludeSlug);
  const currentStories = eligibleStories.filter((story) => !isStaticArchiveStory(story));
  const archiveFallbackStories = eligibleStories.filter(isStaticArchiveStory);

  return [...currentStories, ...archiveFallbackStories].slice(0, limit);
}

export function getStoryPublicVisibility(story: EditableStory, stories: EditableStory[]) {
  const publishedStories = stories.filter(isPublicStoryNow);
  const featuredStory = publishedStories.find((candidate) => candidate.isFeatured) ?? publishedStories[0] ?? null;
  const homepageLatest = getHomepageLatestStories(publishedStories, {
    excludeSlug: featuredStory?.slug,
    limit: 4,
  });
  const section = getSectionForCategory(story.category);
  const sectionStories = section
    ? publishedStories.filter((candidate) => storyMatchesSection(candidate, section)).slice(0, 80)
    : [];
  const actualRoute = sectionPathForCategory(story.category);

  return {
    publicUrl: story.slug ? `/stories/${story.slug}` : "",
    category: normalizeStoryCategory(story.category),
    actualRoute,
    homepageEligible: isHomepageEligibleStory(story),
    appearsOnHomepage: Boolean(featuredStory?.id === story.id || homepageLatest.some((candidate) => candidate.id === story.id)),
    appearsInSection: sectionStories.some((candidate) => candidate.id === story.id),
    sectionLabel: section?.label ?? "",
    sectionSlug: section?.slug ?? "",
    sectionFeedAssigned: section ? `${section.label} (${actualRoute})` : "No matching public section",
  };
}

function mergeDbStoriesWithStatic(
  rows: Array<typeof storyRows.$inferSelect>,
  includeDrafts = false,
  developmentFixtureStories: EditableStory[] = [],
) {
  const legacyEnabled = legacyStoryRecords.length > 0;
  const hasDbFeaturedStory = rows.some((row) => isPublicStoryNow(rowToStory(row)) && row.isFeatured);
  const baseStories = staticStories(developmentFixtureStories).map((story) =>
    hasDbFeaturedStory && story.isFeatured ? { ...story, isFeatured: false } : story
  );
  const merged = new Map(baseStories.map((story) => [story.id, story]));

  for (const row of rows) {
    if (legacyEnabled && row.id.startsWith("seed_")) continue;
    const story = rowToStory(row);
    if (includeDrafts) {
      merged.set(story.id, story);
      continue;
    }
    if (story.status === "unpublished") {
      merged.delete(story.id);
      continue;
    }
    if (!isPublicStoryNow(story)) {
      continue;
    }
    merged.set(story.id, story);
  }

  const stories = [...merged.values()].filter((story) => includeDrafts || isPublicStoryNow(story));
  return sortStories(stories);
}

export async function publishDueScheduledStories() {
  const stamp = nowIso();
  const now = new Date(stamp);
  const db = getDbOrNull();

  if (!db) {
    const published: string[] = [];
    const nextStore = await updateLocalEditorStore((store) => {
      let changed = false;
      const stories = store.stories.map((story) => {
        if (story.status !== "scheduled" || !isScheduledPublishDue(story.scheduledPublishAt, now)) {
          return story;
        }
        changed = true;
        published.push(story.id);
        const publishedAt = new Date(story.scheduledPublishAt).toISOString();
        const historyEntry: StoryStatusHistoryEntry = {
          id: makeId("story-status"),
          storyId: story.id,
          fromStatus: "scheduled",
          toStatus: "published",
          fromWorkflow: story.editorialStatus,
          toWorkflow: "Published",
          changedBy: "Automatic scheduler",
          changedAt: stamp,
        };
        return {
          ...story,
          status: "published" as const,
          publishedAt,
          scheduledPublishAt: "",
          editorialStatus: "Published",
          date: story.date || stamp.slice(0, 10),
          updatedAt: stamp,
          statusHistory: [historyEntry, ...story.statusHistory],
        };
      });
      return changed ? { ...store, stories } : store;
    });
    const nextScheduledAt = nextStore.stories
      .filter((story) => story.status === "scheduled" && Number.isFinite(Date.parse(story.scheduledPublishAt)))
      .map((story) => story.scheduledPublishAt)
      .sort()[0] || "";
    return { checkedAt: stamp, published, nextScheduledAt };
  }

  await ensureContentSchema();
  const rows = await db.select().from(storyRows).where(eq(storyRows.status, "scheduled"));
  const dueStories = rows.map(rowToStory).filter((story) => isScheduledPublishDue(story.scheduledPublishAt, now));
  const published: string[] = [];
  for (const story of dueStories) {
    const publishedAt = new Date(story.scheduledPublishAt).toISOString();
    const updated = await db
      .update(storyRows)
      .set({
        status: "published",
        publishedAt,
        scheduledPublishAt: "",
        editorialStatus: "Published",
        updatedAt: stamp,
        date: story.date || stamp.slice(0, 10),
      })
      .where(and(eq(storyRows.id, story.id), eq(storyRows.status, "scheduled")))
      .returning({ id: storyRows.id });
    if (updated.length === 0) continue;
    published.push(story.id);
    await db.insert(storyStatusHistory).values({
      id: makeId("story-status"),
      storyId: story.id,
      fromStatus: "scheduled",
      toStatus: "published",
      fromWorkflow: story.editorialStatus,
      toWorkflow: "Published",
      changedBy: "Automatic scheduler",
      changedAt: stamp,
    });
  }
  const nextScheduledAt = rows
    .map(rowToStory)
    .filter((story) => story.status === "scheduled" && !published.includes(story.id) && Number.isFinite(Date.parse(story.scheduledPublishAt)))
    .map((story) => story.scheduledPublishAt)
    .sort()[0] || "";
  return { checkedAt: stamp, published, nextScheduledAt };
}

function presentPublicStory(story: EditableStory): EditableStory {
  const imageAlt = publicImageAlt({
    alt: story.imageAlt,
    caption: story.imageCaption,
    title: story.title,
  });
  return imageAlt === story.imageAlt ? story : { ...story, imageAlt };
}

function presentPublicStories(stories: EditableStory[]) {
  return stories.map(presentPublicStory);
}

function presentPublicGuide(guide: EditableGuide): EditableGuide {
  const imageAlt = publicImageAlt({
    alt: guide.imageAlt,
    caption: guide.imageCaption,
    title: guide.title,
  });
  const inlineImages = (guide.inlineImages || []).map((image) => {
    const alt = publicImageAlt({
      alt: image.alt,
      caption: image.caption,
      title: guide.title,
    });
    return alt === image.alt ? image : { ...image, alt };
  });
  const inlineChanged = inlineImages.some((image, index) => image !== guide.inlineImages?.[index]);
  if (imageAlt === guide.imageAlt && !inlineChanged) return guide;
  return { ...guide, imageAlt, inlineImages };
}

export async function getPublishedStories() {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    return presentPublicStories(await getLocalPublishedStories(store));
  }

  try {
    await ensureSeedData();
    const rows = await db
      .select()
      .from(storyRows)
      .orderBy(desc(storyRows.isFeatured), desc(storyRows.date), asc(storyRows.sortOrder));
    return presentPublicStories(mergeDbStoriesWithStatic(rows));
  } catch (error) {
    console.error("[OldSeaDogs storage] published CMS stories could not be loaded", {
      errorName: error instanceof Error ? error.name : "",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    if (homepageFixturePolicy(0).productionRuntime) {
      throw new Error("Published CMS stories could not be loaded. Static-only fallback was blocked to prevent newer stories disappearing.", { cause: error });
    }
    const fixture = await loadDevelopmentHomepageFixture(0);
    return presentPublicStories(sortStories(staticStories(fixture.stories)));
  }
}

export async function getStoryBySlug(slug: string) {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    const story = (await getLocalPublishedStories(store)).find((item) => item.slug === slug) ?? null;
    return story ? presentPublicStory(story) : null;
  }

  try {
    await ensureSeedData();
    const [row] = await db
      .select()
      .from(storyRows)
      .where(eq(storyRows.slug, slug))
      .limit(1);
    if (row) {
      const story = rowToStory(row);
      if (isPublicStoryNow(story)) return presentPublicStory(story);
      if (story.status === "unpublished") return null;
      const archived = staticStories().find((candidate) => candidate.slug === slug) ?? null;
      return archived ? presentPublicStory(archived) : null;
    }
    const archived = staticStories().find((story) => story.slug === slug) ?? null;
    return archived ? presentPublicStory(archived) : null;
  } catch (error) {
    if (homepageFixturePolicy(0).productionRuntime) {
      throw new Error("Published CMS story data could not be loaded. Development fixture fallback is blocked in production.", { cause: error });
    }
    const fixture = await loadDevelopmentHomepageFixture(0);
    const story = staticStories(fixture.stories).find((item) => item.slug === slug) ?? null;
    return story ? presentPublicStory(story) : null;
  }
}

const localGuidesCache = new WeakMap<LocalEditorStore, EditableGuide[]>();

export async function getAllGuides() {
  const store = await readLocalEditorStore();
  const cached = localGuidesCache.get(store);
  if (cached) return cached;
  const guides = mergeLocalGuidesWithStatic(store.guides);
  localGuidesCache.set(store, guides);
  return guides;
}

export async function getPublishedGuides() {
  const guides = await getAllGuides();
  return guides.filter((guide) => guide.status === "published").map(presentPublicGuide);
}

export async function getIndexedGuides() {
  const guides = await getPublishedGuides();
  return guides.filter((guide) => !guide.noindex);
}

export async function getHomepageGuides() {
  const guides = await getPublishedGuides();
  return guides
    .filter((guide) => guide.showOnHomepage)
    .sort((a, b) => a.homepageOrder - b.homepageOrder || a.title.localeCompare(b.title))
    .slice(0, 5);
}

export async function getGuideBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const guides = await getAllGuides();
  const guide = guides.find((item) => item.slug === slug) ?? null;
  if (!guide) return null;
  if (!options.includeDrafts && guide.status !== "published") return null;
  return presentPublicGuide(guide);
}

const localSettingsCache = new WeakMap<LocalEditorStore, SiteSettings>();

export async function getApprovedPublicGalleryPhotos(): Promise<PublicGalleryPhoto[]> {
  const db = getDbOrNull();
  const photosFrom = (
    items: GalleryItem[],
    mediaById: Map<string, { contentType: string }>,
  ) => items.flatMap((item) => {
    const photo = toPublicGalleryPhoto({
      ...item,
      contentType: mediaById.get(item.mediaId)?.contentType || "",
    });
    return photo ? [photo] : [];
  });

  if (!db) {
    const store = await readLocalEditorStore();
    const mediaById = new Map(store.media.map((asset) => [asset.id, asset]));
    return photosFrom(
      store.galleryItems
        .filter((item) => item.status === "approved")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)),
      mediaById,
    );
  }

  await ensureContentSchema();
  const rows = await db
    .select()
    .from(galleryItems)
    .where(eq(galleryItems.status, "approved"))
    .orderBy(desc(galleryItems.createdAt), desc(galleryItems.id));
  if (rows.length === 0) return [];
  const mediaRows = await db
    .select({ id: mediaAssets.id, contentType: mediaAssets.contentType })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, [...new Set(rows.map((row) => row.mediaId))]));
  return photosFrom(rows.map(rowToGalleryItem), new Map(mediaRows.map((asset) => [asset.id, asset])));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    const cached = localSettingsCache.get(store);
    if (cached) return cached;
    const fixture = await loadDevelopmentHomepageFixture(store.stories.length);
    const settings = { ...defaultSettings, ...store.settings, ...fixture.settings };
    localSettingsCache.set(store, settings);
    return settings;
  }

  try {
    await ensureSeedData();
    const rows = await db.select().from(siteSettings);
    return rows.reduce(
      (settings, row) => ({ ...settings, [row.key]: row.value }),
      defaultSettings
    );
  } catch (error) {
    if (homepageFixturePolicy(0).productionRuntime) {
      throw new Error("Homepage settings could not be loaded. Development fixture fallback is blocked in production.", { cause: error });
    }
    const fixture = await loadDevelopmentHomepageFixture(0);
    return { ...defaultSettings, ...fixture.settings };
  }
}

export function findHomepageLeadStory(
  stories: EditableStory[],
  settings: Pick<SiteSettings, "homepageLeadStoryId" | "homepageLeadStorySlug">
) {
  const leadId = settings.homepageLeadStoryId.trim();
  const leadSlug = settings.homepageLeadStorySlug.trim();
  if (!leadId && !leadSlug) return null;
  return stories.find((story) =>
    (leadId && story.id === leadId) || (leadSlug && story.slug === leadSlug)
  ) ?? null;
}

export function isHomepageLeadSelectable(
  story: Pick<EditableStory, "status" | "slug" | "title" | "publishedAt" | "scheduledPublishAt">
) {
  return isPublicStoryNow(story) && Boolean(story.slug.trim()) && Boolean(story.title.trim());
}

export async function saveHomepageSettings(input: {
  leadStoryId: string;
  homepageLatestStoryIds: string;
  homepageEditorsChoiceStoryIds: string;
  homepageHiddenStoryIds: string;
  allowMissingImage?: boolean;
}) {
  const requestedLead = input.leadStoryId.trim();
  const settingsForLead = (story: EditableStory | null) => ({
    homepageLeadStoryId: story?.id || "",
    homepageLeadStorySlug: story?.slug || "",
    homepageLatestStoryIds: input.homepageLatestStoryIds,
    homepageEditorsChoiceStoryIds: input.homepageEditorsChoiceStoryIds,
    homepageHiddenStoryIds: input.homepageHiddenStoryIds,
  });
  const validateLead = (stories: EditableStory[]) => {
    if (!requestedLead) return null;
    const story = stories.find((candidate) => candidate.id === requestedLead || candidate.slug === requestedLead);
    if (!story) throw new Error("The selected Homepage Lead Story could not be found.");
    if (!isHomepageLeadSelectable(story)) {
      throw new Error("Only published stories with public story URLs can become the Homepage Lead Story.");
    }
    if (!hasStoryPhoto(story) && !input.allowMissingImage) {
      throw new Error("The selected Homepage Lead Story has no image. Confirm the override before saving Homepage Manager.");
    }
    return story;
  };

  const db = getDbOrNull();
  if (!db) {
    let selectedLead: EditableStory | null = null;
    await updateLocalEditorStore((store) => {
      selectedLead = validateLead(mergeLocalStoriesWithStatic(store.stories));
      return {
        ...store,
        settings: {
          ...defaultSettings,
          ...store.settings,
          ...settingsForLead(selectedLead),
        },
        stories: store.stories.map((story) => ({
          ...story,
          isFeatured: Boolean(selectedLead && story.id === selectedLead.id),
        })),
      };
    });
    return { settings: await getSiteSettings(), story: selectedLead };
  }

  await ensureSeedData();
  const rows = await db.select().from(storyRows);
  const selectedLead = validateLead(mergeDbStoriesWithStatic(rows));
  const stamp = nowIso();
  const settings = settingsForLead(selectedLead);
  await Promise.all(Object.entries(settings).map(([key, value]) =>
    db.insert(siteSettings).values({ key, value, updatedAt: stamp }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: stamp },
    })
  ));
  await db.update(storyRows).set({ isFeatured: false });
  if (selectedLead) {
    await db.update(storyRows).set({ isFeatured: true }).where(eq(storyRows.id, selectedLead.id));
  }
  return { settings: await getSiteSettings(), story: selectedLead };
}

const localAdsCache = new WeakMap<LocalEditorStore, { ads: Advert[]; day: string }>();

export async function getActiveAds() {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    const day = new Date().toISOString().slice(0, 10);
    const cached = localAdsCache.get(store);
    if (cached?.day === day) return cached.ads;
    const adverts = store.ads.length > 0 ? store.ads : defaultAdvertRows();
    const active = activeAdvertRows(adverts);
    localAdsCache.set(store, { ads: active, day });
    return active;
  }

  try {
    await ensureSeedData();
    const activeAds = await db
      .select()
      .from(ads)
      .where(eq(ads.isActive, true))
      .orderBy(asc(ads.placement), asc(ads.label));
    const liveAds = activeAdvertRows(activeAds);
    return liveAds.length > 0 ? liveAds : activeAdvertRows(defaultAdvertRows());
  } catch {
    return activeAdvertRows(defaultAdvertRows());
  }
}

function summarizeSocialEvents(events: SocialEvent[]): SocialAnalyticsSummary {
  const byPlatform = new Map<string, number>();
  for (const event of events) {
    const platform = event.platform || "General";
    byPlatform.set(platform, (byPlatform.get(platform) || 0) + 1);
  }

  return {
    socialClicks: events.filter((event) => event.type === "social_click").length,
    outboundClicks: events.filter((event) => event.type === "outbound_click").length,
    generatedPostUsage: events.filter((event) => event.type === "generated_post").length,
    byPlatform: [...byPlatform.entries()]
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count || a.platform.localeCompare(b.platform)),
    recentEvents: [...events]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20),
  };
}

export async function getSocialAnalytics(): Promise<SocialAnalyticsSummary> {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    return summarizeSocialEvents(store.socialEvents);
  }

  try {
    await ensureContentSchema();
    const rows = await db.select().from(socialEvents).orderBy(desc(socialEvents.createdAt));
    return summarizeSocialEvents(rows);
  } catch {
    return summarizeSocialEvents([]);
  }
}

export async function recordSocialEvent(input: {
  type: "social_click" | "outbound_click" | "generated_post";
  platform?: string;
  target?: string;
  storySlug?: string;
}) {
  const type = input.type;
  if (!["social_click", "outbound_click", "generated_post"].includes(type)) {
    throw new Error("Unsupported social analytics event.");
  }

  const record = {
    id: makeId("social"),
    type,
    platform: String(input.platform || "").slice(0, 80),
    target: String(input.target || "").slice(0, 500),
    storySlug: String(input.storySlug || "").slice(0, 120),
    createdAt: nowIso(),
  } satisfies SocialEvent;

  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      socialEvents: [record, ...store.socialEvents].slice(0, 2500),
    }));
    return record;
  }

  await ensureContentSchema();
  await db.insert(socialEvents).values(record);
  return record;
}

export async function getEditorData() {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    const storageStatus = await getEditorStorageStatus();
    const stories = mergeLocalStoriesWithStatic(store.stories, true);
    return {
      stories,
      storyManagement: makeStoryManagementIndex(stories, store.stories.map((story) => story.id)),
      storyStoreVersion: store.updatedAt,
      media: store.media,
      galleryCategories: store.galleryCategories,
      galleryItems: store.galleryItems,
      instagramImports: store.instagramImports,
      ads: store.ads.length > 0 ? store.ads : defaultAdvertRows(),
      settings: { ...defaultSettings, ...store.settings },
      sourceWatch: sourceWatchSites,
      pressReleases: store.pressReleases.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
      blockedSenders: store.blockedSenders.sort((a, b) => a.value.localeCompare(b.value)),
      emailIngestion: getEmailIngestionSettings(storageStatus),
      socialAnalytics: summarizeSocialEvents(store.socialEvents),
    };
  }

  await ensureSeedData();
  const [storyList, historyList, media, categoryList, galleryList, instagramList, advertList, settings, pressReleaseList, blockedSenderList, socialAnalytics] = await Promise.all([
    db.select().from(storyRows).orderBy(desc(storyRows.date), asc(storyRows.sortOrder)),
    db.select().from(storyStatusHistory).orderBy(desc(storyStatusHistory.changedAt)),
    db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)),
    db.select().from(galleryCategories).orderBy(asc(galleryCategories.sortOrder), asc(galleryCategories.name)),
    db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt)),
    db.select().from(instagramImports).orderBy(desc(instagramImports.importedAt)),
    db.select().from(ads).orderBy(asc(ads.placement), asc(ads.label)),
    getSiteSettings(),
    db.select().from(pressReleaseEmails).orderBy(desc(pressReleaseEmails.receivedAt), desc(pressReleaseEmails.updatedAt)),
    db.select().from(pressReleaseBlockedSenders).orderBy(asc(pressReleaseBlockedSenders.value)),
    getSocialAnalytics(),
  ]);

  const stories = mergeDbStoriesWithStatic(storyList, true).map((story) => ({
      ...story,
      statusHistory: historyList.filter((entry) => entry.storyId === story.id),
    }));

  return {
    stories,
    storyManagement: makeStoryManagementIndex(stories, storyList.map((story) => story.id)),
    storyStoreVersion: storyList.reduce((latest, story) => story.updatedAt > latest ? story.updatedAt : latest, ""),
    media: media.map(normalizeMediaAsset),
    galleryCategories: categoryList.length > 0 ? categoryList : defaultGalleryCategories(),
    galleryItems: galleryList.map(rowToGalleryItem),
    instagramImports: instagramList,
    ads: advertList,
    settings,
    sourceWatch: sourceWatchSites,
    pressReleases: pressReleaseList.map(rowToPressRelease),
    blockedSenders: blockedSenderList,
    emailIngestion: getEmailIngestionSettings(await getEditorStorageStatus()),
    socialAnalytics,
  };
}

export async function importPressReleaseEmail(input: {
  rawEmail?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  receivedAt?: string;
  bodyText?: string;
  attachments?: PressReleaseAttachment[];
}) {
  const db = getDbOrNull();

  if (!db) {
    const parsed = parsePressReleaseEmail(input);
    let record: PressReleaseEmail | null = null;
    await updateLocalEditorStore((store) => {
      const blockedValues = store.blockedSenders.map((item) => item.value);
      const duplicate = detectDuplicatePressRelease(
        {
          subject: parsed.subject,
          senderEmail: parsed.senderEmail,
          bodyText: parsed.bodyText,
        },
        store.pressReleases.map((item) => ({
          id: item.id,
          subject: item.subject,
          senderEmail: item.senderEmail,
          bodyText: item.bodyText,
          receivedAt: item.receivedAt,
        }))
      );
      const classification = classifyPressRelease({
        subject: parsed.subject,
        bodyText: parsed.bodyText,
        senderEmail: parsed.senderEmail,
        blockedValues,
      });
      const parsedWordCount = parsed.bodyText.split(/\s+/).filter(Boolean).length;
      const warnings = [...classification.warnings, ...parsed.cleaningWarnings];
      if (duplicate) warnings.push("Possible duplicate press release.");
      if (parsedWordCount < 80 && classification.status !== "spam") {
        warnings.push("Needs more detail before article generation.");
      }
      const importStatus =
        parsedWordCount < 80 && classification.status !== "spam" ? "needsDetail" : classification.status;
      record = rowToPressRelease(
        pressReleaseToRow({
          id: makeId("email"),
          messageId: parsed.messageId,
          senderName: parsed.senderName,
          senderEmail: parsed.senderEmail,
          senderDomain: senderDomain(parsed.senderEmail),
          subject: parsed.subject,
          receivedAt: parsed.receivedAt,
          preview: parsed.preview,
          bodyText: parsed.bodyText,
          rawEmail: parsed.rawEmail,
          attachments: parsed.attachments,
          status: importStatus,
          category: suggestPressReleaseCategory(parsed.subject, parsed.bodyText),
          relevanceScore: classification.score,
          duplicateOf: duplicate?.id || "",
          duplicateScore: duplicate ? Math.round(duplicate.score * 100) : 0,
          warnings,
          imageCredit: parsed.photoCredits[0] || "",
        }) as typeof pressReleaseEmails.$inferSelect
      );
      return {
        ...store,
        pressReleases: [record, ...store.pressReleases.filter((item) => item.id !== record?.id)],
      };
    });
    if (!record) throw new Error("The press release could not be stored.");
    return record;
  }

  await ensureSeedData();
  const parsed = parsePressReleaseEmail(input);
  const blocked = await db.select().from(pressReleaseBlockedSenders);
  const blockedValues = blocked.map((item) => item.value);
  const existingRows = await db.select().from(pressReleaseEmails).orderBy(desc(pressReleaseEmails.receivedAt));
  const duplicate = detectDuplicatePressRelease(
    {
      subject: parsed.subject,
      senderEmail: parsed.senderEmail,
      bodyText: parsed.bodyText,
    },
    existingRows.map((row) => ({
      id: row.id,
      subject: row.subject,
      senderEmail: row.senderEmail,
      bodyText: row.bodyText,
      receivedAt: row.receivedAt,
    }))
  );
  const classification = classifyPressRelease({
    subject: parsed.subject,
    bodyText: parsed.bodyText,
    senderEmail: parsed.senderEmail,
    blockedValues,
  });
  const parsedWordCount = parsed.bodyText.split(/\s+/).filter(Boolean).length;
  const warnings = [...classification.warnings, ...parsed.cleaningWarnings];
  if (duplicate) warnings.push("Possible duplicate press release.");
  if (parsedWordCount < 80 && classification.status !== "spam") {
    warnings.push("Needs more detail before article generation.");
  }
  const importStatus =
    parsedWordCount < 80 && classification.status !== "spam" ? "needsDetail" : classification.status;

  const record = pressReleaseToRow({
    id: makeId("email"),
    messageId: parsed.messageId,
    senderName: parsed.senderName,
    senderEmail: parsed.senderEmail,
    senderDomain: senderDomain(parsed.senderEmail),
    subject: parsed.subject,
    receivedAt: parsed.receivedAt,
    preview: parsed.preview,
    bodyText: parsed.bodyText,
    rawEmail: parsed.rawEmail,
    attachments: parsed.attachments,
    status: importStatus,
    category: suggestPressReleaseCategory(parsed.subject, parsed.bodyText),
    relevanceScore: classification.score,
    duplicateOf: duplicate?.id || "",
    duplicateScore: duplicate ? Math.round(duplicate.score * 100) : 0,
    warnings,
    imageCredit: parsed.photoCredits[0] || "",
  });

  await db.insert(pressReleaseEmails).values(record);
  return getPressReleaseById(record.id);
}

export async function savePressReleaseEmail(input: Partial<PressReleaseEmail> & { id: string }) {
  const db = getDbOrNull();

  console.info("[OldSeaDogs content] savePressReleaseEmail start", {
    id: input.id,
    storage: db ? "database" : "local-file",
    partialFields: Object.keys(input).sort(),
    attachmentCount: input.attachments?.length ?? "preserve-existing",
    hasRawEmail: Object.prototype.hasOwnProperty.call(input, "rawEmail"),
    imageUrl: input.imageUrl || "",
  });

  const existing = await getPressReleaseById(input.id);
  const merged: PressReleaseEmail = {
    ...existing,
    ...input,
    attachments: input.attachments ?? existing.attachments,
    warnings: input.warnings ?? existing.warnings,
    generatedBody: input.generatedBody ?? existing.generatedBody,
    status: normalizePressReleaseStatus(input.status || existing.status),
  };
  const record = pressReleaseToRow(merged);

  if (!db) {
    const item = rowToPressRelease(record as typeof pressReleaseEmails.$inferSelect);
    await updateLocalEditorStore((store) => ({
      ...store,
      pressReleases: [item, ...store.pressReleases.filter((pressRelease) => pressRelease.id !== item.id)],
    }));
    console.info("[OldSeaDogs content] savePressReleaseEmail saved local item", {
      id: item.id,
      status: item.status,
      imageUrl: item.imageUrl,
      generatedBodyCount: item.generatedBody.length,
      attachmentCount: item.attachments.length,
    });
    return item;
  }

  await db
    .insert(pressReleaseEmails)
    .values(record)
    .onConflictDoUpdate({
      target: pressReleaseEmails.id,
      set: {
        senderName: record.senderName,
        senderEmail: record.senderEmail,
        senderDomain: record.senderDomain,
        subject: record.subject,
        receivedAt: record.receivedAt,
        preview: record.preview,
        bodyText: record.bodyText,
        rawEmail: record.rawEmail,
        attachmentsJson: record.attachmentsJson,
        status: record.status,
        category: record.category,
        relevanceScore: record.relevanceScore,
        duplicateOf: record.duplicateOf,
        duplicateScore: record.duplicateScore,
        warningsJson: record.warningsJson,
        generatedTitle: record.generatedTitle,
        generatedExcerpt: record.generatedExcerpt,
        generatedBodyJson: record.generatedBodyJson,
        generatedWordCount: record.generatedWordCount,
        selectedAttachmentId: record.selectedAttachmentId,
        imageUrl: record.imageUrl,
        imageAlt: record.imageAlt,
        imageCredit: record.imageCredit,
        imageCaption: record.imageCaption,
        rightsNote: record.rightsNote,
        storyId: record.storyId,
        updatedAt: record.updatedAt,
      },
    });

  const saved = await getPressReleaseById(record.id);
  console.info("[OldSeaDogs content] savePressReleaseEmail saved database item", {
    id: saved.id,
    status: saved.status,
    imageUrl: saved.imageUrl,
    generatedBodyCount: saved.generatedBody.length,
    attachmentCount: saved.attachments.length,
  });
  return saved;
}

export async function markPressReleaseEmail(id: string, status: PressReleaseStatus) {
  return savePressReleaseEmail({ id, status });
}

export async function blockPressReleaseSender(input: { value: string; kind?: string; reason?: string }) {
  const db = getDbOrNull();

  const stamp = nowIso();
  const value = input.value.trim().toLowerCase();
  if (!value) throw new Error("Choose a sender or domain to block.");
  const record = {
    id: makeId("block"),
    value,
    kind: input.kind || (value.includes("@") ? "sender" : "domain"),
    reason: input.reason || "Blocked in the Old Sea Dogs editor",
    createdAt: stamp,
  } satisfies PressReleaseBlockedSender;

  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      blockedSenders: [record, ...store.blockedSenders.filter((blocked) => blocked.value !== value)],
      pressReleases: store.pressReleases.map((pressRelease) => {
        const blocked =
          record.kind === "domain"
            ? pressRelease.senderDomain === value
            : pressRelease.senderEmail.toLowerCase() === value;
        return blocked ? { ...pressRelease, status: "spam" as PressReleaseStatus, updatedAt: stamp } : pressRelease;
      }),
    }));
    return record;
  }

  await ensureContentSchema();

  await db
    .insert(pressReleaseBlockedSenders)
    .values(record)
    .onConflictDoUpdate({
      target: pressReleaseBlockedSenders.value,
      set: {
        kind: record.kind,
        reason: record.reason,
        createdAt: record.createdAt,
      },
    });

  if (record.kind === "domain") {
    await db
      .update(pressReleaseEmails)
      .set({ status: "spam", updatedAt: stamp })
      .where(eq(pressReleaseEmails.senderDomain, value));
  } else {
    await db
      .update(pressReleaseEmails)
      .set({ status: "spam", updatedAt: stamp })
      .where(eq(pressReleaseEmails.senderEmail, value));
  }

  const [blocked] = await db
    .select()
    .from(pressReleaseBlockedSenders)
    .where(eq(pressReleaseBlockedSenders.value, value))
    .limit(1);
  return blocked;
}

export async function unblockPressReleaseSender(id: string) {
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      blockedSenders: store.blockedSenders.filter((blocked) => blocked.id !== id),
    }));
    return true;
  }

  await ensureContentSchema();
  await db.delete(pressReleaseBlockedSenders).where(eq(pressReleaseBlockedSenders.id, id));
  return true;
}

export async function generatePressReleaseArticle(id: string) {
  const item = await getPressReleaseById(id);
  if (item.status === "spam" || item.status === "rejected") {
    throw new Error("This press release is marked as spam or rejected. Restore it before generating an article.");
  }

  const generated = generateOldSeaDogsPressArticle({
    subject: item.subject,
    bodyText: item.bodyText,
    category: item.category,
  });
  const warnings = [...new Set([...item.warnings, ...generated.warnings])];

  return savePressReleaseEmail({
    id,
    status: generated.status === "needsDetail" ? "needsDetail" : "converted",
    category: generated.category,
    generatedTitle: generated.title,
    generatedExcerpt: generated.excerpt,
    generatedBody: generated.body,
    generatedWordCount: generated.wordCount,
    warnings,
  });
}

export async function savePressReleaseAsDraft(id: string) {
  const item = await getPressReleaseById(id);
  if (item.status === "spam" || item.status === "rejected") {
    throw new Error("This press release is marked as spam or rejected.");
  }
  if (item.generatedBody.length === 0) {
    throw new Error("Generate article body text before saving this as a draft.");
  }

  if (item.storyId) {
    const editorData = await getEditorData();
    const existingStory = editorData.stories.find((candidate) => candidate.id === item.storyId);
    if (existingStory?.status === "published") {
      return {
        story: existingStory,
        pressRelease: await savePressReleaseEmail({
          id,
          status: "published",
          storyId: existingStory.id,
        }),
      };
    }
  }

  const story = await saveStory(pressReleaseStoryInput(item, "draft"));
  return {
    story,
    pressRelease: await savePressReleaseEmail({
      id,
      status: "converted",
      storyId: story.id,
    }),
  };
}

export async function publishPressReleaseStory(id: string) {
  const item = await getPressReleaseById(id);
  if (item.status === "spam" || item.status === "rejected") {
    throw new Error("This press release is marked as spam or rejected.");
  }
  if (item.generatedBody.length === 0) {
    throw new Error("Generate article body text before publishing it.");
  }
  const beforeEditorData = await getEditorData();
  const draftStory = item.storyId
    ? beforeEditorData.stories.find((candidate) => candidate.id === item.storyId) ?? null
    : null;
  const publishPayload = pressReleaseStoryInput(item, "published");
  const editorialWarnings = getEditorialWarnings(publishPayload);
  const story = await saveStory({
    ...publishPayload,
    id: item.storyId || "",
  });
  const allStories = await getPublishedStories();
  const visibility = getStoryPublicVisibility(story, allStories);
  const publicStory = await getStoryBySlug(story.slug);
  const imageDiagnostics = storyImageDiagnostics(story, publicStory);
  const selectedImageFields = pressReleaseImageFields(item, story.title);
  const publishDiagnostics: PressReleasePublishDiagnostics = {
    publishRequestReceived: true,
    activeItemId: item.id,
    newsroomStatusBeforePublish: item.status,
    selectedAttachmentId: item.selectedAttachmentId,
    selectedImageUrl: selectedImageFields.imageUrl,
    featuredImageUrl: selectedImageFields.imageUrl,
    imageUrl: item.imageUrl,
    mediaId: mediaIdFromImageUrl(selectedImageFields.imageUrl),
    draftStoryId: draftStory?.id || "",
    draftStoryStatus: draftStory?.status || "",
    draftImageField: draftStory?.imageUrl || "",
    draftFeaturedImageField: draftStory?.imageUrl || "",
    publishPayloadImageField: publishPayload.imageUrl || "",
    publishPayloadFeaturedImageField: publishPayload.imageUrl || "",
    publishPayloadInlineImageCount: storyInlineImageCount(publishPayload.body || []),
    storyCreated: Boolean(story.id && story.slug && story.status === "published"),
    storyId: story.id,
    storySlug: story.slug,
    storyStatus: story.status,
    publicUrl: `/stories/${story.slug}`,
    publicStoryExists: Boolean(publicStory),
    publicStoryImageField: publicStory?.imageUrl || "",
    publicStoryFeaturedImageField: publicStory?.imageUrl || "",
    publicStoryInlineImageCount: storyInlineImageCount(publicStory?.body || []),
    appearsOnHomepage: visibility.appearsOnHomepage,
    appearsInSection: visibility.appearsInSection,
    homepageEligible: visibility.homepageEligible,
    sectionLabel: visibility.sectionLabel,
  };

  return {
    story,
    pressRelease: await savePressReleaseEmail({
      id,
      status: "published",
      storyId: story.id,
    }),
    publicUrl: `/stories/${story.slug}`,
    visibility,
    editorialWarnings,
    imageDiagnostics,
    publishDiagnostics,
  };
}

export async function unpublishPressReleaseStory(id: string) {
  const item = await getPressReleaseById(id);
  if (!item.storyId) {
    throw new Error("This newsroom item does not have a public story to unpublish.");
  }

  const editorData = await getEditorData();
  const story = editorData.stories.find((candidate) => candidate.id === item.storyId);
  if (!story) {
    throw new Error("I could not find the public story linked to this newsroom item.");
  }

  const draftStory = await saveStory({
    ...story,
    status: "draft",
  });

  return {
    story: draftStory,
    pressRelease: await savePressReleaseEmail({
      id,
      status: "converted",
      storyId: draftStory.id,
    }),
    publicUrl: "",
  };
}

export async function deletePressReleaseEmail(
  id: string,
  deleteMode: "queueOnly" | "unpublishStory" = "queueOnly"
) {
  const item = await getPressReleaseById(id);
  let story: EditableStory | undefined;
  let publicStoryAction = item.storyId ? "leftUnchanged" : "none";

  if (deleteMode === "unpublishStory" && item.storyId) {
    const result = await unpublishPressReleaseStory(id);
    story = result.story;
    publicStoryAction = "unpublished";
  }

  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      pressReleases: store.pressReleases.filter((pressRelease) => pressRelease.id !== id),
    }));
    return { ok: true, deleted: true, id, story, publicStoryAction };
  }

  await ensureContentSchema();
  await db.delete(pressReleaseEmails).where(eq(pressReleaseEmails.id, id));
  return { ok: true, deleted: true, id, story, publicStoryAction };
}

async function assertSavedStoryIsVisible(story: EditableStory) {
  if (story.status !== "published") return;

  const visibleStory = await getStoryBySlug(story.slug);
  if (!visibleStory || visibleStory.id !== story.id || visibleStory.status !== "published") {
    throw new Error("This story was saved, but it is not visible on the public site yet. It has not been marked as published.");
  }
}

type SaveStoryInput = Partial<EditableStory> & {
  publicationOverride?: PublicationOverrideInput;
  statusChangedBy?: string;
  revisionReason?: string;
  rightsWarningMediaIds?: string[];
  rightsWarningEditorIdentity?: string;
  editorialWarningEditorIdentity?: string;
};

export async function saveStory(input: SaveStoryInput): Promise<EditableStory> {
  if (!getDbOrNull()) {
    // The lock covers the complete read/validate/revision/write transaction.
    // This prevents another Node or PM2 process from calculating a competing
    // story update from the same stale JSON snapshot.
    return runLocalEditorStoreWriteTransaction(() => saveStoryInternal(input, true));
  }
  return saveStoryInternal(input, false);
}

async function saveStoryInternal(
  input: SaveStoryInput,
  localStoreLockHeld: boolean
): Promise<EditableStory> {
  const db = getDbOrNull();

  if (db) await ensureSeedData();
  const stamp = nowIso();
  const id = input.id || makeId("story");
  let existingStory: EditableStory | null = null;
  if (input.id) {
    if (db) {
      const [existingRow] = await db.select().from(storyRows).where(eq(storyRows.id, input.id)).limit(1);
      existingStory = existingRow ? rowToStory(existingRow) : null;
    } else {
      const store = await readLocalEditorStore();
      existingStory = mergeLocalStoriesWithStatic(store.stories, true).find((story) => story.id === input.id) ?? null;
    }
  }
  const status = normalizeStoryStatus(input.status || existingStory?.status || "draft");
  let scheduledPublishAt = String(input.scheduledPublishAt || "").trim();
  if (status === "scheduled") {
    const validation = validateScheduledPublishAt(scheduledPublishAt, new Date(stamp));
    if (!validation.ok) throw new StoryScheduleValidationError(validation.error);
    scheduledPublishAt = validation.iso;
  } else if (status === "published") {
    scheduledPublishAt = "";
  }
  const publishedAt =
    status === "published"
      ? input.publishedAt || existingStory?.publishedAt || stamp
      : String(input.publishedAt || existingStory?.publishedAt || "");
  const slug = await makeUniqueStorySlug(makeSlug(input.slug || existingStory?.slug || input.title || ""), id, db);
  const body = Array.isArray(input.body)
    ? input.body.map(cleanPressReleaseText).filter(Boolean)
    : String(input.body ?? "")
        .split(/\n{2,}/)
        .map((item) => cleanPressReleaseText(item))
        .filter(Boolean);
  const record: typeof storyRows.$inferInsert = {
    id,
    slug,
    title: cleanPressReleaseHeadline(input.title || "Untitled story"),
    category: normalizeStoryCategory(cleanPressReleaseHeadline(input.category || "News")),
    sectionSlugsJson: "[]",
    date: input.date || stamp.slice(0, 10),
    author: cleanPressReleaseHeadline(input.author || "Old Sea Dogs"),
    sourceType: cleanPressReleaseHeadline(input.sourceType || "Original"),
    sourceName: cleanPressReleaseHeadline(input.sourceName || "Old Sea Dogs desk"),
    sourceUrl: input.sourceUrl?.trim() || null,
    originalSourceType: String(input.originalSourceType ?? existingStory?.originalSourceType ?? ""),
    originalSourceRef: String(input.originalSourceRef ?? existingStory?.originalSourceRef ?? ""),
    originalSourceContent: String(input.originalSourceContent ?? existingStory?.originalSourceContent ?? ""),
    imageUrl: input.imageUrl?.trim() || "",
    imageAlt: cleanPressReleaseHeadline(input.imageAlt || input.title || "Old Sea Dogs story image"),
    imageCredit: cleanPressReleaseHeadline(input.imageCredit || ""),
    imageCaption: cleanPressReleaseText(input.imageCaption || ""),
    videoUrl: input.videoUrl?.trim() || "",
    videoCaption: cleanPressReleaseText(input.videoCaption || ""),
    videoPosition: input.videoPosition === "top" || input.videoPosition === "after-intro" || input.videoPosition === "bottom"
      ? input.videoPosition
      : "",
    oldSeaDogsView: cleanPressReleaseText(input.oldSeaDogsView || ""),
    sourceNotes: cleanPressReleaseText(input.sourceNotes || ""),
    methodNotes: cleanPressReleaseText(input.methodNotes || ""),
    contentBasis: cleanPressReleaseHeadline(input.contentBasis || basisFromSourceType(input.sourceType || "Original")),
    editorialStatus: cleanPressReleaseHeadline(input.editorialStatus || existingStory?.editorialStatus || "Draft"),
    noindex: Boolean(input.noindex),
    summary: cleanPressReleaseText(input.summary || ""),
    bodyJson: JSON.stringify(body),
    tagsJson: JSON.stringify(
      cleanStoryTags(Array.isArray(input.tags) ? input.tags.filter(Boolean) : parseList(String(input.tags ?? "")))
    ),
    readMinutes: Number(input.readMinutes || 3),
    isFeatured: existingStory?.isFeatured ?? false,
    status,
    publishedAt,
    scheduledPublishAt,
    sortOrder: Number(input.sortOrder ?? 0),
    createdAt: input.createdAt || existingStory?.createdAt || stamp,
    updatedAt: stamp,
  };
  const primarySectionSlug = getSectionForCategory(record.category)?.slug || "news";
  record.sectionSlugsJson = JSON.stringify(Array.from(new Set([
    primarySectionSlug,
    ...(Array.isArray(input.sectionSlugs) ? input.sectionSlugs : existingStory?.sectionSlugs || []),
  ].map((slug) => String(slug).trim().toLowerCase()).filter((slug) => oldSeaDogsSections.some((section) => section.slug === slug)))));

  const prospectiveStory = rowToStory(record as typeof storyRows.$inferSelect);
  const revisionComparable = (story: EditableStory) => {
    const { updatedAt, statusHistory, ...content } = story;
    void updatedAt;
    void statusHistory;
    return JSON.stringify(content);
  };
  const publishedContentChanged = Boolean(
    existingStory?.status === "published" &&
    status === "published" &&
    revisionComparable(existingStory) !== revisionComparable(prospectiveStory)
  );
  if (publishedContentChanged && record.editorialStatus === existingStory?.editorialStatus) {
    record.editorialStatus = "Updated";
  }
  const revision: StoryRevision | null = publishedContentChanged && existingStory
    ? {
        id: makeId("story-revision"),
        storyId: id,
        snapshot: existingStory,
        reason: cleanPressReleaseHeadline(input.revisionReason || "Published story edit"),
        createdBy: cleanPressReleaseHeadline(input.statusChangedBy || "Bridge editor"),
        createdAt: stamp,
      }
    : null;

  const historyEntry: StoryStatusHistoryEntry | null = !existingStory ||
    existingStory.status !== status ||
    existingStory.editorialStatus !== record.editorialStatus
    ? {
        id: makeId("story-status"),
        storyId: id,
        fromStatus: existingStory?.status || "",
        toStatus: status,
        fromWorkflow: existingStory?.editorialStatus || "",
        toWorkflow: record.editorialStatus || "",
        changedBy: cleanPressReleaseHeadline(input.statusChangedBy || "Bridge editor"),
        changedAt: stamp,
      }
    : null;

  const publicationInput = {
    title: record.title,
    category: record.category,
    sourceType: record.sourceType,
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl,
    oldSeaDogsView: record.oldSeaDogsView,
    sourceNotes: record.sourceNotes,
    methodNotes: record.methodNotes,
    contentBasis: record.contentBasis,
    noindex: record.noindex,
    summary: record.summary,
    body,
    status: record.status,
  };
  const enteringPublicWorkflow = (record.status === "published" || record.status === "scheduled") &&
    existingStory?.status !== record.status;
  const requiresTechnicalValidation = record.status === "published" || record.status === "scheduled";
  const editorialWarnings = enteringPublicWorkflow ? getEditorialWarnings(publicationInput) : [];

  if (requiresTechnicalValidation) {
    const technicalIssues = validateStoryForPublication(publicationInput);
    if (technicalIssues.length > 0) throw new StoryTechnicalValidationError(technicalIssues);
  }
  if (enteringPublicWorkflow) {
    if (editorialWarnings.length > 0 && !(
      input.publicationOverride?.confirm && input.publicationOverride.confirmEditorialWarnings
    )) {
      throw new PublicationOverrideRequiredError(editorialWarnings);
    }
  }

  const overrideReason = cleanPressReleaseText(input.publicationOverride?.editorNote || "");
  const rightsWarningLogs: PublicationOverrideLog[] = enteringPublicWorkflow && input.publicationOverride?.confirmImageRights
    ? [...new Set(input.rightsWarningMediaIds || [])].map((mediaId) => {
      const editorIdentity = cleanPressReleaseHeadline(input.rightsWarningEditorIdentity || input.statusChangedBy || "Bridge editor");
      const validationOverridden = "Image rights information incomplete at publication";
      return {
        id: makeId("override"),
        storyId: id,
        kind: "media-rights",
        mediaId,
        editorIdentity,
        wording: "I confirm I have the rights to publish this image.",
        paragraph: "",
        editorNote: overrideReason,
        warnings: [validationOverridden],
        headline: record.title,
        storyStatus: status,
        action: "editorial_override",
        timestamp: stamp,
        user: editorIdentity,
        time: stamp,
        validationOverridden,
        reason: overrideReason,
      };
    })
    : [];
  const editorialOverrideLog: PublicationOverrideLog | null = enteringPublicWorkflow &&
    editorialWarnings.length > 0 && input.publicationOverride?.confirmEditorialWarnings
    ? (() => {
      const editorIdentity = cleanPressReleaseHeadline(input.editorialWarningEditorIdentity || input.statusChangedBy || "Bridge editor");
      const validationOverridden = editorialWarnings.join(" | ");
      return {
        id: makeId("override"),
        storyId: id,
        kind: "editorial",
        mediaId: "",
        editorIdentity,
        wording: editorialWarnings[0],
        paragraph: editorialWarnings.join(" "),
        editorNote: overrideReason,
        warnings: editorialWarnings,
        headline: record.title,
        storyStatus: status,
        action: "editorial_override",
        timestamp: stamp,
        user: editorIdentity,
        time: stamp,
        validationOverridden,
        reason: overrideReason,
      };
    })()
    : null;
  const overrideLogs = [...rightsWarningLogs, editorialOverrideLog].filter((item): item is PublicationOverrideLog => Boolean(item));

  if (!db) {
    const story = {
      ...rowToStory(record as typeof storyRows.$inferSelect),
      statusHistory: historyEntry
        ? [historyEntry, ...(existingStory?.statusHistory || [])]
        : existingStory?.statusHistory || [],
    };
    await updateLocalEditorStore((store) => {
      return {
        ...store,
        stories: [story, ...store.stories.filter((item) => item.id !== story.id)],
        publicationOverrides: overrideLogs.length
          ? [...overrideLogs, ...store.publicationOverrides.filter((item) => !overrideLogs.some((log) => log.id === item.id))]
          : store.publicationOverrides,
        storyRevisions: revision ? [revision, ...store.storyRevisions] : store.storyRevisions,
      };
    }, localStoreLockHeld);
    await assertSavedStoryIsVisible(story);
    return story;
  }

  if (revision) {
    await db.insert(storyRevisions).values({
      id: revision.id,
      storyId: revision.storyId,
      snapshotJson: JSON.stringify(revision.snapshot),
      reason: revision.reason,
      createdBy: revision.createdBy,
      createdAt: revision.createdAt,
    });
  }

  await db
    .insert(storyRows)
    .values(record)
    .onConflictDoUpdate({
      target: storyRows.id,
      set: {
        slug: record.slug,
        title: record.title,
        category: record.category,
        sectionSlugsJson: record.sectionSlugsJson,
        date: record.date,
        author: record.author,
        sourceType: record.sourceType,
        sourceName: record.sourceName,
        sourceUrl: record.sourceUrl,
        originalSourceType: record.originalSourceType,
        originalSourceRef: record.originalSourceRef,
        originalSourceContent: record.originalSourceContent,
        imageUrl: record.imageUrl,
        imageAlt: record.imageAlt,
        imageCredit: record.imageCredit,
        imageCaption: record.imageCaption,
        videoUrl: record.videoUrl,
        videoCaption: record.videoCaption,
        videoPosition: record.videoPosition,
        oldSeaDogsView: record.oldSeaDogsView,
        sourceNotes: record.sourceNotes,
        methodNotes: record.methodNotes,
        contentBasis: record.contentBasis,
        editorialStatus: record.editorialStatus,
        noindex: record.noindex,
        summary: record.summary,
        bodyJson: record.bodyJson,
        tagsJson: record.tagsJson,
        readMinutes: record.readMinutes,
        status: record.status,
        publishedAt: record.publishedAt,
        scheduledPublishAt: record.scheduledPublishAt,
        sortOrder: record.sortOrder,
        updatedAt: record.updatedAt,
      },
    });

  if (historyEntry) {
    await db.insert(storyStatusHistory).values(historyEntry);
  }

  const [row] = await db.select().from(storyRows).where(eq(storyRows.id, id)).limit(1);
  const story = {
    ...rowToStory(row),
    statusHistory: historyEntry
      ? [historyEntry, ...(existingStory?.statusHistory || [])]
      : existingStory?.statusHistory || [],
  };
  if (overrideLogs.length) {
    await updateLocalEditorStore((store) => ({
      ...store,
      publicationOverrides: [...overrideLogs, ...store.publicationOverrides.filter((item) => !overrideLogs.some((log) => log.id === item.id))],
    })).catch(() => undefined);
  }
  await assertSavedStoryIsVisible(story);
  return story;
}

export async function getStoryRevisions(storyId: string): Promise<StoryRevision[]> {
  const db = getDbOrNull();
  if (!db) {
    const store = await readLocalEditorStore();
    return store.storyRevisions
      .filter((revision) => revision.storyId === storyId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  await ensureContentSchema();
  const rows = await db.select().from(storyRevisions).where(eq(storyRevisions.storyId, storyId)).orderBy(desc(storyRevisions.createdAt));
  return rows.map((row) => normalizeStoryRevision({
    id: row.id,
    storyId: row.storyId,
    snapshot: JSON.parse(row.snapshotJson) as EditableStory,
    reason: row.reason,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  })).filter((revision): revision is StoryRevision => Boolean(revision));
}

export async function restoreStoryRevision(storyId: string, revisionId: string, changedBy = "Bridge editor") {
  if (!getDbOrNull()) {
    return runLocalEditorStoreWriteTransaction(async () => {
      const store = await readLocalEditorStore();
      const current = mergeLocalStoriesWithStatic(store.stories, true).find((story) => story.id === storyId);
      if (!current) throw new Error("The story to restore could not be found.");
      const revision = store.storyRevisions.find((item) => item.storyId === storyId && item.id === revisionId);
      if (!revision) throw new Error("The selected story revision could not be found.");

      return saveStoryInternal({
        ...revision.snapshot,
        id: current.id,
        slug: current.slug,
        status: current.status,
        publishedAt: current.publishedAt,
        scheduledPublishAt: current.scheduledPublishAt,
        createdAt: current.createdAt,
        isFeatured: current.isFeatured,
        statusChangedBy: changedBy,
        revisionReason: `Rollback to revision ${revision.id}`,
      }, true);
    });
  }

  const editorData = await getEditorData();
  const current = editorData.stories.find((story) => story.id === storyId);
  if (!current) throw new Error("The story to restore could not be found.");
  const revision = (await getStoryRevisions(storyId)).find((item) => item.id === revisionId);
  if (!revision) throw new Error("The selected story revision could not be found.");

  // Rollback restores editorial content while preserving the canonical record,
  // current URL and original publication identity. saveStory creates a revision
  // of the replaced state first, so the rollback itself can be undone.
  return saveStory({
    ...revision.snapshot,
    id: current.id,
    slug: current.slug,
    status: current.status,
    publishedAt: current.publishedAt,
    scheduledPublishAt: current.scheduledPublishAt,
    createdAt: current.createdAt,
    isFeatured: current.isFeatured,
    statusChangedBy: changedBy,
    revisionReason: `Rollback to revision ${revision.id}`,
  });
}

export async function saveGuide(input: Partial<EditableGuide>) {
  validateGuideInput(input);
  const slug = makeSlug(input.slug || input.title || "");
  if (!slug) throw new Error("Choose a guide before saving.");

  let savedGuide: EditableGuide | null = null;
  await updateLocalEditorStore((store) => {
    const existingGuides = mergeLocalGuidesWithStatic(store.guides);
    const index = existingGuides.findIndex((guide) => guide.slug === slug);
    const existingGuide = index >= 0 ? existingGuides[index] : null;
    const nextInternalNumber = existingGuides.reduce((highest, guide) => {
      const match = guide.internalId.match(/^OSD-G(\d+)$/i);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
    const fallback = existingGuide ?? staticGuideDefaults(blankGuideSeed, existingGuides.length);
    const next = normalizeStoredGuide({
      ...fallback,
      ...input,
      internalId: existingGuide?.internalId || input.internalId || `OSD-G${String(nextInternalNumber).padStart(3, "0")}`,
      showOnHomepage: existingGuide?.showOnHomepage ?? false,
      homepageOrder: existingGuide?.homepageOrder ?? 0,
      slug,
      updatedAt: input.updatedAt || nowIso().slice(0, 10),
    }, index >= 0 ? index : existingGuides.length);

    if (guideWordCount(next) < guideMinimumWordCount(next) && input.status === "published") {
      throw new Error(`This Guide is under ${guideMinimumWordCount(next).toLocaleString("en-GB")} words. Save it as a draft or expand it before publishing.`);
    }

    savedGuide = next;
    return {
      ...store,
      guides: [next, ...existingGuides.filter((guide) => guide.slug !== slug)],
    };
  });

  if (!savedGuide) throw new Error("Guide could not be saved.");
  return savedGuide;
}

export async function saveStoryImage(
  id: string,
  imageUrl: string,
  imageAlt: string,
  imageCredit = "",
  imageCaption = ""
) {
  const db = getDbOrNull();
  if (!db) {
    let updated: EditableStory | null = null;
    await updateLocalEditorStore((store) => {
      const existing = store.stories.find((story) => story.id === id) ?? staticStories().find((story) => story.id === id);
      if (!existing) throw new Error("I could not find that story.");
      updated = {
        ...existing,
        imageUrl,
        imageAlt: imageAlt.trim() || "Old Sea Dogs story image",
        imageCredit: cleanPressReleaseHeadline(imageCredit),
        imageCaption: cleanPressReleaseText(imageCaption),
        updatedAt: nowIso(),
      };
      return {
        ...store,
        stories: [updated, ...store.stories.filter((story) => story.id !== id)],
      };
    });
    if (!updated) throw new Error("The story image could not be saved.");
    return updated;
  }

  await ensureContentSchema();
  const stamp = nowIso();
  await db
    .update(storyRows)
    .set({
      imageUrl,
      imageAlt: imageAlt.trim() || "Old Sea Dogs story image",
      imageCredit: cleanPressReleaseHeadline(imageCredit),
      imageCaption: cleanPressReleaseText(imageCaption),
      updatedAt: stamp,
    })
    .where(eq(storyRows.id, id));

  const [row] = await db.select().from(storyRows).where(eq(storyRows.id, id)).limit(1);
  if (!row) throw new Error("I could not find that story.");
  return rowToStory(row);
}

export async function deleteStory(id: string) {
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      stories: store.stories.filter((story) => story.id !== id),
      pressReleases: store.pressReleases.filter((pressRelease) => pressRelease.storyId !== id),
    }));
    return { ok: true, deleted: true, id };
  }
  await ensureContentSchema();
  await db.delete(storyRows).where(eq(storyRows.id, id));
  await db.delete(pressReleaseEmails).where(eq(pressReleaseEmails.storyId, id));
  return { ok: true, deleted: true, id };
}

export async function saveSettings(input: Partial<SiteSettings>) {
  const homepageKeys = new Set([
    "homepageLeadStoryId",
    "homepageLeadStorySlug",
    "homepageLatestStoryIds",
    "homepageEditorsChoiceStoryIds",
    "homepageHiddenStoryIds",
  ]);
  const attemptedHomepageKey = Object.keys(input).find((key) => homepageKeys.has(key));
  if (attemptedHomepageKey) {
    throw new Error("Homepage settings can only be changed in Homepage Manager by pressing Save Homepage.");
  }
  if (input.defaultSocialImageMediaId) {
    const asset = await getMediaAsset(input.defaultSocialImageMediaId);
    if (!asset || !asset.contentType.startsWith("image/") || asset.url !== input.defaultSocialImageUrl) {
      throw new Error("The default social-sharing image must be an existing publicly served Media Library image.");
    }
  }
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      settings: { ...defaultSettings, ...store.settings, ...input },
    }));
    return getSiteSettings();
  }

  await ensureContentSchema();
  const stamp = nowIso();
  await Promise.all(
    Object.entries(input).map(([key, value]) =>
      db
        .insert(siteSettings)
        .values({ key, value: String(value), updatedAt: stamp })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: String(value), updatedAt: stamp },
        })
    )
  );
  return getSiteSettings();
}

export async function saveAd(input: Partial<Advert>) {
  const db = getDbOrNull();

  const stamp = nowIso();
  const id = input.id || makeId("ad");
  const record: typeof ads.$inferInsert = {
    id,
    placement: input.placement || "sidebar",
    kind: input.kind || "manual",
    label: input.label || "Advert",
    title: input.title || "",
    body: input.body || "",
    imageUrl: input.imageUrl || "",
    linkUrl: input.linkUrl || "",
    code: input.code || "",
    startDate: input.startDate || "",
    endDate: input.endDate || "",
    isActive: input.isActive ?? true,
    createdAt: input.createdAt || stamp,
    updatedAt: stamp,
  };

  if (!db) {
    const advert = record as Advert;
    await updateLocalEditorStore((store) => ({
      ...store,
      ads: [advert, ...store.ads.filter((ad) => ad.id !== advert.id)],
    }));
    return advert;
  }

  await ensureContentSchema();

  await db
    .insert(ads)
    .values(record)
    .onConflictDoUpdate({
      target: ads.id,
      set: {
        placement: record.placement,
        kind: record.kind,
        label: record.label,
        title: record.title,
        body: record.body,
        imageUrl: record.imageUrl,
        linkUrl: record.linkUrl,
        code: record.code,
        startDate: record.startDate,
        endDate: record.endDate,
        isActive: record.isActive,
        updatedAt: record.updatedAt,
      },
    });

  const [row] = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
  return row;
}

export async function deleteAd(id: string) {
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      ads: store.ads.filter((ad) => ad.id !== id),
    }));
    return;
  }
  await ensureContentSchema();
  await db.delete(ads).where(eq(ads.id, id));
}

export async function saveMediaAsset(input: Pick<MediaAsset, "id" | "filename" | "contentType" | "size" | "r2Key" | "url"> & Partial<Omit<MediaAsset, "id" | "filename" | "contentType" | "size" | "r2Key" | "url" | "createdAt">>) {
  const db = getDbOrNull();
  const record = normalizeMediaAsset({ ...input, createdAt: nowIso() });
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      media: [record, ...store.media.filter((asset) => asset.id !== record.id)],
    }));
    return record;
  }
  await ensureContentSchema();
  await db.insert(mediaAssets).values(record).onConflictDoUpdate({
    target: mediaAssets.id,
    set: record,
  });
  return record;
}

export async function updateMediaAsset(id: string, input: Partial<MediaAsset>) {
  const current = await getMediaAsset(id);
  if (!current) throw new Error("Media item not found.");
  const record = normalizeMediaAsset({
    ...current,
    ...input,
    id,
    url: current.url,
    r2Key: current.r2Key,
    originalKey: current.originalKey,
    webKey: current.webKey,
    originalFilename: current.originalFilename || current.filename,
  });
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({
      ...store,
      media: [record, ...store.media.filter((asset) => asset.id !== id)],
    }));
    return record;
  }
  await ensureContentSchema();
  await db.update(mediaAssets).set(record).where(eq(mediaAssets.id, id));
  return record;
}

export async function saveExternalVideo(input: Partial<MediaAsset> & { externalUrl: string }) {
  const url = input.externalUrl.trim();
  if (!/^https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be|vimeo\.com|tiktok\.com)\//i.test(url)) {
    throw new Error("Use a valid YouTube, Vimeo or TikTok URL.");
  }
  const id = makeId("video");
  const title = cleanPressReleaseHeadline(input.displayName || input.internalTitle || "External video");
  return saveMediaAsset({
    id, filename: title, originalFilename: "External URL", displayName: title, internalTitle: title,
    contentType: "text/uri-list", size: 0, r2Key: `external:${id}`, url, externalUrl: url,
    sourceType: url.includes("vimeo.com") ? "vimeo" : url.includes("tiktok.com") ? "tiktok" : "youtube", alt: input.alt || input.description || title,
    description: input.description || input.alt || title, caption: input.caption || "", credit: input.credit || "",
    copyright: input.copyright || "", copyrightOwnership: input.copyrightOwnership || "unknown",
    posterMediaId: input.posterMediaId || "", tagsJson: input.tagsJson || "[]", collectionsJson: input.collectionsJson || "[]",
    storyAssociationId: input.storyAssociationId || "", galleryAssociationId: input.galleryAssociationId || "",
  });
}

export async function deleteMediaAsset(id: string) {
  const data = await getEditorData();
  const asset = data.media.find((item) => item.id === id);
  if (!asset) throw new Error("Media item not found.");
  const mediaPath = `/api/media/${id}`;
  const story = data.stories.find((item) => item.imageUrl.startsWith(mediaPath) || item.body.some((block) => block.includes(mediaPath)));
  if (story) throw new Error(`This photograph is used by “${story.title}”. Remove it from that story before deleting it.`);
  const galleryItem = data.galleryItems.find((item) => item.mediaId === id);
  if (galleryItem) throw new Error("This photograph is in Through the Lens review. Remove that gallery record before deleting the media file.");

  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({ ...store, media: store.media.filter((item) => item.id !== id) }));
  } else {
    await ensureContentSchema();
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  }
  await deleteLocalMediaUpload(asset.r2Key);
  return { ok: true, id };
}

export async function saveGalleryCategory(input: Partial<GalleryCategory>) {
  const stamp = nowIso();
  const name = cleanPressReleaseHeadline(input.name || "New category");
  const record: GalleryCategory = {
    id: input.id || makeId("gallery-category"),
    name,
    slug: makeSlug(input.slug || name),
    description: cleanPressReleaseText(input.description || ""),
    sortOrder: Number(input.sortOrder || 0),
    createdAt: input.createdAt || stamp,
    updatedAt: stamp,
  };
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({ ...store, galleryCategories: [record, ...store.galleryCategories.filter((item) => item.id !== record.id)] }));
  } else {
    await ensureContentSchema();
    await db.insert(galleryCategories).values(record).onConflictDoUpdate({ target: galleryCategories.id, set: record });
  }
  return record;
}

export async function saveGalleryItem(input: Partial<GalleryItem>) {
  const stamp = nowIso();
  const item = normalizeGalleryItem({ ...input, updatedAt: stamp, createdAt: input.createdAt || stamp });
  if (!item.mediaId) throw new Error("Choose a media item for the gallery record.");
  if (!new Set(["pending", "approved", "rejected"]).has(item.status)) item.status = "pending";
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({ ...store, galleryItems: [item, ...store.galleryItems.filter((candidate) => candidate.id !== item.id)] }));
  } else {
    await ensureContentSchema();
    const row: GalleryItemRow = { ...item, tagsJson: JSON.stringify(item.tags), categoryIdsJson: JSON.stringify(item.categoryIds), storyIdsJson: JSON.stringify(item.storyIds) };
    delete (row as Partial<GalleryItem>).tags;
    delete (row as Partial<GalleryItem>).categoryIds;
    delete (row as Partial<GalleryItem>).storyIds;
    await db.insert(galleryItems).values(row).onConflictDoUpdate({ target: galleryItems.id, set: row });
  }
  await updateMediaAsset(item.mediaId, { galleryItemId: item.id, sourceType: item.sourceType });
  return item;
}

export async function saveInstagramImport(input: Partial<InstagramImport> & { instagramMediaId: string }) {
  const stamp = nowIso();
  const record: InstagramImport = {
    id: input.id || makeId("instagram"),
    instagramMediaId: input.instagramMediaId,
    permalink: String(input.permalink || ""),
    mediaType: String(input.mediaType || "IMAGE"),
    caption: String(input.caption || ""),
    timestamp: String(input.timestamp || ""),
    mediaId: String(input.mediaId || ""),
    galleryItemId: String(input.galleryItemId || ""),
    status: String(input.status || "pending"),
    importedAt: input.importedAt || stamp,
    updatedAt: stamp,
  };
  const db = getDbOrNull();
  if (!db) {
    await updateLocalEditorStore((store) => ({ ...store, instagramImports: [record, ...store.instagramImports.filter((item) => item.instagramMediaId !== record.instagramMediaId)] }));
  } else {
    await ensureContentSchema();
    await db.insert(instagramImports).values(record).onConflictDoUpdate({ target: instagramImports.instagramMediaId, set: record });
  }
  return record;
}

export async function getMediaAsset(id: string) {
  const db = getDbOrNull();
  const findInLocalStore = async () => {
    const store = await readLocalEditorStore();
    return store.media.find((asset) => asset.id === id) ?? null;
  };

  return findMediaAssetAcrossStores({
    findInDatabase: db
      ? async () => {
          await ensureContentSchema();
          const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
          return asset ? normalizeMediaAsset(asset) : null;
        }
      : null,
    findInLocalStore,
    // Cloudflare D1 remains authoritative. DigitalOcean explicitly configures
    // this directory, so a D1-shaped runtime binding with no matching row must
    // not hide a valid local media record.
    localFallbackEnabled: Boolean(runtimeNodeProcess()?.env?.OLDSEADOGS_DATA_DIR?.trim()),
  });
}
