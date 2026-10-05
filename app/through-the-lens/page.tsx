import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { TikTokProfileEmbed } from "../../components/TikTokProfileEmbed";
import { isGalleryPublicRolloutEnabled } from "../../lib/gallery-public.js";
import { createPageMetadata } from "../../lib/seo";
import { getApprovedPublicGalleryPhotos, getSiteSettings } from "../../lib/site-content";

const title = "Through the Lens";
const description = "Approved photographs from the Old Sea Dogs waterfront, published in the Through the Lens gallery.";

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
      <SiteHeader />

      <header className="social-hero">
        <p className="eyebrow">Gallery</p>
        <h1>Through the Lens</h1>
        <p>
          Approved photographs from the Old Sea Dogs collection. Pictures still
          waiting for review stay in the newsroom.
        </p>
        <p>
          <Link href="/social">Follow Old Sea Dogs on social</Link>
        </p>
      </header>

      {photos.length === 0 ? (
        <section className="lens-empty" aria-label="Through the Lens">
          <h2>No photographs published yet</h2>
          <p>Approved pictures will appear here when the newsroom publishes them.</p>
        </section>
      ) : (
        <section className="lens-grid" aria-label="Approved photographs">
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
          <p>The creator profile stays unloaded until you choose to open it.</p>
        </div>
        <TikTokProfileEmbed />
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
