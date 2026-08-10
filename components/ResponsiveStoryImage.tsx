import type { ReactNode } from "react";

type ResponsiveStoryImageProps = {
  alt: string;
  children?: ReactNode;
  className?: string;
  eager?: boolean;
  imageClassName?: string;
  objectPosition?: string;
  sizes?: string;
  src: string;
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
  imageClassName = "",
  objectPosition,
  sizes = "(max-width: 640px) 100vw, 50vw",
  src,
}: ResponsiveStoryImageProps) {
  const thumbnail = thumbnailImageUrl(src);

  return (
    <span className={className}>
      <img
        alt={alt}
        className={imageClassName}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        loading={eager ? "eager" : "lazy"}
        sizes={sizes}
        src={eager ? src : thumbnail}
        style={objectPosition ? { objectPosition } : undefined}
      />
      {children}
    </span>
  );
}
