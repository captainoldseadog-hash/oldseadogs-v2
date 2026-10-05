import type { ReactNode } from "react";
import Link from "next/link";
import { AdSenseUnit } from "./AdSenseUnit";
import { AdBlock, pickAdvertForPlacement } from "./AdBlock";
import { SocialFollowBlock } from "./SocialFollowBlock";
import { displayCategoryLabel, sectionPathForCategory } from "../content/sections";
import type { Advert, EditableStory } from "../lib/site-content";
import { storyHeaderDateLabel } from "../lib/story-header-date";
import { cleanStoryTags } from "../lib/tags";
import { publicImageAlt } from "../lib/public-image-alt";
import { publicMediaVariantUrl } from "../lib/public-media";
import { derivativeImageUrl, derivativeSrcSet, mobileSourceSrcSet } from "../lib/responsive-image";

type ArticlePreviewContentProps = {
  story: Pick<
    EditableStory,
    | "title"
    | "summary"
    | "category"
    | "author"
    | "date"
    | "publishedAt"
    | "readMinutes"
    | "imageUrl"
    | "imageAlt"
    | "imageCaption"
    | "imageCredit"
    | "videoUrl"
    | "videoCaption"
    | "videoPosition"
    | "oldSeaDogsView"
    | "sourceNotes"
    | "methodNotes"
    | "contentBasis"
    | "sourceType"
    | "sourceName"
    | "sourceUrl"
    | "body"
    | "tags"
    | "updatedAt"
  >;
  ads?: Advert[];
  beforeBody?: ReactNode;
  socialShare?: ReactNode;
  previewOnly?: boolean;
  imageLooksLikeLogo?: boolean;
  showAdditionalAds?: boolean;
  adsenseConfig?: {
    clientId: string;
    enabled: boolean;
    inlineSlotId: string;
    bottomSlotId: string;
    showPlaceholder?: boolean;
  };
};

function formatArticleDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const correctionsEmail = "captainoldseadog@gmail.com";

function formatUpdatedDate(value: string, fallback: string) {
  return formatArticleDate(value || fallback);
}

function basisLabel(story: ArticlePreviewContentProps["story"]) {
  if (story.contentBasis?.trim()) return story.contentBasis.trim();
  const sourceType = story.sourceType.trim().toLowerCase();
  if (sourceType.includes("press release")) return "Press release";
  if (sourceType.includes("automatic watch")) return "Official notice or organiser statement";
  if (sourceType.includes("interview")) return "Interview";
  if (sourceType.includes("site visit")) return "Site visit";
  return "Old Sea Dogs observation and editorial research";
}

function sourceLabel(story: ArticlePreviewContentProps["story"]) {
  if (story.sourceNotes?.trim()) return story.sourceNotes.trim();
  const sourceName = story.sourceName.trim();
  const sourceType = story.sourceType.trim();
  if (sourceName && sourceType && sourceName.toLowerCase() !== sourceType.toLowerCase()) {
    return `${sourceType}: ${sourceName}`;
  }
  return sourceName || sourceType || "Old Sea Dogs desk";
}

function methodLabel(story: ArticlePreviewContentProps["story"]) {
  if (story.methodNotes?.trim()) return story.methodNotes.trim();
  return "Edited by Michael Hodges for Old Sea Dogs, with names, dates, places, source claims and photo details checked against the available public information before publication.";
}

function imageCreditLabel(story: ArticlePreviewContentProps["story"]) {
  if (story.imageCredit?.trim()) return story.imageCredit.trim();
  if (story.imageUrl?.trim()) return "Image credit being checked by the editor.";
  return "No lead image used.";
}

function defaultOldSeaDogsView(story: ArticlePreviewContentProps["story"]) {
  const audience = story.category.toLowerCase().includes("club")
    ? "club members, visiting crews and volunteers"
    : story.category.toLowerCase().includes("port")
      ? "skippers, marina visitors and harbour users"
      : story.category.toLowerCase().includes("race")
        ? "crews, owners and race followers"
        : "sailors, owners, clubs, marinas and readers";

  return `This story matters only if it helps ${audience} make better decisions afloat or ashore. The new point should be the named event, result, boat, notice, place or change in the report above, not the shine around it. Old Sea Dogs treats press releases and organiser statements as a starting point, then looks for the practical detail: dates, entry rules, berthing, costs, crew impact, safety notes and what readers should check next. What remains uncertain is the usual waterfront mix of weather, final notices, availability, pricing and how a claim holds up once people arrive. Use this piece as a pointer, then check the linked source before making plans.`;
}

function parseInlineImage(paragraph: string) {
  const match = paragraph.match(/^\[image:([^|\]]+)(?:\|([^|\]]*))?(?:\|([^|\]]*))?(?:\|([^|\]]*))?(?:\|([^|\]]*))?(?:\|([^|\]]*))?(?:\|([^\]]*))?\]$/);
  if (!match) return null;
  return {
    url: match[1].trim(),
    caption: (match[2] || "").trim(),
    credit: (match[3] || "").trim(),
    alt: (match[4] || "").trim(),
    copyright: (match[5] || "").trim(),
    location: (match[6] || "").trim(),
    dateTaken: (match[7] || "").trim(),
  };
}

function parseInlineVideo(paragraph: string) {
  const match = paragraph.match(/^\[video:([^|\]]+)(?:\|([^\]]*))?(?:\|([^\]]*))?(?:\|([^\]]*))?\]$/);
  if (!match) return null;
  const url = match[1].trim();
  const embedUrl = videoEmbedUrl(url);
  if (!embedUrl) return null;
  return {
    url,
    embedUrl,
    placement: (match[2] || "inline video").trim(),
    caption: (match[3] || "").trim(),
    credit: (match[4] || "").trim(),
  };
}

function videoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?#]+)/)?.[1] || "";
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part)) || "";
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : "";
    }
    if (host === "player.vimeo.com" && /^\/video\/\d+/.test(url.pathname)) {
      return `https://player.vimeo.com${url.pathname}`;
    }
    if (host === "tiktok.com" || host === "m.tiktok.com") {
      const id = url.pathname.match(/\/video\/(\d+)/)?.[1] || "";
      return id ? `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?autoplay=0` : "";
    }
    return "";
  } catch {
    return "";
  }
}

function StoryVideo({ caption, title, url }: { caption: string; title: string; url: string }) {
  if (!url.trim()) return null;
  const uploadedVideo = url.startsWith("/api/media/");
  const embedUrl = uploadedVideo ? "" : videoEmbedUrl(url);
  if (!uploadedVideo && !embedUrl) return null;
  return (
    <figure className="article-inline-figure article-inline-video story-video">
      {uploadedVideo ? (
        <video controls playsInline preload="metadata" aria-label={caption || `${title} video`}>
          <source src={url} />
          Your browser cannot play this uploaded video.
        </video>
      ) : (
        <iframe
          src={embedUrl}
          title={caption || `${title} video`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
      {caption ? <figcaption><span>{caption}</span></figcaption> : null}
    </figure>
  );
}

function decodeBasicHtml(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function stripInlineHtml(value: string) {
  return decodeBasicHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeArticleFormatting(value: string) {
  return escapeHtml(value.trim())
    .replace(
      /&lt;a\s+href=&quot;((?:https?:\/\/|\/)[^&]*)&quot;&gt;([\s\S]*?)&lt;\/a&gt;/gi,
      (_match, href: string, label: string) => `<a href="${href}" rel="noreferrer" target="_blank">${label}</a>`
    )
    .replace(
      /&lt;(\/?)(h2|h3|strong|em|blockquote|ul|ol|li)\b[^&]*?&gt;/gi,
      (_match, slash: string, tag: string) => `<${slash}${tag.toLowerCase()}>`
    )
    .replace(/&lt;hr\s*\/?&gt;/gi, "<hr />");
}

function parseFormattedArticleBlock(paragraph: string) {
  const trimmed = paragraph.trim();
  if (!/<\/?(h2|h3|strong|em|blockquote|ul|ol|li|a|hr)\b/i.test(trimmed)) return null;
  return sanitizeArticleFormatting(trimmed);
}

function isPlainArticleParagraph(paragraph: string) {
  const trimmed = paragraph.trim();
  return Boolean(trimmed) && !parseInlineImage(trimmed) && !parseInlineImageFigure(trimmed) && !parseInlineVideo(trimmed) && !parseFormattedArticleBlock(trimmed);
}

function isRenderableInlineImageUrl(value: string) {
  return (
    value.startsWith("/api/media/") ||
    value.startsWith("/images/") ||
    value.startsWith("/legacy-photos/") ||
    value.startsWith("/section-heroes/")
  );
}

function parseInlineImageFigure(paragraph: string) {
  const figureMatch = paragraph.match(/^<figure\s+([^>]*class=["'][^"']*\barticle-inline-image\b[^"']*["'][^>]*)>([\s\S]*?)<\/figure>$/i);
  if (!figureMatch) return null;
  const figureAttributes = ` ${figureMatch[1] || ""}`;
  const figureBody = figureMatch[2] || "";
  const srcMatch = figureBody.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!srcMatch?.[1]) return null;
  const url = decodeBasicHtml(srcMatch[1].trim());
  if (!isRenderableInlineImageUrl(url)) return null;

  const altMatch = figureBody.match(/<img\s+[^>]*alt=["']([^"']*)["'][^>]*>/i);
  const figcaptionMatch = figureBody.match(/<figcaption>([\s\S]*?)<\/figcaption>/i);
  const figcaptionHtml = figcaptionMatch?.[1] || "";
  const creditMatch = figcaptionHtml.match(/<span\s+[^>]*class=["'][^"']*\bphoto-credit\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  const dataCaptionMatch = figureAttributes.match(/\sdata-caption=["']([^"']*)["']/i);
  const dataCreditMatch = figureAttributes.match(/\sdata-credit=["']([^"']*)["']/i);
  const credit = dataCreditMatch?.[1] ? decodeBasicHtml(dataCreditMatch[1].trim()) : creditMatch ? stripInlineHtml(creditMatch[1]) : "";
  const captionHtml = creditMatch ? figcaptionHtml.replace(creditMatch[0], "") : figcaptionHtml;

  return {
    url,
    caption: dataCaptionMatch?.[1] ? decodeBasicHtml(dataCaptionMatch[1].trim()) : stripInlineHtml(captionHtml),
    credit,
    alt: altMatch?.[1] ? decodeBasicHtml(altMatch[1].trim()) : "",
  };
}

function inlineImageAlt(inlineImage: { alt?: string; caption?: string }, fallback: string) {
  return publicImageAlt({
    alt: inlineImage.alt,
    caption: inlineImage.caption,
    title: fallback,
  });
}

export function ArticlePreviewContent({
  story,
  ads = [],
  beforeBody,
  socialShare,
  previewOnly = false,
  imageLooksLikeLogo = false,
  showAdditionalAds = false,
  adsenseConfig,
}: ArticlePreviewContentProps) {
  const articleInlineAd = pickAdvertForPlacement(ads, "article-inline");
  const articleSidebarAd = showAdditionalAds ? pickAdvertForPlacement(ads, "article-sidebar") : null;
  const footerAd = showAdditionalAds ? pickAdvertForPlacement(ads, "footer") : null;
  const hasPhoto = Boolean(story.imageUrl?.trim());
  const visibleTags = cleanStoryTags(story.tags);
  const bodyBlocks = story.body.filter(Boolean);
  const plainParagraphCount = bodyBlocks.filter(isPlainArticleParagraph).length;
  const shouldShowInlineAdsense =
    !previewOnly &&
    Boolean(adsenseConfig) &&
    plainParagraphCount >= 7 &&
    Boolean(adsenseConfig?.inlineSlotId || adsenseConfig?.showPlaceholder);
  const inlineAdsenseAfterBlockIndex = shouldShowInlineAdsense
    ? bodyBlocks.findIndex((paragraph, index) => {
        const plainParagraphsSeen = bodyBlocks
          .slice(0, index + 1)
          .filter(isPlainArticleParagraph).length;
        return isPlainArticleParagraph(paragraph) && plainParagraphsSeen === 4;
      })
    : -1;
  const storyVideoAfterIntroIndex = story.videoPosition === "after-intro"
    ? bodyBlocks.findIndex((paragraph, index) =>
        isPlainArticleParagraph(paragraph) && bodyBlocks.slice(0, index + 1).filter(isPlainArticleParagraph).length === 3
      )
    : -1;

  return (
    <div className={previewOnly ? "article-preview-frame preview-mode" : "article-preview-frame"}>
      {previewOnly ? (
        <div className="preview-only-banner" role="status">
          Preview only — not published
        </div>
      ) : null}

      <article className="article-layout">
        <header className="article-header">
          <Link className="eyebrow category-back-link" href={sectionPathForCategory(story.category)}>
            {displayCategoryLabel(story.category)}
          </Link>
          <h1>{story.title || "Untitled story"}</h1>
          {story.summary ? <p className="article-summary">{story.summary}</p> : null}
          <div className="article-meta">
            <span>{storyHeaderDateLabel(story)}</span>
            <span>{story.readMinutes || 3} min read</span>
          </div>
          <div className="article-share-desktop">{socialShare}</div>
        </header>

        {hasPhoto ? (
          <figure className="article-figure">
            <div
              className={`article-image ${imageLooksLikeLogo ? "club-logo-image" : ""}`}
            >
              <picture>
                <source
                  media="(max-width: 1024px)"
                  sizes="(max-width: 760px) calc(100vw - 40px), 860px"
                  srcSet={mobileSourceSrcSet(story.imageUrl, publicMediaVariantUrl(story.imageUrl, "mobile"))}
                />
                <img
                  src={derivativeImageUrl(story.imageUrl, 1600)}
                  srcSet={derivativeSrcSet(story.imageUrl, [768, 1200, 1600]) || undefined}
                  alt={publicImageAlt({
                    alt: story.imageAlt,
                    caption: story.imageCaption,
                    title: story.title,
                  })}
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 760px) calc(100vw - 40px), 860px"
                />
              </picture>
            </div>
            {story.imageCaption || story.imageCredit ? (
              <figcaption>
                {story.imageCaption ? <span>{story.imageCaption}</span> : null}
                {story.imageCredit ? <span className="photo-credit">{story.imageCredit}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="article-share-mobile">{socialShare}</div>

        {beforeBody}

        {story.videoPosition === "top" ? <StoryVideo caption={story.videoCaption} title={story.title} url={story.videoUrl} /> : null}

        <div className="article-body">
          {bodyBlocks.map((paragraph, index) => {
            const inlineImage = parseInlineImage(paragraph) || parseInlineImageFigure(paragraph);
            if (inlineImage) {
              return (
                <figure className="article-inline-figure article-inline-image" key={`${inlineImage.url}-${index}`}>
                  <img
                    src={derivativeImageUrl(inlineImage.url, 1200)}
                    srcSet={derivativeSrcSet(inlineImage.url, [480, 768, 1200]) || undefined}
                    alt={inlineImageAlt(inlineImage, story.title)}
                    decoding="async"
                    loading="lazy"
                    sizes="(max-width: 760px) calc(100vw - 40px), 860px"
                  />
                  {inlineImage.caption || inlineImage.credit ? (
                    <figcaption>
                      {inlineImage.caption ? <span>{inlineImage.caption}</span> : null}
                      {inlineImage.credit ? <span className="photo-credit">{inlineImage.credit}</span> : null}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }
            const inlineVideo = parseInlineVideo(paragraph);
            if (inlineVideo) {
              return (
                <figure className="article-inline-figure article-inline-video" key={`${inlineVideo.embedUrl}-${index}`}>
                  <iframe
                    src={inlineVideo.embedUrl}
                    title={inlineVideo.caption || `${story.title} video`}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  {inlineVideo.caption || inlineVideo.credit ? (
                    <figcaption>
                      {inlineVideo.caption ? <span>{inlineVideo.caption}</span> : null}
                      {inlineVideo.credit ? <span className="photo-credit">{inlineVideo.credit}</span> : null}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }
            const formattedBlock = parseFormattedArticleBlock(paragraph);
            if (formattedBlock) {
              return (
                <div
                  className="article-formatted-block"
                  dangerouslySetInnerHTML={{ __html: formattedBlock }}
                  key={`${formattedBlock}-${index}`}
                />
              );
            }
            return (
              <div className="article-paragraph-with-ad" key={`${paragraph}-${index}`}>
                <p>{paragraph}</p>
                {index === inlineAdsenseAfterBlockIndex && adsenseConfig ? (
                  <AdSenseUnit
                    className="article-adsense-inline"
                    clientId={adsenseConfig.clientId}
                    enabled={adsenseConfig.enabled}
                    format="auto"
                    placement="article-inline"
                    showPlaceholder={adsenseConfig.showPlaceholder}
                    slotId={adsenseConfig.inlineSlotId}
                  />
                ) : null}
                {index === storyVideoAfterIntroIndex ? <StoryVideo caption={story.videoCaption} title={story.title} url={story.videoUrl} /> : null}
              </div>
            );
          })}
        </div>

        {story.videoPosition === "bottom" || (story.videoPosition === "after-intro" && storyVideoAfterIntroIndex < 0)
          ? <StoryVideo caption={story.videoCaption} title={story.title} url={story.videoUrl} />
          : null}

        <AdBlock ad={articleInlineAd} className="article-inline-ad" />

        <section className="old-sea-dogs-view" aria-labelledby="old-sea-dogs-view-title">
          <p className="eyebrow">Old Sea Dogs View</p>
          <h2 id="old-sea-dogs-view-title">What this means on the water</h2>
          <p>{story.oldSeaDogsView?.trim() || defaultOldSeaDogsView(story)}</p>
        </section>

        <footer className="article-source-notes" aria-label="Sources and editorial method">
          <div>
            <h2>Sources</h2>
            <p>{sourceLabel(story)}</p>
            {story.sourceUrl ? (
              <a href={story.sourceUrl} rel="noreferrer" target="_blank">
                Open source
              </a>
            ) : null}
          </div>
          <div>
            <h2>Method</h2>
            <p>{methodLabel(story)}</p>
          </div>
          <div>
            <h2>Image credit</h2>
            <p>{imageCreditLabel(story)}</p>
          </div>
          <div>
            <h2>Basis</h2>
            <p>{basisLabel(story)}</p>
          </div>
        </footer>

        <aside className="article-authority-box" aria-label="Written and edited by">
          <div><p className="eyebrow">Written and edited by</p><h2>Michael Hodges</h2><p>Old Sea Dogs editor, Isle of Wight boater, RYA Day Skipper, Powerboat Level 2 holder and practical marina-watcher.</p></div>
          <dl><div><dt>Author profile</dt><dd><Link href="/authors/michael-hodges">Michael Hodges</Link></dd></div><div><dt>Last updated</dt><dd>{formatUpdatedDate(story.updatedAt, story.date)}</dd></div></dl>
        </aside>

        <aside className="author-bio-box" aria-label="Corrections and contact information">
          <p className="eyebrow">Corrections and contact</p><h2>Help us keep this story accurate</h2><p><a href={`mailto:${correctionsEmail}`}>{correctionsEmail}</a></p>
        </aside>

        {visibleTags.length > 0 ? (
          <footer className="article-tags">
            {visibleTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </footer>
        ) : null}

        {!previewOnly && adsenseConfig ? (
          <AdSenseUnit
            className="article-adsense-bottom"
            clientId={adsenseConfig.clientId}
            enabled={adsenseConfig.enabled}
            format="auto"
            placement="article-bottom"
            showPlaceholder={adsenseConfig.showPlaceholder}
            slotId={adsenseConfig.bottomSlotId}
          />
        ) : null}

        <SocialFollowBlock
          compact
          body="Follow Old Sea Dogs for the next dispatch, short video, show note or dockside update."
          showSocialPageLink
          title="Follow Old Sea Dogs"
        />
      </article>

      {articleSidebarAd ? (
        <section className="article-ad-band" aria-label="Article sponsor">
          <AdBlock ad={articleSidebarAd} className="article-sidebar-ad" />
        </section>
      ) : null}

      {footerAd ? (
        <section className="article-ad-band" aria-label="Footer advertisement">
          <AdBlock ad={footerAd} />
        </section>
      ) : null}
    </div>
  );
}
