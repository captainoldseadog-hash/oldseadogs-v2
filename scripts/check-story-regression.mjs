#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function storyTime(story) {
  return Date.parse(story.publishedAt || story.updatedAt || story.createdAt || story.date || "") || 0;
}

function publicStories(store) {
  return store.stories
    .filter((story) => story.status === "published" && String(story.slug || "").trim())
    .sort((a, b) => storyTime(b) - storyTime(a) || String(b.date || "").localeCompare(String(a.date || "")));
}

async function readStore(filePath) {
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (!Array.isArray(parsed.stories)) throw new Error(`${filePath} does not contain a stories array.`);
  return parsed;
}

async function fetchHomepage(baseUrl) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(baseUrl, { redirect: "follow" });
      const text = await response.text();
      if (!response.ok) throw new Error(`Homepage returned HTTP ${response.status}.`);
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function main() {
  const beforePath = path.resolve(argValue("--before"));
  const afterPath = path.resolve(argValue("--after"));
  const baseUrl = argValue("--base-url").replace(/\/+$/, "");
  if (!argValue("--before") || !argValue("--after")) {
    throw new Error("Pass --before <backup editor-store.json> and --after <current editor-store.json>.");
  }

  const [before, after] = await Promise.all([readStore(beforePath), readStore(afterPath)]);
  const beforeIds = new Set(before.stories.map((story) => String(story.id || "")).filter(Boolean));
  const afterIds = new Set(after.stories.map((story) => String(story.id || "")).filter(Boolean));
  const missingIds = [...beforeIds].filter((id) => !afterIds.has(id));
  const beforePublished = publicStories(before);
  const afterPublished = publicStories(after);
  const newestBefore = beforePublished[0] || null;
  const newestAfter = afterPublished[0] || null;
  const errors = [];

  if (after.stories.length < before.stories.length) errors.push(`Story count fell from ${before.stories.length} to ${after.stories.length}.`);
  if (missingIds.length) errors.push(`${missingIds.length} story IDs disappeared: ${missingIds.slice(0, 10).join(", ")}`);
  if (afterPublished.length < beforePublished.length) errors.push(`Published story count fell from ${beforePublished.length} to ${afterPublished.length}.`);
  if (newestBefore && !afterIds.has(newestBefore.id)) errors.push(`The previously newest published story disappeared: ${newestBefore.id}.`);
  if (newestBefore && newestAfter && storyTime(newestAfter) < storyTime(newestBefore)) errors.push("The newest published story moved backwards in time.");
  if (!newestAfter && !hasArg("--allow-empty")) errors.push("No published stories remain after the change.");

  let homepageContainsNewest = null;
  if (baseUrl && newestAfter) {
    const html = await fetchHomepage(baseUrl);
    homepageContainsNewest = html.includes(`/stories/${newestAfter.slug}`) || html.includes(newestAfter.slug);
    if (!homepageContainsNewest) errors.push(`Homepage does not contain the newest published story: ${newestAfter.slug}.`);
  }

  const result = {
    ok: errors.length === 0,
    before: { path: beforePath, stories: before.stories.length, published: beforePublished.length, newest: newestBefore?.slug || "" },
    after: { path: afterPath, stories: after.stories.length, published: afterPublished.length, newest: newestAfter?.slug || "" },
    missingIds,
    homepageContainsNewest,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
