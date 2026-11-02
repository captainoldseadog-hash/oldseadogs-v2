#!/usr/bin/env node
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const defaultDataDir = "/var/www/oldseadogs-data";
const defaultBackupDir = "/var/www/Oldseadogsbackups";
const legacyBackupDirs = ["/var/www/oldseadogs-backups"];
const defaultAppDir = "/var/www/oldseadogs";
const defaultPm2Name = "oldseadogs";
const defaultEnvironmentFile = "/etc/oldseadogs/oldseadogs.env";
const manifestFileName = "manifest.json";
const manifestHashFileName = "manifest.sha256";
const deployHistoryFileName = "deploy-history.jsonl";
const restoreHistoryFileName = "restore-history.jsonl";
const backupCategoryDirs = [
  "app-snapshots",
  "stories",
  "media",
  "editor",
  "gallery",
  "instagram",
  "emails",
  "exports",
  "database",
  "logs",
  "restore-plans",
];

const defaultPrivateConfigPaths = [
  "/etc/oldseadogs/oldseadogs.env",
  "/etc/nginx/sites-available/oldseadogs",
  "/etc/nginx/sites-available/oldseadogs-production",
  "/etc/nginx/sites-available/oldseadogs-staging",
  "/etc/nginx/sites-enabled/oldseadogs",
  "/etc/nginx/oldseadogs.htpasswd",
  "/var/www/oldseadogs/ecosystem.config.cjs",
  "/var/www/oldseadogs/package.json",
];

const rsyncRuntimeExcludes = [
  ".oldseadogs-data",
  ".oldseadogs-data/***",
  "oldseadogs-data",
  "oldseadogs-data/***",
  "/var/www/oldseadogs-data",
  "/var/www/oldseadogs-data/***",
  "var/www/oldseadogs-data",
  "var/www/oldseadogs-data/***",
  "editor-store.json",
  "*.backup-*",
];

const rsyncBuildExcludes = [
  ".git",
  ".next",
  ".wrangler",
  "dist",
  "node_modules",
  "outputs",
  "work",
  "logs/*.log",
];

function argValue(args, name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback;
}

function hasArg(args, name) {
  return args.includes(name);
}

function nowStamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function isoNow() {
  return new Date().toISOString();
}

function normalizePathForManifest(value) {
  return value.split(path.sep).join("/");
}

function safeConfigRelativePath(sourcePath) {
  return sourcePath.replace(/^\/+/, "").split(path.sep).filter(Boolean).join(path.sep);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function parseConfigPaths(args) {
  const explicit = argValue(args, "--config-paths");
  const raw = explicit || process.env.OLDSEADOGS_CONFIG_PATHS || "";
  if (!raw.trim()) return defaultPrivateConfigPaths;
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function backupOptions(args) {
  const explicitBackupDir = hasArg(args, "--backup-dir") || Boolean(process.env.OLDSEADOGS_BACKUP_DIR);
  return {
    appDir: argValue(args, "--app-dir", process.env.OLDSEADOGS_APP_DIR || defaultAppDir),
    backupDir: argValue(args, "--backup-dir", process.env.OLDSEADOGS_BACKUP_DIR || defaultBackupDir),
    dataDir: argValue(args, "--data-dir", process.env.OLDSEADOGS_DATA_DIR || defaultDataDir),
    explicitBackupDir,
    json: hasArg(args, "--json"),
  };
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensurePrivateDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
  await fs.chmod(dirPath, 0o700).catch(() => undefined);
}

async function writeJsonFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  JSON.parse(await fs.readFile(tempPath, "utf8"));
  await fs.rename(tempPath, filePath);
  await fs.chmod(filePath, 0o600).catch(() => undefined);
}

async function appendJsonLine(filePath, value) {
  await ensurePrivateDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
  await fs.chmod(filePath, 0o600).catch(() => undefined);
}

async function readJsonLines(filePath) {
  if (!await exists(filePath)) return [];
  const text = await fs.readFile(filePath, "utf8");
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function walkRegularFiles(rootDir) {
  if (!await exists(rootDir)) return [];
  const files = [];

  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await visit(rootDir);
  return files.sort();
}

async function addManifestItems({ items, kind, sourceRoot, backupRoot, backupSubdir }) {
  const root = path.join(backupRoot, backupSubdir);
  if (!await exists(root)) return;
  const rootStat = await fs.lstat(root);
  const files = rootStat.isFile() ? [root] : await walkRegularFiles(root);
  for (const filePath of files) {
    const relativeToBackup = normalizePathForManifest(path.relative(backupRoot, filePath));
    const relativeToSubdir = rootStat.isFile() ? path.basename(root) : path.relative(root, filePath);
    const stat = await fs.stat(filePath);
    items.push({
      kind,
      relativePath: relativeToBackup,
      sourcePath: normalizePathForManifest(path.join(sourceRoot, relativeToSubdir)),
      size: stat.size,
      sha256: await sha256File(filePath),
    });
  }
}

async function copyPrivateConfig({ backupPath, configPaths, skipped }) {
  const configDir = path.join(backupPath, "private-config");
  await ensurePrivateDir(configDir);

  for (const sourcePath of configPaths) {
    try {
      const stat = await fs.lstat(sourcePath);
      const relativePath = safeConfigRelativePath(sourcePath);
      const destination = path.join(configDir, relativePath);
      await fs.mkdir(path.dirname(destination), { recursive: true });

      if (stat.isSymbolicLink()) {
        const target = await fs.readlink(sourcePath);
        await fs.writeFile(`${destination}.symlink.txt`, `Symlink: ${sourcePath} -> ${target}\n`, "utf8");
        await fs.chmod(`${destination}.symlink.txt`, 0o600).catch(() => undefined);
        continue;
      }

      if (stat.isDirectory()) {
        await fs.cp(sourcePath, destination, {
          dereference: false,
          preserveTimestamps: true,
          recursive: true,
        });
      } else if (stat.isFile()) {
        await fs.copyFile(sourcePath, destination);
        await fs.chmod(destination, 0o600).catch(() => undefined);
      }
    } catch (error) {
      skipped.push({
        kind: "private-config",
        path: sourcePath,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function countStoreData(parsed) {
  return {
    stories: Array.isArray(parsed.stories) ? parsed.stories.length : 0,
    guides: Array.isArray(parsed.guides) ? parsed.guides.length : 0,
    mediaRecords: Array.isArray(parsed.media) ? parsed.media.length : 0,
    ads: Array.isArray(parsed.ads) ? parsed.ads.length : 0,
    pressReleases: Array.isArray(parsed.pressReleases) ? parsed.pressReleases.length : 0,
    scrapedQueue: scrapedStoryQueueSnapshot(parsed).length,
    uploadedImages: mediaMetadataSnapshot(parsed).filter((item) => String(item.contentType || "").startsWith("image/")).length,
    uploadedVideos: mediaMetadataSnapshot(parsed).filter((item) => String(item.contentType || "").startsWith("video/")).length,
    emailImports: emailImportsSnapshot(parsed).length,
    galleryItems: Array.isArray(parsed.galleryItems) ? parsed.galleryItems.length : 0,
    galleryCategories: Array.isArray(parsed.galleryCategories) ? parsed.galleryCategories.length : 0,
    instagramImports: Array.isArray(parsed.instagramImports) ? parsed.instagramImports.length : 0,
  };
}

function storyMetadataSnapshot(store) {
  return Array.isArray(store.stories)
    ? store.stories.map((story) => ({
        id: story.id || "",
        slug: story.slug || "",
        title: story.title || "",
        sectionSlugs: Array.isArray(story.sectionSlugs) ? story.sectionSlugs : [],
        status: story.status || "",
        editorialStatus: story.editorialStatus || "",
        noindex: Boolean(story.noindex),
        isFeatured: Boolean(story.isFeatured),
        sourceType: story.sourceType || "",
        sourceName: story.sourceName || "",
        imageCredit: story.imageCredit || "",
        imageUrl: story.imageUrl || "",
        imageCaption: story.imageCaption || "",
        videoUrl: story.videoUrl || "",
        videoCaption: story.videoCaption || "",
        videoPosition: story.videoPosition || "",
        tags: Array.isArray(story.tags) ? story.tags : [],
        uploadedMediaReferences: Array.isArray(story.body)
          ? [...new Set([story.imageUrl || "", ...story.body]
              .flatMap((value) => [...String(value).matchAll(/\/api\/media\/([^|?\]#]+)/g)].map((match) => match[1]))
              .filter(Boolean))]
          : [],
        publishedAt: story.publishedAt || "",
        scheduledPublishAt: story.scheduledPublishAt || "",
        statusHistory: Array.isArray(story.statusHistory) ? story.statusHistory : [],
        updatedAt: story.updatedAt || "",
      }))
    : [];
}

function guideSnapshot(store) {
  return Array.isArray(store.guides) ? store.guides : [];
}

function homepageGuideVisibilitySnapshot(store) {
  return guideSnapshot(store).map((guide) => ({
    slug: guide.slug || "",
    title: guide.title || "",
    status: guide.status || "draft",
    showOnHomepage: Boolean(guide.showOnHomepage),
    homepageOrder: Number(guide.homepageOrder || 0),
    noindex: Boolean(guide.noindex),
    updatedAt: guide.updatedAt || "",
  }));
}

function mediaMetadataSnapshot(store) {
  return Array.isArray(store.media)
    ? store.media.map((item) => ({
        id: item.id || "",
        filename: item.filename || "",
        originalFilename: item.originalFilename || item.filename || "",
        displayName: item.displayName || item.filename || "",
        internalTitle: item.internalTitle || "",
        contentType: item.contentType || "",
        size: Number(item.size || 0),
        r2Key: item.r2Key || "",
        url: item.url || "",
        alt: item.alt || "",
        caption: item.caption || "",
        credit: item.credit || "",
        copyright: item.copyright || "",
        copyrightOwnership: item.copyrightOwnership || "unknown",
        copyrightOwner: item.copyrightOwner || "",
        photographer: item.photographer || "",
        source: item.source || "",
        licence: item.licence || "",
        permissionNote: item.permissionNote || "",
        usageRestrictions: item.usageRestrictions || "",
        creditLine: item.creditLine || "",
        permissionReceivedAt: item.permissionReceivedAt || "",
        location: item.location || "",
        dateTaken: item.dateTaken || "",
        sourceType: item.sourceType || "upload",
        category: item.category || "",
        tagsJson: item.tagsJson || "[]",
        collectionsJson: item.collectionsJson || "[]",
        storyIdsJson: item.storyIdsJson || "[]",
        galleryItemId: item.galleryItemId || "",
        originalKey: item.originalKey || item.r2Key || "",
        webKey: item.webKey || "",
        posterMediaId: item.posterMediaId || "",
        externalUrl: item.externalUrl || "",
        description: item.description || "",
        storyAssociationId: item.storyAssociationId || "",
        galleryAssociationId: item.galleryAssociationId || "",
        createdAt: item.createdAt || "",
      }))
    : [];
}

function galleryMetadataSnapshot(store) {
  const rollout = String(store?.settings?.galleryPublicRollout || "false").trim().toLowerCase() === "true";
  return {
    name: "Through the Lens",
    settings: {
      name: "Through the Lens",
      publicRollout: rollout,
      galleryPublicRollout: rollout ? "true" : "false",
      defaultApprovalStatus: "pending",
      instagramAutoPublish: false,
    },
    categories: Array.isArray(store.galleryCategories) ? store.galleryCategories : [],
    items: Array.isArray(store.galleryItems) ? store.galleryItems : [],
    instagramImports: Array.isArray(store.instagramImports) ? store.instagramImports : [],
  };
}

function emailImportsSnapshot(store) {
  return Array.isArray(store.pressReleases)
    ? store.pressReleases.map((item) => ({
        id: item.id || "",
        messageId: item.messageId || "",
        senderName: item.senderName || "",
        senderEmail: item.senderEmail || "",
        senderDomain: item.senderDomain || "",
        subject: item.subject || "",
        receivedAt: item.receivedAt || "",
        status: item.status || "",
        category: item.category || "",
        relevanceScore: Number(item.relevanceScore || 0),
        duplicateOf: item.duplicateOf || "",
        warningCount: Array.isArray(item.warnings) ? item.warnings.length : 0,
        attachmentCount: Array.isArray(item.attachments) ? item.attachments.length : 0,
        storedImageCount: Array.isArray(item.attachments)
          ? item.attachments.filter((attachment) => String(attachment.dataUrl || "").startsWith("/api/media/")).length
          : 0,
        imageUrl: item.imageUrl || "",
        imageCredit: item.imageCredit || "",
        storyId: item.storyId || "",
        updatedAt: item.updatedAt || "",
      }))
    : [];
}

function scrapedStoryQueueSnapshot(store) {
  return Array.isArray(store.stories)
    ? store.stories
        .filter((story) =>
          story.status === "draft" &&
          /\b(automatic watch|source watch|scrape|scraped|generated|source detail)\b/i.test(String(story.sourceType || ""))
        )
        .map((story) => ({
          id: story.id || "",
          slug: story.slug || "",
          title: story.title || "",
          status: story.status || "",
          editorialStatus: story.editorialStatus || "",
          sourceType: story.sourceType || "",
          sourceName: story.sourceName || "",
          sourceUrl: story.sourceUrl || "",
          wordCount: Array.isArray(story.body) ? story.body.join(" ").split(/\s+/).filter(Boolean).length : 0,
          imageUrl: story.imageUrl || "",
          updatedAt: story.updatedAt || "",
        }))
    : [];
}

function videoMetadataSnapshot(store) {
  const storyVideoFields = Array.isArray(store.stories)
    ? store.stories
        .filter((story) => String(story.videoUrl || "").trim())
        .map((story) => ({
          storyId: story.id || "",
          storySlug: story.slug || "",
          storyTitle: story.title || "",
          url: story.videoUrl || "",
          position: story.videoPosition || "",
          caption: story.videoCaption || "",
        }))
    : [];
  const storyVideos = Array.isArray(store.stories)
    ? store.stories.flatMap((story) =>
        Array.isArray(story.body)
          ? story.body
              .map((paragraph) => String(paragraph || "").match(/^\[video:([^|\]]+)(?:\|([^\]]*))?(?:\|([^\]]*))?(?:\|([^\]]*))?\]$/))
              .filter(Boolean)
              .map((match) => ({
                storyId: story.id || "",
                storySlug: story.slug || "",
                storyTitle: story.title || "",
                url: match[1] || "",
                placement: match[2] || "",
                caption: match[3] || "",
                credit: match[4] || "",
              }))
          : []
      )
    : [];
  const uploadedVideoRecords = mediaMetadataSnapshot(store).filter((item) => String(item.contentType || "").startsWith("video/"));
  return {
    storyVideoFields,
    storyVideos,
    uploadedVideoRecords,
  };
}

function homepageSettingsSnapshot(store) {
  const featuredStories = Array.isArray(store.stories)
    ? store.stories
        .filter((story) => Boolean(story.isFeatured))
        .map((story) => ({
          id: story.id || "",
          slug: story.slug || "",
          title: story.title || "",
          status: story.status || "",
          updatedAt: story.updatedAt || "",
        }))
    : [];
  return {
    settings: store.settings && typeof store.settings === "object" ? store.settings : {},
    featuredStories,
    guideVisibility: homepageGuideVisibilitySnapshot(store),
  };
}

function analyticsSettingsSnapshot(store) {
  const measurementId = String(process.env.OLDSEADOGS_GA4_ID || process.env.NEXT_PUBLIC_GA4_ID || "").trim();
  return {
    measurementIdConfigured: Boolean(measurementId),
    measurementIdValid: /^G-[A-Z0-9]{4,20}$/i.test(measurementId),
    dataApiPropertyConfigured: Boolean(process.env.OLDSEADOGS_GA4_PROPERTY_ID),
    dataApiClientConfigured: Boolean(process.env.OLDSEADOGS_GA4_CLIENT_EMAIL && process.env.OLDSEADOGS_GA4_PRIVATE_KEY),
    consentRequired: true,
    editorTrackingDisabled: true,
    savedSettings: store.settings?.analytics && typeof store.settings.analytics === "object" ? store.settings.analytics : {},
  };
}

async function ensureBackupCategoryDirs(backupRoot) {
  await ensurePrivateDir(backupRoot);
  for (const dir of backupCategoryDirs) {
    await ensurePrivateDir(path.join(backupRoot, dir));
  }
}

function safeBackupFileName(value, fallback) {
  const cleaned = String(value || fallback || "item")
    .trim()
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return cleaned || fallback || "item";
}

function storyReadableExport(story) {
  return {
    id: story.id || "",
    slug: story.slug || "",
    title: story.title || "",
    summary: story.summary || "",
    category: story.category || "",
    author: story.author || "",
    status: story.status || "",
    editorialStatus: story.editorialStatus || "",
    publishedAt: story.publishedAt || "",
    scheduledPublishAt: story.scheduledPublishAt || "",
    date: story.date || "",
    tags: Array.isArray(story.tags) ? story.tags : [],
    image: {
      url: story.imageUrl || "",
      alt: story.imageAlt || "",
      caption: story.imageCaption || "",
      credit: story.imageCredit || "",
    },
    video: {
      url: story.videoUrl || "",
      caption: story.videoCaption || "",
      position: story.videoPosition || "",
    },
    homepage: {
      isFeatured: Boolean(story.isFeatured),
      sortOrder: Number(story.sortOrder || 0),
      noindex: Boolean(story.noindex),
    },
    source: {
      type: story.sourceType || "",
      name: story.sourceName || "",
      url: story.sourceUrl || "",
      notes: story.sourceNotes || "",
    },
    privateOriginalSource: {
      type: story.originalSourceType || "",
      reference: story.originalSourceRef || "",
      content: story.originalSourceContent || "",
    },
    body: Array.isArray(story.body) ? story.body : [],
    mediaReferences: Array.isArray(story.body)
      ? [...new Set([story.imageUrl || "", story.videoUrl || "", ...story.body]
          .flatMap((value) => [...String(value).matchAll(/\/api\/media\/([^|?\]#]+)/g)].map((match) => match[1]))
          .filter(Boolean))]
      : [],
    statusHistory: Array.isArray(story.statusHistory) ? story.statusHistory : [],
    updatedAt: story.updatedAt || "",
  };
}

function emailReadableExport(item) {
  return {
    id: item.id || "",
    messageId: item.messageId || "",
    senderName: item.senderName || "",
    senderEmail: item.senderEmail || "",
    senderDomain: item.senderDomain || "",
    subject: item.subject || "",
    receivedAt: item.receivedAt || "",
    status: item.status || "",
    category: item.category || "",
    preview: item.preview || "",
    bodyText: item.bodyText || "",
    generatedTitle: item.generatedTitle || "",
    generatedExcerpt: item.generatedExcerpt || "",
    generatedBody: Array.isArray(item.generatedBody) ? item.generatedBody : [],
    generatedWordCount: Number(item.generatedWordCount || 0),
    warnings: Array.isArray(item.warnings) ? item.warnings : [],
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map((attachment) => ({
          id: attachment.id || "",
          filename: attachment.filename || "",
          contentType: attachment.contentType || "",
          size: Number(attachment.size || 0),
          storedReference: String(attachment.dataUrl || "").startsWith("/api/media/") ? attachment.dataUrl : "",
          embeddedInOriginalEmail: !String(attachment.dataUrl || "").startsWith("/api/media/"),
          suggestedCredit: attachment.suggestedCredit || "",
          caption: attachment.caption || "",
          rightsNote: attachment.rightsNote || "",
        }))
      : [],
    imageUrl: item.imageUrl || "",
    imageCredit: item.imageCredit || "",
    storyId: item.storyId || "",
    updatedAt: item.updatedAt || "",
  };
}

async function writeReadableStoryBackups(store, destination) {
  await ensurePrivateDir(destination);
  const stories = Array.isArray(store.stories) ? store.stories : [];
  const index = [];
  for (const story of stories) {
    const fileName = `${safeBackupFileName(`${story.slug || "story"}-${story.id || ""}`, "story")}.json`;
    const relativePath = fileName;
    const filePath = path.join(destination, fileName);
    await writeJsonFile(filePath, storyReadableExport(story));
    index.push({
      id: story.id || "",
      slug: story.slug || "",
      title: story.title || "",
      status: story.status || "",
      file: relativePath,
      sha256: await sha256File(filePath),
    });
  }
  await writeJsonFile(path.join(destination, "index.json"), {
    createdAt: isoNow(),
    count: index.length,
    stories: index,
  });
}

async function writeReadableEmailBackups(store, destination) {
  await ensurePrivateDir(destination);
  await ensurePrivateDir(path.join(destination, "original-eml"));
  await ensurePrivateDir(path.join(destination, "parsed-json"));
  await ensurePrivateDir(path.join(destination, "attachments"));
  const emails = Array.isArray(store.pressReleases) ? store.pressReleases : [];
  const index = [];
  for (const item of emails) {
    const baseName = safeBackupFileName(`${item.receivedAt || ""}-${item.id || ""}-${item.subject || "email"}`, item.id || "email");
    const parsedPath = path.join(destination, "parsed-json", `${baseName}.json`);
    const emlPath = path.join(destination, "original-eml", `${baseName}.eml`);
    const attachmentsPath = path.join(destination, "attachments", `${baseName}.json`);
    await writeJsonFile(parsedPath, emailReadableExport(item));
    await fs.writeFile(emlPath, item.rawEmail || item.bodyText || "", "utf8");
    await fs.chmod(emlPath, 0o600).catch(() => undefined);
    await writeJsonFile(attachmentsPath, {
      id: item.id || "",
      subject: item.subject || "",
      attachments: emailReadableExport(item).attachments,
    });
    index.push({
      id: item.id || "",
      subject: item.subject || "",
      status: item.status || "",
      parsedJson: normalizePathForManifest(path.relative(destination, parsedPath)),
      originalEml: normalizePathForManifest(path.relative(destination, emlPath)),
      attachments: normalizePathForManifest(path.relative(destination, attachmentsPath)),
      sha256: {
        parsedJson: await sha256File(parsedPath),
        originalEml: await sha256File(emlPath),
        attachments: await sha256File(attachmentsPath),
      },
    });
  }
  await writeJsonFile(path.join(destination, "import-log.json"), {
    createdAt: isoNow(),
    count: index.length,
    emails: index,
  });
}

async function createBackup(args, overrides = {}) {
  const options = { ...backupOptions(args), ...overrides };
  const label = overrides.label || argValue(args, "--label", "manual");
  const backupId = `${nowStamp()}-${label}`.replace(/[^a-zA-Z0-9_.-]+/g, "-");
  const backupRoot = path.resolve(options.backupDir);
  const backupPath = path.join(backupRoot, backupId);
  const editorStorePath = path.join(options.dataDir, "editor-store.json");
  const mediaPath = path.join(options.dataDir, "media");
  const skipped = [];
  const items = [];

  if (await exists(backupPath)) {
    throw new Error(`Backup already exists: ${backupPath}`);
  }

  const editorStoreText = await fs.readFile(editorStorePath, "utf8");
  const editorStore = JSON.parse(editorStoreText);
  const storeCounts = countStoreData(editorStore);

  await ensureBackupCategoryDirs(backupRoot);
  await ensurePrivateDir(backupPath);

  await fs.copyFile(editorStorePath, path.join(backupPath, "editor-store.json"));
  await fs.chmod(path.join(backupPath, "editor-store.json"), 0o600).catch(() => undefined);
  await writeJsonFile(path.join(backupPath, "story-metadata.json"), storyMetadataSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "guide-content.json"), guideSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "homepage-guide-visibility.json"), homepageGuideVisibilitySnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "uploaded-media-records.json"), mediaMetadataSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "email-imports.json"), emailImportsSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "scraped-story-queue.json"), scrapedStoryQueueSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "homepage-settings.json"), homepageSettingsSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "analytics-settings.json"), analyticsSettingsSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "video-metadata.json"), videoMetadataSnapshot(editorStore));
  await writeJsonFile(path.join(backupPath, "gallery-metadata.json"), galleryMetadataSnapshot(editorStore));
  await writeReadableStoryBackups(editorStore, path.join(backupPath, "stories"));
  await writeReadableStoryBackups(editorStore, path.join(backupRoot, "stories", backupId));
  await writeReadableEmailBackups(editorStore, path.join(backupPath, "emails"));
  await writeReadableEmailBackups(editorStore, path.join(backupRoot, "emails", backupId));

  if (await exists(mediaPath)) {
    await fs.cp(mediaPath, path.join(backupPath, "media"), {
      dereference: false,
      preserveTimestamps: true,
      recursive: true,
    });
  } else {
    skipped.push({ kind: "media", path: mediaPath, reason: "Media directory does not exist." });
  }

  await copyPrivateConfig({
    backupPath,
    configPaths: [
      ...parseConfigPaths(args),
      path.join(options.dataDir, "instagram-credentials.json"),
      path.join(options.dataDir, "instagram-sync-log.json"),
    ],
    skipped,
  });

  await addManifestItems({
    items,
    kind: "editor-store",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "editor-store.json",
  });
  await addManifestItems({
    items,
    kind: "story-metadata",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "story-metadata.json",
  });
  await addManifestItems({
    items,
    kind: "guide-content",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "guide-content.json",
  });
  await addManifestItems({
    items,
    kind: "homepage-guide-visibility",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "homepage-guide-visibility.json",
  });
  await addManifestItems({
    items,
    kind: "uploaded-media-records",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "uploaded-media-records.json",
  });
  await addManifestItems({
    items,
    kind: "email-imports",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "email-imports.json",
  });
  await addManifestItems({
    items,
    kind: "scraped-story-queue",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "scraped-story-queue.json",
  });
  await addManifestItems({
    items,
    kind: "homepage-settings",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "homepage-settings.json",
  });
  await addManifestItems({
    items,
    kind: "analytics-settings",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "analytics-settings.json",
  });
  await addManifestItems({
    items,
    kind: "video-metadata",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "video-metadata.json",
  });
  await addManifestItems({
    items,
    kind: "gallery-metadata",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "gallery-metadata.json",
  });
  await addManifestItems({
    items,
    kind: "story-readable-exports",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "stories",
  });
  await addManifestItems({
    items,
    kind: "email-readable-exports",
    sourceRoot: options.dataDir,
    backupRoot: backupPath,
    backupSubdir: "emails",
  });
  await addManifestItems({
    items,
    kind: "media",
    sourceRoot: mediaPath,
    backupRoot: backupPath,
    backupSubdir: "media",
  });
  await addManifestItems({
    items,
    kind: "private-config",
    sourceRoot: "/",
    backupRoot: backupPath,
    backupSubdir: "private-config",
  });

  const totals = items.reduce(
    (next, item) => ({
      bytes: next.bytes + item.size,
      files: next.files + 1,
      mediaFiles: next.mediaFiles + (item.kind === "media" ? 1 : 0),
      privateConfigFiles: next.privateConfigFiles + (item.kind === "private-config" ? 1 : 0),
    }),
    { bytes: 0, files: 0, mediaFiles: 0, privateConfigFiles: 0 }
  );

  const manifest = {
    schemaVersion: 4,
    backupId,
    createdAt: isoNow(),
    host: os.hostname(),
    dataDir: options.dataDir,
    appDir: options.appDir,
    backupDir: backupRoot,
    backupPath,
    editorStorePath,
    mediaPath,
    storeCounts,
    totals,
    skipped,
    items,
  };

  await writeJsonFile(path.join(backupPath, manifestFileName), manifest);
  const manifestHash = await sha256File(path.join(backupPath, manifestFileName));
  await fs.writeFile(path.join(backupPath, manifestHashFileName), `${manifestHash}  ${manifestFileName}\n`, "utf8");
  await fs.chmod(path.join(backupPath, manifestHashFileName), 0o600).catch(() => undefined);

  return manifest;
}

async function listBackups(backupDir) {
  if (!await exists(backupDir)) return [];
  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const backupPath = path.join(backupDir, entry.name);
    const manifestPath = path.join(backupPath, manifestFileName);
    if (!await exists(manifestPath)) continue;
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      backups.push({
        backupId: manifest.backupId || entry.name,
        backupPath,
        createdAt: manifest.createdAt || "",
        storeCounts: manifest.storeCounts || {},
        totals: manifest.totals || {},
      });
    } catch {
      backups.push({
        backupId: entry.name,
        backupPath,
        createdAt: "",
        storeCounts: {},
        totals: {},
        unreadable: true,
      });
    }
  }

  return backups.sort((a, b) => String(b.createdAt || b.backupId).localeCompare(String(a.createdAt || a.backupId)));
}

async function listCompatibleBackups(options) {
  const dirs = options.explicitBackupDir
    ? [options.backupDir]
    : [options.backupDir, ...legacyBackupDirs];
  const uniqueDirs = [...new Set(dirs.map((dir) => path.resolve(dir)))];
  const backups = [];
  for (const dir of uniqueDirs) {
    backups.push(...await listBackups(dir));
  }
  return backups.sort((a, b) => String(b.createdAt || b.backupId).localeCompare(String(a.createdAt || a.backupId)));
}

async function resolveBackupPath(args, backupDir) {
  const options = backupOptions(args);
  const requested = argValue(args, "--backup", "latest");
  if (requested && requested !== "latest") {
    return path.isAbsolute(requested) ? requested : path.join(backupDir, requested);
  }

  const backups = await listCompatibleBackups(options);
  if (backups.length === 0) {
    throw new Error(`No backups found in ${backupDir}${options.explicitBackupDir ? "" : ` or ${legacyBackupDirs.join(", ")}`}`);
  }
  return backups[0].backupPath;
}

async function readManifest(backupPath) {
  return JSON.parse(await fs.readFile(path.join(backupPath, manifestFileName), "utf8"));
}

async function verifyBackup(args, overrides = {}) {
  const options = { ...backupOptions(args), ...overrides };
  const backupPath = overrides.backupPath || await resolveBackupPath(args, options.backupDir);
  const errors = [];
  const warnings = [];
  let manifest = null;

  try {
    manifest = await readManifest(backupPath);
  } catch (error) {
    return {
      ok: false,
      backupPath,
      errors: [`Could not read manifest: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
      manifest: null,
    };
  }

  const manifestPath = path.join(backupPath, manifestFileName);
  const manifestHashPath = path.join(backupPath, manifestHashFileName);
  if (await exists(manifestHashPath)) {
    const expectedHash = (await fs.readFile(manifestHashPath, "utf8")).trim().split(/\s+/)[0];
    const actualHash = await sha256File(manifestPath);
    if (expectedHash !== actualHash) {
      errors.push("Manifest SHA256 does not match manifest.sha256.");
    }
  } else {
    warnings.push("manifest.sha256 is missing.");
  }

  const requiredKinds = [
    "editor-store",
    "story-metadata",
    "guide-content",
    "uploaded-media-records",
    "email-imports",
    "scraped-story-queue",
    "homepage-settings",
    "video-metadata",
    "media",
  ];
  if (Number(manifest.schemaVersion || 1) >= 2) requiredKinds.push("gallery-metadata");
  if (Number(manifest.schemaVersion || 1) >= 3) requiredKinds.push("analytics-settings");
  if (Number(manifest.schemaVersion || 1) >= 4) requiredKinds.push("story-readable-exports", "email-readable-exports");
  const presentKinds = new Set((manifest.items || []).map((item) => item.kind));
  for (const kind of requiredKinds) {
    if (!presentKinds.has(kind)) {
      errors.push(`Backup manifest is missing required coverage item: ${kind}.`);
    }
  }

  for (const item of manifest.items || []) {
    const itemPath = path.join(backupPath, item.relativePath);
    try {
      const stat = await fs.stat(itemPath);
      if (stat.size !== item.size) {
        errors.push(`${item.relativePath} size mismatch: expected ${item.size}, found ${stat.size}.`);
      }
      const hash = await sha256File(itemPath);
      if (hash !== item.sha256) {
        errors.push(`${item.relativePath} SHA256 mismatch.`);
      }
    } catch (error) {
      errors.push(`${item.relativePath} missing or unreadable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    const storeText = await fs.readFile(path.join(backupPath, "editor-store.json"), "utf8");
    const parsed = JSON.parse(storeText);
    if (!Array.isArray(parsed.stories)) {
      errors.push("editor-store.json does not contain a stories array.");
    }
  } catch (error) {
    errors.push(`editor-store.json could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    ok: errors.length === 0,
    backupPath,
    errors,
    warnings,
    manifest,
  };
}

async function currentStoreCounts(dataDir) {
  const storePath = path.join(dataDir, "editor-store.json");
  try {
    const parsed = JSON.parse(await fs.readFile(storePath, "utf8"));
    return countStoreData(parsed);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function restorePlan(args) {
  const options = backupOptions(args);
  const verification = await verifyBackup(args, options);
  const manifest = verification.manifest;
  const targetStore = path.join(options.dataDir, "editor-store.json");
  const targetMedia = path.join(options.dataDir, "media");
  const plan = {
    createdAt: isoNow(),
    okToApply: verification.ok,
    backupPath: verification.backupPath,
    backupId: manifest?.backupId || "",
    dataDir: options.dataDir,
    verification: {
      ok: verification.ok,
      errors: verification.errors,
      warnings: verification.warnings,
    },
    currentStoreCounts: await currentStoreCounts(options.dataDir),
    backupStoreCounts: manifest?.storeCounts || {},
    actions: [
      "Verify the selected backup manifest and file SHA256 values.",
      `Create a fresh pre-restore backup in ${options.backupDir}.`,
      `Replace ${targetStore} atomically from ${path.join(verification.backupPath, "editor-store.json")}.`,
      `Replace ${targetMedia} from ${path.join(verification.backupPath, "media")} using a staging directory and preserved pre-restore copy.`,
      "Do not restore private config automatically; review private-config files manually if needed.",
    ],
    applyCommand: `npm run restore:apply -- --backup ${shellQuote(verification.backupPath)} --confirm-restore`,
  };

  if (hasArg(args, "--write-plan")) {
    const plansDir = path.join(options.backupDir, "restore-plans");
    await ensurePrivateDir(plansDir);
    const planPath = path.join(plansDir, `restore-plan-${nowStamp()}.json`);
    await writeJsonFile(planPath, plan);
    plan.planPath = planPath;
  }

  return plan;
}

async function atomicCopyFile(sourcePath, destinationPath) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  const tempPath = `${destinationPath}.${process.pid}.${Date.now()}.restore-tmp`;
  await fs.copyFile(sourcePath, tempPath);
  JSON.parse(await fs.readFile(tempPath, "utf8"));
  await fs.rename(tempPath, destinationPath);
  await fs.chmod(destinationPath, 0o600).catch(() => undefined);
}

async function restoreApply(args) {
  if (!hasArg(args, "--confirm-restore")) {
    throw new Error("Refusing to restore without --confirm-restore. Run restore:plan first.");
  }

  const options = backupOptions(args);
  const verification = await verifyBackup(args, options);
  if (!verification.ok) {
    throw new Error(`Refusing to restore because backup verification failed: ${verification.errors.join(" ")}`);
  }

  const preRestoreBackup = await createBackup(args, {
    ...options,
    label: `pre-restore-${nowStamp()}`,
  });

  const stamp = nowStamp();
  const backupPath = verification.backupPath;
  const targetStore = path.join(options.dataDir, "editor-store.json");
  const targetMedia = path.join(options.dataDir, "media");
  const backupMedia = path.join(backupPath, "media");
  const mediaStaging = path.join(options.dataDir, `.media-restore-${stamp}.tmp`);
  const mediaPreserved = `${targetMedia}.pre-restore-${stamp}`;

  await atomicCopyFile(path.join(backupPath, "editor-store.json"), targetStore);

  if (await exists(backupMedia)) {
    await fs.rm(mediaStaging, { force: true, recursive: true });
    await fs.cp(backupMedia, mediaStaging, {
      dereference: false,
      preserveTimestamps: true,
      recursive: true,
    });
    if (await exists(targetMedia)) {
      await fs.rename(targetMedia, mediaPreserved);
    }
    await fs.rename(mediaStaging, targetMedia);
  }

  const record = {
    type: "restore",
    restoredAt: isoNow(),
    backupPath,
    preRestoreBackupPath: preRestoreBackup.backupPath,
    dataDir: options.dataDir,
    mediaPreserved: await exists(mediaPreserved) ? mediaPreserved : "",
  };
  await appendJsonLine(path.join(options.backupDir, restoreHistoryFileName), record);
  return record;
}

async function appendDeployHistory(args) {
  const options = backupOptions(args);
  const encoded = argValue(args, "--append-base64");
  if (!encoded) throw new Error("Missing --append-base64 deployment record.");
  const record = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  await appendJsonLine(path.join(options.backupDir, deployHistoryFileName), record);
  return record;
}

async function readDeployHistory(backupDir) {
  return readJsonLines(path.join(backupDir, deployHistoryFileName));
}

async function rollback(args) {
  const options = backupOptions(args);
  const history = await readDeployHistory(options.backupDir);
  const requestedId = argValue(args, "--deployment", "");
  const record = requestedId
    ? history.find((item) => item.deploymentId === requestedId)
    : [...history].reverse().find((item) => item.appSnapshotPath);

  if (!record) {
    throw new Error("No deployment history record with an app snapshot was found.");
  }

  const plan = {
    createdAt: isoNow(),
    deploymentId: record.deploymentId,
    appSnapshotPath: record.appSnapshotPath,
    appDir: argValue(args, "--app-dir", record.appDir || options.appDir),
    dataBackupPath: record.backupPath,
    dataRollback: "Not automatic. Use restore:plan and restore:apply if live story data also needs to be restored.",
    command: `rsync -a --delete --exclude='.oldseadogs-data' --exclude='node_modules' ${shellQuote(`${record.appSnapshotPath}/`)} ${shellQuote(`${record.appDir || options.appDir}/`)}`,
  };

  if (!hasArg(args, "--apply")) return plan;
  if (!hasArg(args, "--confirm-rollback")) {
    throw new Error("Refusing to roll back app code without --confirm-rollback.");
  }
  if (!await exists(record.appSnapshotPath)) {
    throw new Error(`App snapshot does not exist: ${record.appSnapshotPath}`);
  }

  await runCommand("rsync", [
    "-a",
    "--delete",
    "--exclude=.oldseadogs-data",
    "--exclude=node_modules",
    `${record.appSnapshotPath}/`,
    `${plan.appDir}/`,
  ]);

  if (hasArg(args, "--restart")) {
    const pm2Name = argValue(args, "--pm2-name", defaultPm2Name);
    await runCommand("pm2", ["reload", pm2Name, "--update-env"]);
  }

  return {
    ...plan,
    appliedAt: isoNow(),
  };
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let stdout = "";
    let stderr = "";
    if (options.capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stdout}\n${stderr}`));
      }
    });
  });
}

async function findLocalRuntimeData(sourceDir) {
  const forbidden = [];
  const skipDirs = new Set([
    ".git",
    ".next",
    ".wrangler",
    "dist",
    "node_modules",
    "outputs",
    "work",
  ]);

  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (skipDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = normalizePathForManifest(path.relative(sourceDir, fullPath));

      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile()) {
        const inRuntimeDir =
          relativePath.startsWith(".oldseadogs-data/") ||
          relativePath.startsWith("oldseadogs-data/") ||
          relativePath.startsWith("var/www/oldseadogs-data/");
        const looksLikeStore = entry.name === "editor-store.json";
        if (inRuntimeDir || looksLikeStore) {
          forbidden.push(relativePath);
        }
      }
    }
  }

  await visit(sourceDir);
  return forbidden;
}

function parseDeployTarget(target) {
  const match = String(target || "").match(/^([^:]+):(.+)$/);
  if (!match) {
    throw new Error("Deploy target must look like oldseadogs@161.35.168.184:/var/www/oldseadogs");
  }
  return {
    sshHost: match[1],
    appDir: match[2].replace(/\/+$/, ""),
  };
}

function rsyncArgs({ dryRun, sourceDir, target }) {
  const args = [
    "-az",
    "--delete",
    "--itemize-changes",
  ];
  if (dryRun) args.push("--dry-run");
  for (const item of [...rsyncRuntimeExcludes, ...rsyncBuildExcludes]) {
    args.push(`--exclude=${item}`);
  }
  args.push(`${sourceDir.replace(/\/+$/, "")}/`, target);
  return args;
}

function dangerousRsyncOutput(output) {
  return output
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const path = line.replace(/^\S+\s+/, "");

      return (
        path === "editor-store.json" ||
        (path.endsWith("/editor-store.json") &&
         path !== "tests/fixtures/bridge-safety-editor-store.json") ||
        path.includes(".oldseadogs-data") ||
        path.includes("oldseadogs-data")
      );
    });
}

async function remoteNodeJson({ sshHost, remoteScript, command, args = [] }) {
  const result = await runCommand("ssh", [sshHost, "node", remoteScript, command, "--json", ...args], { capture: true });
  return JSON.parse(result.stdout);
}

async function remoteShell({ sshHost, shell }) {
  return runCommand("ssh", [sshHost, shell], { capture: true });
}

async function deploySafe(args) {
  const apply = hasArg(args, "--apply");
  const sourceDir = process.cwd();
  const target = argValue(args, "--target", process.env.OLDSEADOGS_DEPLOY_TARGET || "");
  const remoteDataDir = argValue(args, "--data-dir", defaultDataDir);
  const remoteBackupDir = argValue(args, "--backup-dir", process.env.OLDSEADOGS_BACKUP_DIR || defaultBackupDir);
  const pm2Name = argValue(args, "--pm2-name", defaultPm2Name);
  const forbidden = await findLocalRuntimeData(sourceDir);

  if (forbidden.length > 0) {
    throw new Error(`Refusing to deploy because local runtime data is present: ${forbidden.slice(0, 20).join(", ")}`);
  }

  if (!target) {
    return {
      ok: false,
      dryRun: true,
      message: "No deploy target supplied. Set OLDSEADOGS_DEPLOY_TARGET or pass --target oldseadogs@161.35.168.184:/var/www/oldseadogs.",
      excludes: rsyncRuntimeExcludes,
    };
  }

  const parsedTarget = parseDeployTarget(target);
  const deploymentId = `deploy-${nowStamp()}`;
  const remoteTempScript = `/tmp/oldseadogs-ops-${process.pid}-${Date.now()}.mjs`;
  const localScript = fileURLToPath(import.meta.url);
  const appSnapshotPath = `${remoteBackupDir}/app-snapshots/${deploymentId}`;

  if (!apply) {
    const dryRun = await runCommand("rsync", rsyncArgs({ dryRun: true, sourceDir, target }), { capture: true });
    const dangerous = dangerousRsyncOutput(dryRun.stdout);
    return {
      ok: dangerous.length === 0,
      dryRun: true,
      target,
      deploymentId,
      excludes: rsyncRuntimeExcludes,
      dangerous,
      message: dangerous.length
        ? "Dry run found runtime data in rsync output. Fix exclusions before using --apply."
        : "Dry run passed. Use --apply to create a verified backup and deploy.",
    };
  }

  await runCommand("scp", [localScript, `${parsedTarget.sshHost}:${remoteTempScript}`]);

  try {
    const backup = await remoteNodeJson({
      sshHost: parsedTarget.sshHost,
      remoteScript: remoteTempScript,
      command: "backup:create",
      args: [
        "--data-dir",
        remoteDataDir,
        "--backup-dir",
        remoteBackupDir,
        "--app-dir",
        parsedTarget.appDir,
        "--label",
        `pre-deploy-${deploymentId}`,
      ],
    });

    const verification = await remoteNodeJson({
      sshHost: parsedTarget.sshHost,
      remoteScript: remoteTempScript,
      command: "backup:verify",
      args: [
        "--backup",
        backup.backupPath,
        "--backup-dir",
        remoteBackupDir,
      ],
    });

    if (!verification.ok) {
      throw new Error(`Remote backup verification failed: ${verification.errors.join(" ")}`);
    }

    await remoteShell({
      sshHost: parsedTarget.sshHost,
      shell: [
        `mkdir -p ${shellQuote(appSnapshotPath)}`,
        "&&",
        "rsync -a --delete --exclude='.oldseadogs-data' --exclude='node_modules' --exclude='logs/*.log'",
        `${shellQuote(`${parsedTarget.appDir}/`)} ${shellQuote(`${appSnapshotPath}/`)}`,
      ].join(" "),
    });

    const dryRun = await runCommand("rsync", rsyncArgs({ dryRun: true, sourceDir, target }), { capture: true });
    const dangerous = dangerousRsyncOutput(dryRun.stdout);
    if (dangerous.length > 0) {
      throw new Error(`Refusing to deploy because rsync dry-run included runtime data: ${dangerous.join(", ")}`);
    }

    await runCommand("rsync", rsyncArgs({ dryRun: false, sourceDir, target }));

    const postDeployShell = [
      `test -r ${shellQuote(defaultEnvironmentFile)}`,
      "&& set -a",
      `&& . ${shellQuote(defaultEnvironmentFile)}`,
      "&& set +a",
      `&& cd ${shellQuote(parsedTarget.appDir)}`,
      "&& npm ci --include=dev",
      `&& npm run check:storage -- --store ${shellQuote(path.posix.join(remoteDataDir, "editor-store.json"))}`,
      "&& npm run check:bridge",
      "&& npm run check:controlled-media",
      "&& npm run build:do",
      `&& (pm2 reload ${shellQuote(pm2Name)} --update-env || pm2 reload oldseadogs-web --update-env)`,
      "&& pm2 save",
      `&& npm run check:stories -- --before ${shellQuote(path.posix.join(backup.backupPath, "editor-store.json"))} --after ${shellQuote(path.posix.join(remoteDataDir, "editor-store.json"))} --base-url http://127.0.0.1:3000`,
    ].join(" ");
    await remoteShell({ sshHost: parsedTarget.sshHost, shell: postDeployShell });

    const record = {
      type: "deploy",
      deploymentId,
      deployedAt: isoNow(),
      target,
      appDir: parsedTarget.appDir,
      dataDir: remoteDataDir,
      backupPath: backup.backupPath,
      backupId: backup.backupId,
      appSnapshotPath,
      sourceHost: os.hostname(),
      sourceDir,
      pm2Name,
    };
    const encodedRecord = Buffer.from(JSON.stringify(record), "utf8").toString("base64url");
    await remoteNodeJson({
      sshHost: parsedTarget.sshHost,
      remoteScript: remoteTempScript,
      command: "deploy:history",
      args: [
        "--backup-dir",
        remoteBackupDir,
        "--append-base64",
        encodedRecord,
      ],
    });

    return {
      ok: true,
      ...record,
      backupVerified: true,
      rollbackCommand: `npm run rollback -- --deployment ${deploymentId}`,
      dataRestorePlanCommand: `npm run restore:plan -- --backup ${backup.backupPath}`,
    };
  } finally {
    await remoteShell({
      sshHost: parsedTarget.sshHost,
      shell: `rm -f ${shellQuote(remoteTempScript)}`,
    }).catch(() => undefined);
  }
}

function printBackupList(backups) {
  if (backups.length === 0) {
    console.log("No OldSeaDogs backups found.");
    return;
  }
  console.table(backups.map((backup) => ({
    id: backup.backupId,
    createdAt: backup.createdAt,
    stories: backup.storeCounts?.stories ?? "",
    mediaFiles: backup.totals?.mediaFiles ?? "",
    path: backup.backupPath,
  })));
}

function printVerification(result) {
  console.log(result.ok ? "Backup verification passed." : "Backup verification failed.");
  console.log(`Backup: ${result.backupPath}`);
  if (result.manifest?.storeCounts) {
    console.table(result.manifest.storeCounts);
  }
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
  for (const error of result.errors) console.error(`Error: ${error}`);
}

function printRestorePlan(plan) {
  console.log(plan.okToApply ? "Restore plan is ready." : "Restore plan is blocked.");
  console.log(`Backup: ${plan.backupPath}`);
  console.log(`Data dir: ${plan.dataDir}`);
  console.log("Actions:");
  for (const action of plan.actions) console.log(`- ${action}`);
  if (plan.verification.errors.length > 0) {
    console.log("Verification errors:");
    for (const error of plan.verification.errors) console.log(`- ${error}`);
  }
  console.log(`Apply command: ${plan.applyCommand}`);
  if (plan.planPath) console.log(`Plan written: ${plan.planPath}`);
}

function printHistory(records) {
  if (records.length === 0) {
    console.log("No deployment history found.");
    return;
  }
  console.table(records.slice(-20).reverse().map((record) => ({
    deploymentId: record.deploymentId,
    deployedAt: record.deployedAt,
    backupPath: record.backupPath,
    appSnapshotPath: record.appSnapshotPath,
  })));
}

function printHelp() {
  console.log(`OldSeaDogs operations commands

  backup:list      List backups in /var/www/Oldseadogsbackups and compatible legacy backup dirs
  backup:create    Create a timestamped backup with SHA256 manifest
  backup:verify    Verify a backup manifest and file hashes
  restore:plan     Show a restore plan without changing data
  restore:apply    Apply a verified restore; requires --confirm-restore
  rollback         Plan or apply an app rollback from deploy history
  deploy:history   List or append deployment history
  deploy:safe      Verified backup + rsync deploy wrapper; --apply required to deploy
`);
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  const options = backupOptions(args);

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "backup:list") {
    const backups = await listCompatibleBackups(options);
    if (options.json) console.log(JSON.stringify(backups, null, 2));
    else printBackupList(backups);
    return;
  }

  if (command === "backup:create") {
    const manifest = await createBackup(args);
    if (options.json) console.log(JSON.stringify(manifest, null, 2));
    else {
      console.log("Backup created.");
      console.log(`Backup: ${manifest.backupPath}`);
      console.table({ ...manifest.storeCounts, files: manifest.totals.files, bytes: manifest.totals.bytes });
    }
    return;
  }

  if (command === "backup:verify") {
    const result = await verifyBackup(args);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else printVerification(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (command === "restore:plan") {
    const plan = await restorePlan(args);
    if (options.json) console.log(JSON.stringify(plan, null, 2));
    else printRestorePlan(plan);
    if (!plan.okToApply) process.exitCode = 1;
    return;
  }

  if (command === "restore:apply") {
    const record = await restoreApply(args);
    if (options.json) console.log(JSON.stringify(record, null, 2));
    else {
      console.log("Restore applied.");
      console.log(`Restored from: ${record.backupPath}`);
      console.log(`Pre-restore backup: ${record.preRestoreBackupPath}`);
    }
    return;
  }

  if (command === "rollback") {
    const plan = await rollback(args);
    if (options.json) console.log(JSON.stringify(plan, null, 2));
    else {
      console.log(hasArg(args, "--apply") ? "Rollback applied." : "Rollback plan only.");
      console.log(JSON.stringify(plan, null, 2));
    }
    return;
  }

  if (command === "deploy:history") {
    if (hasArg(args, "--append-base64")) {
      const record = await appendDeployHistory(args);
      if (options.json) console.log(JSON.stringify(record, null, 2));
      else console.log(`Deployment history written: ${record.deploymentId}`);
      return;
    }
    const history = await readDeployHistory(options.backupDir);
    if (options.json) console.log(JSON.stringify(history, null, 2));
    else printHistory(history);
    return;
  }

  if (command === "deploy:safe") {
    const result = await deploySafe(args);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown OldSeaDogs operations command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
