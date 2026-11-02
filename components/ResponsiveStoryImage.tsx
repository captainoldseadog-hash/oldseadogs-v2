import type { ReactNode } from "react";
import { FittedImage } from "./FittedImage";
import type { ImagePresentation, ImageSlotName } from "../lib/image-fit";
import { derivativeImageUrl, derivativeSrcSet, isRenderableImageReference } from "../lib/responsive-image";

type ResponsiveStoryImageProps = {
  alt: string;
  children?: ReactNode;
  className?: string;
  eager?: boolean;
  focalPoint?: string;
  height?: number;
  imageClassName?: string;
  objectPosition?: string;
  presentation?: ImagePresentation;
  probe?: boolean;
  sizes?: string;
  slot?: ImageSlotName;
  src: string;
  width?: number;
};

export function thumbnailImageUrl(src: string) {
  if (!src.startsWith("/api/media/") || src.includes("variant=")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}variant=thumbnail`;
}

export function ResponsiveStoryImage({
  alt,
  children,
  className = "",
  eager = false,
  focalPoint,
  height,
  imageClassName = "",
  objectPosition,
  presentation = "cover",
  probe = false,
  sizes = "(max-width: 640px) 100vw, 50vw",
  slot,
  src,
  width,
}: ResponsiveStoryImageProps) {
  if (!isRenderableImageReference(src)) return null;
  const thumbnail = thumbnailImageUrl(src);
  const srcSet = derivativeSrcSet(src, eager ? [768, 1200, 1600] : [480, 768]);
  const resolvedSrc = eager ? derivativeImageUrl(src, 1200) : (srcSet ? derivativeImageUrl(src, 480) : thumbnail);
  const position = focalPoint || objectPosition;

  if (presentation === "contain" || probe) {
    return (
      <FittedImage
        alt={alt}
        className={className}
        eager={eager}
        focalPoint={position}
        height={height}
        presentation={presentation}
        probe={probe && presentation !== "contain"}
        sizes={sizes}
        slot={slot}
        src={resolvedSrc}
        srcSet={srcSet || undefined}
        width={width}
      >
        {children}
      </FittedImage>
    );
  }

  return (
    <span className={className}>
      <img
        alt={alt}
        className={imageClassName}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        loading={eager ? "eager" : "lazy"}
        sizes={sizes}
        src={resolvedSrc}
        srcSet={srcSet || undefined}
        style={position ? { objectPosition: position } : undefined}
      />
      {children}
    </span>
  );
}
