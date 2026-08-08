import type { Metadata } from "next";
import BridgeCms from "./BridgeCms";
import { EditorGate } from "./EditorGate";
import { createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Old Sea Dogs Editor",
  description: "Private Old Sea Dogs publishing dashboard.",
  path: "/editor",
  noIndex: true,
});

export default async function EditorPage({
  searchParams,
}: {
  searchParams?: Promise<{ editorLogin?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <EditorGate failed={params.editorLogin === "failed"}>
      <BridgeCms section="dashboard" />
    </EditorGate>
  );
}
