import fs from "node:fs/promises";
import path from "node:path";

function fail(message) {
  console.error(`Current production-matching CMS store unavailable; latest-story validation cannot be completed. ${message}`);
  process.exitCode = 1;
}

function publicationTime(story) {
  for (const value of [story?.publishedAt, story?.date]) {
    if (typeof value !== "string" || !value.trim()) continue;
    const time = Date.parse(value);
    if (Number.isFinite(time)) return time;
  }
  return Number.NEGATIVE_INFINITY;
}

if (process.env.OLDSEADOGS_REQUIRE_EXISTING_STORE !== "true") {
  fail("Set OLDSEADOGS_REQUIRE_EXISTING_STORE=true for current-content approval testing.");
} else if (!process.env.OLDSEADOGS_DATA_DIR?.trim()) {
  fail("Set OLDSEADOGS_DATA_DIR to the directory containing the approved current editor-store.json.");
} else {
  const dataDir = path.resolve(process.env.OLDSEADOGS_DATA_DIR.trim());
  const storePath = path.join(dataDir, "editor-store.json");

  try {
    const [text, stats] = await Promise.all([
      fs.readFile(storePath, "utf8"),
      fs.stat(storePath),
    ]);
    const store = JSON.parse(text);
    if (!Array.isArray(store?.stories)) {
      throw new Error("The store does not contain a stories array.");
    }

    const publishedStories = store.stories
      .filter((story) => story?.status === "published")
      .sort((left, right) => publicationTime(right) - publicationTime(left));
    const newest = publishedStories[0];
    if (!newest) {
      throw new Error("The store contains no published stories.");
    }

    console.log(JSON.stringify({
      currentContentApprovalStore: true,
      path: storePath,
      modifiedAt: stats.mtime.toISOString(),
      version: store.version ?? store.schemaVersion ?? null,
      storyCount: store.stories.length,
      publishedStoryCount: publishedStories.length,
      newestPublishedStory: {
        title: newest.title ?? "",
        slug: newest.slug ?? "",
        publishedAt: newest.publishedAt || newest.date || "",
      },
    }, null, 2));
  } catch (error) {
    fail(`Could not read ${storePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
