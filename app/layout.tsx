import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Old Sea Dogs",
  description:
    "Boating, yachting, boat reviews, and practical sea stories from Old Sea Dogs.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
