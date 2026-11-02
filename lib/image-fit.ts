export type ImageFitChoice = "auto" | "fill" | "contain";
export type ImagePresentation = "cover" | "contain";

export type ImageSlotName =
  | "hero"
  | "app-lead"
  | "app-card"
  | "story-card"
  | "compact"
  | "article"
  | "section-thumb"
  | "guide-card"
  | "guide-hero"
  | "search";

export type ImageSlot = {
  width: number;
  aspect: number;
  /** Image aspect / slot aspect (or the inverse) at or above this uses contain in Auto. */
  aspectFar: number;
};

/**
 * Rendered slot sizes used to decide whether a stored image can fill the frame.
 * Aspect thresholds stay wide enough that ordinary 3:2, 4:3 and 16:9 photographs
 * keep the existing cover crop. Square graphics on a wide hero, and portraits in
 * a landscape card, fall outside that range.
 */
export const imageSlots: Record<ImageSlotName, ImageSlot> = {
  hero: { width: 1280, aspect: 2.15, aspectFar: 1.72 },
  "app-lead": { width: 360, aspect: 0.82, aspectFar: 2.6 },
  "app-card": { width: 290, aspect: 1.6, aspectFar: 1.85 },
  "story-card": { width: 390, aspect: 1.6, aspectFar: 1.85 },
  compact: { width: 290, aspect: 16 / 9, aspectFar: 1.85 },
  article: { width: 860, aspect: 16 / 9, aspectFar: 1.7 },
  "section-thumb": { width: 66, aspect: 1, aspectFar: 2.4 },
  "guide-card": { width: 560, aspect: 16 / 9, aspectFar: 1.85 },
  "guide-hero": { width: 1200, aspect: 16 / 9, aspectFar: 1.7 },
  search: { width: 260, aspect: 1.6, aspectFar: 1.85 },
};

const SIZE_RATIO = 0.85;
export const GRAPHIC_SAMPLE_EDGE = 24;
/** 24×24 sample entropy below this is a flat logo/graphic, not a photograph. */
export const GRAPHIC_ENTROPY_MAX = 3;

export function readGraphicSample(data: ArrayLike<number>) {
  const pixels = Math.floor(data.length / 4);
  let transparent = 0;
  const counts = new Map<number, number>();
  for (let index = 0; index < pixels; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] < 24) {
      transparent += 1;
      continue;
    }
    const key = ((data[offset] >> 4) << 8) | ((data[offset + 1] >> 4) << 4) | (data[offset + 2] >> 4);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const opaque = pixels - transparent;
  let entropy = 0;
  if (opaque > 0) {
    for (const count of counts.values()) {
      const probability = count / opaque;
      entropy -= probability * Math.log2(probability);
    }
  }
  const transparentRatio = pixels > 0 ? transparent / pixels : 0;
  return {
    entropy,
    transparentRatio,
    flat: opaque > 0 && entropy < GRAPHIC_ENTROPY_MAX,
    hasAlpha: transparentRatio > 0.08,
  };
}

export function normalizeImageFit(value: unknown): ImageFitChoice {
  const text = String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (text === "fill" || text === "cover" || text === "crop") return "fill";
  if (text === "contain" || text === "whole" || text === "show-whole" || text === "show-whole-image") return "contain";
  return "auto";
}

export function imageSlot(slot: ImageSlotName | ImageSlot): ImageSlot {
  return typeof slot === "string" ? imageSlots[slot] : slot;
}

export function aspectDistance(imageAspect: number, slotAspect: number) {
  if (!Number.isFinite(imageAspect) || !Number.isFinite(slotAspect) || imageAspect <= 0 || slotAspect <= 0) return 1;
  const ratio = imageAspect / slotAspect;
  return ratio >= 1 ? ratio : 1 / ratio;
}

export function resolveImagePresentation(input: {
  fit?: unknown;
  width?: number | null;
  height?: number | null;
  slot: ImageSlotName | ImageSlot;
  logoLike?: boolean;
  graphic?: boolean;
}): ImagePresentation {
  const choice = normalizeImageFit(input.fit);
  if (choice === "fill") return "cover";
  if (choice === "contain") return "contain";
  if (input.logoLike || input.graphic) return "contain";

  const slot = imageSlot(input.slot);
  const width = Number(input.width || 0);
  const height = Number(input.height || 0);
  if (width > 0 && height > 0) {
    if (aspectDistance(width / height, slot.aspect) >= slot.aspectFar) return "contain";
    if (width < slot.width * SIZE_RATIO) return "contain";
  }
  return "cover";
}

export function focalPointStyle(value: string | undefined | null) {
  const text = String(value || "").trim();
  if (!text || text === "50% 50%" || text === "center" || text === "center center") return undefined;
  if (/^(?:\d{1,3}%\s+){1,2}\d{1,3}%$/.test(text)) return text;
  if (/^(?:left|right|center|top|bottom)(?:\s+(?:left|right|center|top|bottom))?$/.test(text)) return text;
  return undefined;
}

function creditKey(piece: string) {
  return piece
    .toLowerCase()
    .replace(/^(?:photo|image|picture|photograph)\s*:\s*/i, "")
    .replace(/©|\(c\)/gi, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Collapse a credit that repeats itself, including "A · A" and pieces that
 * are the same line with or without a © / "Photo:" prefix.
 */
export function dedupeCredit(value: string) {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  const wholeRepeat = trimmed.match(/^(.{4,}?)\s*(?:[·•|]|[-–—])\s*\1$/i);
  const source = wholeRepeat ? wholeRepeat[1].trim() : trimmed;
  const pieces = source.split(/\s*[·•|]\s*/).map((piece) => piece.trim()).filter(Boolean);
  const seen: string[] = [];
  const kept: string[] = [];

  for (const piece of pieces) {
    const key = creditKey(piece);
    if (!key) continue;
    const duplicateIndex = seen.findIndex((existing) => {
      if (existing === key) return true;
      if (key.length >= 6 && existing.length >= 6 && (existing.includes(key) || key.includes(existing))) return true;
      return false;
    });
    if (duplicateIndex >= 0) {
      const existing = seen[duplicateIndex];
      if (key.length > existing.length && key.includes(existing)) {
        seen[duplicateIndex] = key;
        kept[duplicateIndex] = piece;
      }
      continue;
    }
    seen.push(key);
    kept.push(piece);
  }

  return kept.join(" · ");
}
