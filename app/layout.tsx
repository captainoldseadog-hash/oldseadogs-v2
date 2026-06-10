import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import {
  createPageMetadata,
  defaultDescription,
  robotsMetadata,
  siteName,
  siteUrl,
} from "../lib/seo";
import { organizationJsonLd, websiteJsonLd } from "../lib/structured-data";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        {children}
      </body>
    </html>
  );
}
