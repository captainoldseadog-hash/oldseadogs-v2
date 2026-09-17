export type StoryListRecord = {
  id: string;
  slug?: string;
  status: string;
  editorialStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  scheduledPublishAt?: string;
  date?: string;
  statusHistory?: Array<{ changedAt?: string }>;
};

const legacyEpoch = "1970-01-01T00:00:00.000Z";

function validIso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  const stamp = Date.parse(value);
  return Number.isFinite(stamp) ? new Date(stamp).toISOString() : "";
}

export function storyCreatedAt(story: StoryListRecord) {
  const explicit = validIso(story.createdAt);
  if (explicit) return explicit;
  const history = (story.statusHistory || []).map((entry) => validIso(entry.changedAt)).filter(Boolean).sort();
  if (history[0]) return history[0];
  // `date` is a legacy imported/original publication day. It is only a stable
  // fallback for old records and never replaces a real creation timestamp.
  return validIso(story.date) || validIso(story.publishedAt) || validIso(story.scheduledPublishAt) || validIso(story.updatedAt) || legacyEpoch;
}

export function compareStoriesNewestCreated(a: StoryListRecord, b: StoryListRecord) {
  const byCreated = storyCreatedAt(b).localeCompare(storyCreatedAt(a));
  if (byCreated) return byCreated;
  return `${a.id}\u0000${a.slug || ""}`.localeCompare(`${b.id}\u0000${b.slug || ""}`);
}

export function storyMatchesWorkflow(story: StoryListRecord, workflow: string) {
  const wanted = workflow.trim().toLowerCase();
  if (!wanted || wanted === "all") return true;
  if (["draft", "published", "scheduled", "unpublished"].includes(wanted)) {
    return story.status.toLowerCase() === wanted;
  }
  return (story.editorialStatus || "").trim().toLowerCase() === wanted;
}

export function sortAndPaginateStories<T extends StoryListRecord>(stories: T[], page: number, pageSize: number) {
  const sorted = [...stories].sort(compareStoriesNewestCreated);
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(sorted.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * safePageSize;
  return { stories: sorted.slice(start, start + safePageSize), page: safePage, pageCount, total: sorted.length };
}
