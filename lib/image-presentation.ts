import { isLogoLikeStoryImage } from "../content/story-images";
import { readImageTraits } from "./image-derivatives";
import {
  focalPointStyle,
  normalizeImageFit,
  resolveImagePresentation,
  type ImageFitChoice,
  type ImagePresentation,
  type ImageSlotName,
} from "./image-fit";

export type ResolvedImageFrame = {
  presentation: ImagePresentation;
  width: number;
  height: number;
  fit: ImageFitChoice;
  focalPoint?: string;
  graphic: boolean;
  logoLike: boolean;
  probe: boolean;
};

export async function presentationForImage(input: {
  url: string;
  slot: ImageSlotName;
  fit?: unknown;
  focalPoint?: string | null;
  logoLike?: boolean;
  alt?: string;
  caption?: string;
  category?: string;
  slug?: string;
}): Promise<ResolvedImageFrame> {
  const traits = input.url ? await readImageTraits(input.url).catch(() => null) : null;
  const logoLike = input.logoLike ?? isLogoLikeStoryImage({
    category: input.category,
    imageAlt: input.alt,
    imageCaption: input.caption,
    imageUrl: input.url,
    slug: input.slug,
  });
  const graphic = Boolean(
    traits && (traits.flat || traits.hasAlpha || /svg/i.test(traits.contentType))
  );
  const storyFit = normalizeImageFit(input.fit);
  const fit = storyFit === "auto" ? normalizeImageFit(traits?.fit) : storyFit;
  const focalPoint = focalPointStyle(input.focalPoint) || focalPointStyle(traits?.focalPoint);
  const knownSize = Boolean(traits?.width && traits?.height);
  return {
    presentation: resolveImagePresentation({
      fit,
      width: traits?.width,
      height: traits?.height,
      slot: input.slot,
      logoLike,
      graphic,
    }),
    width: traits?.width || 0,
    height: traits?.height || 0,
    fit,
    focalPoint,
    graphic,
    logoLike,
    probe: fit === "auto" && !graphic && !logoLike && !knownSize,
  };
}

export async function presentationForStories<T extends {
  imageUrl?: string;
  imageFit?: unknown;
  imageFocalPoint?: string | null;
  imageAlt?: string;
  imageCaption?: string;
  category?: string;
  slug?: string;
}>(stories: T[], slot: ImageSlotName) {
  return Promise.all(stories.map((story) => (
    story.imageUrl
      ? presentationForImage({
          url: story.imageUrl,
          slot,
          fit: story.imageFit,
          focalPoint: story.imageFocalPoint,
          alt: story.imageAlt,
          caption: story.imageCaption,
          category: story.category,
          slug: story.slug,
        })
      : Promise.resolve(null)
  )));
}
