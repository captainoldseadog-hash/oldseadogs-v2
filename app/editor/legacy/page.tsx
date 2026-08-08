import type { Metadata } from "next";
import EditorDashboard from "../EditorDashboard";
import { EditorGate } from "../EditorGate";
import { createPageMetadata } from "../../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Classic Editor | Old Sea Dogs",
  description: "Private Old Sea Dogs classic publishing dashboard.",
  path: "/editor/legacy",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default function ClassicEditorPage() {
  return (
    <EditorGate>
      <EditorDashboard />
    </EditorGate>
  );
}
