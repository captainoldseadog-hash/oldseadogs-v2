import { oldSeaDogsSections, storyMatchesSection } from "../content/sections";
import { detectManufacturer, storyMatchesManufacturer } from "../content/manufacturers";
import { type EditableStory } from "./site-content";
import { normalizeSearchText, searchTokens } from "./search";

export type InternalLinkItem = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  reason: string;
};

export type InternalLinkGroup = {
  title: string;
  href?: string;
  items: InternalLinkItem[];
};

const raceTopicPhrases = [
  "Cowes Week",
  "Rolex Fastnet",
  "Fastnet",
  "Admiral's Cup",
  "Admirals Cup",
  "SailGP",
  "Ocean Race",
  "RORC",
  "Caribbean 600",
  "Round the Island",
  "Sydney Hobart",
  "Transpac",
  "America's Cup",
  "Musto Skiff",
];

function storyText(story: EditableStory) {
  return normalizeSearchText(
    [
      story.title,
      story.category,
      story.author,
      story.summary,
      story.tags.join(" "),
      story.body.slice(0, 3).join(" "),
    ].join(" ")
  );
}

function sectionForStory(story: EditableStory) {
  return oldSeaDogsSections.find((section) => storyMatchesSection(story, section));
}

function overlapScore(a: EditableStory, b: EditableStory) {
  const aTokens = new Set(
    searchTokens(`${a.title} ${a.summary} ${a.tags.join(" ")}`).filter(
      (token) => token.length > 3
    )
  );
  const bText = storyText(b);
  let score = 0;

  for (const token of aTokens) {
    if (bText.includes(token)) score += 1;
  }

  if (a.category === b.category) score += 4;
  if (a.author === b.author) score += 1;
  return score;
}

function uniqueLinkItems(items: InternalLinkItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function toLinkItem(story: EditableStory, reason: string): InternalLinkItem {
  return {
    slug: story.slug,
    title: story.title,
    category: story.category,
    summary: story.summary,
    reason,
  };
}

export function findRelatedStories(
  current: EditableStory,
  stories: EditableStory[],
  limit = 4
) {
  return stories
    .filter((story) => story.slug !== current.slug)
    .map((story) => ({ story, score: overlapScore(current, story) }))
    .filter((item) => item.score > 2)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.story.date.localeCompare(a.story.date);
    })
    .slice(0, limit)
    .map(({ story }) => story);
}

function bestByPhrase(
  current: EditableStory,
  stories: EditableStory[],
  phrase: string,
  allowedCategories: string[],
  limit: number
) {
  const needle = normalizeSearchText(phrase);
  return stories
    .filter((story) => story.slug !== current.slug)
    .filter((story) => allowedCategories.includes(story.category))
    .filter((story) => storyText(story).includes(needle))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

function detectRaceTopic(story: EditableStory) {
  const haystack = storyText(story);
  return raceTopicPhrases.find((phrase) => haystack.includes(normalizeSearchText(phrase)));
}

export function getInternalLinkGroups(
  current: EditableStory,
  stories: EditableStory[]
): InternalLinkGroup[] {
  const groups: InternalLinkGroup[] = [];
  const section = sectionForStory(current);

  const related = findRelatedStories(current, stories, 4);
  if (related.length > 0) {
    groups.push({
      title: section ? `Related ${section.label.toLowerCase()} stories` : "Related stories",
      items: related.map((story) => toLinkItem(story, "Related article")),
    });
  }

  if (current.category === "Clubs") {
    const marinaLinks = findRelatedStories(
      current,
      stories.filter((story) => story.category === "Ports"),
      4
    ).slice(0, 4);
    const fallbackMarinas = stories
      .filter((story) => story.category === "Ports")
      .filter((story) => !marinaLinks.some((item) => item.slug === story.slug))
      .slice(0, 4 - marinaLinks.length);
    const portLinks = [...marinaLinks, ...fallbackMarinas];
    if (portLinks.length > 0) {
      groups.push({
        title: "Related ports and marinas",
        href: "/ports",
        items: portLinks.map((story) => toLinkItem(story, "Port or marina profile")),
      });
    }
  }

  if (current.category === "Ports") {
    const clubLinks = findRelatedStories(
      current,
      stories.filter((story) => story.category === "Clubs"),
      4
    );
    const fallbackClubs = stories
      .filter((story) => story.category === "Clubs")
      .filter((story) => !clubLinks.some((item) => item.slug === story.slug))
      .slice(0, 4 - clubLinks.length);
    const linkedClubs = [...clubLinks, ...fallbackClubs];
    if (linkedClubs.length > 0) {
      groups.push({
        title: "Related yacht and sailing clubs",
        href: "/clubs",
        items: linkedClubs.map((story) => toLinkItem(story, "Club profile")),
      });
    }
  }

  if (current.category === "Boat Reviews") {
    const manufacturer = detectManufacturer(
      `${current.title} ${current.summary} ${current.tags.join(" ")} ${current.body.slice(0, 3).join(" ")}`
    );
    if (manufacturer) {
      const manufacturerLinks = stories
        .filter((story) => story.slug !== current.slug)
        .filter((story) => ["Boat Reviews", "News", "Shows"].includes(story.category))
        .filter((story) => storyMatchesManufacturer(story, manufacturer))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4);
      if (manufacturerLinks.length > 0) {
        groups.push({
          title: `More ${manufacturer.name} stories`,
          href: `/manufacturers/${manufacturer.slug}`,
          items: manufacturerLinks.map((story) =>
            toLinkItem(story, "Builder or manufacturer match")
          ),
        });
      }
    }
  }

  if (current.category === "Racing" || current.category === "Regatta" || current.category === "News") {
    const raceTopic = detectRaceTopic(current);
    if (raceTopic) {
      const raceLinks = bestByPhrase(
        current,
        stories,
        raceTopic,
        ["Racing", "News", "Shows"],
        4
      );
      if (raceLinks.length > 0) {
        groups.push({
          title: `More on ${raceTopic}`,
          href: `/search?q=${encodeURIComponent(raceTopic)}`,
          items: raceLinks.map((story) => toLinkItem(story, "Race or regatta match")),
        });
      }
    }
  }

  return groups
    .map((group) => ({
      ...group,
      items: uniqueLinkItems(group.items),
    }))
    .filter((group) => group.items.length > 0)
    .slice(0, 3);
}
