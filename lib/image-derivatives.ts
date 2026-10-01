import { derivativeImageUrl, nearestResponsiveWidth, type ResponsiveImageWidth } from "./responsive-image.ts";

type NodeProcessLike = {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
};

type SourceImage = {
  cacheKey: string;
  contentType: string;
  filename: string;
  load(): Promise<Uint8Array | null>;
};

type SharpFactory = ((input: Uint8Array, options: { failOn: "none"; limitInputPixels: number; sequentialRead: boolean }) => {
  metadata(): Promise<{ width?: number; height?: number }>;
  rotate(): {
    resize(options: { fit: "inside"; width: number; withoutEnlargement: boolean }): {
      webp(options: { effort: number; quality: number }): { toBuffer(): Promise<Buffer> };
    };
  };
}) & {
  cache(value: false): void;
  concurrency(value: number): void;
};

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_INPUT_PIXELS = 16_000_000;
const WEBP_QUALITY = 76;
const WEBP_EFFORT = 2;
const IMAGE_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const sizeCache = new Map<string, { height: number; width: number }>();
const inflight = new Map<string, Promise<Uint8Array>>();
let encodeQueue: Promise<unknown> = Promise.resolve();
let sharpConfigured = false;

function nodeProcess() {
  return (globalThis as typeof globalThis & { process?: NodeProcessLike }).process;
}

async function cacheDirectory() {
  const { os, path } = await nodeModules();
  const process = nodeProcess();
  const override = process?.env?.OLDSEADOGS_IMAGE_CACHE_DIR?.trim();
  const dataDir = process?.env?.OLDSEADOGS_DATA_DIR?.trim()
    || (process?.cwd ? path.join(process.cwd(), ".oldseadogs-data") : os.tmpdir());
  const candidate = override || path.join(dataDir, "cache", "image-derivatives");
  if (!(await isUnsafeCacheDirectory(candidate))) return candidate;
  return path.join(os.tmpdir(), "oldseadogs-image-derivatives");
}

async function isUnsafeCacheDirectory(directory: string) {
  const { path } = await nodeModules();
  const process = nodeProcess();
  const resolved = path.resolve(directory);
  const publicDir = process?.cwd ? path.resolve(process.cwd(), "public") : "";
  if (publicDir && (resolved === publicDir || resolved.startsWith(`${publicDir}${path.sep}`))) return true;
  const markers = ["originals", "web", "thumbnails"].map((name) => `${path.sep}media${path.sep}${name}`);
  if (markers.some((marker) => resolved.includes(marker))) return true;
  if (path.basename(resolved) === "editor-store.json") return true;
  return false;
}

async function nodeModules() {
  const fs = await import(/* @vite-ignore */ "node:fs/promises") as {
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
    realpath(path: string): Promise<string>;
    rename(from: string, to: string): Promise<void>;
    stat(path: string): Promise<{ mtimeMs: number; size: number }>;
    writeFile(path: string, data: Uint8Array | string): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ "node:path") as {
    basename(value: string): string;
    dirname(value: string): string;
    join(...parts: string[]): string;
    relative(from: string, to: string): string;
    resolve(...parts: string[]): string;
    sep: string;
  };
  const os = await import(/* @vite-ignore */ "node:os") as { tmpdir(): string };
  return { fs, os, path };
}

async function loadSharp() {
  const sharpModule = await import(/* @vite-ignore */ "sharp");
  const sharp = sharpModule.default as SharpFactory;
  if (!sharpConfigured) {
    sharp.cache(false);
    sharp.concurrency(1);
    sharpConfigured = true;
  }
  return sharp;
}

function enqueue<T>(task: () => Promise<T>) {
  const run = encodeQueue.then(task, task);
  encodeQueue = run.then(() => undefined, () => undefined);
  return run;
}

export async function readImageSize(url: string) {
  const cached = sizeCache.get(url);
  if (cached) return cached;
  const mediaId = url.match(/^\/api\/media\/([A-Za-z0-9_-]+)/)?.[1];
  if (mediaId) {
    const recorded = await recordedMediaSize(mediaId);
    if (recorded) {
      sizeCache.set(url, recorded);
      return recorded;
    }
  }
  const source = await readSourceImage(url).catch(() => null);
  if (!source) return null;
  const bytes = await source.load();
  if (!bytes) return null;
  try {
    const sharp = await loadSharp();
    const metadata = await sharp(bytes, {
      failOn: "none",
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    }).metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!width || !height) return null;
    const size = { width, height };
    sizeCache.set(url, size);
    return size;
  } catch {
    return null;
  }
}

export async function renderWebpDerivative(url: string, width: number) {
  const safeWidth = nearestResponsiveWidth(width);
  const source = await readSourceImage(url);
  if (!source) return null;
  const cacheKey = `${safeWidth}:${source.cacheKey}`;
  const pending = inflight.get(cacheKey);
  if (pending) return pending;
  const promise = enqueue(() => encodeDerivative(source, safeWidth));
  inflight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    if (inflight.get(cacheKey) === promise) inflight.delete(cacheKey);
  }
}

async function encodeDerivative(source: SourceImage, width: ResponsiveImageWidth) {
  const cached = await readCachedDerivative(source, width);
  if (cached) return cached;
  const sourceBytes = await source.load();
  if (!sourceBytes) throw new Error("The source image could not be read.");
  const sharp = await loadSharp();
  const pipeline = sharp(sourceBytes, {
    failOn: "none",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  }).rotate();
  const encoded = await pipeline.resize({
    fit: "inside",
    width,
    withoutEnlargement: true,
  }).webp({ effort: WEBP_EFFORT, quality: WEBP_QUALITY }).toBuffer();
  const derivative = new Uint8Array(encoded);
  await writeCachedDerivative(source, width, derivative);
  return derivative;
}

export function derivativeResponseHeaders(etag: string) {
  return {
    "Cache-Control": IMAGE_CACHE_CONTROL,
    "Content-Type": "image/webp",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
}

export async function serveDerivative(request: Request, width: number, asset: string[]) {
  const url = sourceUrlForAsset(asset);
  if (!url || !Number.isFinite(width)) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  try {
    const source = await readSourceImage(url);
    if (!source) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const etag = `"${nearestResponsiveWidth(width)}-${source.cacheKey}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: derivativeResponseHeaders(etag) });
    }
    const bytes = await renderWebpDerivative(url, width);
    if (!bytes) return redirectToOriginal(url);
    return new Response(Buffer.from(bytes), { headers: derivativeResponseHeaders(etag) });
  } catch (error) {
    console.error("[OldSeaDogs images] derivative failed", {
      url,
      width,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return redirectToOriginal(url);
  }
}

function sourceUrlForAsset(asset: string[]) {
  if (asset.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\") || segment.includes("/"))) {
    return "";
  }
  if (asset[0] === "media" && asset.length === 2 && /^[A-Za-z0-9_-]+$/.test(asset[1] || "")) {
    return `/api/media/${asset[1]}`;
  }
  const relative = asset.join("/");
  if (!/^(?:images|legacy-photos|section-heroes|ads)\//.test(relative)) return "";
  if (!/\.(?:png|jpe?g|webp|gif|avif)$/i.test(relative)) return "";
  return `/${relative}`;
}

function redirectToOriginal(url: string) {
  const location = derivativeImageUrl(url, 1600).startsWith("/api/media/")
    ? derivativeImageUrl(url, 1600)
    : url;
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store",
      Location: location,
    },
  });
}

async function readSourceImage(url: string): Promise<SourceImage | null> {
  const mediaId = url.match(/^\/api\/media\/([A-Za-z0-9_-]+)$/)?.[1];
  if (mediaId) return readMediaOriginal(mediaId);
  if (!url.startsWith("/")) return null;
  return readPublicFile(url);
}

async function readPublicFile(url: string): Promise<SourceImage | null> {
  const { fs, path } = await nodeModules();
  const process = nodeProcess();
  if (!process?.cwd) return null;
  const publicRoot = path.resolve(process.cwd(), "public");
  const relative = url.replace(/^\/+/, "");
  const resolved = path.resolve(publicRoot, relative);
  if (resolved !== publicRoot && !resolved.startsWith(`${publicRoot}${path.sep}`)) return null;
  let real = resolved;
  try {
    real = await fs.realpath(resolved);
  } catch {
    return null;
  }
  const realRoot = await fs.realpath(publicRoot).catch(() => publicRoot);
  if (real !== realRoot && !real.startsWith(`${realRoot}${path.sep}`)) return null;
  const details = await fs.stat(real);
  if (details.size <= 0 || details.size > MAX_SOURCE_BYTES) return null;
  return {
    cacheKey: `${details.size}-${Math.round(details.mtimeMs)}-${relative}`,
    contentType: contentTypeFor(relative),
    filename: path.basename(relative),
    load: async () => fs.readFile(real),
  };
}

async function recordedMediaSize(id: string) {
  const { getMediaAsset } = await import("./site-content");
  const asset = await getMediaAsset(id);
  const width = Number(asset?.width || 0);
  const height = Number(asset?.height || 0);
  if (!width || !height) return null;
  return { width, height };
}

async function readMediaOriginal(id: string): Promise<SourceImage | null> {
  const { getMediaAsset } = await import("./site-content");
  const { readLocalMediaUpload } = await import("./local-media-storage");
  const asset = await getMediaAsset(id);
  if (!asset?.r2Key?.startsWith("local:")) return null;
  const original = await readLocalMediaUpload(asset.r2Key, "original");
  if (!original || original.bytes.byteLength <= 0 || original.bytes.byteLength > MAX_SOURCE_BYTES) return null;
  if (original.contentType && !original.contentType.startsWith("image/")) return null;
  return {
    cacheKey: `${id}-${original.bytes.byteLength}-${asset.createdAt || ""}`,
    contentType: original.contentType || asset.contentType || "image/jpeg",
    filename: original.filename,
    load: async () => original.bytes,
  };
}

async function cachedDerivativePath(source: SourceImage, width: number) {
  const { path } = await nodeModules();
  const safeName = source.cacheKey.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
  return path.join(await cacheDirectory(), String(width), `${safeName}.webp`);
}

async function readCachedDerivative(source: SourceImage, width: number) {
  const { fs } = await nodeModules();
  try {
    return await fs.readFile(await cachedDerivativePath(source, width));
  } catch {
    return null;
  }
}

async function writeCachedDerivative(source: SourceImage, width: number, bytes: Uint8Array) {
  const { fs, os, path } = await nodeModules();
  const target = await cachedDerivativePath(source, width);
  if (await isUnsafeCacheDirectory(path.dirname(target))) return;
  const temporary = path.join(os.tmpdir(), `oldseadogs-img-${processPid()}-${Date.now()}.webp`);
  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(temporary, bytes);
    await fs.rename(temporary, target);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code !== "EPERM" && code !== "EROFS" && code !== "EACCES") {
      console.error("[OldSeaDogs images] derivative cache write skipped", {
        target,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function processPid() {
  const process = nodeProcess() as NodeProcessLike & { pid?: number };
  return process?.pid || 0;
}

function contentTypeFor(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}
