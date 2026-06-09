import type { Metadata } from "next";
import EditorDashboard from "./EditorDashboard";

export const metadata: Metadata = {
  title: "Old Sea Dogs Editor",
  description: "Private Old Sea Dogs publishing dashboard.",
};

export default function EditorPage() {
  return <EditorDashboard />;
}
