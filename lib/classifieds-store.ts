import { emptyClassifiedsStore, type ClassifiedsStore } from "./classifieds-types.ts";

type NodeProcess = {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
  kill?: (pid: number, signal?: number) => boolean;
  pid?: number;
};

let readCache: { signature: string; store: ClassifiedsStore } | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

function nodeProcess() {
  return (globalThis as { process?: NodeProcess }).process;
}

export function clearClassifiedsCaches() {
  readCache = null;
  writeQueue = Promise.resolve();
}

export async function classifiedsDataDir() {
  const { path } = await nodeModules();
  const process = nodeProcess();
  return process?.env?.OLDSEADOGS_DATA_DIR?.trim() || path.join(process?.cwd?.() || ".", ".oldseadogs-data");
}

export async function classifiedsStorePath() {
  const { path } = await nodeModules();
  return path.join(await classifiedsDataDir(), "classifieds-store.json");
}

export async function readClassifiedsStore() {
  const filePath = await classifiedsStorePath();
  const fs = await nodeFs();
  let signature = "missing";
  try {
    const stat = await fs.stat(filePath);
    signature = `${filePath}:${stat.ino}:${stat.size}:${stat.mtimeMs}`;
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") throw error;
  }
  if (readCache?.signature === signature) return readCache.store;
  const store = await readClassifiedsStoreUncached();
  readCache = { signature, store };
  return store;
}

export async function updateClassifiedsStore(
  mutator: (store: ClassifiedsStore) => ClassifiedsStore | Promise<ClassifiedsStore>,
) {
  const job = writeQueue.then(() => withClassifiedsLock(async () => {
    const current = await readClassifiedsStoreUncached();
    const next = await mutator(current);
    if (next === current) return current;
    await writeClassifiedsStoreNow(next);
    return next;
  }));
  writeQueue = job.then(() => undefined, () => undefined);
  return job;
}

async function readClassifiedsStoreUncached() {
  const filePath = await classifiedsStorePath();
  const fs = await nodeFs();
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as Partial<ClassifiedsStore>;
    if (parsed.version !== 1 || !Array.isArray(parsed.listings)) {
      throw new Error(`The classifieds store at ${filePath} is not a version 1 store. It was not replaced.`);
    }
    return {
      version: 1 as const,
      listings: parsed.listings,
      deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : [],
      rateHits: Array.isArray(parsed.rateHits) ? parsed.rateHits : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT") return emptyClassifiedsStore();
    if (error instanceof Error && error.message.includes("was not replaced")) throw error;
    throw new Error(`The classifieds store at ${filePath} could not be read safely. No empty replacement was created.`, { cause: error });
  }
}

async function writeClassifiedsStoreNow(store: ClassifiedsStore) {
  const filePath = await classifiedsStorePath();
  const { path } = await nodeModules();
  const fs = await nodeFs();
  const process = nodeProcess();
  const next: ClassifiedsStore = { ...store, version: 1, updatedAt: new Date().toISOString() };
  const payload = `${JSON.stringify(next, null, 2)}\n`;
  const tempPath = `${filePath}.${process?.pid ?? "node"}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(tempPath, payload, { encoding: "utf8", mode: 0o600 });
    JSON.parse(await fs.readFile(tempPath, "utf8"));
    await fs.rename(tempPath, filePath);
    readCache = null;
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function withClassifiedsLock<T>(operation: () => Promise<T>) {
  const filePath = await classifiedsStorePath();
  const fs = await nodeFs();
  const process = nodeProcess();
  const lockPath = `${filePath}.lock`;
  const token = `${process?.pid ?? "node"}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startedAt = Date.now();
  const timeoutMs = Math.max(5_000, Number(process?.env?.OLDSEADOGS_STORE_LOCK_TIMEOUT_MS || 30_000));

  while (true) {
    try {
      await fs.mkdir(lockPath, { mode: 0o700 });
      try {
        await fs.writeFile(
          `${lockPath}/owner.json`,
          JSON.stringify({ pid: process?.pid ?? 0, token, acquiredAt: new Date().toISOString() }),
          { encoding: "utf8", mode: 0o600 },
        );
      } catch (ownerError) {
        await fs.rm(lockPath, { recursive: true, force: true });
        throw ownerError;
      }
      break;
    } catch (error) {
      if ((error as { code?: string }).code !== "EEXIST") throw error;
      const owner = await lockOwner(lockPath);
      const dead = owner !== null && owner.pid > 0 && !processIsRunning(owner.pid);
      if (dead) {
        try {
          await fs.rename(`${lockPath}/owner.json`, `${lockPath}/reaping-${token}.json`);
          await fs.rm(lockPath, { recursive: true, force: true });
          continue;
        } catch (staleError) {
          if ((staleError as { code?: string }).code !== "ENOENT") throw staleError;
        }
      }
      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(`Timed out waiting for the classifieds store lock at ${lockPath}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 25 + Math.floor(Math.random() * 50)));
    }
  }

  try {
    return await operation();
  } finally {
    try {
      const owner = JSON.parse(await fs.readFile(`${lockPath}/owner.json`, "utf8")) as { token?: string };
      if (owner.token === token) await fs.rm(lockPath, { recursive: true, force: true });
    } catch (error) {
      if ((error as { code?: string }).code !== "ENOENT") throw error;
    }
  }
}

async function lockOwner(lockPath: string) {
  const fs = await nodeFs();
  try {
    const owner = JSON.parse(await fs.readFile(`${lockPath}/owner.json`, "utf8")) as { pid?: number };
    const stat = await fs.stat(lockPath);
    return { pid: Number(owner.pid || 0), ageMs: Date.now() - stat.mtimeMs };
  } catch {
    return null;
  }
}

function processIsRunning(pid: number) {
  const process = nodeProcess();
  if (!pid || !process?.kill) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as { code?: string }).code !== "ESRCH";
  }
}

async function nodeFs() {
  return import(/* @vite-ignore */ "node:fs/promises") as Promise<{
    mkdir(path: string, options?: { recursive?: boolean; mode?: number }): Promise<void>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    rename(from: string, to: string): Promise<void>;
    rm(path: string, options?: { force?: boolean; recursive?: boolean }): Promise<void>;
    stat(path: string): Promise<{ ino: number | bigint; mtimeMs: number; size: number }>;
    writeFile(path: string, data: string, options?: { encoding: "utf8"; mode?: number }): Promise<void>;
  }>;
}

async function nodeModules() {
  const path = await import(/* @vite-ignore */ "node:path") as {
    dirname(value: string): string;
    join(...parts: string[]): string;
  };
  return { path };
}
