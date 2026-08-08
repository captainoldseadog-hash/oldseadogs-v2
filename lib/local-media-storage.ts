type NodeProcessLike = {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
  versions?: {
    node?: string;
  };
};

type LocalMediaUploadInput = {
  bytes: ArrayBuffer;
  contentType: string;
  fileName: string;
  id: string;
};

type LocalMediaUpload = {
  key: string;
  url: string;
  thumbnailUrl: string;
  originalKey: string;
  webKey: string;
  width: number;
  height: number;
};

export async function saveLocalVideoUpload(input: LocalMediaUploadInput): Promise<LocalMediaUpload | null> {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd) return null;
  const fs = await import(/* @vite-ignore */ "node:fs/promises") as {
    writeFile(path: string, data: Uint8Array | string): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ "node:path") as {
    basename(value: string): string; join(...parts: string[]): string;
  };
  const mediaPaths = await localMediaPaths();
  if (!mediaPaths) return null;
  const safeName = path.basename(input.fileName);
  const filename = `${input.id}-${safeName}`;
  const bytes = new Uint8Array(input.bytes);
  await fs.writeFile(path.join(mediaPaths.originalDir, filename), bytes);
  await fs.writeFile(path.join(mediaPaths.metadataDir, `${input.id}.json`), JSON.stringify({
    id: input.id, originalFilename: input.fileName, filename, contentType: input.contentType,
    size: bytes.byteLength, mediaKind: "video", createdAt: new Date().toISOString(),
  }, null, 2));
  return { key: `local:${input.id}`, url: `/api/media/${input.id}`, thumbnailUrl: "", originalKey: `local:${input.id}:original`, webKey: "", width: 0, height: 0 };
}

type LocalMediaRead = {
  bytes: Uint8Array;
  filename: string;
  contentType?: string;
};

function nodeProcess() {
  return (globalThis as typeof globalThis & { process?: NodeProcessLike }).process;
}

export function localMediaStorageAvailable() {
  const process = nodeProcess();
  return Boolean(process?.versions?.node && process.cwd);
}

export async function getLocalMediaStorageInfo() {
  const paths = await localMediaPaths(false);
  return {
    available: Boolean(paths),
    dataDir: paths?.dataDir || "",
    mediaDir: paths?.mediaDir || "",
    originalDir: paths?.originalDir || "",
    webDir: paths?.webDir || "",
    thumbnailDir: paths?.thumbnailDir || "",
    metadataDir: paths?.metadataDir || "",
  };
}

async function localMediaPaths(ensureDirectories = true) {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd) return null;

  const fsSpecifier = "node:fs/promises";
  const pathSpecifier = "node:path";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    access(path: string): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ pathSpecifier) as {
    join(...parts: string[]): string;
  };
  const dataDir = process.env?.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  const mediaDir = path.join(dataDir, "media");
  const originalDir = path.join(mediaDir, "originals");
  const webDir = path.join(mediaDir, "web");
  const thumbnailDir = path.join(mediaDir, "thumbnails");
  const metadataDir = path.join(mediaDir, "metadata");
  if (ensureDirectories) {
    await Promise.all([originalDir, webDir, thumbnailDir, metadataDir].map(async (directory) => {
      try { await fs.access(directory); } catch {
        try { await fs.mkdir(directory, { recursive: true }); } catch (error) {
          if ((error as { code?: string }).code !== "EPERM") throw error;
        }
      }
    }));
  }

  return {
    dataDir,
    mediaDir,
    originalDir,
    webDir,
    thumbnailDir,
    metadataDir,
  };
}

export async function saveLocalMediaUpload(input: LocalMediaUploadInput): Promise<LocalMediaUpload | null> {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd) return null;

  const fsSpecifier = "node:fs/promises";
  const pathSpecifier = "node:path";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    writeFile(path: string, data: Uint8Array): Promise<void>;
    writeFile(path: string, data: string): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ pathSpecifier) as {
    basename(value: string): string;
    join(...parts: string[]): string;
  };
  const mediaPaths = await localMediaPaths();
  if (!mediaPaths) return null;

  const safeName = path.basename(input.fileName);
  const filename = `${input.id}-${safeName}`;
  const originalPath = path.join(mediaPaths.originalDir, filename);
  const webFilename = `${input.id}.webp`;
  const thumbnailFilename = `${input.id}.webp`;
  const webPath = path.join(mediaPaths.webDir, webFilename);
  const thumbnailPath = path.join(mediaPaths.thumbnailDir, thumbnailFilename);
  const metadataPath = path.join(mediaPaths.metadataDir, `${input.id}.json`);
  const bytes = new Uint8Array(input.bytes);

  await fs.writeFile(originalPath, bytes);
  let width = 0;
  let height = 0;
  try {
    const sharpModule = await import(/* @vite-ignore */ "sharp");
    const sharp = sharpModule.default;
    const source = sharp(bytes, { failOn: "none" }).rotate();
    const metadata = await source.metadata();
    width = Number(metadata.width || 0);
    height = Number(metadata.height || 0);
    await source.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(webPath);
    await source.clone().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toFile(thumbnailPath);
  } catch {
    await fs.writeFile(webPath, bytes);
    await fs.writeFile(thumbnailPath, bytes);
  }
  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        id: input.id,
        originalFilename: input.fileName,
        filename,
        webFilename,
        thumbnailFilename,
        webContentType: "image/webp",
        thumbnailContentType: "image/webp",
        width,
        height,
        contentType: input.contentType,
        size: bytes.byteLength,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  return {
    key: `local:${input.id}`,
    url: `/api/media/${input.id}`,
    thumbnailUrl: `/api/media/${input.id}?variant=thumbnail`,
    originalKey: `local:${input.id}:original`,
    webKey: `local:${input.id}:web`,
    width,
    height,
  };
}

export async function readLocalMediaUpload(key: string, variant = "original"): Promise<LocalMediaRead | null> {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd || !key.startsWith("local:")) return null;

  const fsSpecifier = "node:fs/promises";
  const pathSpecifier = "node:path";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    readFile(path: string): Promise<Uint8Array>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
  };
  const path = await import(/* @vite-ignore */ pathSpecifier) as {
    basename(value: string): string;
    join(...parts: string[]): string;
  };
  const mediaPaths = await localMediaPaths();
  if (!mediaPaths) return null;

  const localId = path.basename(key.slice("local:".length));
  if (!localId) return null;

  const metadataPath = path.join(mediaPaths.metadataDir, `${localId}.json`);
  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8")) as {
      filename?: string;
      webFilename?: string;
      thumbnailFilename?: string;
      contentType?: string;
      webContentType?: string;
      thumbnailContentType?: string;
    };
    const thumbnail = variant === "thumbnail" || variant === "thumb";
    const original = variant === "original" || metadata.contentType?.startsWith("video/");
    const filename = thumbnail
      ? metadata.thumbnailFilename || metadata.webFilename || metadata.filename
      : original ? metadata.filename : metadata.webFilename || metadata.filename;
    if (!filename) return null;
    const diskPath = path.join(
      thumbnail ? mediaPaths.thumbnailDir : original ? mediaPaths.originalDir : mediaPaths.webDir,
      path.basename(filename)
    );
    return {
      bytes: await fs.readFile(diskPath),
      filename: path.basename(filename),
      contentType: thumbnail ? metadata.thumbnailContentType || "image/webp" : original ? metadata.contentType : metadata.webContentType || "image/webp",
    };
  } catch {
    // Backwards compatibility for earlier local uploads stored under public/uploads.
  }

  const filename = localId;
  const diskPath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    return {
      bytes: await fs.readFile(diskPath),
      filename,
    };
  } catch {
    return null;
  }
}

export async function deleteLocalMediaUpload(key: string) {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd || !key.startsWith("local:")) return;
  const fsSpecifier = "node:fs/promises";
  const pathSpecifier = "node:path";
  const fs = await import(/* @vite-ignore */ fsSpecifier) as {
    readFile(path: string, encoding: "utf8"): Promise<string>;
    rm(path: string, options: { force: boolean }): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ pathSpecifier) as {
    basename(value: string): string;
    join(...parts: string[]): string;
  };
  const paths = await localMediaPaths(false);
  if (!paths) return;
  const id = path.basename(key.slice("local:".length).split(":")[0]);
  if (!id) return;
  const metadataPath = path.join(paths.metadataDir, `${id}.json`);
  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8")) as {
      filename?: string; webFilename?: string; thumbnailFilename?: string;
    };
    await Promise.all([
      metadata.filename ? fs.rm(path.join(paths.originalDir, path.basename(metadata.filename)), { force: true }) : Promise.resolve(),
      metadata.webFilename ? fs.rm(path.join(paths.webDir, path.basename(metadata.webFilename)), { force: true }) : Promise.resolve(),
      metadata.thumbnailFilename ? fs.rm(path.join(paths.thumbnailDir, path.basename(metadata.thumbnailFilename)), { force: true }) : Promise.resolve(),
    ]);
  } catch {
    // Missing metadata is safe: remove the record only and leave any unknown file for backup/recovery.
  }
  await fs.rm(metadataPath, { force: true });
}
