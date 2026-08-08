import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const outputBase = path.join(projectDir, "outputs");
const packageName = "The Helm Phase 1 RC1";
const packageDir = path.join(outputBase, packageName);
const archivePath = path.join(outputBase, `${packageName}.tar.gz`);
const sourceDir = path.join(packageDir, "source");

const rootFiles = [
  ".gitignore", "BACKUP.md", "BACKUP_RUNBOOK.md", "DECISIONS.md", "DEPLOYMENT.md", "DEV_ENVIRONMENT.md",
  "INSTAGRAM_CONNECTOR_SETUP.md", "PRODUCTION.md", "PROJECT_STATUS.md", "PROJECT_STRUCTURE.md", "README.md",
  "RESTORE_RUNBOOK.md", "SAFE_DEPLOYMENT.md", "SHUTDOWN.md", "STARTUP.md", "TODO.md",
  "Start OldSeaDogs Preview - Terminal commands.txt", "Start OldSeaDogs Preview.command", "check_dev.sh",
  "drizzle.config.ts", "ecosystem.config.cjs", "eslint.config.mjs", "next.config.ts", "package-lock.json", "package.json",
  "postcss.config.mjs", "proxy.ts", "start-oldseadogs-local.sh", "start_dev.sh", "stop_dev.sh", "tsconfig.json", "vite.config.ts",
];
const sourceDirectories = [".openai", "app", "build", "components", "content", "db", "deploy", "drizzle", "lib", "public", "release", "reports", "scripts", "tests", "worker"];
const excludedChangedPrefixes = ["dist/", "logs/", "node_modules/", "outputs/", "work/", ".wrangler/"];

async function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(await fs.readFile(filePath));
  return hash.digest("hex");
}

async function filesUnder(root, relative = "") {
  const dir = path.join(root, relative);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(root, next));
    else if (entry.isFile()) files.push(next);
  }
  return files;
}

async function copyIfPresent(relative) {
  const source = path.join(projectDir, relative);
  try { await fs.access(source); } catch { return; }
  const destination = path.join(sourceDir, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true, preserveTimestamps: true });
}

await fs.rm(packageDir, { recursive: true, force: true });
await fs.rm(archivePath, { force: true });
await fs.mkdir(sourceDir, { recursive: true });
for (const relative of [...rootFiles, ...sourceDirectories]) await copyIfPresent(relative);
await fs.cp(path.join(projectDir, "dist"), path.join(packageDir, "dist"), { recursive: true, preserveTimestamps: true });

await execFileAsync(process.execPath, [path.join(projectDir, "scripts/create-staging-rc1-fixture.mjs"), path.join(packageDir, "staging-data")], { cwd: projectDir });

const { stdout: changedOutput } = await execFileAsync("git", ["ls-files", "--modified", "--others", "--exclude-standard", "-z"], { cwd: projectDir, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
const changedPaths = changedOutput.toString("utf8").split("\0").filter(Boolean)
  .filter((relative) => !excludedChangedPrefixes.some((prefix) => relative.startsWith(prefix)))
  .sort();
const changedFiles = [];
for (const relative of changedPaths) {
  const filePath = path.join(projectDir, relative);
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat?.isFile()) continue;
  changedFiles.push({ path: relative, bytes: stat.size, sha256: await sha256(filePath) });
}
await fs.writeFile(path.join(packageDir, "CHANGED_FILES.json"), `${JSON.stringify({ releaseId: packageName, generatedAt: new Date().toISOString(), files: changedFiles }, null, 2)}\n`);
await fs.writeFile(path.join(packageDir, "CHANGED_FILES.sha256"), `${changedFiles.map((file) => `${file.sha256}  ${file.path}`).join("\n")}\n`);

const buildInfoText = await fs.readFile(path.join(projectDir, "lib/generated-build-info.ts"), "utf8");
const buildTimestamp = buildInfoText.match(/"buildTimestamp":\s*"([^"]+)"/)?.[1] || "unknown";
const gitCommit = buildInfoText.match(/"gitCommit":\s*"([^"]+)"/)?.[1] || "unknown";
const buildId = `helm-phase1-rc1-${buildTimestamp.replace(/[-:.]/g, "").replace("Z", "Z")}-${gitCommit}`;
const metadata = {
  releaseId: packageName,
  buildId,
  buildTimestamp,
  gitCommit,
  packageCreatedAt: new Date().toISOString(),
  changedFileCount: changedFiles.length,
  contents: { source: true, compiledDist: true, stagingData: true, dependencyLock: "source/package-lock.json", migration: "source/drizzle/0008_tearful_luckman.sql" },
  productionDeploymentApproved: false,
};
await fs.writeFile(path.join(packageDir, "RELEASE_MANIFEST.json"), `${JSON.stringify(metadata, null, 2)}\n`);

const payloadFiles = (await filesUnder(packageDir)).filter((relative) => relative !== "SHA256SUMS");
const checksumLines = [];
for (const relative of payloadFiles) checksumLines.push(`${await sha256(path.join(packageDir, relative))}  ${relative}`);
await fs.writeFile(path.join(packageDir, "SHA256SUMS"), `${checksumLines.join("\n")}\n`);

await execFileAsync("/usr/bin/tar", ["-czf", archivePath, "-C", outputBase, packageName], { cwd: projectDir, maxBuffer: 4 * 1024 * 1024 });
const archiveChecksum = await sha256(archivePath);
await fs.writeFile(path.join(outputBase, "RELEASE_CHECKSUMS.sha256"), `${archiveChecksum}  ${path.basename(archivePath)}\n`);
process.stdout.write(`${JSON.stringify({ ...metadata, packageDir, archivePath, archiveBytes: (await fs.stat(archivePath)).size, archiveSha256: archiveChecksum }, null, 2)}\n`);
