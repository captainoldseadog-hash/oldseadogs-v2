#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const knownStatuses = new Set(["draft", "scheduled", "published", "unpublished"]);
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

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function defaultStorePath() {
  const dataDir = process.env.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  return path.join(dataDir, "editor-store.json");
}

function isMissingFileError(error) {
  return Boolean(error && typeof error === "object" && error.code === "ENOENT");
}

function normalizeStatus(value) {
  if (value === "private") return "unpublished";
  return knownStatuses.has(value) ? value : "published";
}

function dateFallback(story) {
  if (story.publishedAt) return story.publishedAt;
  if (story.updatedAt) return story.updatedAt;
  if (story.createdAt) return story.createdAt;
  if (story.date) return `${story.date}T12:00:00.000Z`;
  return "";
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

function storyTime(story) {
  return Date.parse(story.updatedAt || story.publishedAt || story.createdAt || story.date || "") || 0;
}

function isPublic(story) {
  return story.status === "published";
}

function homepageEligible(story) {
  const sourceType = String(story.sourceType || "").toLowerCase();
  return (
    isPublic(story) &&
    Boolean(String(story.slug || "").trim()) &&
    sourceType !== "insufficient source detail for publication" &&
    sourceType !== "needs more source detail"
  );
}

function sortForHomepage(stories) {
  return [...stories]
    .filter(homepageEligible)
    .sort((a, b) => {
      if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) return a.isFeatured ? -1 : 1;
      const timeCompare = storyTime(b) - storyTime(a);
      if (timeCompare) return timeCompare;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
}

function homepageSet(stories) {
  const eligible = sortForHomepage(stories);
  const featured = eligible.find((story) => story.isFeatured) || eligible[0] || null;
  return new Set([
    ...(featured ? [featured.id] : []),
    ...eligible.filter((story) => story.slug !== featured?.slug).slice(0, 4).map((story) => story.id),
  ]);
}

function sectionSet(stories) {
  const map = new Map();
  for (const story of stories.filter(isPublic)) {
    const route = sectionRoute(story);
    if (!route) continue;
    if (!map.has(route)) map.set(route, new Set());
    map.get(route).add(story.id);
  }
  return map;
}

function repairStory(story) {
  const repaired = { ...story };
  const changes = [];
  const originalStatus = story.status;
  const status = normalizeStatus(String(story.status || ""));

  if (!originalStatus || originalStatus !== status) {
    repaired.status = status;
    changes.push(`status ${originalStatus || "missing"} -> ${status}`);
  }

  if (repaired.status === "scheduled" && !repaired.scheduledPublishAt && repaired.publishedAt) {
    repaired.status = "published";
    changes.push("scheduled without scheduled date but with publishedAt -> published");
  }

  if (repaired.status === "published" && !repaired.publishedAt) {
    const fallback = dateFallback(repaired);
    if (fallback) {
      repaired.publishedAt = fallback;
      changes.push(`publishedAt backfilled -> ${fallback}`);
    }
  }

  if (!repaired.scheduledPublishAt) repaired.scheduledPublishAt = "";
  if (!Array.isArray(repaired.tags)) repaired.tags = [];
  return { repaired, changes };
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  const text = await response.text().catch(() => "");
  return { status: response.status, ok: response.ok, text };
}

async function publicChecks(baseUrl, story, sectionPath) {
  if (!baseUrl || !story.slug || !isPublic(story)) {
    return {
      directUrlStatus: baseUrl ? "not public" : "not checked",
      homepageContains: false,
      sectionContains: false,
      searchContains: false,
    };
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const storyPath = `/stories/${story.slug}`;
  const direct = await fetchText(`${cleanBase}${storyPath}`).catch((error) => ({ status: `error: ${error.message}`, text: "" }));
  const homepage = await fetchText(cleanBase).catch(() => ({ status: "error", text: "" }));
  const section = sectionPath
    ? await fetchText(`${cleanBase}${sectionPath}`).catch(() => ({ status: "error", text: "" }))
    : { status: "no section", text: "" };
  const searchQuery = encodeURIComponent(story.slug || story.title || "");
  const search = await fetchText(`${cleanBase}/api/search?q=${searchQuery}`).catch(() => ({ status: "error", text: "" }));

  return {
    directUrlStatus: direct.status,
    homepageContains: homepage.text.includes(storyPath) || homepage.text.includes(story.slug),
    sectionContains: section.text.includes(storyPath) || section.text.includes(story.slug),
    searchContains: search.text.includes(story.slug),
  };
}

async function main() {
  const explicitStorePath = argValue("--store");
  const storePath = explicitStorePath || defaultStorePath();
  const baseUrl = argValue("--base-url") || process.env.OLDSEADOGS_VERIFY_BASE_URL || "";
  const repair = hasArg("--repair");
  const jsonOnly = hasArg("--json");
  const usingDefaultLocalStore = !explicitStorePath && !process.env.OLDSEADOGS_DATA_DIR?.trim();

  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(storePath, "utf8"));
  } catch (error) {
    if (usingDefaultLocalStore && isMissingFileError(error)) {
      const emptyCounts = countStatuses([]);
      const report = {
        checkedAt: new Date().toISOString(),
        storePath,
        baseUrl: baseUrl || "not checked",
        repairMode: repair,
        skipped: true,
        reason: "No local editor-store.json exists yet. Live production data was not checked or touched.",
        totals: {
          before: emptyCounts,
          after: emptyCounts,
          countMatches: true,
        },
        repairLog: [],
        stories: [],
      };
      if (jsonOnly) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printMissingStoreReport(report);
      }
      return;
    }
    console.error(`Could not read story store: ${storePath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
    return;
  }

  const originalStories = Array.isArray(parsed.stories) ? parsed.stories : [];
  const beforeCounts = countStatuses(originalStories);
  const repairLog = [];
  const stories = originalStories.map((story) => {
    const { repaired, changes } = repairStory(story);
    if (changes.length) repairLog.push({ title: story.title || "", slug: story.slug || "", changes });
    return repaired;
  });
  const afterCounts = countStatuses(stories);

  if (repair && repairLog.length) {
    const backupPath = `${storePath}.backup-${nowStamp()}`;
    await fs.copyFile(storePath, backupPath);
    await fs.writeFile(storePath, JSON.stringify({ ...parsed, stories, updatedAt: new Date().toISOString() }, null, 2), "utf8");
    repairLog.unshift({ title: "Backup created", slug: backupPath, changes: ["No data was deleted."] });
  }

  const homepageIds = homepageSet(stories);
  const sectionIds = sectionSet(stories);
  const rows = [];
  for (const story of stories) {
    const route = sectionRoute(story);
    const publicResult = await publicChecks(baseUrl, story, route);
    rows.push({
      title: story.title || "Untitled story",
      slug: story.slug || "",
      status: normalizeStatus(story.status),
      publishedDate: story.publishedAt || "",
      scheduledDate: story.scheduledPublishAt || "",
      homepageFeature: story.isFeatured ? "Yes" : "No",
      visibleOnHomepage: homepageIds.has(story.id) || publicResult.homepageContains ? "Yes" : "No",
      visibleInSection: (sectionIds.get(route)?.has(story.id) || publicResult.sectionContains) ? "Yes" : "No",
      directUrlStatus: publicResult.directUrlStatus,
      appearsInSearch: publicResult.searchContains ? "Yes" : baseUrl ? "No" : "Not checked",
      editableInEditor: "Yes",
      tags: Array.isArray(story.tags) ? story.tags.join(", ") : "",
      reasonIfMissing: missingReason(story, route, publicResult),
    });
  }

  const report = {
    checkedAt: new Date().toISOString(),
    storePath,
    baseUrl: baseUrl || "not checked",
    repairMode: repair,
    totals: {
      before: beforeCounts,
      after: afterCounts,
      countMatches: originalStories.length === stories.length,
    },
    repairLog,
    stories: rows,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printReport(report);
}

function countStatuses(stories) {
  const counts = {
    total: stories.length,
    published: 0,
    scheduled: 0,
    draft: 0,
    unpublished: 0,
    missingOrUnknown: 0,
  };
  for (const story of stories) {
    const raw = story.status;
    if (!raw || !knownStatuses.has(String(raw))) {
      counts.missingOrUnknown += 1;
      continue;
    }
    const status = normalizeStatus(String(raw || ""));
    counts[status] += 1;
  }
  return counts;
}

function missingReason(story, route, publicResult) {
  if (!story.slug) return "missing slug";
  if (story.status === "scheduled") return story.scheduledPublishAt ? "scheduled for future release" : "scheduled without scheduled date";
  if (story.status === "draft") return "draft";
  if (story.status === "unpublished") return "unpublished";
  if (!route) return "no matching section route";
  if (publicResult.directUrlStatus !== "not checked" && publicResult.directUrlStatus !== 200) {
    return `public URL returned ${publicResult.directUrlStatus}`;
  }
  return "";
}

function printReport(report) {
  console.log("OldSeaDogs story data verification");
  console.log(`Checked at: ${report.checkedAt}`);
  console.log(`Store: ${report.storePath}`);
  console.log(`Public base URL: ${report.baseUrl}`);
  console.log("");
  console.log("Counts before repair:");
  console.table(report.totals.before);
  console.log("Counts after repair:");
  console.table(report.totals.after);
  console.log(`Story count unchanged: ${report.totals.countMatches ? "Yes" : "No"}`);
  if (report.repairLog.length) {
    console.log("");
    console.log("Repair log:");
    console.table(report.repairLog);
  }
  console.log("");
  console.log("Stories:");
  console.table(report.stories);
}

function printMissingStoreReport(report) {
  console.log("OldSeaDogs story data verification");
  console.log(`Checked at: ${report.checkedAt}`);
  console.log(`Store: ${report.storePath}`);
  console.log(`Public base URL: ${report.baseUrl}`);
  console.log("");
  console.log(report.reason);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
