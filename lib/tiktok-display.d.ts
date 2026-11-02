export const TIKTOK_UNIQUE_ID: string;
export const TIKTOK_PROFILE_URL: string;

export type PublicTikTokVideo = {
  id: string;
  title: string;
  viewCount: number;
  watchUrl: string;
  embedUrl: string;
  coverPath: string;
};

export function isTikTokVideoId(value: unknown): boolean;

export function accountMatchesChannel(username: unknown, expected?: string): boolean;

export function formatTikTokViewCount(value: unknown): string;

export function cleanTikTokTitle(value: unknown): string;

export function isOfficialCoverUrl(value: unknown): boolean;

export function officialEmbedUrl(videoId: unknown, embedLink?: unknown): string;

export function officialWatchUrl(videoId: unknown, shareUrl?: unknown): string;

export function coverPathForTikTokVideo(videoId: unknown): string;

export function toPublicTikTokVideo(raw: {
  id?: unknown;
  title?: unknown;
  video_description?: unknown;
  view_count?: unknown;
  share_url?: unknown;
  embed_link?: unknown;
} | null | undefined): PublicTikTokVideo | null;

export function toPublicTikTokCatalog(catalog: {
  available?: unknown;
  complete?: unknown;
  videos?: unknown[];
} | null | undefined): {
  available: boolean;
  complete: boolean;
  videos: PublicTikTokVideo[];
};

export function sanitizePublicTikTokVideo(value: unknown): PublicTikTokVideo | null;
