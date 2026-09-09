import { oldSeaDogsSameAsLinks } from "../content/social-links";
import { contactEmail, absoluteUrl, siteName, siteUrl } from "./seo";
import { cleanStoryTags } from "./tags";

type StructuredStory = {
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
};

type StructuredImage = {
  url: string;
  width?: number;
  height?: number;
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: absoluteUrl("/images/old-sea-dogs-logo.png"),
  email: contactEmail,
  sameAs: oldSeaDogsSameAsLinks,
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  publisher: {
    "@type": "Organization",
    name: siteName,
  },
};

export const michaelHodgesPersonJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Michael Hodges",
  url: absoluteUrl("/authors/michael-hodges"),
  image: absoluteUrl("/images/authors/oldseadogs-michael-hodges.webp"),
  email: contactEmail,
  jobTitle: "Editor and founder",
  sameAs: oldSeaDogsSameAsLinks,
  worksFor: {
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
  },
};

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(story: StructuredStory, image?: StructuredImage) {
  const authorName = story.author.trim() || "Michael Hodges";
  const author = authorName.toLowerCase() === siteName.toLowerCase()
    ? {
        "@type": "Organization",
        name: siteName,
        url: siteUrl,
      }
    : {
        "@type": "Person",
        name: authorName,
        ...(authorName.toLowerCase() === "michael hodges"
          ? { url: absoluteUrl("/authors/michael-hodges") }
          : {}),
      };

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.summary,
    articleSection: story.category,
    keywords: cleanStoryTags(story.tags),
    datePublished: story.publishedAt || story.date,
    dateModified: story.updatedAt || story.publishedAt || story.date,
    mainEntityOfPage: absoluteUrl(`/stories/${story.slug}`),
    image: image ? [{
      "@type": "ImageObject",
      url: absoluteUrl(image.url),
      ...(image.width ? { width: image.width } : {}),
      ...(image.height ? { height: image.height } : {}),
    }] : undefined,
    author,
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/old-sea-dogs-logo.png"),
      },
    },
  };
}

export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Michael Hodges author profile",
    url: absoluteUrl("/authors/michael-hodges"),
    mainEntity: michaelHodgesPersonJsonLd,
  };
}

export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Old Sea Dogs",
    url: absoluteUrl("/contact"),
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      email: contactEmail,
    },
  };
}
