const editorialHtmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  copy: "©",
  euro: "€",
  gt: ">",
  hellip: "…",
  laquo: "«",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  ndash: "–",
  nbsp: " ",
  pound: "£",
  quot: '"',
  raquo: "»",
  rdquo: "”",
  reg: "®",
  rsquo: "’",
  trade: "™",
};

export function decodeEditorialHtmlEntities(value: string) {
  return value
    .replace(/&#x([a-f0-9]+);?/gi, (_match, code) => {
      const point = parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&#([0-9]+);?/g, (_match, code) => {
      const point = parseInt(code, 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name) => editorialHtmlEntities[String(name).toLowerCase()] ?? match);
}

export function normalizeEditorialTypography(value: string) {
  return decodeEditorialHtmlEntities(value)
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200f\ufeff]/g, "")
    .replace(/[\u0018\u0091]/g, "‘")
    .replace(/[\u0019\u0092]/g, "’")
    .replace(/\u0093/g, "“")
    .replace(/\u0094/g, "”")
    .replace(/\u0096/g, "–")
    .replace(/\u0097/g, "—")
    .replace(/\u0085/g, "…")
    .replace(/\uFFFD/g, "")
    .replace(/Â(?=\s|$)/g, "")
    .replace(/Â/g, "")
    .replace(/â€™/g, "’")
    .replace(/â€˜/g, "‘")
    .replace(/â€š/g, "‚")
    .replace(/â€›/g, "‛")
    .replace(/â€œ/g, "“")
    .replace(/â€�/g, "”")
    .replace(/â€ž/g, "„")
    .replace(/â€Ÿ/g, "‟")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¦/g, "…")
    .replace(/â€¢/g, "-")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ã[^\s]?/g, "")
    .replace(/&nbsp;?/gi, " ");
}
