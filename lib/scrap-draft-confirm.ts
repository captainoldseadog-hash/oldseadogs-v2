/** The word that always unlocks the scrap confirmation. */
export const scrapConfirmWord = "SCRAP";

/** First word of a story title, used as the other accepted confirmation. */
export function scrapConfirmPhrase(title: string) {
  return title.trim().split(/\s+/)[0] || "";
}

/**
 * The delete control stays disabled until the editor types SCRAP, exactly,
 * or the first word of the story title.
 */
export function scrapConfirmAccepted(typed: string, title: string) {
  const value = typed.trim();
  if (!value) return false;
  if (value === scrapConfirmWord) return true;
  const phrase = scrapConfirmPhrase(title);
  return phrase.length > 0 && value.toLocaleLowerCase() === phrase.toLocaleLowerCase();
}

/** Shown after a draft is removed, including where the backup is and how to restore one story. */
export function scrapBackupMessage(title: string, backupPath: string) {
  const name = title.trim() || "The draft";
  const where = backupPath.trim()
    ? `A backup was saved at ${backupPath.trim()}.`
    : "A backup was saved before it was removed.";
  return `“${name}” was scrapped. ${where} On the Drafts page, Recently scrapped can restore this one story. The rest of that backup stays untouched.`;
}
