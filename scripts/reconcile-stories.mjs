#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const publicSections = [
  "/",
  "/news",
  "/shows",
  "/races",
  "/reviews",
  "/gear",
  "/destinations",
  "/masterclass",
  "/lifestyle",
  "/clubs",
  "/ports",
  "/archive",
];

const sectionRoutes = new Map([
  ["news", "/news"],
  ["shows", "/shows"],
  ["races", "/races"],
  ["racing", "/races"],
  ["regattas", "/races"],
  ["reviews", "/reviews"],
  ["boat reviews", "/reviews"],
  ["gear", "/gear"],
  ["destinations", "/destinations"],
  ["masterclass", "/masterclass"],
  ["lifestyle", "/lifestyle"],
  ["clubs", "/clubs"],
  ["ports", "/ports"],
]);

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function hasArg(name) {
  return process.argv.includes(name);
}

function cleanBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\)$/, "")
    .replace(/\/+$/, "");
}

function defaultStorePath() {
  const dataDir = process.env.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  return path.join(dataDir, "editor-store.json");
}

function nowStamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function countStatuses(stories) {
  const counts = { total: stories.length, published: 0, scheduled: 0, draft: 0, unpublished: 0, missingOrUnknown: 0 };
  for (const story of stories) {
    if (story.status === "published") counts.published += 1;
    else if (story.status === "scheduled") counts.scheduled += 1;
    else if (story.status === "draft") counts.draft += 1;
    else if (story.status === "unpublished") counts.unpublished += 1;
    else counts.missingOrUnknown += 1;
  }
  return counts;
}

function normalizeCategory(category) {
  const raw = String(category || "News").trim();
  const key = raw.toLowerCase();
  if (key === "racing" || key === "regattas") return "Races";
  if (key === "boat reviews") return "Reviews";
  return raw || "News";
}

function sectionRoute(story) {
  return sectionRoutes.get(normalizeCategory(story.category).toLowerCase()) || "";
}

function storyPath(story) {
  return story.slug ? `/stories/${story.slug}` : "";
}

function fallbackPublishedAt(story) {
  if (story.publishedAt) return story.publishedAt;
  if (story.updatedAt) return story.updatedAt;
  if (story.createdAt) return story.createdAt;
  if (story.date) return `${story.date}T12:00:00.000Z`;
  return new Date().toISOString();
}

function textNeedle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function pageMatchesStory(text, story) {
  const haystack = textNeedle(text);
  const title = textNeedle(story.title);
  const slug = textNeedle(story.slug);
  return Boolean((title && haystack.includes(title.slice(0, 80))) || (slug && haystack.includes(slug)));
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  return {
    status: response.status,
    url: response.url,
    text: await response.text().catch(() => ""),
  };
}

async function fetchPublicPages(baseUrl) {
  const pages = new Map();
  await Promise.all(
    publicSections.map(async (route) => {
      try {
        pages.set(route, await fetchText(`${baseUrl}${route}`));
      } catch (error) {
        pages.set(route, { status: `error: ${error instanceof Error ? error.message : String(error)}`, text: "" });
      }
    })
  );
  return pages;
}

function pageContainsPath(page, pathValue) {
  if (!page?.text || !pathValue) return false;
  return page.text.includes(pathValue) || page.text.includes(pathValue.replace(/^\//, ""));
}

async function loadStaticStoryIndex() {
  const byId = new Map();
  const bySlug = new Map();

  try {
    const legacyPath = path.join(process.cwd(), "content", "legacy-stories.json");
    const legacy = JSON.parse(await fs.readFile(legacyPath, "utf8"));
    if (Array.isArray(legacy)) {
      for (const story of legacy) {
        const record = {
          source: "legacy-stories.json",
          id: String(story.id || ""),
          slug: String(story.slug || ""),
          title: String(story.title || ""),
          category: String(story.category || ""),
        };
        if (record.id) byId.set(record.id, record);
        if (record.slug) bySlug.set(record.slug, record);
      }
    }
  } catch {
    // Static legacy content is optional in small development copies.
  }

  try {
    const seedPath = path.join(process.cwd(), "content", "stories.ts");
    const seedText = await fs.readFile(seedPath, "utf8");
    const storyBlocks = seedText.match(/\{[\s\S]*?slug:\s*"[^"]+"[\s\S]*?\}/g) || [];
    for (const block of storyBlocks) {
      const slug = block.match(/slug:\s*"([^"]+)"/)?.[1] || "";
      if (!slug) continue;
      const record = {
        source: "content/stories.ts",
        id: `seed_${slug}`,
        slug,
        title: block.match(/title:\s*"([^"]+)"/)?.[1] || "",
        category: block.match(/category:\s*"([^"]+)"/)?.[1] || "",
      };
      byId.set(record.id, record);
      bySlug.set(record.slug, record);
    }
  } catch {
    // Seed content is optional in some deployment bundles.
  }

  return { byId, bySlug };
}

function isSourceWatchDraft(story) {
  const sourceType = String(story.sourceType || "").toLowerCase();
  return story.status === "draft" && (sourceType.includes("automatic") || sourceType.includes("source watch"));
}

function repairEvidenceForStory(story, staticIndex, publicEvidence) {
  const evidence = [...publicEvidence];
  const staticById = story.id ? staticIndex.byId.get(story.id) : null;
  const staticBySlug = story.slug ? staticIndex.bySlug.get(story.slug) : null;
  const previousPublishedAt = Boolean(String(story.publishedAt || "").trim());
  const homepageFeatured = Boolean(story.isFeatured);

  if (staticById) evidence.push(`matches static story id in ${staticById.source}`);
  else if (staticBySlug) evidence.push(`matches static story slug in ${staticBySlug.source}`);
  if (previousPublishedAt) evidence.push("has previous publishedAt");
  if (homepageFeatured) evidence.push("has homepage featured flag");

  const staticMatch = Boolean(staticById || staticBySlug);
  const publicRouteProof = publicEvidence.length > 0;
  const eligible =
    staticMatch ||
    previousPublishedAt ||
    homepageFeatured ||
    publicRouteProof;
  const blockedScrapedDraft = isSourceWatchDraft(story) && !staticMatch && !previousPublishedAt && !homepageFeatured && !publicRouteProof;

  return {
    evidence,
    staticMatch,
    previousPublishedAt,
    homepageFeatured,
    publicRouteProof,
    blockedScrapedDraft,
    eligible: eligible && !blockedScrapedDraft,
  };
}

async function inspectStory(baseUrl, pages, staticIndex, story) {
  const pathValue = storyPath(story);
  const route = sectionRoute(story);
  const homepage = pages.get("/");
  const section = route ? pages.get(route) : null;
  const archive = pages.get("/archive");
  const evidence = [];
  let directStatus = "not checked";
  let directTitleMatch = false;

  if (pathValue) {
    try {
      const direct = await fetchText(`${baseUrl}${pathValue}`);
      directStatus = direct.status;
      directTitleMatch = direct.status === 200 && pageMatchesStory(direct.text, story);
      if (directStatus === 200 && directTitleMatch) evidence.push("direct public URL returned 200 and matched title/slug");
      else if (directStatus === 200) evidence.push("direct public URL returned 200 but title/slug match was weak");
    } catch (error) {
      directStatus = `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  const homepageContains = pageContainsPath(homepage, pathValue);
  const sectionContains = pageContainsPath(section, pathValue);
  const archiveContains = pageContainsPath(archive, pathValue);
  if (homepageContains) evidence.push("homepage contains story link");
  if (sectionContains) evidence.push(`${route} contains story link`);
  if (archiveContains) evidence.push("archive contains story link");

  const provenPublic = Boolean((directStatus === 200 && directTitleMatch) || homepageContains || sectionContains || archiveContains);
  const repairEvidence = repairEvidenceForStory(story, staticIndex, evidence);
  const shouldMarkPublished = story.status !== "published" && repairEvidence.eligible;
  return {
    title: story.title || "Untitled story",
    slug: story.slug || "",
    id: story.id || "",
    status: story.status || "missing",
    category: normalizeCategory(story.category),
    route,
    directStatus,
    directTitleMatch,
    homepageContains,
    sectionContains,
    archiveContains,
    provenPublic,
    staticMatch: repairEvidence.staticMatch,
    previousPublishedAt: repairEvidence.previousPublishedAt,
    homepageFeatured: repairEvidence.homepageFeatured,
    blockedScrapedDraft: repairEvidence.blockedScrapedDraft,
    evidence: repairEvidence.evidence,
    action: shouldMarkPublished ? "mark published" : "leave unchanged",
  };
}

async function main() {
  const storePath = argValue("--store") || defaultStorePath();
  const baseUrl = cleanBaseUrl(argValue("--base-url") || process.env.OLDSEADOGS_VERIFY_BASE_URL || "");
  const repair = hasArg("--repair");
  const dryRun = hasArg("--dry-run") || !repair;
  const jsonOnly = hasArg("--json");

  if (!baseUrl) {
    console.error("Missing --base-url. Example: --base-url https://oldseadogs.com");
    process.exitCode = 2;
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(storePath, "utf8"));
  } catch (error) {
    console.error(`Could not read story store: ${storePath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
    return;
  }

  const stories = Array.isArray(parsed.stories) ? parsed.stories : [];
  const before = countStatuses(stories);
  const staticIndex = await loadStaticStoryIndex();
  const pages = await fetchPublicPages(baseUrl);
  const inspected = [];

  for (const story of stories) {
    inspected.push(await inspectStory(baseUrl, pages, staticIndex, story));
  }

  const toRepair = inspected.filter((item) => item.action === "mark published");
  const repairedStories = stories.map((story) => {
    const match = toRepair.find((item) => item.id === story.id);
    if (!match) return story;
    return {
      ...story,
      status: "published",
      publishedAt: story.publishedAt || fallbackPublishedAt(story),
      scheduledPublishAt: "",
      updatedAt: new Date().toISOString(),
    };
  });
  const after = countStatuses(repairedStories);
  let backupPath = "";

  if (repair && toRepair.length) {
    backupPath = `${storePath}.backup-${nowStamp()}`;
    await fs.copyFile(storePath, backupPath);
    await fs.writeFile(
      storePath,
      JSON.stringify({ ...parsed, stories: repairedStories, updatedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  }

  const report = {
    checkedAt: new Date().toISOString(),
    mode: dryRun ? "dry-run" : "repair",
    storePath,
    baseUrl,
    backupPath,
    counts: { before, after, totalUnchanged: before.total === after.total },
    publicPageStatus: Object.fromEntries([...pages.entries()].map(([route, page]) => [route, page.status])),
    staticStorySources: {
      idCount: staticIndex.byId.size,
      slugCount: staticIndex.bySlug.size,
    },
    provenPublicDrafts: toRepair.length,
    wouldMarkPublished: toRepair,
    remainDraft: inspected.filter((item) => item.status === "draft" && item.action !== "mark published"),
    alreadyPublished: inspected.filter((item) => item.status === "published"),
    allStories: inspected,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printReport(report);
}

function printReport(report) {
  console.log("OldSeaDogs story reconciliation");
  console.log(`Mode: ${report.mode}`);
  console.log(`Checked at: ${report.checkedAt}`);
  console.log(`Store: ${report.storePath}`);
  console.log(`Base URL: ${report.baseUrl}`);
  if (report.backupPath) console.log(`Backup: ${report.backupPath}`);
  console.log("");
  console.log("Public page status:");
  console.table(report.publicPageStatus);
  console.log("Static story sources:");
  console.table(report.staticStorySources);
  console.log("Counts before:");
  console.table(report.counts.before);
  console.log("Counts after:");
  console.table(report.counts.after);
  console.log(`Total unchanged: ${report.counts.totalUnchanged ? "Yes" : "No"}`);
  console.log(`Proven public draft/unpublished/scheduled stories to mark published: ${report.provenPublicDrafts}`);
  console.log("");
  console.log("Would mark as published:");
  console.table(report.wouldMarkPublished.map(summaryRow));
  console.log("");
  console.log("Drafts left unchanged:");
  console.table(report.remainDraft.map(summaryRow));
}

function summaryRow(item) {
  return {
    title: item.title,
    slug: item.slug,
    status: item.status,
    category: item.category,
    route: item.route,
    directStatus: item.directStatus,
    homepage: item.homepageContains ? "yes" : "no",
    section: item.sectionContains ? "yes" : "no",
    archive: item.archiveContains ? "yes" : "no",
    staticMatch: item.staticMatch ? "yes" : "no",
    previousPublishedAt: item.previousPublishedAt ? "yes" : "no",
    homepageFeatured: item.homepageFeatured ? "yes" : "no",
    blockedScrapedDraft: item.blockedScrapedDraft ? "yes" : "no",
    evidence: item.evidence.join("; "),
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
