import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { CookieConsent } from "../components/CookieConsent";
import { JsonLd } from "../components/JsonLd";
import { MobileSiteHeader } from "../components/MobileSiteHeader";
import {
  adsenseClientId,
  adsenseEnabled,
  createPageMetadata,
  defaultDescription,
  ga4MeasurementId,
  robotsMetadata,
  siteName,
  siteUrl,
} from "../lib/seo";
import { organizationJsonLd, websiteJsonLd } from "../lib/structured-data";
import { isPublicPagePath } from "../lib/route-boundaries";
import { consentCookieName, legacyConsentCookieName, parseConsentChoice } from "../lib/cookie-consent";
import "./globals.css";

const adsensePublisherId = "ca-pub-7278382533036873";
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
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const requestCookies = await cookies();
  const pathname = requestHeaders.get(requestPathHeader) || "/";
  const adsenseAccountId = adsenseClientId || adsensePublisherId;
  const isPublicPage = isPublicPagePath(pathname);
  const shouldRenderAdsenseMeta = isPublicPage && Boolean(adsenseAccountId);
  const shouldRenderGoogleConsent = isPublicPage && Boolean(ga4MeasurementId);
  const encodedConsent = requestCookies.get(consentCookieName)?.value;
  const encodedLegacyConsent = requestCookies.get(legacyConsentCookieName)?.value;
  let initialConsentChoice: ReturnType<typeof parseConsentChoice> = null;
  try {
    initialConsentChoice = parseConsentChoice(encodedConsent ? decodeURIComponent(encodedConsent) : null)
      || parseConsentChoice(encodedLegacyConsent ? decodeURIComponent(encodedLegacyConsent) : null);
  } catch {
    initialConsentChoice = null;
  }

  return (
    <html lang="en">
      {shouldRenderAdsenseMeta || shouldRenderGoogleConsent ? (
        <head>
          {shouldRenderGoogleConsent ? (
            <script
              data-ga4-id={ga4MeasurementId}
              dangerouslySetInnerHTML={{ __html: googleConsentDefaults }}
              id="oldseadogs-google-consent-default"
            />
          ) : null}
          {shouldRenderAdsenseMeta ? (
            <meta name="google-adsense-account" content={adsenseAccountId} />
          ) : null}
        </head>
      ) : null}
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        {isPublicPage ? <MobileSiteHeader /> : null}
        {children}
        <CookieConsent
          adsenseClientId={adsenseClientId}
          adsenseEnabled={adsenseEnabled}
          ga4Id={ga4MeasurementId}
          initialChoice={initialConsentChoice}
          migrateInitialChoice={!encodedConsent && Boolean(initialConsentChoice)}
        />
      </body>
    </html>
  );
}
