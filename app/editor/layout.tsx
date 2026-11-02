import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  applicationName: "Bridge",
  manifest: "/editor/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bridge",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/editor/bridge-icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/editor/bridge-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#123f6f",
};

const pointManifestAtBridge = `(function(){var link=document.querySelector('link[rel="manifest"]');if(!link){link=document.createElement("link");link.rel="manifest";document.head.appendChild(link);}link.href="/editor/manifest.webmanifest";})();`;

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: pointManifestAtBridge }} />
      {children}
    </>
  );
}
