import { GUIDE_TYPES } from "../content/flagship-guides.ts";
import type { EditableGuide } from "./site-content.ts";

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function validateGuideInput(input: Partial<EditableGuide>) {
  const issues: string[] = [];
  if (!String(input.title || "").trim()) issues.push("Guide title is required.");
  if (input.slug !== undefined && !validSlug(input.slug)) {
    issues.push("Guide slug must contain lowercase letters, numbers and single hyphens only.");
  }
  if (input.guideType !== undefined && !GUIDE_TYPES.includes(input.guideType)) {
    issues.push("Guide type is not supported.");
  }
  if (
    input.editorialOrder !== undefined
    && (!Number.isInteger(input.editorialOrder) || input.editorialOrder < 0)
  ) {
    issues.push("Editorial order must be a non-negative integer.");
  }
  const latitude = input.location?.latitude;
  const longitude = input.location?.longitude;
  const mapZoom = input.location?.mapZoom;
  if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    issues.push("Guide latitude must be between -90 and 90.");
  }
  if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    issues.push("Guide longitude must be between -180 and 180.");
  }
  if (mapZoom !== undefined && (!Number.isInteger(mapZoom) || mapZoom < 1 || mapZoom > 20)) {
    issues.push("Guide map zoom must be an integer between 1 and 20.");
  }
  if (input.status === "published" && ((latitude === undefined) !== (longitude === undefined))) {
    issues.push("Published Guides require both latitude and longitude when either coordinate is supplied.");
  }
  for (const [label, values] of [
    ["related", input.relatedGuideSlugs],
    ["Cruise On", input.cruiseOnGuideSlugs],
  ] as const) {
    if (values?.includes(String(input.slug || ""))) issues.push(`A Guide cannot include itself in ${label} relationships.`);
    if (values && new Set(values).size !== values.length) issues.push(`${label} Guide relationships cannot contain duplicates.`);
  }
  if (issues.length) throw new Error(issues.join(" "));
}
