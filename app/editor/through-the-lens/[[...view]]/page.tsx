import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BridgeCms from "../../BridgeCms";
import { EditorGate } from "../../EditorGate";
import { createPageMetadata } from "../../../../lib/seo";

type GalleryView = "dashboard" | "pending" | "approved" | "rejected" | "categories" | "instagram" | "settings";

const views = new Set<GalleryView>(["dashboard", "pending", "approved", "rejected", "categories", "instagram", "settings"]);

export const metadata: Metadata = createPageMetadata({
  title: "Through the Lens | Old Sea Dogs Bridge CMS",
  description: "Private Old Sea Dogs gallery review workflow.",
  path: "/editor/through-the-lens",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function ThroughTheLensPage({ params }: { params: Promise<{ view?: string[] }> }) {
  const route = (await params).view?.[0] || "dashboard";
  if (!views.has(route as GalleryView)) notFound();
  return <EditorGate><BridgeCms section="gallery" galleryView={route as GalleryView} /></EditorGate>;
}
