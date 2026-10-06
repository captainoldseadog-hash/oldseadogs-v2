import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { TikTokVideoGrid, TikTokVideoGridFallback } from "../../components/TikTokVideoGrid";
import { isGalleryPublicRolloutEnabled } from "../../lib/gallery-public.js";
import { createPageMetadata } from "../../lib/seo";
import { getApprovedPublicGalleryPhotos, getSiteSettings } from "../../lib/site-content";

const title = "Through the Lens";
const description = "Photographs from the Old Sea Dogs waterfront.";

const galleryIsPublic = cache(async () => {
  const settings = await getSiteSettings();
  return isGalleryPublicRolloutEnabled(settings.galleryPublicRollout);
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const live = await galleryIsPublic();
  return createPageMetadata({
    title,
    description,
    path: "/through-the-lens",
    noIndex: !live,
  });
}

export default async function ThroughTheLensPage() {
  if (!(await galleryIsPublic())) notFound();
  const photos = await getApprovedPublicGalleryPhotos();

  return (
    <main className="article-shell social-hub-shell">
      <SiteHeader current="through-the-lens" />

      <header className="social-hero">
        <p className="eyebrow">Gallery</p>
        <h1>Through the Lens</h1>
        <p>Photographs from the Old Sea Dogs waterfront.</p>
        <p>
          <Link href="/social">Follow Old Sea Dogs on social</Link>
        </p>
      </header>

      {photos.length === 0 ? (
        <section className="lens-empty" aria-label="Through the Lens">
          <h2>No photographs yet</h2>
          <p>Pictures from the waterfront will appear here.</p>
        </section>
      ) : (
        <section className="lens-grid" aria-label="Photographs">
          {photos.map((photo) => (
            <figure className="lens-card" key={photo.id}>
              <img alt={photo.alt} src={photo.imageUrl} />
              <figcaption>
                {photo.title ? <strong>{photo.title}</strong> : null}
                {photo.caption ? <p>{photo.caption}</p> : null}
                {photo.credit || photo.location ? (
                  <small>{[photo.credit, photo.location].filter(Boolean).join(" · ")}</small>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      <section className="latest-video-section" aria-label="Old Sea Dogs on TikTok">
        <div className="section-heading">
          <p className="eyebrow">TikTok</p>
          <h2>@oldseadogs8</h2>
          <p>Recent videos from the channel. Each one opens on TikTok.</p>
        </div>
        <Suspense fallback={<TikTokVideoGridFallback />}>
          <TikTokVideoGrid />
        </Suspense>
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/social", label: "Social" },
          { href: "/", label: "Home" },
        ]}
      />
    </main>
  );
}
