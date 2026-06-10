import type { MetadataRoute } from "next";
import { manufacturers, storyMatchesManufacturer } from "../content/manufacturers";
import { oldSeaDogsSections } from "../content/sections";
import { getPublishedStories } from "../lib/site-content";
import { absoluteUrl } from "../lib/seo";

export const dynamic = "force-dynamic";

const staticRoutes = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.7 },
  { path: "/authors/michael-hodges", priority: 0.7 },
  { path: "/contact", priority: 0.7 },
  { path: "/search", priority: 0.65 },
  { path: "/privacy", priority: 0.35 },
  { path: "/cookie-policy", priority: 0.35 },
  { path: "/terms", priority: 0.35 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await getPublishedStories();
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.path === "/" ? "daily" as const : "monthly" as const,
      priority: route.priority,
    })),
    ...oldSeaDogsSections.map((section) => ({
      url: absoluteUrl(`/${section.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: section.slug === "news" ? 0.9 : 0.75,
    })),
    ...manufacturers
      .filter((manufacturer, index, list) =>
        list.findIndex((item) => item.slug === manufacturer.slug) === index
      )
      .filter((manufacturer) =>
        stories.some((story) => storyMatchesManufacturer(story, manufacturer))
      )
      .map((manufacturer) => ({
        url: absoluteUrl(`/manufacturers/${manufacturer.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.62,
      })),
    ...stories.map((story) => ({
      url: absoluteUrl(`/stories/${story.slug}`),
      lastModified: new Date(story.updatedAt || `${story.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: story.isFeatured ? 0.9 : 0.65,
    })),
  ];
}
