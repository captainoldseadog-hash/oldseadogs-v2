import type { GuideType } from "../../../content/flagship-guides";
import type { ManagedGuideFields } from "../../../lib/guide-contract";

export type GuideStatus = "draft" | "published" | "unpublished";

export type GuideSection = { id?: string; heading: string; body: string[] };

export type GuideImage = {
  mediaId?: string;
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  focalPoint?: string;
  order?: number;
};

export type InlineGuideImage = GuideImage & {
  id: string;
  sectionIndex: number;
  paragraphIndex: number;
  order: number;
};

export type EditorGuide = ManagedGuideFields & {
  internalId: string;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  introduction: string;
  guideType: GuideType;
  regionKey: string;
  regionName: string;
  subregion: string;
  parentGuideSlug: string;
  editorialOrder: number;
  author: string;
  contributorCredits: string[];
  updatedAt: string;
  imageUrl: string;
  imageAlt: string;
  imageFocalPoint: string;
  artworkCredit: string;
  quickFacts: Array<{ label: string; value: string }>;
  sections: Array<{ heading: string; body: string[]; anchor?: string; kind?: "prose" | "callout" | "quote"; listItems?: string[]; links?: Array<{ label: string; guideSlug: string }> }>;
  checklist: string[];
  sourceLinks: Array<{ label: string; href: string }>;
  location: { latitude?: number; longitude?: number; mapZoom?: number; what3words?: string; osGridReference?: string };
  relatedGuideSlugs: string[];
  cruiseOnGuideSlugs: string[];
  previousGuideSlug: string;
  nextGuideSlug: string;
  status: GuideStatus;
  noindex: boolean;
  showOnHomepage: boolean;
  homepageOrder: number;
  seoTitle: string;
  seoDescription: string;
  socialTitle: string;
  socialDescription: string;
  canonicalPath: string;
  editorialNotes: string;
  researchNotes: string;
  reviewDue: string;
  accuracyConcerns: string;
  sourceNotes: string;
  draftComments: string;
  verifiedFacilities: Array<{ label: string; detail: string; sourceUrl: string; verifiedOn: string }>;
  facilityVerificationNotes: string;
  tags: string[];
  wordCount: number;
  minimumWords: number;
  quality: string;
  imageCaption: string;
  imageCredit: string;
  featuredMediaId: string;
  inlineImages: InlineGuideImage[];
};

export type GuidesPayload = {
  guides: EditorGuide[];
  summary: { total: number; published: number; homepage: number; indexed: number; thin: number };
};

export type MediaAsset = {
  id: string;
  filename: string;
  displayName: string;
  contentType: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  caption: string;
  credit: string;
  creditLine?: string;
};

export type MediaPayload = { media: MediaAsset[] };
