/**
 * Newsletter wording and Substack destinations.
 * The homepage block, marina and harbour guide block, and footer
 * social link all read from here. Do not duplicate this copy.
 *
 * Publication checked against the public pages:
 * https://oldseadogs1.substack.com and https://substack.com/@oldseadogs1
 */
export const oldSeaDogsNewsletter = {
  publicationUrl: "https://oldseadogs1.substack.com",
  subscribeUrl: "https://oldseadogs1.substack.com/subscribe",
  socialLabel: "Substack",
  socialHandle: "@oldseadogs1",
  socialDescription: "New marina guides, berth notes and stories from the water.",
  homepage: {
    eyebrow: "Newsletter",
    title: "Letters from the water",
    body: "New marina guides, berth notes and stories from Old Sea Dogs, sent when there is something worth reading.",
    cta: "Subscribe on Substack",
  },
  guide: {
    eyebrow: "Newsletter",
    title: "New marina guides, berth notes and stories",
    body: "Follow Old Sea Dogs on Substack for new marina guides, berth notes and stories from the water.",
    cta: "Subscribe on Substack",
  },
} as const;
