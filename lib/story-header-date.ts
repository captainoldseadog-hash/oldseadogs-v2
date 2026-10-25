const londonTimeZone = "Europe/London";

// Public story dates use the same instant as JSON-LD datePublished:
// publishedAt, then the editorial date only when no publish timestamp exists.
// The editorial `date` field can still hold an imported source day or a shared
// batch day, which is often earlier than publishedAt. createdAt, updatedAt,
// and a server timezone west of UTC must not choose or shift the calendar day.

type StoryPublishDateSource = {
  publishedAt?: string | null;
  date?: string | null;
};

function parseDisplayInstant(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const instant = new Date(Date.UTC(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
      12,
    ));
    return Number.isNaN(instant.getTime()) ? null : instant;
  }
  const instant = new Date(trimmed);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

function storyPublishInstant(story: StoryPublishDateSource) {
  const publishedAt = story.publishedAt?.trim() || "";
  const date = story.date?.trim() || "";
  return parseDisplayInstant(publishedAt) || parseDisplayInstant(date);
}

function formatLondonDate(instant: Date, month: "long" | "short") {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: londonTimeZone,
  }).format(instant);
}

export function storyHeaderDateLabel(story: StoryPublishDateSource) {
  const instant = storyPublishInstant(story);
  if (!instant) return story.publishedAt?.trim() || story.date?.trim() || "";
  return formatLondonDate(instant, "long");
}

export function storyListingDateLabel(story: StoryPublishDateSource) {
  const instant = storyPublishInstant(story);
  if (!instant) return "";
  return formatLondonDate(instant, "short");
}
