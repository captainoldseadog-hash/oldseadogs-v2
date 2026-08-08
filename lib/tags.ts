const junkTagPatterns = [
  /^old[-\s]?sea[-\s]?dogs$/i,
  /^oldseadogs$/i,
  /^www\.oldseadogs\.com$/i,
  /^https?:\/\/(www\.)?oldseadogs\.com\/?$/i,
  /^oldseadogs\.com$/i,
  /^home$/i,
  /^article$/i,
  /^story$/i,
  /^news$/i,
];

function normalizeTag(tag: string) {
  return tag
    .replace(/^#/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulTag(tag: string) {
  if (tag.length < 3) return false;
  if (tag.length > 48) return false;
  if (junkTagPatterns.some((pattern) => pattern.test(tag))) return false;
  return true;
}

export function cleanStoryTags(tags: string[], limit = 8) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const rawTag of tags) {
    const tag = normalizeTag(String(rawTag || ""));
    const key = tag.toLowerCase();
    if (!tag || !isUsefulTag(tag) || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(tag);
    if (cleaned.length >= limit) break;
  }

  return cleaned;
}
