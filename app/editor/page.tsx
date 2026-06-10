import type { Metadata } from "next";
import EditorDashboard from "./EditorDashboard";
import { createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Old Sea Dogs Editor",
  description: "Private Old Sea Dogs publishing dashboard.",
  path: "/editor",
  noIndex: true,
});

export default function EditorPage() {
  return <EditorDashboard />;
}
