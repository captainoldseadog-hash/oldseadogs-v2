import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export function getDbOrNull() {
  try {
    return getDb();
  } catch {
    return null;
  }
}

type MediaObject = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata(headers: Headers): void;
};

type MediaBucket = {
  get(key: string): Promise<MediaObject | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
};

export function getMediaBucket() {
  return (env as unknown as { MEDIA?: MediaBucket }).MEDIA ?? null;
}
