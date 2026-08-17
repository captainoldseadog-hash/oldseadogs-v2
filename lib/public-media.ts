const mobileMediaVariants: Record<string, string> = {
  "/legacy-photos/c35532d15601-port-hercules-during-the-2026-monaco-grand-prix-while-kimi-anton.webp":
    "/legacy-photos/c35532d15601-port-hercules-during-the-2026-monaco-grand-prix-while-kimi-anton-mobile.webp",
  "/images/guides/guides-marina-hamble-point-hero-v1.png":
    "/images/guides/guides-marina-hamble-point-hero-mobile.webp",
  "/images/guides/guides-solent-needles-hero-v1.png":
    "/images/guides/guides-solent-needles-mobile.webp",
};

export function publicMediaVariantUrl(url: string, variant: "web" | "thumbnail" | "mobile") {
  if (variant === "mobile" && mobileMediaVariants[url]) {
    return mobileMediaVariants[url];
  }
  if (variant === "thumbnail" && url === "/images/guides/guides-solent-needles-hero-v1.png") {
    return "/images/guides/guides-solent-needles-mobile.webp";
  }
  if (!/^\/api\/media\/[^/?#]+$/.test(url)) return url;
  return `${url}?variant=${variant === "mobile" ? "web" : variant}`;
}
