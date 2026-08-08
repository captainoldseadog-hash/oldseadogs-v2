import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type D1Statement = {
  run(): Promise<unknown>;
};

export type D1Binding = {
  prepare(query: string): D1Statement;
};

type RuntimeBindings = {
  DB?: D1Binding;
  MEDIA?: MediaBucket;
};

let runtimeBindings: RuntimeBindings = {};

export function setRuntimeBindings(bindings: RuntimeBindings) {
  runtimeBindings = bindings ?? {};
}

function getRuntimeBindings() {
  return runtimeBindings;
}

export function getDb() {
  const db = getRuntimeBindings().DB;
  if (!db) {
    throw new Error(
      "Database binding `DB` is unavailable. On Cloudflare/Sites, set the `d1` field in .openai/hosting.json to `DB`. On DigitalOcean, configure the PostgreSQL adapter before using persistent editor data."
    );
  }

  return drizzle(db, { schema });
}

export function getDbOrNull() {
  try {
    return getDb();
  } catch {
    return null;
  }
}

export function getD1BindingOrNull() {
  return getRuntimeBindings().DB ?? null;
}

export type MediaObject = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata(headers: Headers): void;
};

export type MediaBucket = {
  get(key: string): Promise<MediaObject | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
};

export function getMediaBucket() {
  return getRuntimeBindings().MEDIA ?? null;
}
