import type { ReactNode } from "react";
import Link from "next/link";
import { HarbourTvThumb } from "./HarbourTvThumb.tsx";
import {
  harbourBrands,
  harbourCatalog,
  harbourFaqs,
  harbourIntroParagraphs,
  harbourSeoCopy,
  harbourSections,
  harbourUpdatedLabel,
  harbourVideoObject,
  type HarbourBucket,
  type HarbourVideo,
} from "../lib/harbour-tv.ts";
import { JsonLd } from "./JsonLd.tsx";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function VideoCard({ video }: { video: HarbourVideo }) {
  return (
    <article className="htv-card">
      <HarbourTvThumb id={video.id} thumb={video.thumb} title={video.title} />
      <h4>{video.title}</h4>
      <p>
        {video.channel} · {formatDate(video.published)} ·{" "}
        <a href={`https://www.youtube.com/watch?v=${video.id}`} rel="nofollow noopener">YouTube</a>
      </p>
    </article>
  );
}

function ShortCard({ video }: { video: HarbourVideo }) {
  return (
    <div className="htv-sh">
      <HarbourTvThumb id={video.id} thumb={video.thumb} title={video.title} />
      <p>{video.title.slice(0, 60)}</p>
    </div>
  );
}

function Chips({ current }: { current: string }) {
  return (
    <nav aria-label="Harbour TV sections" className="htv-chips">
      <Link className={`htv-chip${current === "" ? " on" : ""}`} href="/videos">All</Link>
      {harbourSections().map(([slug, bucket]) => (
        <Link className={`htv-chip${current === slug ? " on" : ""}`} href={`/videos/${slug}`} key={slug}>{bucket.title}</Link>
      ))}
      {harbourBrands().map(([slug, bucket]) => (
        <Link className={`htv-chip${current === `b${slug}` ? " on" : ""}`} href={`/videos/brands/${slug}`} key={slug}>{bucket.title}</Link>
      ))}
    </nav>
  );
}

function FaqList({ items }: { items: Array<[string, string]> }) {
  return (
    <>
      <h2>Frequently asked questions</h2>
      <div className="htv-faq">
        {items.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export function HarbourTvPage({
  title,
  description,
  path,
  current,
  crumb,
  videos,
  children,
  faqName,
  faqLower,
}: {
  title: string;
  description: string;
  path: string;
  current: string;
  crumb: Array<[string, string]>;
  videos: HarbourVideo[];
  children: ReactNode;
  faqName?: string;
  faqLower?: string;
}) {
  const generated = harbourCatalog().generated;
  const faqs = faqName && faqLower ? harbourFaqs(faqName, faqLower) : null;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: `https://oldseadogs.com${path}`,
      dateModified: generated,
      isPartOf: { "@type": "WebSite", name: "Old Sea Dogs", url: "https://oldseadogs.com" },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: videos.length,
        itemListElement: videos.map((video, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          item: harbourVideoObject(video),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumb.map(([name, url], index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        item: `https://oldseadogs.com${url}`,
      })),
    },
    ...(faqs ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    }] : []),
  ];

  return (
    <div className="htv">
      <JsonLd data={jsonLd} />
      <nav aria-label="Breadcrumb" className="htv-crumbs">
        {crumb.map(([name, url], index) => (
          <span key={url}>
            {index < crumb.length - 1 ? <Link href={url}>{name}</Link> : name}
            {index < crumb.length - 1 ? " › " : ""}
          </span>
        ))}
      </nav>
      <div className="htv-hero">
        <h1>{title}</h1>
        <p><time dateTime={generated}>Updated {harbourUpdatedLabel(generated)}</time> · {videos.length} videos</p>
      </div>
      <Chips current={current} />
      {children}
      {faqs ? <FaqList items={faqs} /> : null}
      <div className="htv-note">Videos play from YouTube in privacy-enhanced mode and belong to their creators.</div>
    </div>
  );
}

export function HarbourBucketBlocks({ bucket }: { bucket: HarbourBucket }) {
  return (
    <>
      <h2>Full-length videos</h2>
      {bucket.full.length ? (
        <div className="htv-grid">{bucket.full.map((video) => <VideoCard key={video.id} video={video} />)}</div>
      ) : <p className="htv-empty">No full-length videos this week.</p>}
      <h2>Shorts</h2>
      {bucket.shorts.length ? (
        <div className="htv-rail">{bucket.shorts.map((video) => <ShortCard key={video.id} video={video} />)}</div>
      ) : <p className="htv-empty">No Shorts this week.</p>}
    </>
  );
}

export function HarbourHubBody() {
  const hubMore = harbourSeoCopy()._hub_more;
  return (
    <>
      <div className="htv-intro">
        <p>Harbour TV is Old Sea Dogs&apos; hub for the best boating videos on YouTube: sailing, powerboats, flybridges, jet skis, diving, boat gear, fishing and the big brands, from Beneteau and Jeanneau to Princess and Sunseeker. We refresh it every other day from trusted channels and filtered search, keeping full-length films and Shorts apart.</p>
        {hubMore ? <p>{hubMore}</p> : null}
      </div>
      {harbourSections().map(([slug, bucket]) => {
        const full = bucket.full.slice(0, 3);
        const shorts = bucket.shorts.slice(0, 6);
        return (
          <section key={slug}>
            <h2>{bucket.title} videos <Link href={`/videos/${slug}`}>See all →</Link></h2>
            {full.length ? <><h3 className="htv-lbl">Full-length</h3><div className="htv-grid">{full.map((video) => <VideoCard key={video.id} video={video} />)}</div></> : null}
            {shorts.length ? <><h3 className="htv-lbl">Shorts</h3><div className="htv-rail">{shorts.map((video) => <ShortCard key={video.id} video={video} />)}</div></> : null}
          </section>
        );
      })}
    </>
  );
}

export function HarbourSectionIntro({ copyKey }: { copyKey: string }) {
  const paragraphs = harbourIntroParagraphs(copyKey);
  return (
    <div className="htv-intro">
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <p>Pair these videos with our <Link href="/guides">harbour and marina guides</Link> and the latest <Link href="/">Old Sea Dogs stories</Link>.</p>
    </div>
  );
}
