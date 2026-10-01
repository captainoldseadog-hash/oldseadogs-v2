import { derivativeImageUrl, derivativeSrcSet, type ResponsiveImageWidth } from "../lib/responsive-image";

type DerivativeImageProps = {
  alt: string;
  className?: string;
  eager?: boolean;
  height?: number;
  sizes: string;
  src: string;
  style?: { objectPosition?: string };
  width?: number;
  widths?: readonly number[];
};

export function DerivativeImage({
  alt,
  className,
  eager = false,
  height,
  sizes,
  src,
  style,
  width,
  widths,
}: DerivativeImageProps) {
  const displayWidth: ResponsiveImageWidth | number = eager ? 1600 : 768;
  const srcSet = derivativeSrcSet(src, widths || (eager ? [768, 1200, 1600] : [480, 768, 1200]));

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      height={height || undefined}
      loading={eager ? "eager" : "lazy"}
      sizes={sizes}
      src={derivativeImageUrl(src, displayWidth)}
      srcSet={srcSet || undefined}
      style={style}
      width={width || undefined}
    />
  );
}
