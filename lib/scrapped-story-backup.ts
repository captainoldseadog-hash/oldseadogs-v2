const backupIdPattern = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,180}$/;
const storyIdPattern = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,160}$/;
const maxBackups = 8;
const maxStories = 30;
const maxStoreBytes = 80_000_000;

export type ScrappedDraftSummary = {
  id: string;
  title: string;
  backupId: string;
  backupPath: string;
};

export function scrappedBackupRoots(env?: { OLDSEADOGS_BACKUP_DIR?: string }) {
  const primary = env?.OLDSEADOGS_BACKUP_DIR?.trim() || "/var/www/Oldseadogsbackups";
  return [...new Set([primary, "/var/www/oldseadogs-backups"])];
}

/** Backup folder names created by the pre-delete backup, with no path segments. */
export function isPreBulkDeleteBackupId(backupId: string) {
  return backupIdPattern.test(backupId) && backupId.includes("pre-bulk-delete-") && !backupId.includes("..");
}

export function isScrappedStoryId(storyId: string) {
  return storyIdPattern.test(storyId) && !storyId.includes("..");
}

type BackupCandidate = {
  backupId: string;
  backupPath: string;
  storePath: string;
};

async function backupCandidates(roots: string[]) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const candidates: BackupCandidate[] = [];

  for (const root of roots) {
    const resolvedRoot = path.resolve(root);
    let entries: Array<{ name: string; isDirectory(): boolean }>;
    try {
      entries = await fs.readdir(resolvedRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || !isPreBulkDeleteBackupId(entry.name)) continue;
      const backupPath = path.resolve(resolvedRoot, entry.name);
      const storePath = path.resolve(backupPath, "editor-store.json");
      const relative = path.relative(resolvedRoot, storePath);
      if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) continue;
      candidates.push({ backupId: entry.name, backupPath, storePath });
    }
  }

  return candidates.sort((left, right) => right.backupId.localeCompare(left.backupId));
}

async function readBackupStore(candidate: BackupCandidate) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const stat = await fs.stat(candidate.storePath);
  if (!stat.isFile() || stat.size > maxStoreBytes) return null;
  const realBackup = await fs.realpath(candidate.backupPath);
  const realStore = await fs.realpath(candidate.storePath);
  const relative = path.relative(realBackup, realStore);
  if (relative !== "editor-store.json") return null;
  const parsed = JSON.parse(await fs.readFile(realStore, "utf8")) as { stories?: unknown };
  return Array.isArray(parsed.stories) ? parsed.stories : null;
}

function draftRecord(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const story = value as { id?: unknown; title?: unknown; status?: unknown };
  const id = typeof story.id === "string" ? story.id.trim() : "";
  if (!isScrappedStoryId(id) || story.status !== "draft") return null;
  return {
    id,
    title: typeof story.title === "string" && story.title.trim() ? story.title.trim() : "Untitled story",
    story: value as Record<string, unknown>,
  };
}

/**
 * Drafts that are in a recent pre-delete backup and missing from the live store.
 * Newest backup wins. Published copies and stories still in the editor are ignored.
 */
export async function listRecentlyScrappedDrafts(liveIds: ReadonlySet<string>, roots: string[]) {
  const found = new Map<string, ScrappedDraftSummary>();
  for (const candidate of (await backupCandidates(roots)).slice(0, maxBackups)) {
    let stories: unknown[] | null = null;
    try {
      stories = await readBackupStore(candidate);
    } catch {
      continue;
    }
    if (!stories) continue;
    for (const value of stories) {
      const draft = draftRecord(value);
      if (!draft || liveIds.has(draft.id) || found.has(draft.id)) continue;
      found.set(draft.id, {
        id: draft.id,
        title: draft.title,
        backupId: candidate.backupId,
        backupPath: candidate.backupPath,
      });
      if (found.size >= maxStories) return [...found.values()];
    }
  }
  return [...found.values()];
}

export async function readScrappedDraft(backupId: string, storyId: string, roots: string[]) {
  if (!isPreBulkDeleteBackupId(backupId) || !isScrappedStoryId(storyId)) {
    return { ok: false as const, error: "That backup could not be used." };
  }
  const candidate = (await backupCandidates(roots)).find((item) => item.backupId === backupId);
  if (!candidate) return { ok: false as const, error: "That pre-delete backup could not be found." };
  let stories: unknown[] | null = null;
  try {
    stories = await readBackupStore(candidate);
  } catch {
    return { ok: false as const, error: "That pre-delete backup could not be read." };
  }
  if (!stories) return { ok: false as const, error: "That pre-delete backup could not be read." };
  const match = stories
    .map((value) => draftRecord(value))
    .find((draft) => draft?.id === storyId);
  if (!match) {
    return { ok: false as const, error: "That backup does not contain this story as a private draft." };
  }
  return { ok: true as const, story: match.story, backupPath: candidate.backupPath };
}
