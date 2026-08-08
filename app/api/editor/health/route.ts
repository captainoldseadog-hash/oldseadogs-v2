import { sourceWatchSites } from "../../../../content/source-watch";
import { categoryMatchesLabel } from "../../../../content/sections";
import { getDbOrNull, getMediaBucket } from "../../../../db";
import {
  canEditSite,
  forbiddenResponse,
  privateEditorHeaders,
} from "../../../../lib/editor-auth";
import { getDeploymentInfo } from "../../../../lib/deployment-info";
import { getLocalMediaStorageInfo, localMediaStorageAvailable } from "../../../../lib/local-media-storage";
import { oldSeaDogsEnv, searchIndexingEnabled, siteUrl } from "../../../../lib/seo";
import {
  getEditorData,
  getEditorStorageStatus,
  getDevelopmentHomepageFixtureStatus,
  getHomepageLatestStories,
  getPublishedStories,
  getStoryPublicVisibility,
  hasStoryPhoto,
  storyHomepageTime,
} from "../../../../lib/site-content";

export const dynamic = "force-dynamic";

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(privateEditorHeaders())) {
    headers.set(key, value);
  }
  return Response.json(body, { ...init, headers });
}

export async function GET(request: Request) {
  if (!await canEditSite(request)) return forbiddenResponse();

  try {
    const dbAvailable = Boolean(getDbOrNull());
    const storageStatus = await getEditorStorageStatus();
    const homepageFixture = await getDevelopmentHomepageFixtureStatus();
    const deployment = await getDeploymentInfo();
    const mediaInfo = await getLocalMediaStorageInfo();
    const mediaAvailable = localMediaStorageAvailable() || Boolean(getMediaBucket());
    const editorData = await getEditorData();
    const publishedStories = await getPublishedStories();
    const homepageFeaturedStory = publishedStories.find((story) => story.isFeatured) ?? publishedStories[0] ?? null;
    const homepageLatestStories = getHomepageLatestStories(publishedStories, {
      excludeSlug: homepageFeaturedStory?.slug,
      limit: 4,
    });
    const transpacTestStory = publishedStories.find(
      (story) => story.slug === "get-ready-to-race-in-the-2027-transpac"
    ) ?? null;
    const transpacVisibility = transpacTestStory
      ? getStoryPublicVisibility(transpacTestStory, publishedStories)
      : null;
    const emailIngestion = editorData.emailIngestion;
    const portCount = editorData.stories.filter((story) => categoryMatchesLabel(story.category, "Ports")).length;
    const clubCount = editorData.stories.filter((story) => categoryMatchesLabel(story.category, "Clubs")).length;
    const draftCount = editorData.stories.filter((story) => story.status === "draft").length;
    const storiesWithImages = editorData.stories.filter(hasStoryPhoto).length;
    const storiesWithoutImages = editorData.stories.length - storiesWithImages;
    const newsroomItemsWithImages = editorData.pressReleases.filter((item) => item.imageUrl.trim()).length;
    const newsroomItemsWithoutImages = editorData.pressReleases.length - newsroomItemsWithImages;
    const newsroomItemsWithInlineImages = editorData.pressReleases.filter((item) =>
      item.generatedBody.some((paragraph) => paragraph.includes("article-inline-image") || paragraph.includes("[image:/api/media/"))
    ).length;
    const latestNewsroomImageItem =
      [...editorData.pressReleases]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .find((item) => item.imageUrl.trim() || item.attachments.some((attachment) => attachment.dataUrl.startsWith("/api/media/"))) ??
      null;
    const latestNewsroomImageStory = latestNewsroomImageItem?.storyId
      ? editorData.stories.find((story) => story.id === latestNewsroomImageItem.storyId) ?? null
      : null;
    const latestNewsroomImageUrl = latestNewsroomImageItem?.imageUrl.trim() || "";
    const latestNewsroomStoryImageUrl = latestNewsroomImageStory?.imageUrl.trim() || "";
    const latestNewsroomInlineImageCount = latestNewsroomImageItem
      ? latestNewsroomImageItem.generatedBody.filter((paragraph) =>
          paragraph.includes("article-inline-image") || paragraph.includes("[image:/api/media/")
        ).length
      : 0;
    const latestPublicStoryInlineImageCount = latestNewsroomImageStory
      ? latestNewsroomImageStory.body.filter((paragraph) =>
          paragraph.includes("article-inline-image") || paragraph.includes("[image:/api/media/")
        ).length
      : 0;

    const services = {
      site: {
        ok: true,
        detail: "Main site is served by the Vinext production process.",
      },
      editor: {
        ok: true,
        detail: "Private editor UI and API are reachable locally.",
      },
      database: {
        ok: dbAvailable || storageStatus.persistent,
        detail: dbAvailable
          ? "Persistent editor database storage is available."
          : storageStatus.detail,
        mode: storageStatus.mode,
        dataPath: storageStatus.dataPath,
      },
      mediaUploads: {
        ok: mediaAvailable,
        detail: mediaAvailable
          ? "Local media storage or MEDIA bucket is available."
          : "No local media storage or MEDIA bucket is available.",
        mediaDirectory: mediaInfo.mediaDir,
      },
      scraperRewrite: {
        ok: sourceWatchSites.length > 0,
        sourcesWatched: sourceWatchSites.length,
        detail: `${sourceWatchSites.length} source watch site${sourceWatchSites.length === 1 ? "" : "s"} configured for manual review.`,
      },
      emailPressReleaseImport: {
        ok: emailIngestion.methods.length > 0,
        inboxConfigured: emailIngestion.inboxConfigured,
        detail: emailIngestion.note,
        missingEnvironmentKeys: emailIngestion.missingEnvironmentKeys,
        storage: emailIngestion.storageDetail,
      },
      reviewApprovalWorkflow: {
        ok: true,
        draftCount,
        pressReleaseItems: editorData.pressReleases.length,
        detail: "Stories, generated drafts, and press releases remain in review until approved.",
      },
      adManagement: {
        ok: Array.isArray(editorData.ads),
        adverts: editorData.ads.length,
        detail: "Advert records are available to the editor.",
      },
      portsClubsManagement: {
        ok: portCount > 0 && clubCount > 0,
        ports: portCount,
        clubs: clubCount,
        detail: "Ports and Clubs are managed through published story records.",
      },
    };

    const ok = Object.values(services).every((service) => service.ok);

    return privateJson(
      {
        ok,
        checkedAt: new Date().toISOString(),
        oldSeaDogsEnv,
        siteUrl,
        searchIndexingEnabled,
        buildTimestamp: deployment.buildTimestamp,
        gitCommit: deployment.gitCommit,
        gitBranch: deployment.gitBranch,
        deploymentTimestamp: deployment.deploymentTimestamp,
        serverHostname: deployment.serverHostname,
        dataDirectory: storageStatus.dataPath,
        mediaDirectory: mediaInfo.mediaDir,
        digitalOceanMode: deployment.digitalOceanMode,
        enabledFeatures: deployment.features,
        scraperSourceCount: sourceWatchSites.length,
        newsroomPreviewEnabled: deployment.features.newsroomPreviewEnabled,
        emailPublishEnabled: deployment.features.emailPublishEnabled,
        mediaRecordsCount: editorData.media.length,
        storiesWithImages,
        storiesWithoutImages,
        newsroomItemsWithImages,
        newsroomItemsWithoutImages,
        newsroomItemsWithInlineImages,
        latestNewsroomImageDiagnostics: latestNewsroomImageItem
          ? {
              itemId: latestNewsroomImageItem.id,
              subject: latestNewsroomImageItem.subject,
              status: latestNewsroomImageItem.status,
              storyId: latestNewsroomImageItem.storyId,
              itemImage: latestNewsroomImageUrl,
              itemFeaturedImage: latestNewsroomImageUrl,
              itemImageMediaId: latestNewsroomImageUrl.match(/\/api\/media\/([^/?#]+)/)?.[1] || "",
              selectedAttachmentId: latestNewsroomImageItem.selectedAttachmentId,
              attachmentMediaUrls: latestNewsroomImageItem.attachments
                .map((attachment) => attachment.dataUrl)
                .filter((value) => value.startsWith("/api/media/")),
              itemInlineImageCount: latestNewsroomInlineImageCount,
              itemBodyContainsInlineFigure: latestNewsroomImageItem.generatedBody.some((paragraph) =>
                paragraph.includes("article-inline-image")
              ),
              publicStorySlug: latestNewsroomImageStory?.slug || "",
              publicStoryStatus: latestNewsroomImageStory?.status || "",
              publicStoryImage: latestNewsroomStoryImageUrl,
              publicStoryFeaturedImage: latestNewsroomStoryImageUrl,
              publicStoryImageMediaId: latestNewsroomStoryImageUrl.match(/\/api\/media\/([^/?#]+)/)?.[1] || "",
              publicStoryCaption: latestNewsroomImageStory?.imageCaption || "",
              publicStoryCredit: latestNewsroomImageStory?.imageCredit || "",
              publicStoryBodyContainsApiMedia: latestNewsroomImageStory?.body.some((paragraph) =>
                paragraph.includes("/api/media/")
              ) ?? false,
              publicStoryInlineImageCount: latestPublicStoryInlineImageCount,
              imageFieldCarriedToPublicStory: Boolean(
                latestNewsroomImageUrl &&
                latestNewsroomStoryImageUrl &&
                latestNewsroomImageUrl === latestNewsroomStoryImageUrl
              ),
            }
          : null,
        homepageFeaturedSlug: homepageFeaturedStory?.slug ?? "",
        homepageDataSource: homepageFixture.source,
        homepageDevelopmentFixture: homepageFixture,
        homepageLatestSlugs: homepageLatestStories.map((story) => story.slug),
        homepageLatestStories: homepageLatestStories.map((story) => ({
          slug: story.slug,
          title: story.title,
          status: story.status,
          category: story.category,
          date: story.date,
          updatedAt: story.updatedAt,
          createdAt: story.createdAt,
          sourceType: story.sourceType,
          sourceName: story.sourceName,
          homepageTime: storyHomepageTime(story),
        })),
        transpacTestStory: transpacTestStory
          ? {
              slug: transpacTestStory.slug,
              title: transpacTestStory.title,
              status: transpacTestStory.status,
              category: transpacTestStory.category,
              date: transpacTestStory.date,
              updatedAt: transpacTestStory.updatedAt,
              createdAt: transpacTestStory.createdAt,
              sourceType: transpacTestStory.sourceType,
              sourceName: transpacTestStory.sourceName,
              homepageTime: storyHomepageTime(transpacTestStory),
              visibility: transpacVisibility,
            }
          : null,
        services,
      },
      { status: ok ? 200 : 503 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown editor health error.";
    console.error("[OldSeaDogs editor health]", error);
    return privateJson(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}
