import { createSafeId } from "./safe-id";
import { analyzeOldSeaDogsStyle, type OldSeaDogsStyleReport } from "./editorial-quality";

export type PressReleaseStatus =
  | "new"
  | "reviewed"
  | "accepted"
  | "archived"
  | "rejected"
  | "spam"
  | "converted"
  | "published"
  | "needsDetail";

export type PressReleaseAttachment = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  dataUrl: string;
  suggestedCredit: string;
  caption: string;
  rightsNote: string;
};

export type ParsedPressReleaseEmail = {
  messageId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  receivedAt: string;
  preview: string;
  bodyText: string;
  rawEmail: string;
  attachments: PressReleaseAttachment[];
  photoCredits: string[];
  cleaningWarnings: string[];
};

export type EmailIngestionSettings = {
  methods: string[];
  inboxConfigured: boolean;
  connectionStatus: "configured" | "not-configured";
  connectionTest: "not-run" | "ready";
  lastFetch: string;
  lastSuccess: string;
  lastError: string;
  provider: string;
  folders: string[];
  environmentKeys: string[];
  configuredEnvironmentKeys: string[];
  missingEnvironmentKeys: string[];
  secretEnvironmentKeys: string[];
  status: string;
  note: string;
  storageMode: string;
  storageDetail: string;
};

export type GeneratedPressArticle = {
  title: string;
  excerpt: string;
  body: string[];
  category: string;
  wordCount: number;
  status: "ready" | "needsDetail";
  warnings: string[];
  styleReport: OldSeaDogsStyleReport;
};

export type PressReleaseCleaningPreview = {
  rawWordCount: number;
  cleanedWordCount: number;
  removedBoilerplateCount: number;
  removedUrlCount: number;
  removedBrokenCharacterCount: number;
  extractedPhotoCredits: string[];
  warnings: string[];
  cleanedText: string;
};

type ParseInput = {
  rawEmail?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  receivedAt?: string;
  bodyText?: string;
  attachments?: PressReleaseAttachment[];
};

const marineKeywords = [
  "sail",
  "sailing",
  "yacht",
  "yachting",
  "boat",
  "boating",
  "marina",
  "harbour",
  "harbor",
  "port",
  "regatta",
  "race",
  "racing",
  "offshore",
  "cruising",
  "superyacht",
  "classic yacht",
  "club",
  "lifeboat",
  "chandlery",
  "marine",
  "naval",
  "seamanship",
  "launch",
  "sea trial",
  "boat show",
];

const spamKeywords = [
  "crypto",
  "casino",
  "loan",
  "forex",
  "nft",
  "guaranteed income",
  "weight loss",
  "seo package",
  "lead generation",
  "wire transfer",
  "limited time offer",
];

const bannedSourcePhrases = [
  /\baccording to\b/gi,
  /\breported by\b/gi,
  /\bscraped from\b/gi,
  /\bpicked up from\b/gi,
  /\bsource material\b/gi,
  /\bsource article\b/gi,
  /\bpress release\b/gi,
  /\bshowcased\b/gi,
  /\bdazzles\b/gi,
  /\bgame-changing\b/gi,
  /\bcaptures the hearts\b/gi,
  /\binnovation reborn\b/gi,
  /\bunveils stunning\b/gi,
  /\bthe old sea dogs desk\b/gi,
  /\bsail world\b/gi,
  /\bboat international\b/gi,
  /\bmby\b/gi,
  /\bsuperyachtnews\b/gi,
];

const generatedArticleRejectPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "email header", pattern: /^(?:from|to|cc|bcc|subject|date|reply-to|message-id):\s+/im },
  { label: "MIME content", pattern: /\b(?:MIME-Version|Content-Type|Content-Transfer-Encoding|Content-Disposition):/i },
  { label: "attachment metadata", pattern: /\b(?:filename|name)=["']?[^"'\s]+\.(?:jpe?g|png|webp|gif|pdf|docx?)\b/i },
  { label: "encoded text", pattern: /=\?[A-Za-z0-9_-]+\?[BQ]\?[^?]+\?=|=(?:20|3D|E2|80|99|C2|A0)/i },
  { label: "HTML fragment", pattern: /<\/?(?:html|body|div|span|p|br|table|tr|td|a)\b|&(?:nbsp|amp|quot|apos|rsquo|lsquo|ldquo|rdquo);/i },
  { label: "tracking information", pattern: /\b(?:tracking pixel|utm_[a-z]+|mailchimp|campaign monitor|view this email in your browser)\b/i },
  { label: "press boilerplate", pattern: /\b(?:for immediate release|please find attached|click here|sign up now|don't miss out|do not miss out)\b/i },
  { label: "standalone ends marker", pattern: /(?:^|\n)\s*ends\s*(?:\n|$)/i },
  { label: "promotional call to action", pattern: /\b(?:register now|book now|buy now|limited time|exclusive offer|call to action)\b/i },
];

const fillerPatterns = [
  /\bthe value of the story\b/i,
  /\bthe story highlights\b/i,
  /\bthe story reveals\b/i,
  /\breaders will note\b/i,
  /\bsailors may wonder\b/i,
  /\bowners should consider\b/i,
  /\bthe facts suggest\b/i,
  /\bthe article shows\b/i,
  /\bwhat matters here\b/i,
  /\bthe bigger picture\b/i,
  /\bthe wider meaning\b/i,
  /\bkey takeaway\b/i,
  /\btaken together\b/i,
  /\bit is another reminder\b/i,
  /\bthe course is clear\b/i,
];

type RuntimeProcessLike = {
  env?: Record<string, string | undefined>;
};

type RuntimeBufferLike = {
  from(value: string, encoding: "base64" | "binary" | "utf8"): { toString(encoding: "utf8" | "binary"): string };
};

type EmailStorageStatus = {
  mode: string;
  persistent: boolean;
  detail: string;
};

const runtimeProcess = (globalThis as typeof globalThis & { process?: RuntimeProcessLike }).process;

function configuredEnvKey(...keys: string[]) {
  return keys.find((key) => Boolean(runtimeProcess?.env?.[key]?.trim())) || "";
}

function configuredEnvValue(...keys: string[]) {
  const key = configuredEnvKey(...keys);
  return key ? String(runtimeProcess?.env?.[key] || "").trim() : "";
}

export function getEmailIngestionSettings(storage?: EmailStorageStatus): EmailIngestionSettings {
  const configuredEnvironmentKeys = [
    configuredEnvKey("OLDSEADOGS_INBOX_PROVIDER", "OLDSEADOGS_EMAIL_PROVIDER"),
    configuredEnvKey("OLDSEADOGS_INBOX_USER", "OLDSEADOGS_IMAP_USER"),
    configuredEnvKey("OLDSEADOGS_INBOX_HOST", "OLDSEADOGS_IMAP_HOST"),
    configuredEnvKey("OLDSEADOGS_INBOX_PORT", "OLDSEADOGS_IMAP_PORT"),
    configuredEnvKey("OLDSEADOGS_INBOX_SECURE"),
    configuredEnvKey("OLDSEADOGS_INBOX_PASSWORD", "OLDSEADOGS_INBOX_TOKEN", "OLDSEADOGS_IMAP_PASSWORD"),
  ].filter(Boolean);
  const missingEnvironmentKeys = [
    ["OLDSEADOGS_INBOX_PROVIDER", "OLDSEADOGS_EMAIL_PROVIDER"],
    ["OLDSEADOGS_INBOX_USER", "OLDSEADOGS_IMAP_USER"],
    ["OLDSEADOGS_INBOX_HOST", "OLDSEADOGS_IMAP_HOST"],
    ["OLDSEADOGS_INBOX_PORT", "OLDSEADOGS_IMAP_PORT"],
    ["OLDSEADOGS_INBOX_SECURE"],
    ["OLDSEADOGS_INBOX_PASSWORD", "OLDSEADOGS_INBOX_TOKEN", "OLDSEADOGS_IMAP_PASSWORD"],
  ]
    .filter((keys) => !configuredEnvKey(...keys))
    .map((keys) =>
      keys[0] === "OLDSEADOGS_INBOX_PASSWORD"
        ? "OLDSEADOGS_INBOX_PASSWORD or OLDSEADOGS_INBOX_TOKEN"
        : keys[0]
    );
  const inboxConfigured = missingEnvironmentKeys.length === 0;
  const storageDetail =
    storage?.detail ||
    "Newsroom items use the configured editor storage. On the live DigitalOcean site this is the private server-side JSON store unless a database adapter is attached.";

  return {
    methods: [
      "Paste or type press-release text into the editor",
      "Upload a .eml email file",
      "Attach press-release photos and review thumbnails",
      "Generate, edit, approve, reject, draft and publish from the private queue",
    ],
    inboxConfigured,
    connectionStatus: inboxConfigured ? "configured" : "not-configured",
    connectionTest: inboxConfigured ? "ready" : "not-run",
    lastFetch: "",
    lastSuccess: "",
    lastError: "",
    provider: configuredEnvValue("OLDSEADOGS_INBOX_PROVIDER", "OLDSEADOGS_EMAIL_PROVIDER") || "Not configured",
    folders: ["Inbox", "Unread", "Read", "Archive", "Rejected"],
    environmentKeys: [
      "OLDSEADOGS_INBOX_PROVIDER",
      "OLDSEADOGS_INBOX_USER",
      "OLDSEADOGS_INBOX_HOST",
      "OLDSEADOGS_INBOX_PORT",
      "OLDSEADOGS_INBOX_SECURE",
      "OLDSEADOGS_INBOX_PASSWORD or OLDSEADOGS_INBOX_TOKEN",
    ],
    configuredEnvironmentKeys,
    missingEnvironmentKeys,
    secretEnvironmentKeys: ["OLDSEADOGS_INBOX_PASSWORD", "OLDSEADOGS_INBOX_TOKEN", "OLDSEADOGS_IMAP_PASSWORD"],
    status: inboxConfigured
      ? "Newsroom tools are available on the live site. Inbox connection is configured."
      : "Newsroom tools are available on the live site. Inbox connection is not configured yet.",
    note: inboxConfigured
      ? "Paste or upload .eml press releases here, or connect live inbox fetching from server environment variables. Secrets are checked only on the server and are never shown in the editor."
      : "Paste or upload .eml press releases here. Email inbox import requires server environment variables before live fetching can run.",
    storageMode: storage?.mode || "editor-storage",
    storageDetail,
  };
}

export function makePressAttachment(input: {
  filename: string;
  contentType: string;
  size: number;
  dataUrl: string;
  bodyText?: string;
}): PressReleaseAttachment {
  return {
    id: createSafeId("att"),
    filename: input.filename,
    contentType: input.contentType,
    size: input.size,
    dataUrl: input.dataUrl,
    suggestedCredit: extractPhotoCredit(`${input.bodyText || ""}\n${input.filename}`),
    caption: filenameToCaption(input.filename),
    rightsNote: "",
  };
}

export function parsePressReleaseEmail(input: ParseInput): ParsedPressReleaseEmail {
  const rawEmail = input.rawEmail || "";
  const parsed = rawEmail ? parseRawEmail(rawEmail) : null;
  const sender = parseSender(input.senderEmail || parsed?.from || "");
  const subject = cleanSubject(input.subject || parsed?.subject || "Untitled press release");
  const cleaningPreview = cleanEmailBodyWithStats(input.bodyText || parsed?.bodyText || rawEmail);
  const bodyText = cleaningPreview.cleanedText;
  const receivedAt = normalizeDate(input.receivedAt || parsed?.date || new Date().toISOString());
  const fallbackCredit = cleaningPreview.extractedPhotoCredits[0] || "";
  const attachments = [
    ...(input.attachments || []),
    ...((parsed?.attachments || []).map((attachment) => ({
      ...attachment,
      suggestedCredit: attachment.suggestedCredit || extractPhotoCredit(`${bodyText}\n${attachment.filename}`) || fallbackCredit,
      caption: attachment.caption || filenameToCaption(attachment.filename),
    }))),
  ];

  return {
    messageId: parsed?.messageId || "",
    senderName: input.senderName || sender.name,
    senderEmail: input.senderEmail || sender.email,
    subject,
    receivedAt,
    preview: makePreview(bodyText || subject),
    bodyText,
    rawEmail,
    attachments,
    photoCredits: cleaningPreview.extractedPhotoCredits,
    cleaningWarnings: cleaningPreview.warnings,
  };
}

export function senderDomain(senderEmail: string) {
  const domain = senderEmail.split("@")[1]?.trim().toLowerCase() || "";
  return domain.replace(/^www\./, "");
}

export function classifyPressRelease(input: {
  subject: string;
  bodyText: string;
  senderEmail: string;
  blockedValues: string[];
}) {
  const haystack = `${input.subject}\n${input.bodyText}\n${input.senderEmail}`.toLowerCase();
  const blockedValues = new Set(input.blockedValues.map((value) => value.toLowerCase()));
  const domain = senderDomain(input.senderEmail);
  const warnings: string[] = [];
  let score = 0;

  for (const keyword of marineKeywords) {
    if (haystack.includes(keyword)) score += 2;
  }
  for (const keyword of spamKeywords) {
    if (haystack.includes(keyword)) score -= 4;
  }

  if (blockedValues.has(input.senderEmail.toLowerCase()) || (domain && blockedValues.has(domain))) {
    warnings.push("Sender or domain is blocked.");
    return { status: "spam" as PressReleaseStatus, score: -20, warnings };
  }

  if (score < -1) warnings.push("Looks like non-marine spam or generic marketing.");
  if (score < 2) warnings.push("Marine relevance is low; review before generating.");

  return {
    status: score < -1 ? ("spam" as PressReleaseStatus) : ("new" as PressReleaseStatus),
    score,
    warnings,
  };
}

export function detectDuplicatePressRelease(
  candidate: Pick<ParsedPressReleaseEmail, "subject" | "senderEmail" | "bodyText">,
  existing: Array<{ id: string; subject: string; senderEmail: string; bodyText: string; receivedAt: string }>
) {
  const candidateSubject = normalizeForCompare(candidate.subject);
  const candidateBody = normalizeForCompare(candidate.bodyText);
  const candidateTokens = tokenSet(candidateBody);
  let best: { id: string; score: number } | null = null;

  for (const item of existing) {
    const subjectScore = candidateSubject && candidateSubject === normalizeForCompare(item.subject) ? 0.52 : 0;
    const senderScore = item.senderEmail.toLowerCase() === candidate.senderEmail.toLowerCase() ? 0.16 : 0;
    const overlap = tokenOverlap(candidateTokens, tokenSet(normalizeForCompare(item.bodyText)));
    const score = Math.min(1, subjectScore + senderScore + overlap * 0.48);
    if (!best || score > best.score) best = { id: item.id, score };
  }

  return best && best.score >= 0.72 ? best : null;
}

export function suggestPressReleaseCategory(subject: string, bodyText: string) {
  const text = `${subject} ${bodyText}`.toLowerCase();
  if (/regatta|race|racing|fastnet|cowes week|fleet|line honours|championship|trophy|series/.test(text)) return "Races";
  if (/review|sea trial|test|launch|new model|flybridge|cruiser|rib|motor yacht|sundancer|sunseeker|princess|beneteau|jeanneau/.test(text)) return "Boat Reviews";
  if (/boat show|yacht show|southampton|monaco yacht show|cannes|show stand|exhibition/.test(text)) return "Shows";
  if (/yacht club|sailing club|commodore|clubhouse|members|burgee/.test(text)) return "Clubs";
  if (/marina|harbour|harbor|port|berth|visitor berth|pontoon|fuel dock/.test(text)) return "Ports";
  if (/destination|cruising ground|anchorage|island|coast|bay|inlet/.test(text)) return "Destinations";
  if (/gear|equipment|electronics|plotter|battery|engine|rigging|sailcloth|chandlery/.test(text)) return "Gear";
  if (/lifestyle|restaurant|hotel|watch|clothing|concours|classic yacht/.test(text)) return "Lifestyle";
  return "News";
}

export function generateOldSeaDogsPressArticle(input: {
  subject: string;
  bodyText: string;
  category?: string;
}): GeneratedPressArticle {
  const cleanText = cleanEmailBody(input.bodyText);
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map(cleanArticleSentence)
    .filter(Boolean)
    .filter((sentence) => sentence.length > 28)
    .filter(isPublishableNewsSentence)
    .filter((sentence) => !fillerPatterns.some((pattern) => pattern.test(sentence)));
  const sourceWordCount = wordCount(cleanText);
  const warnings: string[] = [];
  const category = input.category || suggestPressReleaseCategory(input.subject, cleanText);
  const title = seoHeadlineFromSubject(input.subject, cleanText, category);
  const emptyStyleReport = analyzeOldSeaDogsStyle({
    sourceText: cleanText,
    headline: title,
    excerpt: "",
    body: [],
    category,
  });

  if (sourceWordCount < 220 || sentences.length < 6) {
    return {
      title,
      excerpt:
        "Insufficient source detail for publication. Add more facts, dates, names, places or specifications before generating a full Old Sea Dogs article.",
      body: [],
      category,
      wordCount: 0,
      status: "needsDetail",
      warnings: ["Insufficient source detail for publication."],
      styleReport: emptyStyleReport,
    };
  }

  const factSentences = sentences.filter(hasUsefulFact);
  const chosen = uniqueSentences((factSentences.length >= 7 ? factSentences : sentences).slice(0, 44));
  const paragraphs = groupSentences(chosen);
  const lead = makeLeadParagraph(title, chosen[0] || cleanText.split(/\n/)[0] || "");
  const body = [
    lead,
    ...oldSeaDogsContextParagraphs(category, title, chosen),
    ...paragraphs,
  ].map(cleanArticleParagraph).filter(Boolean);
  const excerpt = makeThirtyWordSummary(cleanArticleSentence(chosen[0] || lead), title);
  let finalBody = ensureClosingParagraph(body, category);
  finalBody = finalBody
    .map(cleanArticleParagraph)
    .filter(Boolean)
    .filter((paragraph) => !fillerPatterns.some((pattern) => pattern.test(paragraph)))
    .filter(isPublishableNewsSentence);
  finalBody = uniqueParagraphs(finalBody);

  const generatedWordCount = wordCount(finalBody.join(" "));
  const qualityWarnings = validateGeneratedArticleQuality({
    title,
    excerpt,
    body: finalBody,
    sourceWordCount,
    category,
  });
  const styleReport = analyzeOldSeaDogsStyle({
    sourceText: cleanText,
    headline: title,
    excerpt,
    body: finalBody,
    category,
  });
  if (sourceWordCount >= 420 && generatedWordCount < 400) {
    warnings.push("Generated article is under 400 words; add more source detail or editorial expansion before publishing.");
  } else if (generatedWordCount < 300) {
    warnings.push("Generated article is under 300 words; review before using.");
  }
  warnings.push(...styleReport.warnings);
  warnings.push(...qualityWarnings);
  if (
    generatedWordCount < 260 ||
    (sourceWordCount >= 420 && generatedWordCount < 360) ||
    qualityWarnings.some((warning) => /^Rejected by newsroom quality check:/.test(warning))
  ) {
    return {
      title,
      excerpt:
        "Insufficient source detail for publication. The email does not yet contain enough clean, factual material for a full article.",
      body: [],
      category,
      wordCount: generatedWordCount,
      status: "needsDetail",
      warnings: [...new Set(["Insufficient source detail for publication.", ...styleReport.warnings, ...qualityWarnings])],
      styleReport,
    };
  }

  return {
    title,
    excerpt,
    body: finalBody,
    category,
    wordCount: generatedWordCount,
    status: "ready",
    warnings: [...new Set(warnings)],
    styleReport,
  };
}

export function extractPhotoCredit(text: string) {
  const patterns = [
    /(?:photo|image|picture|credit)\s*(?:by|:|-)\s*([^\n\r.;]+)/i,
    /\u00a9\s*([^\n\r.;]+)/i,
    /copyright\s*(?:by|:|-)?\s*([^\n\r.;]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const credit = match[1].replace(/\s+/g, " ").trim();
      if (credit.length >= 2 && credit.length <= 90) {
        return credit.startsWith("\u00a9") ? credit : `\u00a9 ${credit}`;
      }
    }
  }

  return "";
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function previewPressReleaseCleaning(value: string): PressReleaseCleaningPreview {
  return cleanEmailBodyWithStats(value);
}

export function cleanPressReleaseText(value: string) {
  const safeInlineImage = normalizeTrustedInlineImageFigure(value);
  if (safeInlineImage) return safeInlineImage;
  const safeInlineToken = normalizeTrustedInlineImageToken(value);
  if (safeInlineToken) return safeInlineToken;
  const safeVideoToken = normalizeTrustedVideoToken(value);
  if (safeVideoToken) return safeVideoToken;
  return cleanEmailBody(value);
}

export function cleanPressReleaseHeadline(value: string) {
  return cleanSubject(value);
}

function parseRawEmail(rawEmail: string) {
  const normal = rawEmail.replace(/\r\n/g, "\n");
  const splitIndex = normal.search(/\n\s*\n/);
  const headerText = splitIndex >= 0 ? normal.slice(0, splitIndex) : "";
  const bodyText = splitIndex >= 0 ? normal.slice(splitIndex).trim() : normal.trim();
  const headers = parseHeaders(headerText);
  const contentType = headers.get("content-type") || "";
  const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1] || "";
  const attachments: PressReleaseAttachment[] = [];
  const textParts: string[] = [];

  if (boundary) {
    const parts = bodyText.split(`--${boundary}`);
    for (const part of parts) {
      const parsedPart = parseMimePart(part);
      if (!parsedPart) continue;
      if (parsedPart.kind === "text") textParts.push(parsedPart.text);
      if (parsedPart.kind === "attachment") attachments.push(parsedPart.attachment);
    }
  }

  return {
    messageId: stripAngles(headers.get("message-id") || ""),
    from: decodeMimeWords(headers.get("from") || ""),
    subject: decodeMimeWords(headers.get("subject") || ""),
    date: headers.get("date") || "",
    bodyText: textParts.length ? cleanEmailBody(textParts.join("\n\n")) : cleanEmailBody(bodyText),
    attachments,
  };
}

function parseMimePart(part: string) {
  const trimmed = part.trim();
  if (!trimmed || trimmed === "--") return null;
  const splitIndex = trimmed.search(/\n\s*\n/);
  if (splitIndex < 0) return null;
  const headers = parseHeaders(trimmed.slice(0, splitIndex));
  const body = trimmed.slice(splitIndex).trim();
  const contentType = (headers.get("content-type") || "text/plain").toLowerCase();
  const disposition = (headers.get("content-disposition") || "").toLowerCase();
  const transferEncoding = (headers.get("content-transfer-encoding") || "").toLowerCase();
  const filename =
    headers.get("content-disposition")?.match(/filename="?([^";]+)"?/i)?.[1] ||
    headers.get("content-type")?.match(/name="?([^";]+)"?/i)?.[1] ||
    "";

  if (contentType.startsWith("image/")) {
    const cleanBase64 = transferEncoding.includes("base64")
      ? body.replace(/\s+/g, "")
      : stringToBase64(body);
    const size = Math.ceil((cleanBase64.length * 3) / 4);
    return {
      kind: "attachment" as const,
      attachment: makePressAttachment({
        filename: decodeMimeWords(filename || "press-release-photo.jpg"),
        contentType: contentType.split(";")[0],
        size,
        dataUrl: `data:${contentType.split(";")[0]};base64,${cleanBase64}`,
      }),
    };
  }

  if (contentType.includes("text/plain") || contentType.includes("text/html")) {
    const decoded = decodeBody(body, transferEncoding);
    return {
      kind: "text" as const,
      text: contentType.includes("text/html") ? htmlToText(decoded) : decoded,
    };
  }

  if (disposition.includes("attachment")) return null;
  return null;
}

function parseHeaders(headerText: string) {
  const headers = new Map<string, string>();
  const unfolded = headerText.replace(/\n[ \t]+/g, " ");
  for (const line of unfolded.split("\n")) {
    const index = line.indexOf(":");
    if (index <= 0) continue;
    headers.set(line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim());
  }
  return headers;
}

function parseSender(value: string) {
  const decoded = decodeMimeWords(value);
  const bracketMatch = decoded.match(/^(.*?)<([^>]+)>/);
  const email = (bracketMatch?.[2] || decoded.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "").trim();
  const name = (bracketMatch?.[1] || decoded.replace(email, "") || email.split("@")[0] || "Unknown sender")
    .replace(/^"|"$/g, "")
    .trim();
  return { name, email };
}

function decodeMimeWords(value: string) {
  return value.replace(/=\?([^?]+)\?([bq])\?([^?]+)\?=/gi, (_match, _charset, encoding, text) => {
    try {
      if (encoding.toLowerCase() === "b") return base64ToString(text);
      return decodeQuotedPrintableText(text.replace(/_/g, " "));
    } catch {
      return text;
    }
  });
}

function decodeBody(value: string, encoding: string) {
  if (encoding.includes("base64")) return base64ToString(value.replace(/\s+/g, ""));
  if (encoding.includes("quoted-printable")) return decodeQuotedPrintableText(value);
  return value;
}

function base64ToString(value: string) {
  const buffer = (globalThis as typeof globalThis & { Buffer?: RuntimeBufferLike }).Buffer;
  if (buffer) {
    try {
      return buffer.from(value, "base64").toString("utf8");
    } catch {
      // Fall through to browser-safe decoding.
    }
  }

  try {
    return decodeURIComponent(
      Array.from(atob(value), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
    );
  } catch {
    return atob(value);
  }
}

function decodeBinaryUtf8(value: string) {
  const buffer = (globalThis as typeof globalThis & { Buffer?: RuntimeBufferLike }).Buffer;
  if (buffer) {
    try {
      return buffer.from(value, "binary").toString("utf8");
    } catch {
      return value;
    }
  }

  try {
    return decodeURIComponent(
      Array.from(value, (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
    );
  } catch {
    return value;
  }
}

function decodeQuotedPrintableText(value: string) {
  const binary = value
    .replace(/=\r?\n/g, "")
    .replace(/=([a-f0-9]{2})/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
  return decodeBinaryUtf8(binary);
}

function stringToBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function stripAngles(value: string) {
  return value.replace(/^<|>$/g, "").trim();
}

function normalizeDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function cleanSubject(value: string) {
  return cleanTextEncoding(decodeHtmlEntities(value))
    .replace(/^\s*(fw|fwd|re):\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headlineFromSubject(value: string) {
  const headline = cleanSubject(value)
    .replace(/\bpress release\b/gi, "")
    .replace(/\bfor immediate release\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+[-|]\s*$/, "")
    .trim();
  return headline || "Marine News Update";
}

function seoHeadlineFromSubject(subject: string, bodyText: string, category: string) {
  const base = headlineFromSubject(subject);
  if (base !== "Marine News Update" && wordCount(base) >= 4) return base.slice(0, 96);

  const namedFact = firstNamedFact(
    bodyText
      .split(/(?<=[.!?])\s+/)
      .map(cleanArticleSentence)
      .filter(Boolean)
  );
  const categoryLead = category === "Races" ? "Sailing Race" : category || "Marine News";
  const headline = [namedFact, categoryLead].filter(Boolean).join(": ");
  return headline.slice(0, 96) || "Old Sea Dogs Maritime News Update";
}

function makeThirtyWordSummary(value: string, fallbackTitle: string) {
  const words = cleanArticleSentence(value || fallbackTitle)
    .replace(/\s+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const summaryWords = words.slice(0, 30);
  const summary = summaryWords.join(" ").replace(/[,:;—-]+$/g, "").trim();
  if (!summary) return cleanArticleSentence(fallbackTitle).slice(0, 220);
  return /[.!?]$/.test(summary) ? summary : `${summary}.`;
}

function cleanEmailBody(value: string) {
  return cleanEmailBodyWithStats(value).cleanedText;
}

function cleanEmailBodyWithStats(value: string): PressReleaseCleaningPreview {
  const raw = value || "";
  const htmlText = htmlToText(decodeQuotedPrintableText(raw))
    .replace(/--[=_a-z0-9'()+,./:-]{8,}\s*--?/gi, "\n")
    .replace(/^Content-(?:Type|Transfer-Encoding|Disposition):.*$/gim, "")
    .replace(/^MIME-Version:.*$/gim, "")
    .replace(/^boundary="?[^"\n]+"?$/gim, "")
    .replace(/^--[^\s]{8,}--?$/gim, "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ");
  const rawWordCount = wordCount(htmlText);
  const stats = {
    removedBoilerplateCount: 0,
    removedUrlCount: 0,
    removedBrokenCharacterCount: countBrokenEncoding(raw),
  };
  const extractedPhotoCredits: string[] = [];
  const cleanedLines: string[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const credit = extractPhotoCreditLine(rawLine);
    if (credit) pushUnique(extractedPhotoCredits, credit);
  }

  for (const rawLine of htmlText.split("\n")) {
    const initialLine = rawLine.trim();
    if (!initialLine) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== "") cleanedLines.push("");
      continue;
    }

    const photoCredit = extractPhotoCreditLine(initialLine);
    if (photoCredit) {
      pushUnique(extractedPhotoCredits, photoCredit);
      stats.removedBoilerplateCount += 1;
      continue;
    }

    let line = cleanTextEncoding(decodeHtmlEntities(initialLine));
    const barePhotoCredit = extractBarePhotoCreditLine(line);
    if (barePhotoCredit && extractedPhotoCredits.includes(barePhotoCredit)) {
      stats.removedBoilerplateCount += 1;
      continue;
    }

    if (isBoilerplateLine(line)) {
      stats.removedBoilerplateCount += 1;
      continue;
    }

    if (isDownloadInstructionLine(line)) {
      stats.removedBoilerplateCount += 1;
      stats.removedUrlCount += countUrls(line);
      continue;
    }

    const urlCount = countUrls(line);
    if (urlCount > 0 && shouldRemoveWholeUrlLine(line)) {
      stats.removedUrlCount += urlCount;
      continue;
    }

    line = removeInlineUrls(line, (count) => {
      stats.removedUrlCount += count;
    });
    const quotedPrintableCount = countQuotedPrintableFragments(line);
    stats.removedBrokenCharacterCount += quotedPrintableCount;
    line = line
      .replace(/=([a-f0-9]{2})/gi, " ")
      .replace(/\bcid:[^\s)]+/gi, " ")
      .replace(/\s+\(\s*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

    line = cleanTextEncoding(line).replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();
    if (!line || isBoilerplateLine(line) || isDownloadInstructionLine(line)) {
      stats.removedBoilerplateCount += 1;
      continue;
    }

    const secondPhotoCredit = extractPhotoCreditLine(line);
    if (secondPhotoCredit) {
      pushUnique(extractedPhotoCredits, secondPhotoCredit);
      stats.removedBoilerplateCount += 1;
      continue;
    }

    cleanedLines.push(line);
  }

  const cleanedText = cleanedLines
    .join("\n")
    .replace(/[ \u00a0]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const cleanedWordCount = wordCount(cleanedText);
  const warnings: string[] = [];

  if (cleanedWordCount < 120) {
    warnings.push("Cleaned import has very little usable editorial text.");
  }
  if (stats.removedBoilerplateCount > 0 || stats.removedUrlCount > 0 || stats.removedBrokenCharacterCount > 0) {
    warnings.push("Newsletter boilerplate, raw links or broken characters were removed before generation.");
  }
  if (extractedPhotoCredits.length > 0) {
    warnings.push("Photo credit lines were extracted from the body and kept for image metadata.");
  }

  return {
    rawWordCount,
    cleanedWordCount,
    removedBoilerplateCount: stats.removedBoilerplateCount,
    removedUrlCount: stats.removedUrlCount,
    removedBrokenCharacterCount: stats.removedBrokenCharacterCount,
    extractedPhotoCredits,
    warnings,
    cleanedText,
  };
}

function htmlToText(value: string) {
  return cleanTextEncoding(decodeHtmlEntities(value))
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(?:div|section|article|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripSmallHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function readHtmlAttribute(value: string, name: string) {
  const match = value.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i"));
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : "";
}

function normalizeTrustedInlineImageToken(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^\[image:(\/api\/media\/[^|\]\s]+)(?:\|([^\]]*))?(?:\|([^\]]*))?\]$/);
  if (!match) return "";
  const url = match[1].trim();
  const caption = (match[2] || "").replace(/\s+/g, " ").trim();
  const credit = (match[3] || "").replace(/\s+/g, " ").trim();
  return `[image:${url}${caption || credit ? `|${caption}` : ""}${credit ? `|${credit}` : ""}]`;
}

function normalizeTrustedVideoToken(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^\[video:(https?:\/\/[^|\]\s]+)(?:\|([^\]]*))?(?:\|([^\]]*))?(?:\|([^\]]*))?\]$/);
  if (!match) return "";
  const url = match[1].trim();
  if (!isTrustedVideoUrl(url)) return "";
  const placement = cleanVideoTokenPart(match[2] || "inline video");
  const caption = cleanVideoTokenPart(match[3] || "");
  const credit = cleanVideoTokenPart(match[4] || "");
  return `[video:${url}|${placement}${caption || credit ? `|${caption}` : ""}${credit ? `|${credit}` : ""}]`;
}

function isTrustedVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "vimeo.com" ||
      host === "player.vimeo.com"
    );
  } catch {
    return false;
  }
}

function cleanVideoTokenPart(value: string) {
  return cleanEmailBody(value)
    .replace(/[\[\]|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function normalizeTrustedInlineImageFigure(value: string) {
  const trimmed = value.trim();
  const figureMatch = trimmed.match(/^<figure\s+[^>]*class=["'][^"']*\barticle-inline-image\b[^"']*["'][^>]*>([\s\S]*?)<\/figure>$/i);
  if (!figureMatch) return "";

  const openingTag = trimmed.match(/^<figure\s+([^>]*)>/i)?.[1] || "";
  const figureBody = figureMatch[1] || "";
  const imageMatch = figureBody.match(/<img\s+([^>]*?)>/i);
  if (!imageMatch) return "";

  const imageAttributes = imageMatch[1] || "";
  const src = readHtmlAttribute(` ${imageAttributes}`, "src");
  if (!src.startsWith("/api/media/")) return "";

  const mediaId = src.match(/\/api\/media\/([^/?#]+)/)?.[1] || "";
  const alt = readHtmlAttribute(` ${imageAttributes}`, "alt") || "Old Sea Dogs newsroom image";
  const captionAttribute = readHtmlAttribute(` ${openingTag}`, "data-caption");
  const creditAttribute = readHtmlAttribute(` ${openingTag}`, "data-credit");
  const figcaption = stripSmallHtml(figureBody.match(/<figcaption>([\s\S]*?)<\/figcaption>/i)?.[1] || "");
  const caption = captionAttribute || figcaption;
  const credit = creditAttribute;
  const captionBlock = caption ? `<figcaption>${escapeHtmlAttribute(caption)}</figcaption>` : "";

  return `<figure class="article-inline-image" data-media-id="${escapeHtmlAttribute(mediaId)}" data-caption="${escapeHtmlAttribute(caption)}" data-credit="${escapeHtmlAttribute(credit)}"><img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}" loading="lazy" />${captionBlock}</figure>`;
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    copy: "\u00a9",
    euro: "EUR",
    gt: ">",
    hellip: "...",
    laquo: '"',
    ldquo: '"',
    lsquo: "'",
    lt: "<",
    mdash: "-",
    ndash: "-",
    nbsp: " ",
    pound: "GBP",
    quot: '"',
    raquo: '"',
    rdquo: '"',
    reg: "\u00ae",
    rsquo: "'",
    trade: "TM",
  };

  return value
    .replace(/&#x([a-f0-9]+);?/gi, (_match, code) => {
      const point = parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&#([0-9]+);?/g, (_match, code) => {
      const point = parseInt(code, 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name) => named[String(name).toLowerCase()] ?? match);
}

function cleanTextEncoding(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200f\ufeff]/g, "")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—]/g, "—")
    .replace(/…/g, "...")
    .replace(/\uFFFD/g, "")
    .replace(/Â(?=\s|$)/g, "")
    .replace(/Â/g, "")
    .replace(/â€™|â€˜|â€š|â€›/g, "'")
    .replace(/â€œ|â€�|â€ž|â€Ÿ/g, '"')
    .replace(/â€“|â€”/g, "—")
    .replace(/â€¦/g, "...")
    .replace(/â€¢/g, "-")
    .replace(/Ã©/g, "e")
    .replace(/Ã¨/g, "e")
    .replace(/Ã[^\s]?/g, "")
    .replace(/&nbsp;?/gi, " ");
}

const rawUrlPattern = /\b(?:https?:\/\/|www\.)[^\s<>)\]]+/gi;
const bracketedUrlPattern = /\s*[\[(]\s*(?:https?:\/\/|www\.)[^\])]+[\])]/gi;
const quotedPrintableFragmentPattern = /=([a-f0-9]{2})/gi;

const boilerplateLinePatterns = [
  /\bview this email in your browser\b/i,
  /\bview in browser\b/i,
  /\bclick here to view\b/i,
  /\bif you are having trouble viewing this email\b/i,
  /\bunsubscribe\b/i,
  /\bmanage preferences\b/i,
  /\bupdate your preferences\b/i,
  /\bforward to a friend\b/i,
  /\bprivacy policy\b/i,
  /\bmailing address\b/i,
  /\bcopyright\b.*\ball rights reserved\b/i,
  /\ball rights reserved\b/i,
  /\byou are receiving this email because\b/i,
  /\bthis email was sent to\b/i,
  /\bsent from mailchimp\b/i,
  /\bpowered by mailchimp\b/i,
  /\bfor immediate release\b/i,
  /\bmedia contact\b/i,
  /\btracking pixel\b/i,
];

const downloadLinePatterns = [
  /\bclick on the image to download\b/i,
  /\bdownload images here\b/i,
  /\bdownload high-?res images\b/i,
  /\bmedia download\b/i,
  /\bpress kit\b/i,
  /\bimage download\b/i,
  /\bdownload the photo\b/i,
  /\bclick here to download\b/i,
];

function countUrls(value: string) {
  return value.match(rawUrlPattern)?.length ?? 0;
}

function countQuotedPrintableFragments(value: string) {
  return value.match(quotedPrintableFragmentPattern)?.length ?? 0;
}

function countBrokenEncoding(value: string) {
  return (
    value.match(
      /\uFFFD|Â|â€™|â€œ|â€�|â€|â€“|â€”|Ã©|Ã¨|Ã(?:\s|$)|=20|=3D|=E2|=80|=99/gi
    )?.length ?? 0
  );
}

function isBoilerplateLine(value: string) {
  return boilerplateLinePatterns.some((pattern) => pattern.test(value));
}

function isDownloadInstructionLine(value: string) {
  return downloadLinePatterns.some((pattern) => pattern.test(value));
}

function shouldRemoveWholeUrlLine(value: string) {
  const withoutUrls = value
    .replace(bracketedUrlPattern, " ")
    .replace(rawUrlPattern, " ")
    .replace(/[()|[\]<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!withoutUrls) return true;
  if (isBoilerplateLine(withoutUrls) || isDownloadInstructionLine(withoutUrls)) return true;
  if (/^(may|jun|june|jul|july|aug|august|sep|sept|september|oct|nov|dec|jan|feb|mar|apr)\s+\d{1,2}$/i.test(withoutUrls)) return true;
  if (/^\d{1,2}\s+(may|jun|june|jul|july|aug|august|sep|sept|september|oct|nov|dec|jan|feb|mar|apr)$/i.test(withoutUrls)) return true;
  if (/^[A-Z0-9\s.,:-]{1,28}$/.test(withoutUrls) && withoutUrls.split(/\s+/).length <= 5) return true;
  return false;
}

function removeInlineUrls(value: string, onRemoved: (count: number) => void) {
  let removed = 0;
  const withoutBracketed = value.replace(bracketedUrlPattern, () => {
    removed += 1;
    return " ";
  });
  const withoutUrls = withoutBracketed.replace(rawUrlPattern, () => {
    removed += 1;
    return " ";
  });
  if (removed > 0) onRemoved(removed);
  return withoutUrls;
}

function extractPhotoCreditLine(value: string) {
  const line = cleanTextEncoding(value.replace(/^\s*\uFFFD\s+/, "\u00a9 ")).replace(/\s+/g, " ").trim();
  const patterns = [
    /^[\u00a9\uFFFD]\s*(.+)$/i,
    /^(?:photo|photograph|image|picture)\s*(?:credit)?\s*(?:by|:|-)\s*(.+)$/i,
    /^credit\s*(?::|-)\s*(.+)$/i,
    /^copyright\s*(?:by|:|-)?\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (!match?.[1]) continue;
    const credit = normalizePhotoCredit(match[1]);
    if (credit) return credit;
  }

  return "";
}

function extractBarePhotoCreditLine(value: string) {
  const line = cleanTextEncoding(value).replace(/\s+/g, " ").trim();
  if (!line.includes("/")) return "";
  if (line.length < 4 || line.length > 120) return "";
  if (/[.!?]/.test(line) || /\d/.test(line)) return "";
  if (/\b(race|regatta|fleet|boat|yacht|club|marina|harbour|port|crew|skipper)\b/i.test(line)) return "";
  if (line.split(/\s+/).filter(Boolean).length > 9) return "";
  return normalizePhotoCredit(line);
}

function normalizePhotoCredit(value: string) {
  const credit = removeInlineUrls(value, () => undefined)
    .replace(/\ball rights reserved\b/gi, "")
    .replace(/\bcopyright\b/gi, "")
    .replace(/[|/,\s]+$/g, "")
    .replace(/^[|/,\s:;-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (credit.length < 2 || credit.length > 120) return "";
  return credit.startsWith("\u00a9") ? credit : `\u00a9 ${credit}`;
}

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) values.push(value);
}

function makePreview(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function filenameToCaption(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanArticleSentence(value: string) {
  let sentence = cleanTextEncoding(decodeHtmlEntities(value)).replace(/\s+/g, " ").trim();
  for (const pattern of bannedSourcePhrases) sentence = sentence.replace(pattern, "");
  sentence = sentence
    .replace(/^(?:title|30-word summary|summary|full article|seo keywords|image caption)\s*:?\s*/i, "")
    .replace(/\bthe release says\b/gi, "")
    .replace(/\bthe company announced\b/gi, "")
    .replace(/\bthe organisation announced\b/gi, "")
    .replace(/\bthe organization announced\b/gi, "")
    .replace(/\bthe organisation stated\b/gi, "")
    .replace(/\bthe organization stated\b/gi, "")
    .replace(/\bshowcased\b/gi, "displayed")
    .replace(/\bdazzles\b/gi, "draws attention")
    .replace(/\bgame-changing\b/gi, "notable")
    .replace(/\bcaptures the hearts of\b/gi, "interests")
    .replace(/\binnovation reborn\b/gi, "a revised design")
    .replace(/\bunveils stunning\b/gi, "shows")
    .replace(/\bstunning\b/gi, "notable")
    .replace(/\bworld-class\b/gi, "well-known")
    .replace(/\bcutting-edge\b/gi, "new")
    .replace(/\bseamless\b/gi, "straightforward")
    .replace(/\bwe are delighted to announce that\b/gi, "")
    .replace(/\bwe are pleased to announce that\b/gi, "")
    .replace(/\bplease find attached\b/gi, "")
    .replace(/\bfor immediate release\b/gi, "")
    .replace(/\bclick here\b/gi, "")
    .replace(/\bsign up now\b/gi, "")
    .replace(/\b(?:don't|do not) miss out\b/gi, "")
    .replace(/\bregister now\b/gi, "")
    .replace(/\bour\b/gi, "the")
    .replace(/\s+/g, " ")
    .trim();
  return sentence;
}

function isPublishableNewsSentence(value: string) {
  const text = cleanTextEncoding(value).trim();
  if (!text) return false;
  if (/^(?:title|30-word summary|summary|full article|seo keywords|image caption)\s*:?\s*$/i.test(text)) return false;
  if (generatedArticleRejectPatterns.some(({ pattern }) => pattern.test(text))) return false;
  if (isBoilerplateLine(text) || isDownloadInstructionLine(text)) return false;
  if (/^(?:ends|sent from my iphone|kind regards|best regards|many thanks)\b/i.test(text)) return false;
  return true;
}

function cleanArticleParagraph(value: string) {
  const paragraph = cleanArticleSentence(value)
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/^\W+/, "")
    .trim();
  if (!paragraph) return "";
  return /[.!?]$/.test(paragraph) ? paragraph : `${paragraph}.`;
}

function hasUsefulFact(sentence: string) {
  return (
    /\b\d{1,4}\b/.test(sentence) ||
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(sentence) ||
    /\b(regatta|race|marina|harbour|yacht|boat|club|fleet|crew|port|show|championship|series|berth|metre|knot|engine|launch)\b/i.test(sentence)
  );
}

function uniqueSentences(sentences: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const sentence of sentences) {
    const normalized = normalizeForCompare(sentence);
    if (normalized.length < 20 || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(sentence);
  }
  return unique;
}

function uniqueParagraphs(paragraphs: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const paragraph of paragraphs) {
    const normalized = normalizeForCompare(paragraph);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(paragraph);
  }
  return unique;
}

function validateGeneratedArticleQuality(input: {
  title: string;
  excerpt: string;
  body: string[];
  sourceWordCount: number;
  category: string;
}) {
  const warnings: string[] = [];
  const publicText = [input.title, input.excerpt, ...input.body].join("\n");
  const paragraphs = input.body.map((paragraph) => paragraph.trim()).filter(Boolean);
  const normalizedParagraphs = paragraphs.map(normalizeForCompare);
  const bodyWordCount = wordCount(paragraphs.join(" "));

  for (const { label, pattern } of generatedArticleRejectPatterns) {
    if (pattern.test(publicText)) {
      warnings.push(`Rejected by newsroom quality check: remove ${label}.`);
    }
  }

  if (normalizedParagraphs.length !== new Set(normalizedParagraphs).size) {
    warnings.push("Rejected by newsroom quality check: remove repeated paragraphs.");
  }

  if (paragraphs.some((paragraph) => !isPublishableNewsSentence(paragraph))) {
    warnings.push("Rejected by newsroom quality check: remove email, MIME, boilerplate or promotional artefacts.");
  }

  if (paragraphs.length > 0 && !hasUsefulFact(paragraphs[0])) {
    warnings.push("Opening paragraph needs a hard news fact before publication.");
  }

  if (bodyWordCount < 300) {
    warnings.push("Generated article is under 300 words; add more reporting before publication.");
  }

  if (input.sourceWordCount >= 420 && bodyWordCount < 400) {
    warnings.push("Generated article is under 400 words despite enough source material; expand with factual sailing context.");
  }

  const summaryWords = wordCount(input.excerpt);
  if (summaryWords < 20 || summaryWords > 36) {
    warnings.push("Summary should be close to 30 words.");
  }

  return warnings;
}

function groupSentences(sentences: string[]) {
  const paragraphs: string[] = [];
  for (let index = 1; index < sentences.length; index += 2) {
    paragraphs.push([sentences[index], sentences[index + 1]].filter(Boolean).join(" "));
  }
  return paragraphs;
}

function firstNamedFact(sentences: string[]) {
  return sentences.find((sentence) => /\b[A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){1,5}\b/.test(sentence)) || sentences[0] || "";
}

function oldSeaDogsContextParagraphs(category: string, title: string, sentences: string[]) {
  const anchor = cleanArticleSentence(firstNamedFact(sentences) || title);
  const subject = cleanArticleSentence(title || anchor);
  const normalizedCategory = category.toLowerCase();
  const context: string[] = [];

  if (normalizedCategory === "races" || /race|regatta|fleet|championship|trophy/i.test(`${subject} ${anchor}`)) {
    context.push(
      `${subject} belongs in the part of sailing where crews earn their supper the old way: by watching the breeze, protecting lanes and keeping the boat moving when the easy speed disappears. ${anchor}`
    );
    context.push(
      "Race followers will be looking for the weather, the class form and the small tactical calls that turn a decent day on the water into a result worth carrying back to the clubhouse."
    );
  } else if (normalizedCategory === "boat reviews" || /launch|model|yacht|boat|builder|engine|metre|ft/i.test(`${subject} ${anchor}`)) {
    context.push(
      `${subject} is the sort of boat news that deserves more than brochure polish: hull, layout, range, handling and the unromantic business of whether the thing will make sense after a long, wet day aboard. ${anchor}`
    );
    context.push(
      "Owners and skippers tend to judge these launches from the helm, the side deck and the engine room, not from the champagne photograph."
    );
  } else if (normalizedCategory === "ports" || normalizedCategory === "destinations" || /marina|harbour|port|berth|anchorage/i.test(`${subject} ${anchor}`)) {
    context.push(
      `${subject} matters to cruising skippers because ports are never just dots on a chart. Approach, shelter, berths, fuel, repairs and the welcome on the quay all decide whether a stop becomes a useful landfall or a long evening with a fender in the wrong place. ${anchor}`
    );
  } else if (normalizedCategory === "clubs" || /club|commodore|members|burgee|clubhouse/i.test(`${subject} ${anchor}`)) {
    context.push(
      `${subject} sits in the world of club sailing, where a burgee, a start line and a few old hands on the balcony can tell you as much about a place as any polished brochure. ${anchor}`
    );
  } else if (normalizedCategory === "shows" || /show|exhibition|festival|metstrade|cannes|monaco|southampton/i.test(`${subject} ${anchor}`)) {
    context.push(
      `${subject} will pull the usual mix of builders, brokers, kit makers and dock-walkers, with plenty of claims to inspect and the occasional genuinely useful idea hidden among the shine. ${anchor}`
    );
  } else {
    context.push(
      `${subject} is one for the logbook because it touches the practical business of boats, people and places around the water. ${anchor}`
    );
  }

  context.push(
    "The useful measure is practical enough: boats, people and places on the water, and whether the result changes anything for sailors, owners, clubs, crews or the ports that keep the whole floating circus moving."
  );

  return context;
}

function makeLeadParagraph(title: string, firstSentence: string) {
  const lead = cleanArticleSentence(firstSentence);
  if (!lead) return title;
  if (lead.toLowerCase().includes(title.toLowerCase().slice(0, 24))) return lead;
  return `${lead}`;
}

function ensureClosingParagraph(paragraphs: string[], category: string) {
  void category;
  return paragraphs.filter((paragraph) => {
    if (!paragraph) return false;
    if (fillerPatterns.some((pattern) => pattern.test(paragraph))) return false;
    return hasUsefulFact(paragraph);
  });
}

function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(
    value
      .split(/\s+/)
      .filter((token) => token.length > 4)
      .slice(0, 160)
  );
}

function tokenOverlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let matches = 0;
  for (const token of a) {
    if (b.has(token)) matches += 1;
  }
  return matches / Math.max(a.size, b.size);
}
