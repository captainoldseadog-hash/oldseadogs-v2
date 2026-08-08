import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArticlePreviewContent } from "../../../../components/ArticlePreviewContent";
import { canEditRequestHeaders } from "../../../../lib/editor-auth";
import { getEditorData } from "../../../../lib/site-content";
import { createPageMetadata } from "../../../../lib/seo";

type EditorPreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = createPageMetadata({
  title: "Preview Article | Old Sea Dogs Editor",
  description: "Private Old Sea Dogs article preview.",
  path: "/editor/preview",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function EditorPreviewPage({ params }: EditorPreviewPageProps) {
  const requestHeaders = await headers();
  if (!await canEditRequestHeaders(requestHeaders)) {
    return (
      <main className="article-shell privacy-shell">
        <section className="privacy-hero">
          <p className="eyebrow">Private preview</p>
          <h1>Article preview access is restricted</h1>
          <p>This unpublished preview is available only inside the Old Sea Dogs editor.</p>
        </section>
      </main>
    );
  }

  const { id } = await params;
  const data = await getEditorData();
  const story = data.stories.find((item) => item.id === id || item.slug === id);

  if (!story) notFound();

  return (
    <main className="article-shell editor-preview-page">
      <nav className="article-nav" aria-label="Preview navigation">
        <Link href="/editor" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs Editor</span>
        </Link>
        <Link href="/editor">Back to Editor</Link>
      </nav>

      <ArticlePreviewContent ads={data.ads} previewOnly showAdditionalAds story={story} />
    </main>
  );
}
