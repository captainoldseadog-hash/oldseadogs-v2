#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  insertStoryBlockAtCursor,
  insertStoryBlockAtIndex,
  makeInlineImageBlock,
  moveStoryBlock,
  parseInlineImageBlock,
  splitStoryBlocks,
} from "../lib/story-media-composer.js";

const first = makeInlineImageBlock({
  url: "/api/media/photo-one",
  caption: "Cowes morning",
  credit: "Old Sea Dogs",
  alt: "Classic yacht entering Cowes",
  copyright: "Old Sea Dogs",
  location: "Cowes",
  dateTaken: "2026-07-13",
});
const second = makeInlineImageBlock({ url: "/api/media/photo-two" });
const article = "Introduction.\n\nMiddle paragraph.\n\nConclusion.";
const cursor = article.indexOf("Middle paragraph.");

const inserted = insertStoryBlockAtCursor(article, first, cursor);
assert.equal(inserted.inserted, true);
assert.deepEqual(splitStoryBlocks(inserted.value), ["Introduction.", first, "Middle paragraph.", "Conclusion."]);

const duplicate = insertStoryBlockAtIndex(inserted.value, first, 2);
assert.equal(duplicate.inserted, false);
assert.equal(duplicate.duplicate, true);
assert.equal(splitStoryBlocks(duplicate.value).filter((block) => block === first).length, 1);

const deliberateReuse = insertStoryBlockAtIndex(inserted.value, first, 4);
assert.equal(deliberateReuse.inserted, true);
assert.equal(splitStoryBlocks(deliberateReuse.value).filter((block) => block === first).length, 2);

const secondPhoto = insertStoryBlockAtIndex(inserted.value, second, 3);
const reordered = moveStoryBlock(secondPhoto.value, 3, 1);
assert.deepEqual(splitStoryBlocks(reordered), ["Introduction.", second, first, "Middle paragraph.", "Conclusion."]);

const metadata = parseInlineImageBlock(first);
assert.equal(metadata?.caption, "Cowes morning");
assert.equal(metadata?.location, "Cowes");

const noCursor = insertStoryBlockAtCursor(article, first, null);
assert.equal(noCursor.inserted, false);
assert.match(noCursor.error, /Place the article cursor/);

console.log("Story media regression checks passed: cursor placement, duplicate prevention, deliberate reuse, metadata and reorder.");
