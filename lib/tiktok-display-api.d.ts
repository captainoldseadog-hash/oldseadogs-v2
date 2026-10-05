import type { PublicTikTokVideo } from "./tiktok-display.js";

export type TikTokCredentials = {
  clientKey?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type TikTokTokenRefresh = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  openId: string;
};

export type TikTokCatalog = {
  available: boolean;
  complete: boolean;
  videos: PublicTikTokVideo[];
  covers: Record<string, string>;
  refresh: TikTokTokenRefresh | null;
};

export function assembleTikTokCatalog(options?: {
  credentials?: TikTokCredentials;
  fetchImpl?: typeof fetch;
  maxPages?: number;
}): Promise<TikTokCatalog>;

export function refreshTikTokAccessToken(options: {
  clientKey?: string;
  clientSecret?: string;
  refreshToken?: string;
  fetchImpl?: typeof fetch;
}): Promise<TikTokTokenRefresh>;
