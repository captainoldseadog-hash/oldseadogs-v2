const londonTimeZone = "Europe/London";

// Story headers show the real publish day in Europe/London. The editorial
// `date` field can still hold an imported source day, which is often earlier
// than publishedAt, and a server timezone west of UTC must not move the day.

type StoryHeaderDateSource = {
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

function formatLondonDate(instant: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: londonTimeZone,
  }).format(instant);
}

export function storyHeaderDateLabel(story: StoryHeaderDateSource) {
  const publishedAt = story.publishedAt?.trim() || "";
  const date = story.date?.trim() || "";
  const instant = parseDisplayInstant(publishedAt) || parseDisplayInstant(date);
  if (!instant) return publishedAt || date;
  return formatLondonDate(instant);
}
