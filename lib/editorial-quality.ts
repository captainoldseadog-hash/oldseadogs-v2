type PublishableStoryInput = {
  title?: string;
  category?: string;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string | null;
  oldSeaDogsView?: string;
  sourceNotes?: string;
  methodNotes?: string;
  contentBasis?: string;
  noindex?: boolean;
  summary?: string;
  body?: string[] | string;
  status?: string;
};

export type OldSeaDogsStyleReport = {
  sourceWordCount: number;
  generatedWordCount: number;
  oldSeaDogsStyleScore: number;
  narrativeStrength: number;
  originality: number;
  maritimeStorytelling: number;
  prLanguageRemaining: number;
  readability: number;
  humanInterest: number;
  sailingRelevance: number;
  sourceSimilarity: number;
  warnings: string[];
};

export type HeadlineQualityReport = {
  headline: string;
  isGeneric: boolean;
  issues: string[];
  suggestions: string[];
};

export type PublicationWordingWarning = {
  wording: string;
  location: string;
  paragraph: string;
  message: string;
};

export const bannedPublicationPhraseLabels = [
  "AI",
  "generated",
  "prompt",
  "source material",
  "rewritten from",
  "scraped",
  "according to",
  "the main facts are",
  "supporting detail",
  "the story shows",
  "the value of the story",
  "readers will note",
  "worth keeping on the chart",
  "the Old Sea Dogs desk has picked up",
  "the next pass should",
  "there is enough here",
  "internal note",
  "editorial note",
  "debug",
  "placeholder",
  "email header",
  "MIME content",
  "attachment metadata",
  "encoded text",
  "HTML fragment",
  "tracking information",
  "For immediate release",
  "Please find attached",
  "Ends",
  "Click here",
  "Sign up now",
  "Don't miss out",
];

const prLanguagePatterns = [
  /\bannounced\b/i,
  /\baccording to\b/i,
  /\bpress release\b/i,
  /\bthe organisation stated\b/i,
  /\bthe organization stated\b/i,
  /\bdelighted to announce\b/i,
  /\bproud to announce\b/i,
  /\bworld[- ]class\b/i,
  /\bcutting[- ]edge\b/i,
  /\binnovative solution\b/i,
  /\bmarket[- ]leading\b/i,
  /\bgame[- ]changing\b/i,
  /\bstate[- ]of[- ]the[- ]art\b/i,
  /\bpremium experience\b/i,
  /\bunparalleled\b/i,
  /\bexclusive opportunity\b/i,
  /\bseamless experience\b/i,
  /\belevate\b/i,
  /\btransformative\b/i,
  /\bsolution provider\b/i,
  /\bplease find attached\b/i,
  /\bfor immediate release\b/i,
  /\bclick here\b/i,
  /\bsign up now\b/i,
  /\bdon't miss out\b/i,
  /\bdo not miss out\b/i,
  /\bregister now\b/i,
  /\bcall to action\b/i,
];

const headlineHypePatterns: Array<{ label: string; pattern: RegExp; replacement: string }> = [
  { label: "Dazzles", pattern: /\bdazzles?\b/i, replacement: "shows" },
  { label: "Captures the hearts", pattern: /\bcaptures?\s+the\s+hearts?\b/i, replacement: "draws interest from" },
  { label: "Innovation reborn", pattern: /\binnovation\s+reborn\b/i, replacement: "updated design" },
  { label: "Unveils stunning", pattern: /\bunveils?\s+stunning\b/i, replacement: "launches" },
  { label: "Game-changing", pattern: /\bgame[- ]changing\b/i, replacement: "new" },
  { label: "Stunning", pattern: /\bstunning\b/i, replacement: "" },
  { label: "Revolutionary", pattern: /\brevolutionary\b/i, replacement: "new" },
  { label: "World-class", pattern: /\bworld[- ]class\b/i, replacement: "" },
  { label: "Cutting-edge", pattern: /\bcutting[- ]edge\b/i, replacement: "new" },
  { label: "State-of-the-art", pattern: /\bstate[- ]of[- ]the[- ]art\b/i, replacement: "new" },
  { label: "Unmissable", pattern: /\bunmissable\b/i, replacement: "" },
  { label: "Must-see", pattern: /\bmust[- ]see\b/i, replacement: "" },
  { label: "Premium experience", pattern: /\bpremium\s+experience\b/i, replacement: "ticket option" },
  { label: "Exciting", pattern: /\bexciting\b/i, replacement: "" },
];

const vaguePromotionalHeadlinePatterns = [
  /\b(?:set to|ready to|all-new|bold new era|next generation|raises the bar|takes centre stage|makes waves|turns heads)\b/i,
  /\b(?:delighted|proud|thrilled)\s+to\s+(?:announce|launch|welcome)\b/i,
  /\b(?:experience|discover|explore)\s+(?:the\s+)?(?:ultimate|future|magic|beauty)\b/i,
];

const maritimeTerms = [
  "aboard",
  "anchorage",
  "berth",
  "boat",
  "breeze",
  "burgee",
  "chart",
  "club",
  "cockpit",
  "course",
  "crew",
  "deck",
  "dock",
  "fleet",
  "harbour",
  "harbor",
  "helm",
  "hull",
  "keel",
  "knots",
  "leeward",
  "marina",
  "offshore",
  "pontoon",
  "port",
  "race",
  "regatta",
  "rig",
  "sail",
  "seamanship",
  "skipper",
  "starboard",
  "tide",
  "weather",
  "wind",
  "yacht",
];

const storytellingTerms = [
  "breeze",
  "dockside",
  "fleet",
  "harbour",
  "helm",
  "light airs",
  "offshore",
  "squall",
  "tide",
  "weather",
  "wind shift",
  "crew",
  "skipper",
  "line honours",
  "start line",
  "finish line",
  "clubhouse",
];

const humanInterestTerms = [
  "captain",
  "club",
  "commodore",
  "crew",
  "family",
  "founder",
  "member",
  "owner",
  "sailor",
  "skipper",
  "team",
  "volunteer",
  "veteran",
  "visitor",
  "yard",
];

const bannedPublicationPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "AI", pattern: /\bAI\b/i },
  { label: "generated", pattern: /\bgenerated\b/i },
  { label: "prompt", pattern: /\bprompt\b/i },
  { label: "source material", pattern: /\bsource material\b/i },
  { label: "rewritten from", pattern: /\brewritten from\b/i },
  { label: "scraped", pattern: /\bscraped\b/i },
  { label: "according to", pattern: /\baccording to\b/i },
  { label: "the main facts are", pattern: /\bthe main facts are\b/i },
  { label: "supporting detail", pattern: /\bsupporting detail\b/i },
  { label: "the story shows", pattern: /\bthe story shows\b/i },
  { label: "the value of the story", pattern: /\bthe value of the story\b/i },
  { label: "readers will note", pattern: /\breaders will note\b/i },
  { label: "worth keeping on the chart", pattern: /\bworth keeping on the chart\b/i },
  { label: "the Old Sea Dogs desk has picked up", pattern: /\bthe Old Sea Dogs desk has picked up\b/i },
  { label: "the next pass should", pattern: /\bthe next pass should\b/i },
  { label: "there is enough here", pattern: /\bthere is enough here\b/i },
  { label: "internal note", pattern: /\binternal note\b/i },
  { label: "editorial note", pattern: /\beditorial note\b/i },
  { label: "debug", pattern: /\bdebug\b/i },
  { label: "placeholder", pattern: /\bplaceholder\b/i },
  { label: "lorem ipsum", pattern: /\blorem ipsum\b/i },
  { label: "email header", pattern: /^(?:from|to|cc|bcc|subject|date|reply-to|message-id):\s+/im },
  { label: "MIME content", pattern: /\b(?:MIME-Version|Content-Type|Content-Transfer-Encoding|Content-Disposition):/i },
  { label: "attachment metadata", pattern: /\b(?:filename|name)=["']?[^"'\s]+\.(?:jpe?g|png|webp|gif|pdf|docx?)\b/i },
  { label: "encoded text", pattern: /=\?[A-Za-z0-9_-]+\?[BQ]\?[^?]+\?=|=(?:20|3D|E2|80|99|C2|A0)/i },
  { label: "HTML fragment", pattern: /<\/?(?:html|body|div|span|p|br|table|tr|td|a)\b|&(?:nbsp|amp|quot|apos|rsquo|lsquo|ldquo|rdquo);/i },
  { label: "tracking information", pattern: /\b(?:tracking pixel|utm_[a-z]+|mailchimp|campaign monitor|view this email in your browser)\b/i },
  { label: "For immediate release", pattern: /\bfor immediate release\b/i },
  { label: "Please find attached", pattern: /\bplease find attached\b/i },
  { label: "Ends", pattern: /(?:^|\n)\s*ends\s*(?:\n|$)/i },
  { label: "Click here", pattern: /\bclick here\b/i },
  { label: "Sign up now", pattern: /\bsign up now\b/i },
  { label: "Don't miss out", pattern: /\b(?:don't|do not) miss out\b/i },
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function bodyParagraphs(body: PublishableStoryInput["body"]) {
  if (Array.isArray(body)) return body.map((paragraph) => paragraph.trim()).filter(Boolean);
  return String(body ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

export type OldSeaDogsViewQuality = {
  status: "missing" | "boilerplate" | "custom";
  label: string;
};

const oldSeaDogsViewBoilerplatePatterns = [
  /\bthis story matters only if it helps\b/i,
  /\bthe new point should be the named event\b/i,
  /\bold sea dogs treats press releases and organiser statements as a starting point\b/i,
  /\bwhat remains uncertain is the usual waterfront mix\b/i,
  /\bthis story began as a newsroom email\b/i,
  /\bthe item matters only if it changes what sailors\b/i,
  /\btreat it as a pointer, then check the named source before making plans\b/i,
];

export function oldSeaDogsViewQuality(value: string | undefined): OldSeaDogsViewQuality {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return {
      status: "missing",
      label: "Missing Old Sea Dogs View",
    };
  }

  if (oldSeaDogsViewBoilerplatePatterns.some((pattern) => pattern.test(text))) {
    return {
      status: "boilerplate",
      label: "Fallback boilerplate Old Sea Dogs View",
    };
  }

  return {
    status: "custom",
    label: "Custom Old Sea Dogs View",
  };
}

function sentenceCaseHeadline(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function cleanHeadlineHype(value: string) {
  let next = value;
  for (const { pattern, replacement } of headlineHypePatterns) {
    next = next.replace(pattern, replacement);
  }
  return sentenceCaseHeadline(next.replace(/\s+([,:;-])/g, "$1").replace(/\s{2,}/g, " "));
}

function headlineHasSpecificFact(value: string) {
  return (
    /\b\d{4}\b/.test(value) ||
    /\b\d+(?:\.\d+)?\s?(?:ft|m|metre|meter|nm|mile|boat|boats|crew|crews|berth|berths|day|days)\b/i.test(value) ||
    /\b(?:Cowes|Solent|Southampton|Portsmouth|Hamble|Isle of Wight|Round the Island|Fastnet|RYA|marina|yacht club|boat show)\b/i.test(value)
  );
}

export function analyzeHeadlineQuality(input: {
  title?: string;
  category?: string;
  sourceName?: string;
  sourceType?: string;
}): HeadlineQualityReport {
  const headline = (input.title || "").replace(/\s+/g, " ").trim();
  const issues: string[] = [];
  const matchedHype = headlineHypePatterns
    .filter(({ pattern }) => pattern.test(headline))
    .map(({ label }) => label);

  if (!headline) {
    issues.push("Missing headline.");
  }
  if (matchedHype.length > 0) {
    issues.push(`Generic hype language: ${matchedHype.join(", ")}.`);
  }
  if (vaguePromotionalHeadlinePatterns.some((pattern) => pattern.test(headline))) {
    issues.push("Vague promotional headline wording.");
  }
  if (headline && !headlineHasSpecificFact(headline) && headline.split(/\s+/).length < 8) {
    issues.push("Headline is too vague; add a place, date, boat, race, club, marina or concrete change.");
  }

  const cleaned = cleanHeadlineHype(headline);
  const sourceName = input.sourceName?.trim() || "";
  const category = input.category?.trim() || "Sailing";
  const suggestions = [
    cleaned && cleaned !== headline ? cleaned : "",
    sourceName && cleaned ? `${sourceName}: ${cleaned}` : "",
    cleaned ? `${cleaned} - what changes for ${category.toLowerCase()} readers` : "",
  ]
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 3);

  if (issues.length > 0 && suggestions.length === 0 && headline) {
    suggestions.push(`${headline} - dates, place and practical detail confirmed`);
  }

  return {
    headline,
    isGeneric: issues.length > 0,
    issues,
    suggestions,
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]+/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^'+|'+$/g, ""))
    .filter((token) => token.length >= 4)
    .filter((token) => !commonWords.has(token));
}

const commonWords = new Set([
  "about",
  "after",
  "also",
  "been",
  "being",
  "from",
  "have",
  "into",
  "more",
  "than",
  "that",
  "their",
  "there",
  "this",
  "were",
  "with",
  "will",
  "would",
  "your",
]);

function countPatternHits(text: string, patterns: RegExp[]) {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function countTermHits(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0);
}

function sourceSimilarityScore(sourceText: string, generatedText: string) {
  const sourceTokens = new Set(tokenize(sourceText));
  const generatedTokens = new Set(tokenize(generatedText));
  if (sourceTokens.size === 0 || generatedTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of generatedTokens) {
    if (sourceTokens.has(token)) overlap += 1;
  }

  return clampScore((overlap / Math.max(1, generatedTokens.size)) * 100);
}

function averageSentenceWords(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  if (sentences.length === 0) return 0;
  return wordCount(text) / sentences.length;
}

function hasHardOpening(paragraphs: string[]) {
  const opening = paragraphs[0] || "";
  return (
    /\b\d+(?:\.\d+)?\b/.test(opening) ||
    /\b(?:won|wins|victory|crossed|finished|opened|launched|confirmed|revealed|built|delivered|race|regatta|marina|harbour|club|fleet|crew|yacht|boat)\b/i.test(opening) ||
    /\b[A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){1,5}\b/.test(opening)
  );
}

export function analyzeOldSeaDogsStyle(input: {
  sourceText?: string;
  headline?: string;
  excerpt?: string;
  body?: string[] | string;
  category?: string;
}): OldSeaDogsStyleReport {
  const paragraphs = bodyParagraphs(input.body);
  const generatedText = [input.headline || "", input.excerpt || "", ...paragraphs].join("\n");
  const sourceText = input.sourceText || "";
  const generatedWordCount = wordCount(generatedText);
  const sourceWordCount = wordCount(sourceText);
  const maritimeHits = countTermHits(generatedText, maritimeTerms);
  const storytellingHits = countTermHits(generatedText, storytellingTerms);
  const humanHits = countTermHits(generatedText, humanInterestTerms);
  const prHits = countPatternHits(generatedText, prLanguagePatterns);
  const bannedHits = countPatternHits(generatedText, bannedPublicationPatterns.map(({ pattern }) => pattern));
  const similarity = sourceSimilarityScore(sourceText, generatedText);
  const avgSentenceWords = averageSentenceWords(generatedText);
  const paragraphScore = paragraphs.length >= 5 ? 18 : paragraphs.length >= 3 ? 12 : paragraphs.length >= 1 ? 6 : 0;
  const hardOpeningScore = hasHardOpening(paragraphs) ? 22 : 4;
  const category = (input.category || "").toLowerCase();

  const narrativeStrength = clampScore(
    paragraphScore +
      hardOpeningScore +
      Math.min(24, storytellingHits * 6) +
      (generatedWordCount >= 300 ? 18 : generatedWordCount >= 180 ? 8 : 0) +
      (/\b(?:why|because|as|while|but|after|before|during)\b/i.test(generatedText) ? 10 : 0)
  );
  const originality = clampScore(100 - similarity - prHits * 5 - bannedHits * 8);
  const maritimeStorytelling = clampScore(Math.min(100, maritimeHits * 7 + storytellingHits * 8 + (category.match(/\b(races|ports|clubs|destinations|boat reviews)\b/) ? 10 : 0)));
  const prLanguageRemaining = clampScore(prHits * 13 + bannedHits * 12);
  const readability = clampScore(
    78 +
      (avgSentenceWords >= 12 && avgSentenceWords <= 28 ? 12 : -10) +
      (paragraphs.length >= 4 ? 8 : -8) -
      Math.max(0, avgSentenceWords - 34)
  );
  const humanInterest = clampScore(Math.min(100, humanHits * 12 + (/\b[A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){1,5}\b/.test(generatedText) ? 24 : 0)));
  const sailingRelevance = clampScore(Math.min(100, maritimeHits * 9 + (category ? 10 : 0)));
  const oldSeaDogsStyleScore = clampScore(
    narrativeStrength * 0.2 +
      originality * 0.18 +
      maritimeStorytelling * 0.2 +
      readability * 0.14 +
      humanInterest * 0.12 +
      sailingRelevance * 0.16 -
      prLanguageRemaining * 0.16
  );
  const warnings: string[] = [];

  if (generatedWordCount < 300) warnings.push("Too short for a finished OldSeaDogs rewrite.");
  if (sourceWordCount > 0 && similarity >= 42) warnings.push("Too close to the source material; rewrite more strongly.");
  if (prLanguageRemaining >= 25) warnings.push("Reads like a press release; remove PR or marketing language.");
  if (narrativeStrength < 55) warnings.push("Needs stronger narrative flow and a harder opening.");
  if (maritimeStorytelling < 50) warnings.push("Add more maritime atmosphere, seamanship, race, port, club or boat context.");
  if (humanInterest < 35) warnings.push("Add more human interest: crew, sailors, clubs, owners, yards or dockside detail where factual.");
  if (sailingRelevance < 45) warnings.push("Add more sailing or boating relevance.");
  if (oldSeaDogsStyleScore < 60) warnings.push("Needs stronger OldSeaDogs rewrite before publication.");

  return {
    sourceWordCount,
    generatedWordCount,
    oldSeaDogsStyleScore,
    narrativeStrength,
    originality,
    maritimeStorytelling,
    prLanguageRemaining,
    readability,
    humanInterest,
    sailingRelevance,
    sourceSimilarity: similarity,
    warnings,
  };
}

function publicStoryText(story: PublishableStoryInput) {
  return [
    story.title || "",
    story.summary || "",
    ...bodyParagraphs(story.body),
  ].join("\n");
}

export function findBannedPublicationPhrases(story: PublishableStoryInput) {
  const text = publicStoryText(story);
  return bannedPublicationPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}

export function findPublicationWordingWarning(story: PublishableStoryInput): PublicationWordingWarning | null {
  const title = story.title?.trim() || "";
  const summary = story.summary?.trim() || "";
  const paragraphs = bodyParagraphs(story.body);
  const sections = [
    { label: "headline", text: title },
    { label: "summary", text: summary },
    ...paragraphs.map((text, index) => ({ label: `paragraph ${index + 1}`, text })),
  ];

  for (const { label, pattern } of bannedPublicationPatterns) {
    const match = sections.find((section) => pattern.test(section.text));
    if (!match) continue;

    const excerpt = match.text.replace(/\s+/g, " ").trim().slice(0, 180);
    return {
      wording: label,
      location: match.label,
      paragraph: excerpt,
      message: `Blocked wording "${label}" found in ${match.label}: "${excerpt}". Rewrite that sentence so it reports the event directly in OldSeaDogs voice, without source/process wording.`,
    };
  }

  return null;
}

function bannedPhrasePublicationIssue(story: PublishableStoryInput) {
  return findPublicationWordingWarning(story)?.message || "";
}

export function validateStoryForPublication(
  story: PublishableStoryInput
) {
  if (story.status === "draft") return [];

  const issues: string[] = [];
  const title = story.title?.trim() || "";
  const paragraphs = bodyParagraphs(story.body);

  if (!title || /^untitled/i.test(title)) {
    issues.push("Add a proper headline before publishing.");
  }

  if (paragraphs.length === 0) {
    issues.push("Add article body text before publishing.");
  }

  return issues;
}

export function getEditorialWarnings(story: PublishableStoryInput) {
  if (story.status === "draft") return [];

  const warnings: string[] = [];
  const title = story.title?.trim() || "";
  const summary = story.summary?.trim() || "";
  const paragraphs = bodyParagraphs(story.body);
  const words = wordCount(paragraphs.join(" "));
  const sourceType = (story.sourceType || "").toLowerCase();
  const category = (story.category || "").toLowerCase();
  const bannedPhraseIssue = bannedPhrasePublicationIssue(story);
  const headlineReport = analyzeHeadlineQuality({
    title: story.title,
    category: story.category,
    sourceName: story.sourceName,
    sourceType: story.sourceType,
  });
  const styleReport = analyzeOldSeaDogsStyle({
    headline: story.title,
    excerpt: story.summary,
    body: story.body,
    category: story.category,
  });

  if (/\b(insufficient source detail|needs more source detail)\b/i.test(sourceType)) {
    warnings.push("This item is marked as needing more source detail.");
  }
  if (bannedPhraseIssue) warnings.push(bannedPhraseIssue);
  if (title && headlineReport.isGeneric) {
    warnings.push(`Improve the headline: ${headlineReport.issues.join(" ")} Suggested: ${headlineReport.suggestions[0] || "use a factual headline with the place, date and concrete change."}`);
  }
  if (summary.length < 40) warnings.push("Consider adding a useful standfirst or opening summary.");

  const reviewQueueStory = /\b(automatic watch|press release|generated|scrape|source detail)\b/i.test(sourceType);
  if (reviewQueueStory && words < 300) {
    warnings.push("Review-queue, scraped, emailed, or generated article is under 300 words.");
  } else if (!category.match(/\b(clubs|ports)\b/) && words > 0 && words < 120) {
    warnings.push("The article is short; consider adding more useful reporting or background.");
  }

  if (reviewQueueStory && styleReport.oldSeaDogsStyleScore < 55) {
    warnings.push(`OldSeaDogs style score is ${styleReport.oldSeaDogsStyleScore}/100. Consider strengthening the rewrite.`);
  }

  if (reviewQueueStory && styleReport.prLanguageRemaining >= 35) {
    warnings.push("PR or marketing language remains in the story.");
  }

  if (reviewQueueStory && !story.oldSeaDogsView?.trim()) {
    warnings.push("Consider adding an Old Sea Dogs View.");
  }

  if (reviewQueueStory && !story.sourceNotes?.trim() && !story.sourceName?.trim()) {
    warnings.push("Consider adding a source note.");
  }

  const normalizedParagraphs = paragraphs.map((paragraph) => paragraph.toLowerCase().replace(/\s+/g, " ").trim());
  if (normalizedParagraphs.length !== new Set(normalizedParagraphs).size) {
    warnings.push("Duplicate repeated paragraphs were detected.");
  }

  return [...new Set(warnings.filter(Boolean))];
}
