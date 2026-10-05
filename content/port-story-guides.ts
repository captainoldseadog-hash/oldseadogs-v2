export type PortStoryGuideLink = {
  storySlug: string;
  /** Reader destination. A section anchor is included when the marina lives inside a harbour guide. */
  href: string;
  /** Preferred URL for search. Fragments are omitted. */
  canonicalPath: string;
  guideTitle: string;
  linkLabel: string;
  notice: string;
};

/**
 * Older port stories that repeat a published Guide. There is no standalone
 * Cowes Yacht Haven marina guide in this repo; the maintained notes are the
 * Cowes Harbour Guide section. The Lymington Marina story describes Berthon.
 */
export const portStoryGuideLinks: readonly PortStoryGuideLink[] = [
  {
    storySlug: "ports-cowes-yacht-heaven",
    href: "/guides/solent/cowes#cowes-yacht-haven",
    canonicalPath: "/guides/solent/cowes",
    guideTitle: "Cowes Harbour Guide",
    linkLabel: "Cowes Yacht Haven in the Cowes Harbour Guide",
    notice:
      "Practical notes for Cowes Yacht Haven are kept in the Cowes Harbour Guide.",
  },
  {
    storySlug: "ports-lymington-marina",
    href: "/guides/solent/berthon-lymington-marina",
    canonicalPath: "/guides/solent/berthon-lymington-marina",
    guideTitle: "Berthon Lymington Marina",
    linkLabel: "Read the Berthon Lymington Marina Guide",
    notice:
      "This port story describes Berthon’s marina on the Lymington River. The maintained guide is Berthon Lymington Marina.",
  },
];

const portStoryGuideLinksBySlug = new Map(
  portStoryGuideLinks.map((link) => [link.storySlug, link]),
);

export function portStoryGuideLink(storySlug: string) {
  return portStoryGuideLinksBySlug.get(storySlug) ?? null;
}

export function storyPrefersGuideCanonical(storySlug: string) {
  return Boolean(portStoryGuideLink(storySlug));
}
