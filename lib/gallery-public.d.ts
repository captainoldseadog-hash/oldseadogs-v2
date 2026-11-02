export type PublicGalleryPhoto = {
  id: string;
  title: string;
  caption: string;
  alt: string;
  credit: string;
  location: string;
  imageUrl: string;
  updatedAt: string;
};

export function isGalleryPublicRolloutEnabled(value: string | null | undefined): boolean;

export function toPublicGalleryPhoto(item: {
  id?: string;
  mediaId?: string;
  title?: string;
  caption?: string;
  alt?: string;
  credit?: string;
  location?: string;
  status?: string;
  contentType?: string;
  createdAt?: string;
  updatedAt?: string;
} | null | undefined): PublicGalleryPhoto | null;
