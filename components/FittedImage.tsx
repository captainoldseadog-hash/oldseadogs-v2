"use client";

import { useState, type CSSProperties, type ReactNode, type SyntheticEvent } from "react";
import { aspectDistance, imageSlot, readGraphicSample, type ImagePresentation, type ImageSlotName } from "../lib/image-fit";

type FittedImageProps = {
  alt: string;
  children?: ReactNode;
  className?: string;
  eager?: boolean;
  focalPoint?: string;
  height?: number;
  mobileMedia?: string;
  mobileSrcSet?: string;
  presentation?: ImagePresentation;
  probe?: boolean;
  sizes?: string;
  slot?: ImageSlotName;
  src: string;
  srcSet?: string;
  width?: number;
};

export function FittedImage({
  alt,
  children,
  className = "",
  eager = false,
  focalPoint,
  height,
  mobileMedia = "(max-width: 1024px)",
  mobileSrcSet,
  presentation = "cover",
  probe = false,
  sizes,
  slot,
  src,
  srcSet,
  width,
}: FittedImageProps) {
  const [mode, setMode] = useState<ImagePresentation>(presentation);

  function onLoad(event: SyntheticEvent<HTMLImageElement>) {
    if (!probe || mode === "contain") return;
    const image = event.currentTarget;
    const slotSpec = slot ? imageSlot(slot) : null;
    const rendered = image.clientWidth;
    const tooSmall = rendered > 0 && image.naturalWidth > 0 && image.naturalWidth < rendered * 0.85;
    const far = Boolean(
      slotSpec &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0 &&
      aspectDistance(image.naturalWidth / image.naturalHeight, slotSpec.aspect) >= slotSpec.aspectFar
    );
    if (tooSmall || far || looksLikeGraphic(image)) setMode("contain");
  }

  const position = focalPoint ? { objectPosition: focalPoint } : undefined;
  const frameStyle = {
    "--fitted-max-width": width ? `${Math.max(width, 1)}px` : "100%",
    "--fitted-max-height": height ? `${Math.max(height, 1)}px` : "100%",
  } as CSSProperties;
  const shared = {
    decoding: eager ? "sync" as const : "async" as const,
    fetchPriority: eager ? "high" as const : "auto" as const,
    loading: eager ? "eager" as const : "lazy" as const,
    sizes,
    src,
    srcSet: srcSet || undefined,
  };

  if (mode === "contain") {
    return (
      <span className={`${className} is-contain fitted-frame`.trim()} style={frameStyle}>
        <img alt="" aria-hidden="true" className="fitted-blur" decoding="async" src={src} />
        <img
          {...shared}
          alt={alt}
          className="fitted-sharp"
          height={height || undefined}
          style={position}
          width={width || undefined}
        />
        {children}
      </span>
    );
  }

  const image = (
    <img
      {...shared}
      alt={alt}
      height={height || undefined}
      onLoad={probe ? onLoad : undefined}
      style={position}
      width={width || undefined}
    />
  );

  return (
    <span className={className}>
      {mobileSrcSet ? (
        <picture>
          <source media={mobileMedia} sizes={sizes} srcSet={mobileSrcSet} />
          {image}
        </picture>
      ) : image}
      {children}
    </span>
  );
}

function looksLikeGraphic(image: HTMLImageElement) {
  try {
    const size = 24;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(image, 0, 0, size, size);
    const sample = readGraphicSample(context.getImageData(0, 0, size, size).data);
    return sample.hasAlpha || sample.flat;
  } catch {
    return false;
  }
}
