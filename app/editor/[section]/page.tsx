import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BridgeCms, { type BridgeCmsSection } from "../BridgeCms";
import { EditorGate } from "../EditorGate";
import { createPageMetadata } from "../../../lib/seo";

type EditorSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
  searchParams?: Promise<{
    story?: string;
    media?: string;
  }>;
};

const sections = new Set<BridgeCmsSection>([
  "stories",
  "write",
  "guides",
  "homepage",
  "drafts",
  "published",
  "scheduled",
  "recover",
  "audit",
  "email",
  "scraped",
  "media",
  "gallery",
  "videos",
  "social",
  "analytics",
  "advertising",
  "backups",
  "settings",
  "health",
]);

export const metadata: Metadata = createPageMetadata({
  title: "Old Sea Dogs Bridge CMS",
  description: "Private Old Sea Dogs newsroom CMS.",
  path: "/editor",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function EditorSectionPage({
  params,
  searchParams,
}: EditorSectionPageProps) {
  const [{ section }, query] = await Promise.all([params, searchParams]);

  if (!sections.has(section as BridgeCmsSection)) {
    notFound();
  }

  return (
    <EditorGate>
      <BridgeCms section={section as BridgeCmsSection} storyId={query?.story} mediaId={query?.media} />
    </EditorGate>
  );
}
