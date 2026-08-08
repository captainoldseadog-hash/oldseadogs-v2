const ukTimeZone = "Europe/London";

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseDateTimeInput(value: string): LocalDateTimeParts | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  if (
    check.getUTCFullYear() !== parts.year ||
    check.getUTCMonth() + 1 !== parts.month ||
    check.getUTCDate() !== parts.day ||
    check.getUTCHours() !== parts.hour ||
    check.getUTCMinutes() !== parts.minute
  ) return null;
  return parts;
}

function partsInUk(date: Date): LocalDateTimeParts {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: ukTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function sameParts(left: LocalDateTimeParts, right: LocalDateTimeParts) {
  return left.year === right.year && left.month === right.month && left.day === right.day &&
    left.hour === right.hour && left.minute === right.minute;
}

export function ukDateTimeInputToIso(value: string) {
  const desired = parseDateTimeInput(value);
  if (!desired) return "";
  const nominalUtc = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute);
  let candidateMs = nominalUtc;

  // Resolve the Europe/London offset at the requested wall-clock time. The
  // second pass handles dates on either side of the daylight-saving boundary.
  for (let pass = 0; pass < 2; pass += 1) {
    const represented = partsInUk(new Date(candidateMs));
    const representedUtc = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute
    );
    candidateMs += nominalUtc - representedUtc;
  }

  const candidate = new Date(candidateMs);
  // Spring-forward wall-clock times that never occur are invalid rather than
  // being silently shifted by an hour.
  return sameParts(partsInUk(candidate), desired) ? candidate.toISOString() : "";
}

export function isoToUkDateTimeInput(value: string) {
  if (!value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = partsInUk(date);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function validateScheduledPublishAt(value: string, now = new Date()) {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false as const, error: "Choose a date and time before scheduling this story." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
    return { ok: false as const, error: "Choose a valid scheduled date and time including its timezone." };
  }
  const time = Date.parse(trimmed);
  if (!Number.isFinite(time)) return { ok: false as const, error: "Choose a valid scheduled date and time." };
  if (time <= now.getTime()) return { ok: false as const, error: "The scheduled release time must be in the future. Use Publish Now for an immediate release." };
  return { ok: true as const, iso: new Date(time).toISOString() };
}

export function isScheduledPublishDue(value: string, now = new Date()) {
  const time = Date.parse(value);
  return Boolean(value.trim()) && Number.isFinite(time) && time <= now.getTime();
}
