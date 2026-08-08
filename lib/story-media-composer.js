/**
 * Pure story-block helpers shared by The Bridge and its regression checks.
 * Story bodies remain backwards-compatible arrays separated by blank lines.
 */

export function splitStoryBlocks(value) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function joinStoryBlocks(blocks) {
  return blocks.map((block) => String(block || "").trim()).filter(Boolean).join("\n\n");
}

export function cleanStoryMediaPart(value) {
  return String(value || "").replace(/[\[\]|]/g, " ").replace(/\s+/g, " ").trim();
}

export function makeInlineImageBlock(selection) {
  const fields = [
    cleanStoryMediaPart(selection.caption),
    cleanStoryMediaPart(selection.credit),
    cleanStoryMediaPart(selection.alt),
    cleanStoryMediaPart(selection.copyright),
    cleanStoryMediaPart(selection.location),
    cleanStoryMediaPart(selection.dateTaken),
  ];
  while (fields.length && !fields[fields.length - 1]) fields.pop();
  return `[image:${selection.url}${fields.length ? `|${fields.join("|")}` : ""}]`;
}

export function parseInlineImageBlock(block) {
  const match = String(block || "").match(/^\[image:([^|\]]+)(?:\|([^\]]*))?\]$/);
  if (!match) return null;
  const fields = String(match[2] || "").split("|");
  return {
    url: match[1],
    caption: fields[0] || "",
    credit: fields[1] || "",
    alt: fields[2] || "",
    copyright: fields[3] || "",
    location: fields[4] || "",
    dateTaken: fields[5] || "",
  };
}

function duplicateAtInsertionPoint(blocks, block, index) {
  return blocks[index - 1] === block || blocks[index] === block;
}

export function insertStoryBlockAtIndex(value, block, requestedIndex) {
  const blocks = splitStoryBlocks(value);
  const index = Math.max(0, Math.min(Number(requestedIndex), blocks.length));
  if (duplicateAtInsertionPoint(blocks, block, index)) {
    return { value: joinStoryBlocks(blocks), inserted: false, duplicate: true, index };
  }
  const next = [...blocks];
  next.splice(index, 0, block);
  return { value: joinStoryBlocks(next), inserted: true, duplicate: false, index };
}

export function insertStoryBlockAtCursor(value, block, cursor) {
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > String(value || "").length) {
    return {
      value: String(value || ""),
      inserted: false,
      duplicate: false,
      index: -1,
      error: "Place the article cursor between two paragraphs before inserting a photograph.",
    };
  }

  const current = String(value || "");
  const before = current.slice(0, cursor).trimEnd();
  const after = current.slice(cursor).trimStart();
  const beforeBlocks = splitStoryBlocks(before);
  const afterBlocks = splitStoryBlocks(after);
  const blocks = [...beforeBlocks, ...afterBlocks];
  const index = beforeBlocks.length;
  if (duplicateAtInsertionPoint(blocks, block, index)) {
    return { value: joinStoryBlocks(blocks), inserted: false, duplicate: true, index };
  }

  const next = [...beforeBlocks, block, ...afterBlocks];
  return { value: joinStoryBlocks(next), inserted: true, duplicate: false, index };
}

export function moveStoryBlock(value, from, to) {
  const blocks = splitStoryBlocks(value);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= blocks.length || to < 0 || to >= blocks.length) {
    return joinStoryBlocks(blocks);
  }
  const next = [...blocks];
  const [block] = next.splice(from, 1);
  next.splice(to, 0, block);
  return joinStoryBlocks(next);
}
