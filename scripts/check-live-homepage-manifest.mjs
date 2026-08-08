#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { captureLiveHomepageManifest } from "../lib/live-homepage-manifest.js";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

const baseUrl = argValue("--url") || "https://oldseadogs.com/";
const expectedPath = argValue("--expected");
const manifest = await captureLiveHomepageManifest({ baseUrl });

if (expectedPath) {
  const expected = JSON.parse(await fs.readFile(path.resolve(expectedPath), "utf8"));
  const actualSlugs = [manifest.featuredStory.slug, ...manifest.latestStories.map((story) => story.slug)];
  const expectedSlugs = [expected.featuredStory?.slug, ...(expected.latestStories || []).map((story) => story.slug)];
  if (JSON.stringify(actualSlugs) !== JSON.stringify(expectedSlugs)) {
    console.error("Live homepage story selection or ordering differs from the validation manifest.");
    console.error(JSON.stringify({ expectedSlugs, actualSlugs }, null, 2));
    process.exit(1);
  }
}

process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
