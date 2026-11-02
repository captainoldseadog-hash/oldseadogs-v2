import Link from "next/link";
import { readExternalBoatAds, type ExternalBoatAd, type ExternalBoatAdSource } from "../../lib/external-boat-ads.ts";

const sourceClass: Record<ExternalBoatAdSource, string> = {
  Gumtree: "is-gumtree",
  eBay: "is-ebay",
  YachtWorld: "is-yachtworld",
};

export function ExternalBoatAds() {
  const ads = readExternalBoatAds();
  if (ads.length === 0) return null;

  return (
    <section className="external-boat-ads" aria-label="Gumtree, eBay and YachtWorld advertisements">
      <div className="external-boat-ads-grid">
        {ads.map((ad) => <ExternalBoatAdCard ad={ad} key={ad.id} />)}
      </div>
    </section>
  );
}

function ExternalBoatAdCard({ ad }: { ad: ExternalBoatAd }) {
  const previewId = `${ad.id}-preview`;
  return (
    <article className="external-boat-ad">
      <div className="external-boat-ad-placeholder" aria-hidden="true">
        <BoatSilhouette />
        <span>Photo on original listing</span>
      </div>
      <div className="external-boat-ad-body">
        <div className="external-boat-ad-source-row">
          <span className={`external-boat-ad-badge ${sourceClass[ad.source]}`}>{ad.source}</span>
          <span className="external-boat-ad-year">{ad.year ?? "Year n/a"}</span>
        </div>
        <h2>{ad.makeModel}</h2>
        <p className="external-boat-ad-meta">{[ad.location, ad.boatType].filter(Boolean).join(" · ")}</p>
        <p className="external-boat-ad-price">
          {ad.price}
          {ad.priceNote ? <small>{ad.priceNote}</small> : null}
        </p>
        <div className="external-boat-ad-actions">
          <div className="external-boat-ad-link">
            <a
              className="external-boat-ad-cta"
              href={ad.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={previewId}
            >
              View original listing →
            </a>
            <div className="external-boat-ad-preview" id={previewId} role="tooltip">
              {ad.thumbnail ? (
                <img className="external-boat-ad-thumb" src={ad.thumbnail} alt="" loading="lazy" />
              ) : (
                <div className="external-boat-ad-thumb-empty">Original ad opens on click</div>
              )}
              <div className="external-boat-ad-preview-body">
                <p className="external-boat-ad-preview-source">{ad.source} listing</p>
                <p className="external-boat-ad-preview-title">{ad.previewTitle}</p>
                {ad.snippet ? <p className="external-boat-ad-preview-snippet">{ad.snippet}</p> : null}
                <p className="external-boat-ad-preview-price">{ad.price} · {ad.location}</p>
                <p className="external-boat-ad-preview-hint">Click to open the full ad</p>
              </div>
            </div>
          </div>
          <p className="external-boat-ad-list">
            <Link href="/boats-for-sale/list-your-boat">List this boat properly on Old Sea Dogs</Link>
          </p>
        </div>
      </div>
    </article>
  );
}

function BoatSilhouette() {
  return (
    <svg className="external-boat-ad-silhouette" viewBox="0 0 120 60" fill="none" aria-hidden="true">
      <path d="M8 42 L28 42 L36 22 L78 18 L102 28 L112 42 L8 42 Z" stroke="#c4a35a" strokeWidth="1.5" fill="rgba(196,163,90,0.08)" />
      <path d="M52 18 L52 8 M52 8 L68 20 M52 8 L40 22" stroke="#c4a35a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 44 H112" stroke="#9aa7b8" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
