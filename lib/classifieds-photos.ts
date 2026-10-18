import { CLASSIFIEDS_MAX_PHOTO_BYTES } from "./classifieds-types.ts";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "heif"]);

export class ClassifiedPhotoError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ClassifiedPhotoError";
    this.status = status;
  }
}

export type ProcessedPhoto = {
  webp: Uint8Array;
  thumb: Uint8Array;
  width: number;
  height: number;
  sourceFormat: string;
};

const heifBrands = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis", "hevm", "hevs", "avif"]);

export function isHeifContainer(bytes: Uint8Array) {
  if (bytes.byteLength < 12) return false;
  const box = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (box !== "ftyp") return false;
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
  return heifBrands.has(brand);
}

async function jpegBytesFromHeic(bytes: Uint8Array): Promise<{ bytes: Uint8Array; format: string } | null> {
  if (!isHeifContainer(bytes)) return null;
  try {
    const imported = await import("heic-convert");
    const convert = imported.default;
    const output = await convert({ buffer: Buffer.from(bytes), format: "JPEG", quality: 0.92 });
    const jpeg = output instanceof Uint8Array ? output : new Uint8Array(output);
    return jpeg.byteLength > 0 ? { bytes: jpeg, format: "heif" } : null;
  } catch {
    return null;
  }
}

export async function processClassifiedPhoto(bytes: Uint8Array, declaredType = ""): Promise<ProcessedPhoto> {
  if (bytes.byteLength <= 0) throw new ClassifiedPhotoError("Choose a photograph to upload.");
  if (bytes.byteLength > CLASSIFIEDS_MAX_PHOTO_BYTES) {
    throw new ClassifiedPhotoError("Each photograph must be 8 MB or smaller.", 413);
  }
  const declared = declaredType.toLowerCase();
  if (declared && !/image\/(jpeg|png|webp|heic|heif)/.test(declared) && !declared.endsWith("heic") && !declared.endsWith("heif")) {
    throw new ClassifiedPhotoError("Upload a JPEG, PNG, WebP or HEIC photograph.", 415);
  }
  try {
    return await encodeClassifiedWebp(bytes);
  } catch (error) {
    if (!(error instanceof ClassifiedPhotoError) || !isHeifContainer(bytes)) throw error;
    const converted = await jpegBytesFromHeic(bytes);
    if (!converted) {
      throw new ClassifiedPhotoError("This HEIC photograph could not be read. Please upload a JPEG, PNG or WebP instead.", 415);
    }
    return encodeClassifiedWebp(converted.bytes, "heif");
  }
}

async function encodeClassifiedWebp(bytes: Uint8Array, formatHint = ""): Promise<ProcessedPhoto> {
  const sharp = await loadSharp();
  let pipeline: SharpLike;
  try {
    pipeline = sharp(bytes, { failOn: "none", limitInputPixels: 16_000_000, sequentialRead: true });
    const metadata = await pipeline.metadata();
    const format = metadata.format || "";
    if (!formatHint && (!ALLOWED_FORMATS.has(format) || !metadata.width || !metadata.height)) {
      throw new ClassifiedPhotoError("Upload a JPEG, PNG, WebP or HEIC photograph.", 415);
    }
    const oriented = pipeline.rotate();
    const webp = new Uint8Array(await oriented.clone().resize({
      fit: "inside",
      width: 2000,
      height: 2000,
      withoutEnlargement: true,
    }).webp({ effort: 2, quality: 78 }).toBuffer());
    const thumb = new Uint8Array(await oriented.clone().resize({
      fit: "inside",
      width: 640,
      height: 640,
      withoutEnlargement: true,
    }).webp({ effort: 2, quality: 72 }).toBuffer());
    const saved = await sharp(webp, { failOn: "none", limitInputPixels: 16_000_000, sequentialRead: true }).metadata();
    if (saved.exif || saved.iptc || saved.xmp) {
      throw new ClassifiedPhotoError("The photograph could not be saved without its location data.");
    }
    return {
      webp,
      thumb,
      width: Number(saved.width || metadata.width || 0),
      height: Number(saved.height || metadata.height || 0),
      sourceFormat: formatHint || format,
    };
  } catch (error) {
    if (error instanceof ClassifiedPhotoError) throw error;
    throw new ClassifiedPhotoError("That file could not be read as a photograph.", 415);
  }
}

export async function writeClassifiedPhotoFiles(listingId: string, photoId: string, photo: ProcessedPhoto) {
  const fs = await nodeFs();
  const directory = await photoDirectory(listingId);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(await photoFile(listingId, photoId, "full"), photo.webp);
  await fs.writeFile(await photoFile(listingId, photoId, "thumb"), photo.thumb);
}

export async function readClassifiedPhotoFile(listingId: string, photoId: string, variant: "full" | "thumb") {
  const fs = await nodeFs();
  try {
    return await fs.readFile(await photoFile(listingId, photoId, variant));
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return null;
    throw error;
  }
}

export async function removeClassifiedPhotoFiles(listingId: string) {
  const fs = await nodeFs();
  await fs.rm(await photoDirectory(listingId), { force: true, recursive: true });
}

export async function removeClassifiedPhotoFile(listingId: string, photoId: string) {
  const fs = await nodeFs();
  await fs.rm(await photoFile(listingId, photoId, "full"), { force: true, recursive: false });
  await fs.rm(await photoFile(listingId, photoId, "thumb"), { force: true, recursive: false });
}

async function photoDirectory(listingId: string) {
  const path = await nodePath();
  const { classifiedsDataDir } = await import("./classifieds-store.ts");
  if (!/^[A-Za-z0-9_-]+$/.test(listingId)) throw new ClassifiedPhotoError("Unknown photograph.");
  return path.join(await classifiedsDataDir(), "classifieds-media", listingId);
}

async function photoFile(listingId: string, photoId: string, variant: "full" | "thumb") {
  const path = await nodePath();
  if (!/^[A-Za-z0-9_-]+$/.test(photoId)) throw new ClassifiedPhotoError("Unknown photograph.");
  const suffix = variant === "thumb" ? "-thumb.webp" : ".webp";
  return path.join(await photoDirectory(listingId), `${photoId}${suffix}`);
}

type SharpLike = {
  clone(): SharpLike;
  metadata(): Promise<{ exif?: Buffer; format?: string; height?: number; iptc?: Buffer; width?: number; xmp?: Buffer }>;
  resize(options: { fit: "inside"; height: number; width: number; withoutEnlargement: boolean }): SharpLike;
  rotate(): SharpLike;
  toBuffer(): Promise<Buffer>;
  webp(options: { effort: number; quality: number }): SharpLike;
};

async function loadSharp() {
  const sharpModule = await import(/* @vite-ignore */ "sharp");
  const sharp = sharpModule.default as ((input: Uint8Array, options: { failOn: "none"; limitInputPixels: number; sequentialRead: boolean }) => SharpLike) & {
    cache(value: false): void;
    concurrency(value: number): void;
  };
  sharp.cache(false);
  sharp.concurrency(1);
  return sharp;
}

async function nodeFs() {
  return import(/* @vite-ignore */ "node:fs/promises") as Promise<{
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
    rm(path: string, options: { force: boolean; recursive: boolean }): Promise<void>;
    writeFile(path: string, data: Uint8Array): Promise<void>;
  }>;
}

async function nodePath() {
  return import(/* @vite-ignore */ "node:path") as Promise<{ join(...parts: string[]): string }>;
}
