import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const releaseName = "oldseadogs-cms-media-metadata-2026-07-27-r2";
const outputDir = path.join(projectDir, "outputs");
const packageDir = path.join(outputDir, releaseName);
const archivePath = path.join(outputDir, `${releaseName}.tar.gz`);
const checksumPath = `${archivePath}.sha256`;

const rootFiles = [
  ".gitignore",
  "BACKUP.md",
  "BACKUP_RUNBOOK.md",
  "DEPLOYMENT.md",
  "PRODUCTION.md",
  "README.md",
  "RESTORE_RUNBOOK.md",
  "SAFE_DEPLOYMENT.md",
  "drizzle.config.ts",
  "ecosystem.config.cjs",
  "eslint.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "proxy.ts",
  "tsconfig.json",
  "vite.config.ts",
];

const directories = [
  ".openai",
  "app",
  "build",
  "components",
  "content",
  "db",
  "deploy",
  "dist",
  "drizzle",
  "lib",
  "public",
  "scripts",
  "tests",
  "worker",
];

const excludedNames = new Set([
  ".git",
  ".next",
  ".wrangler",
  ".wrangler-config",
  "node_modules",
  "logs",
  "outputs",
  "work",
]);

function shouldInclude(source) {
  const relative = path.relative(projectDir, source);
  const parts = relative.split(path.sep);
  const basename = path.basename(source);
  if (parts.some((part) => excludedNames.has(part))) return false;
  if (basename === "editor-store.json") return false;
  if (/^\.env(?:\.|$)/i.test(basename) || /\.env(?:\.|$)/i.test(basename)) return false;
  if (/\.(?:log|tar|tgz|tar\.gz|zip)$/i.test(basename)) return false;
  if (parts.includes("cache")) return false;
  return true;
}

async function copyAllowed(relative) {
  const source = path.join(projectDir, relative);
  try {
    await fs.access(source);
  } catch {
    return;
  }
  const destination = path.join(packageDir, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, {
    recursive: true,
    preserveTimestamps: true,
    filter: shouldInclude,
  });
}

async function filesUnder(root, relative = "") {
  const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(root, next));
    else if (entry.isFile()) files.push(next);
  }
  return files;
}

async function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(await fs.readFile(filePath));
  return hash.digest("hex");
}

try {
  await fs.access(archivePath);
  throw new Error(`Refusing to reuse existing release archive: ${archivePath}`);
} catch (error) {
  if (error instanceof Error && !error.message.startsWith("Refusing")) {
    // Expected: the unique archive does not exist yet.
  } else if (error instanceof Error) {
    throw error;
  }
}

try {
  await fs.access(checksumPath);
  throw new Error(`Refusing to reuse existing release checksum: ${checksumPath}`);
} catch (error) {
  if (error instanceof Error && !error.message.startsWith("Refusing")) {
    // Expected: the unique checksum file does not exist yet.
  } else if (error instanceof Error) {
    throw error;
  }
}

await fs.rm(packageDir, { recursive: true, force: true });
await fs.mkdir(packageDir, { recursive: true });
for (const relative of [...rootFiles, ...directories]) await copyAllowed(relative);

const files = await filesUnder(packageDir);
const forbidden = files.filter((relative) => {
  const parts = relative.split(path.sep);
  const basename = path.basename(relative);
  return parts.some((part) => excludedNames.has(part)) ||
    basename === "editor-store.json" ||
    /^\.env(?:\.|$)/i.test(basename) ||
    /\.(?:log|tar|tgz|tar\.gz|zip)$/i.test(basename) ||
    parts.includes("cache");
});
if (forbidden.length > 0) {
  throw new Error(`Forbidden release content detected: ${forbidden.join(", ")}`);
}

const required = [
  "dist/server/index.js",
  "package.json",
  "package-lock.json",
  "ecosystem.config.cjs",
  "public",
  "app/api/editor/route.ts",
  "app/api/media/[id]/route.ts",
  "lib/media-asset-lookup.ts",
  "lib/site-content.ts",
  "tests/media-asset-lookup.test.mjs",
  "tests/media-route.integration.test.mjs",
];
for (const relative of required) {
  await fs.access(path.join(packageDir, relative));
}

const manifest = {
  releaseName,
  createdAt: new Date().toISOString(),
  purpose: "CMS draft access, media metadata persistence and featured-image details",
  productionDataIncluded: false,
  dependenciesIncluded: false,
  dependencyMetadata: ["package.json", "package-lock.json"],
  buildOutput: "dist",
  sourceIncluded: true,
  verification: {
    typecheck: "passed before packaging",
    productionBuild: "npm run build:do",
    phase1Checks: "47 tests passed before packaging",
    schedulingAndRevisionTests: "9 tests passed before packaging",
  },
};
await fs.writeFile(path.join(packageDir, "RELEASE_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const payloadFiles = await filesUnder(packageDir);
const checksums = [];
for (const relative of payloadFiles) {
  if (relative === "SHA256SUMS") continue;
  checksums.push(`${await sha256(path.join(packageDir, relative))}  ${relative}`);
}
await fs.writeFile(path.join(packageDir, "SHA256SUMS"), `${checksums.join("\n")}\n`);

await execFileAsync("/usr/bin/tar", ["-czf", archivePath, "-C", outputDir, releaseName], {
  cwd: projectDir,
  maxBuffer: 8 * 1024 * 1024,
});

const archiveSha256 = await sha256(archivePath);
await fs.writeFile(checksumPath, `${archiveSha256}  ${path.basename(archivePath)}\n`);

process.stdout.write(`${JSON.stringify({
  ...manifest,
  packageDir,
  archivePath,
  checksumPath,
  archiveBytes: (await fs.stat(archivePath)).size,
  archiveSha256,
  topLevel: (await fs.readdir(packageDir)).sort(),
}, null, 2)}\n`);
