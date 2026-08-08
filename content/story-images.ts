type StoryImageLike = {
  category?: string;
  imageAlt?: string;
  imageCaption?: string;
  imageUrl?: string;
  slug?: string;
};

const knownLogoLikeArchiveSlugs = new Set(["clubs-yacht-club-como"]);

export function isLogoLikeStoryImage(story: StoryImageLike) {
  const imageText = [
    story.category,
    story.imageAlt,
    story.imageCaption,
    story.imageUrl,
  ]
    .join(" ")
    .toLowerCase();

  return (
    knownLogoLikeArchiveSlugs.has(story.slug ?? "") ||
    /\b(flag|logo|burgee|emblem)\b/.test(imageText)
  );
}
