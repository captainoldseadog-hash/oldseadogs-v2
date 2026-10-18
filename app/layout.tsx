import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdSenseLoader } from "../components/AdSenseLoader";
import { CookieConsent } from "../components/CookieConsent";
import { GoogleCmpLoader } from "../components/GoogleCmpLoader";
import { JsonLd } from "../components/JsonLd";
import { MobileSiteHeader } from "../components/MobileSiteHeader";
import { googleCmpConsentDefaultScript, googleFcPresentSnippet } from "../lib/google-cmp";
import {
  adsenseClientId,
  adsenseEnabled,
  adsenseLoaderClientId,
  adsenseLoaderSrc,
  adsensePublisherId,
  createPageMetadata,
  defaultDescription,
  fundingChoicesScriptSrc,
  ga4MeasurementId,
  robotsMetadata,
  siteName,
  siteUrl,
  useGoogleCmp,
} from "../lib/seo";
import { organizationJsonLd, websiteJsonLd } from "../lib/structured-data";
import { mobileGuideMenuLinks } from "../lib/guides";
import { isAdsenseLoaderPath, isPublicPagePath } from "../lib/route-boundaries";
import { getPublishedGuides } from "../lib/site-content";
import "./globals.css";

const requestPathHeader = "x-oldseadogs-request-path";
const googleConsentDefaults = `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});window.__oldSeaDogsGoogleConsentDefaulted=true;`;

export const metadata: Metadata = {
  ...createPageMetadata({
    title: siteName,
    description: defaultDescription,
    path: "/",
  }),
  metadataBase: new URL(siteUrl),
  robots: robotsMetadata(),
  applicationName: siteName,
  authors: [{ name: "Michael Hodges", url: "/authors/michael-hodges" }],
  creator: "Michael Hodges",
  publisher: siteName,
  category: "Boating and yachting",
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.png", sizes: "256x256", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get(requestPathHeader) || "/";
  const adsenseAccountId = adsenseClientId || adsensePublisherId;
  const isPublicPage = isPublicPagePath(pathname);
  const guideLinks = isPublicPage ? mobileGuideMenuLinks(await getPublishedGuides()) : [];
  const shouldRenderAdsenseMeta = isPublicPage && Boolean(adsenseAccountId);
  const adsenseLoaderActive = adsenseEnabled && adsenseLoaderClientId === adsensePublisherId;
  const shouldRenderAdsenseLoader = isAdsenseLoaderPath(pathname) && adsenseLoaderActive;
  const shouldRenderGoogleCmp = useGoogleCmp && isAdsenseLoaderPath(pathname);
  const shouldRenderGoogleConsent = isPublicPage && (Boolean(ga4MeasurementId) || shouldRenderAdsenseLoader || shouldRenderGoogleCmp);
  const consentDefaultSource = shouldRenderGoogleCmp ? googleCmpConsentDefaultScript() : googleConsentDefaults;

  return (
    <html lang="en">
      {shouldRenderAdsenseMeta || shouldRenderGoogleConsent ? (
        <head>
          {shouldRenderGoogleConsent ? (
            <script
              data-ga4-id={ga4MeasurementId}
              dangerouslySetInnerHTML={{ __html: consentDefaultSource }}
              id="oldseadogs-google-consent-default"
            />
          ) : null}
          {shouldRenderGoogleCmp ? (
            // Keep this after the consent default. React would otherwise hoist
            // the async Funding Choices tag ahead of Consent Mode.
            <noscript
              dangerouslySetInnerHTML={{
                __html: `</noscript><script async id="oldseadogs-google-cmp" src="${fundingChoicesScriptSrc}" onerror="this.dataset.cmpFailed='true';window.dispatchEvent(new Event('oldseadogs:google-cmp-unavailable'))"></script><script id="oldseadogs-googlefc-present">${googleFcPresentSnippet}</script><noscript>`,
              }}
            />
          ) : null}
          {shouldRenderAdsenseLoader ? (
            // React serializes boolean async as async="" and hoists src scripts
            // ahead of the consent default. This raw tag stays exact and follows it.
            <noscript
              dangerouslySetInnerHTML={{
                __html: `</noscript><script async src="${adsenseLoaderSrc}" crossorigin="anonymous"></script><noscript>`,
              }}
            />
          ) : null}
          {shouldRenderAdsenseMeta ? (
            <meta name="google-adsense-account" content={adsenseAccountId} />
          ) : null}
        </head>
      ) : null}
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        <AdSenseLoader enabled={adsenseLoaderActive} src={adsenseLoaderSrc} />
        <GoogleCmpLoader enabled={useGoogleCmp} src={fundingChoicesScriptSrc} />
        {isPublicPage ? <MobileSiteHeader guideLinks={guideLinks} /> : null}
        {children}
        <CookieConsent
          adsenseClientId={adsenseLoaderClientId}
          adsenseEnabled={adsenseEnabled}
          ga4Id={ga4MeasurementId}
          useGoogleCmp={useGoogleCmp}
        />
      </body>
    </html>
  );
}
