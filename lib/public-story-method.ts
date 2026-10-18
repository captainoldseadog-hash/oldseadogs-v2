export const retiredLegacyArchiveMethodNotes =
  "Legacy archive story retained for continuity and queued for editorial audit.";

export const legacyArchiveMethodNotes =
  "Archive story from the Old Sea Dogs library, based on the sources linked above.";

export function publicStoryMethodNotes(value: string | undefined) {
  const notes = String(value || "").trim();
  if (notes === retiredLegacyArchiveMethodNotes) return legacyArchiveMethodNotes;
  return notes;
}
