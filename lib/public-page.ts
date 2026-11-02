/**
 * Public listing pages. A missing page is page 1. Any other value must be an
 * integer inside 1..pageCount. Out-of-range and non-numeric values are absent
 * so the route can 404 instead of repeating the last page.
 */
export function resolvePublicPage(raw: string | undefined, pageCount: number) {
  const total = Math.max(0, pageCount);
  if (raw == null || raw === "") return total >= 1 ? 1 : null;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const page = Number(raw);
  if (page > total) return null;
  return page;
}
