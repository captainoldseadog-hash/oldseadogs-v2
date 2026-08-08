function decodeHtml(value) {
  return String(value || "")
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(value, baseUrl) {
  return value ? new URL(decodeHtml(value), baseUrl).href : "";
}

function attribute(tag, name) {
  const match = String(tag || "").match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function backgroundImageUrl(html, className, baseUrl) {
  const tag = String(html || "").match(new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>`, "i"))?.[0] || "";
  const style = attribute(tag, "style");
  const url = style.match(/background-image\s*:\s*url\((?:&quot;|["'])?([^)'";]+)(?:&quot;|["'])?\)/i)?.[1] || "";
  return absoluteUrl(url, baseUrl);
}

export function parseHomepageStoryManifest(html, baseUrl = "https://oldseadogs.com/") {
  const source = String(html || "");
  const leadAnchor = [...source.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
    .map((match) => match[0])
    .find((anchor) => decodeHtml(anchor) === "Read the lead story") || "";
  const leadLink = absoluteUrl(attribute(leadAnchor, "href"), baseUrl);
  const latestStart = source.search(/<section\b[^>]*id=["']latest["']/i);
  const latestTail = latestStart >= 0 ? source.slice(latestStart) : "";
  const latestEnd = latestTail.search(/<\/section>/i);
  const latestHtml = latestEnd >= 0 ? latestTail.slice(0, latestEnd) : latestTail;
  const latestStories = [...latestHtml.matchAll(/<article\b[^>]*class=["'][^"']*story-card[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)]
    .slice(0, 4)
    .map((match) => {
      const article = match[0];
      const heading = article.match(/<h3\b[^>]*>[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i);
      const href = heading ? attribute(`<a ${heading[1]}>`, "href") : "";
      const spans = [...(article.match(/class=["'][^"']*story-meta[^"']*["'][\s\S]*?<\/div>/i)?.[0] || "").matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)];
      return {
        slug: href.split("/").filter(Boolean).pop() || "",
        title: decodeHtml(heading?.[2] || ""),
        date: decodeHtml(spans[1]?.[1] || ""),
        imageUrl: backgroundImageUrl(article, "story-image", baseUrl),
        link: absoluteUrl(href, baseUrl),
      };
    });

  return {
    sourceUrl: baseUrl,
    featuredStory: {
      slug: leadLink.split("/").filter(Boolean).pop() || "",
      imageUrl: backgroundImageUrl(source, "hero-image", baseUrl),
      link: leadLink,
    },
    latestStories,
  };
}

export function parseStoryPageDetails(html) {
  const source = String(html || "");
  const title = decodeHtml(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const date = decodeHtml(
    source.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1] ||
    source.match(/class=["'][^"']*article-meta[^"']*["'][\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
    ""
  );
  return { title, date };
}

export async function captureLiveHomepageManifest({
  baseUrl = "https://oldseadogs.com/",
  fetchImpl = fetch,
} = {}) {
  const homepageResponse = await fetchImpl(baseUrl, { headers: { accept: "text/html" } });
  if (!homepageResponse.ok) throw new Error(`Homepage returned HTTP ${homepageResponse.status}.`);
  const manifest = parseHomepageStoryManifest(await homepageResponse.text(), baseUrl);
  if (!manifest.featuredStory.link || manifest.latestStories.length !== 4) {
    throw new Error("The live homepage story manifest could not be extracted safely.");
  }
  const storyResponse = await fetchImpl(manifest.featuredStory.link, { headers: { accept: "text/html" } });
  if (!storyResponse.ok) throw new Error(`Featured story returned HTTP ${storyResponse.status}.`);
  const featuredDetails = parseStoryPageDetails(await storyResponse.text());
  return {
    purpose: "Read-only post-deployment validation; never a production content source.",
    ...manifest,
    capturedAt: new Date().toISOString(),
    featuredStory: { ...manifest.featuredStory, ...featuredDetails },
  };
}
