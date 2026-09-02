import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const releaseName = "oldseadogs-poole-harbour-guides-2026-09-02-r1";
const outputDir = path.join(projectDir, "outputs");
const packageDir = path.join(outputDir, releaseName);
const archivePath = path.join(outputDir, `${releaseName}.tar.gz`);
const checksumPath = `${archivePath}.sha256`;
const allowedWorkingTreeChange = "lib/generated-build-info.ts";

async function sha256(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
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

function forbiddenPath(relative) {
  const parts = relative.split(path.sep);
  const basename = path.basename(relative);
  return parts.some((part) => [".git", ".next", ".wrangler", "node_modules", "logs", "outputs", ".oldseadogs-data", "oldseadogs-data"].includes(part))
    || basename === "editor-store.json"
    || /^\.env(?:\.|$)/i.test(basename)
    || /(?:^|\/)(?:public\/uploads|uploads)(?:\/|$)/i.test(relative)
    || /\.(?:log|tar|tgz|tar\.gz|zip)$/i.test(basename);
}

for (const target of [archivePath, checksumPath, packageDir]) {
  try {
    await fs.access(target);
    throw new Error(`Refusing to overwrite an existing release artifact: ${target}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const { stdout: statusOutput } = await execFileAsync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: projectDir });
const unexpectedChanges = statusOutput.trim().split("\n").filter(Boolean).filter((line) => line.slice(3) !== allowedWorkingTreeChange);
if (unexpectedChanges.length) {
  throw new Error(`Package only from the committed tree. Unexpected changes:\n${unexpectedChanges.join("\n")}`);
}

const { stdout: trackedOutput } = await execFileAsync("git", ["ls-files", "-z"], { cwd: projectDir, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
const tracked = trackedOutput.toString("utf8").split("\0").filter(Boolean).sort();
const forbiddenTracked = tracked.filter(forbiddenPath);
if (forbiddenTracked.length) throw new Error(`Forbidden tracked release content: ${forbiddenTracked.join(", ")}`);

await fs.mkdir(packageDir, { recursive: true });
for (const relative of tracked) {
  const source = path.join(projectDir, relative);
  const destination = path.join(packageDir, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}
await fs.cp(path.join(projectDir, "dist"), path.join(packageDir, "dist"), { recursive: true, preserveTimestamps: true });

const { stdout: commit } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: projectDir });
const { stdout: branch } = await execFileAsync("git", ["branch", "--show-current"], { cwd: projectDir });
const buildInfo = await fs.readFile(path.join(projectDir, "lib/generated-build-info.ts"), "utf8");
const buildTimestamp = buildInfo.match(/"buildTimestamp":\s*"([^"]+)"/)?.[1] || "unknown";
const buildCommit = buildInfo.match(/"gitCommit":\s*"([^"]+)"/)?.[1] || "unknown";
const mediaManifest = JSON.parse(await fs.readFile(path.join(projectDir, "release/poole-harbour-guides/media-manifest.json"), "utf8"));

const manifest = {
  releaseName,
  createdAt: new Date().toISOString(),
  purpose: "Poole Harbour multi-area Guide collection with nine CMS media handoff assets",
  gitCommit: commit.trim(),
  gitBranch: branch.trim(),
  buildTimestamp,
  buildCommit,
  productionDataIncluded: false,
  productionMediaIncluded: false,
  cmsSourceImagesIncluded: mediaManifest.images.map(({ guideSlug, filename, sha256: imageSha256 }) => ({ guideSlug, filename, sha256: imageSha256 })),
  guideState: "Draft, noindex, unpublished, unscheduled, off homepage",
  unresolved: { heroImageEditorial: 0, safety: 16 },
  dependenciesIncluded: false,
  dependencyMetadata: ["package.json", "package-lock.json"],
  buildOutput: "dist",
  sourceIncluded: true,
  productionDataMigrationRequired: false,
  verification: {
    typecheck: "passed before packaging",
    tests: "passed before packaging",
    touchedFileLint: "passed before packaging",
    productionBuild: "npm run build:do passed before packaging",
    digitalOceanBuild: "passed before packaging",
    gitDiffCheck: "passed before packaging"
  }
};
await fs.writeFile(path.join(packageDir, "RELEASE_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const required = [
  "dist/server/index.js",
  "package.json",
  "package-lock.json",
  "ecosystem.config.cjs",
  "lib/generated-build-info.ts",
  "release/poole-harbour-guides/media-manifest.json",
  "release/poole-harbour-guides/poole-harbour-oldseadogs-guide-batch-create-draft-v1.json",
  ...mediaManifest.images.map((image) => `release/poole-harbour-guides/images/${image.filename}`),
];
for (const relative of required) await fs.access(path.join(packageDir, relative));

const files = await filesUnder(packageDir);
const forbidden = files.filter(forbiddenPath);
if (forbidden.length) throw new Error(`Forbidden package content: ${forbidden.join(", ")}`);
if (files.filter((relative) => relative.endsWith(".png") && relative.startsWith("release/poole-harbour-guides/images/")).length !== 9) {
  throw new Error("The package must contain exactly nine Poole source hero images.");
}

const checksumLines = [];
for (const relative of await filesUnder(packageDir)) {
  if (relative === "SHA256SUMS") continue;
  checksumLines.push(`${await sha256(path.join(packageDir, relative))}  ${relative}`);
}
await fs.writeFile(path.join(packageDir, "SHA256SUMS"), `${checksumLines.join("\n")}\n`);

await execFileAsync("/usr/bin/tar", ["-czf", archivePath, "-C", outputDir, releaseName], { cwd: projectDir, maxBuffer: 8 * 1024 * 1024 });
const archiveSha256 = await sha256(archivePath);
await fs.writeFile(checksumPath, `${archiveSha256}  ${path.basename(archivePath)}\n`);

process.stdout.write(`${JSON.stringify({
  ...manifest,
  packageDir,
  archivePath,
  checksumPath,
  archiveBytes: (await fs.stat(archivePath)).size,
  archiveSha256,
}, null, 2)}\n`);
