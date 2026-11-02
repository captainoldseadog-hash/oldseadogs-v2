import noindexWave1 from "../content/story-triage/noindex-slugs.json" with { type: "json" };
import noindexWave2 from "../content/story-triage/noindex-wave-2.json" with { type: "json" };
import sitemapExcludeSlugs from "../content/story-triage/sitemap-exclude-slugs.json" with { type: "json" };

/**
 * Wave 1 is the attached thin-story list and can ship on its own.
 * Wave 2 lives in content/story-triage/noindex-wave-2.json (score -1, when
 * approved) and is included only when STORY_TRIAGE_WAVE=2.
 */
const waveLists = [noindexWave1, noindexWave2] as const;

export function storyTriageMaxWave() {
  const raw = Number.parseInt(process.env.STORY_TRIAGE_WAVE || "1", 10);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, waveLists.length);
}

export function slugsThroughWave(waves: readonly (readonly string[])[], maxWave: number) {
  const slugs = new Set<string>();
  const limit = Math.max(0, Math.min(maxWave, waves.length));
  for (let index = 0; index < limit; index += 1) {
    for (const slug of waves[index]) slugs.add(slug);
  }
  return slugs;
}

function activeNoindexSlugs() {
  return slugsThroughWave(waveLists, storyTriageMaxWave());
}

const sitemapExclude = new Set<string>(sitemapExcludeSlugs);

export function isEditoriallyApprovedStatus(status: string | undefined) {
  const value = (status || "").trim().toLowerCase();
  return value === "ready" || value === "keep live";
}

export function isTriageNoindex(slug: string) {
  return activeNoindexSlugs().has(slug);
}

/**
 * Sitemap exclusion covers the active noindex wave plus redirected duplicates.
 * An editor approval (ready / keep live) puts a thin story back in the sitemap
 * without a deploy. Duplicate sources stay excluded.
 */
export function isTriageSitemapExcluded(slug: string, editorialStatus?: string) {
  if (isEditoriallyApprovedStatus(editorialStatus) && isTriageNoindex(slug)) return false;
  if (isTriageNoindex(slug)) return true;
  if (!sitemapExclude.has(slug)) return false;
  for (let index = storyTriageMaxWave(); index < waveLists.length; index += 1) {
    if ((waveLists[index] as readonly string[]).includes(slug)) return false;
  }
  return true;
}

export function storyClearsStoryTriage(story: {
  slug: string;
  editorialStatus?: string;
  noindex?: boolean;
}) {
  if (story.noindex) return false;
  if (isEditoriallyApprovedStatus(story.editorialStatus)) return true;
  return !isTriageNoindex(story.slug);
}
