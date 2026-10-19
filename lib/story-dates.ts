/** Archive import used this calendar day when a port or club record had no date. */
const PLACEHOLDER_DAY = "2025-01-01";

export function isPlaceholderStoryDate(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (text === PLACEHOLDER_DAY) return true;
  return /^2025-01-01T00:00:00(?:\.000)?Z$/.test(text);
}

/** A publish or update stamp the archive actually knew. The dummy day is omitted. */
export function knownStoryDate(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text || isPlaceholderStoryDate(text)) return "";
  return text;
}
