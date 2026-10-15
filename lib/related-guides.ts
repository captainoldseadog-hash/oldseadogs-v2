import relatedGuidesData from "../content/story-triage/related-guides.json" with { type: "json" };
import { guidePublicPath } from "./guides.ts";
import { storyClearsStoryTriage } from "./story-triage.ts";

type RelatedGuideRule = { pattern: string; guides: string[] };
type GuidePathFields = Parameters<typeof guidePublicPath>[0] & { title: string };
type StoryText = { title: string; summary: string; body: string[] };

const relatedGuideRules = relatedGuidesData.keyword_rules as RelatedGuideRule[];

function consumeMatches(text: string, pattern: string) {
  const expression = new RegExp(pattern, "gi");
  let count = 0;
  const next = text.replace(expression, () => {
    count += 1;
    return " ";
  });
  return { count, text: next };
}

/**
 * Keyword rules are listed specific-first. A match is consumed so "Cowes Week"
 * scores the Cowes Week guide and does not also score the bare "Cowes" rule.
 * Title, h1 and summary hits are worth 3. Body mentions count only at two or
 * more: 1 point plus 0.1 per mention. Secondary guides score 0.8 of that.
 */
export function scoreRelatedGuidePaths(story: StoryText) {
  let heading = `${story.title}\n${story.summary}`;
  let body = story.body.slice(0, 6).join("\n");
  const scores = new Map<string, { score: number; primary: boolean }>();

  for (const rule of relatedGuideRules) {
    const headingHits = consumeMatches(heading, rule.pattern);
    heading = headingHits.text;
    let base = 0;
    if (headingHits.count > 0) {
      base = 3;
      const bodyHits = consumeMatches(body, rule.pattern);
      body = bodyHits.text;
    } else {
      const bodyHits = consumeMatches(body, rule.pattern);
      body = bodyHits.text;
      if (bodyHits.count >= 2) base = 1 + bodyHits.count * 0.1;
    }
    if (!base) continue;
    rule.guides.forEach((guidePath, index) => {
      const points = index === 0 ? base : base * 0.8;
      const current = scores.get(guidePath) ?? { score: 0, primary: false };
      scores.set(guidePath, {
        score: current.score + points,
        primary: current.primary || index === 0,
      });
    });
  }

  return scores;
}

export function getRelatedGuides(story: StoryText, publishedGuides: readonly GuidePathFields[], limit = 3) {
  const publishedByPath = new Map<string, GuidePathFields>();
  for (const guide of publishedGuides) {
    const guidePath = guidePublicPath(guide);
    if (guidePath) publishedByPath.set(guidePath, guide);
  }

  return [...scoreRelatedGuidePaths(story).entries()]
    .filter(([guidePath, score]) => score.score > 0 && publishedByPath.has(guidePath))
    .sort((left, right) => {
      if (right[1].score !== left[1].score) return right[1].score - left[1].score;
      if (left[1].primary !== right[1].primary) return left[1].primary ? -1 : 1;
      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([guidePath]) => {
      const guide = publishedByPath.get(guidePath)!;
      return {
        slug: guide.slug,
        title: guide.title,
        category: "Guides",
        summary: "",
        reason: "Cruising guide",
        guidePath,
      };
    });
}

export function latestStoriesForGuide<T extends StoryText & {
  slug: string;
  date: string;
  editorialStatus?: string;
  noindex?: boolean;
}>(guidePath: string, stories: readonly T[], limit = 3) {
  return stories
    .filter((story) => storyClearsStoryTriage(story))
    .map((story) => ({ story, score: scoreRelatedGuidePaths(story).get(guidePath)?.score ?? 0 }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.story.date.localeCompare(left.story.date);
    })
    .slice(0, limit)
    .map((item) => item.story);
}
