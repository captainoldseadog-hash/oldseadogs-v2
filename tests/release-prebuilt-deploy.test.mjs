import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const packageScript = path.join(projectDir, "deploy/release-package.sh");
const deployScript = path.join(projectDir, "deploy/release-deploy.sh");
const rollbackScript = path.join(projectDir, "deploy/release-rollback.sh");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    cwd: options.cwd,
    env: options.env ?? process.env,
  });
}

function git(root, args) {
  const result = run("git", args, {
    cwd: root,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Packaging Test",
      GIT_AUTHOR_EMAIL: "packaging-test@example.com",
      GIT_COMMITTER_NAME: "Packaging Test",
      GIT_COMMITTER_EMAIL: "packaging-test@example.com",
    },
  });
  assert.equal(result.status, 0, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

async function writeBuildInfo(root, shortCommit) {
  await fs.mkdir(path.join(root, "lib"), { recursive: true });
  await fs.writeFile(
    path.join(root, "lib/generated-build-info.ts"),
    `export const generatedBuildInfo = ${JSON.stringify({
      buildTimestamp: "2026-10-01T00:00:00.000Z",
      gitCommit: shortCommit,
      gitBranch: "test",
    }, null, 2)} as const;\n`,
  );
}

async function makeSourceFixture(t, { sharp = "linux" } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-pkg-src-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await fs.mkdir(path.join(root, "dist/server"), { recursive: true });
  await fs.mkdir(path.join(root, "public"), { recursive: true });
  await fs.mkdir(path.join(root, "scripts"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules/vinext/bin"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules/.bin"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules/sharp"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules/pkg"), { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(root, "package.json"), "{\"name\":\"fixture\",\"private\":true}\n"),
    fs.writeFile(path.join(root, "package-lock.json"), "{}\n"),
    fs.writeFile(path.join(root, "ecosystem.config.cjs"), "module.exports = { apps: [] };\n"),
    fs.writeFile(path.join(root, "dist/server/index.js"), "export {};\n"),
    fs.writeFile(path.join(root, "public/.gitkeep"), ""),
    fs.writeFile(path.join(root, "scripts/.gitkeep"), ""),
    fs.writeFile(path.join(root, "node_modules/sharp/package.json"), "{\"name\":\"sharp\",\"version\":\"0.34.5\"}\n"),
    fs.writeFile(path.join(root, "node_modules/pkg/.env.example"), "EXAMPLE=1\n"),
    fs.writeFile(path.join(root, "node_modules/vinext/bin/vinext.js"), "#!/usr/bin/env node\n", { mode: 0o755 }),
    fs.writeFile(path.join(root, "editor-store.json"), "{\"stories\":[]}\n"),
    fs.writeFile(path.join(root, ".env"), "SECRET=nope\n"),
    fs.writeFile(path.join(root, "nested.tar.gz"), "not-an-archive"),
  ]);
  await fs.symlink("../vinext/bin/vinext.js", path.join(root, "node_modules/.bin/vinext"));
  if (sharp === "linux") {
    const sharpLib = path.join(root, "node_modules/@img/sharp-linux-x64/lib");
    const vipsLib = path.join(root, "node_modules/@img/sharp-libvips-linux-x64/lib");
    await fs.mkdir(sharpLib, { recursive: true });
    await fs.mkdir(vipsLib, { recursive: true });
    await fs.writeFile(path.join(sharpLib, "sharp-linux-x64.node"), "linux-binary");
    await fs.writeFile(path.join(vipsLib, "libvips-cpp.so.8"), "linux-libvips");
  } else if (sharp === "darwin") {
    const darwinLib = path.join(root, "node_modules/@img/sharp-darwin-arm64/lib");
    await fs.mkdir(darwinLib, { recursive: true });
    await fs.writeFile(path.join(darwinLib, "sharp-darwin-arm64.node"), "mac-binary");
  }
  await writeBuildInfo(root, "placeholder000");

  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.email", "packaging-test@example.com"]);
  git(root, ["config", "user.name", "Packaging Test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", "fixture"]);
  const full = git(root, ["rev-parse", "HEAD"]);
  const short = git(root, ["rev-parse", "--short=12", "HEAD"]);
  await writeBuildInfo(root, short);
  return { full, root, short };
}

function packageFixture(root, outputDir) {
  return run("bash", [packageScript, "--source", root, "--output-dir", outputDir]);
}

async function outputFiles(outputDir) {
  const names = await fs.readdir(outputDir);
  const archiveName = names.find((name) => name.endsWith(".tar.gz"));
  assert.ok(archiveName, `expected an archive in ${outputDir}: ${names.join(", ")}`);
  return {
    archive: path.join(outputDir, archiveName),
    checksum: path.join(outputDir, `${archiveName}.sha256`),
    manifest: path.join(outputDir, archiveName.replace(/\.tar\.gz$/, ".manifest.json")),
  };
}

async function makeDeployLayout(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-deploy-"));
  const data = path.join(root, "data");
  const bin = path.join(root, "bin");
  const store = "{\"stories\":[{\"id\":\"live-story\"}]}\n";
  const npmLog = path.join(root, "npm.log");
  const pm2Log = path.join(root, "pm2.log");
  await fs.mkdir(data, { recursive: true });
  await fs.mkdir(bin, { recursive: true });
  await fs.writeFile(path.join(data, "editor-store.json"), store);
  await fs.writeFile(path.join(root, "oldseadogs.env"), "OLDSEADOGS_ENV=production\n");
  await fs.writeFile(path.join(bin, "npm"), `#!/bin/bash
printf '%s\\n' "$*" >> "$NPM_LOG"
exit 99
`, { mode: 0o755 });
  await fs.writeFile(path.join(bin, "pm2"), `#!/bin/bash
printf '%s\\n' "$*" >> "$PM2_LOG"
exit 99
`, { mode: 0o755 });
  await fs.chmod(path.join(data, "editor-store.json"), 0o444);
  await fs.chmod(data, 0o555);
  t.after(async () => {
    await fs.chmod(data, 0o755).catch(() => {});
    await fs.chmod(path.join(data, "editor-store.json"), 0o644).catch(() => {});
    await fs.rm(root, { recursive: true, force: true });
  });
  return {
    data,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      DEPLOY_ROOT: root,
      RELEASES_DIR: path.join(root, "releases"),
      SHARED_DIR: path.join(root, "shared"),
      CURRENT_LINK: path.join(root, "current"),
      DATA_DIR: data,
      ENV_FILE: path.join(root, "oldseadogs.env"),
      BACKUP_ROOT: path.join(root, "backups"),
      NPM_LOG: npmLog,
      PM2_LOG: pm2Log,
    },
    npmLog,
    pm2Log,
    releases: path.join(root, "releases"),
    root,
    shared: path.join(root, "shared"),
    store,
  };
}

async function assertStoreUntouched(layout) {
  assert.equal(await fs.readFile(path.join(layout.data, "editor-store.json"), "utf8"), layout.store);
  await assert.rejects(fs.access(path.join(layout.data, "cache")));
  await assert.rejects(fs.access(layout.npmLog));
  await assert.rejects(fs.access(layout.pm2Log));
}

function writePayloadChecksums(root) {
  const result = run("bash", ["-c", "rm -f SHA256SUMS; tmp=$(mktemp); find . -type f -printf '%P\\0' | sort -z | xargs -0 -r sha256sum -- > \"$tmp\"; mv \"$tmp\" SHA256SUMS"], { cwd: root });
  assert.equal(result.status, 0, result.stderr);
}

function writeArchiveChecksum(archive) {
  const hashed = run("sha256sum", [archive]);
  assert.equal(hashed.status, 0, hashed.stderr);
  const checksum = `${hashed.stdout.split(" ")[0]}  ${path.basename(archive)}\n`;
  return checksum;
}

async function retar(directory, name, destination) {
  const result = run("tar", ["-C", directory, "-czf", destination, name]);
  assert.equal(result.status, 0, result.stderr);
  await fs.writeFile(`${destination}.sha256`, writeArchiveChecksum(destination));
}

async function writeRunnableRelease(directory) {
  await fs.mkdir(path.join(directory, "dist/server"), { recursive: true });
  await fs.mkdir(path.join(directory, "node_modules/.bin"), { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(directory, "package.json"), "{}\n"),
    fs.writeFile(path.join(directory, "package-lock.json"), "{}\n"),
    fs.writeFile(path.join(directory, "ecosystem.config.cjs"), "module.exports = { apps: [] };\n"),
    fs.writeFile(path.join(directory, "dist/server/index.js"), "export {};\n"),
    fs.writeFile(path.join(directory, "node_modules/.bin/vinext"), "#!/usr/bin/env node\n", { mode: 0o755 }),
  ]);
}

test("packaging, dry-run deploy, and rollback do not install or touch CMS data", async (t) => {
  const fixture = await makeSourceFixture(t);
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-pkg-out-"));
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const packaged = packageFixture(fixture.root, outputDir);
  assert.equal(packaged.status, 0, `${packaged.stdout}\n${packaged.stderr}`);

  const files = await outputFiles(outputDir);
  const manifest = JSON.parse(await fs.readFile(files.manifest, "utf8"));
  assert.equal(manifest.gitCommit, fixture.full);
  assert.equal(manifest.gitCommitShort, fixture.short);
  assert.equal(manifest.productionDataIncluded, false);
  assert.equal(manifest.dependenciesIncluded, true);
  assert.equal(manifest.prebuilt, true);
  assert.equal(manifest.npmOnServer, false);
  assert.equal(manifest.platform, "linux");
  assert.equal(manifest.arch, "x64");
  assert.equal(manifest.libc, "glibc");
  const checksum = await fs.readFile(files.checksum, "utf8");
  assert.match(checksum, new RegExp(`^[0-9a-f]{64}  ${path.basename(files.archive)}\\n$`));

  const listing = run("tar", ["-tzf", files.archive]);
  assert.equal(listing.status, 0, listing.stderr);
  assert.doesNotMatch(listing.stdout, /(^|\/)editor-store\.json$/m);
  assert.doesNotMatch(listing.stdout, /(^|\/)\.env$/m);
  assert.doesNotMatch(listing.stdout, /(^|\/)\.git(\/|$)/m);
  assert.doesNotMatch(listing.stdout, /\.tar\.gz$/m);
  assert.match(listing.stdout, /node_modules\/\.bin\/vinext/);
  assert.match(listing.stdout, /sharp-linux-x64\.node/);
  assert.match(listing.stdout, /libvips-cpp\.so/);
  assert.match(listing.stdout, /node_modules\/pkg\/\.env\.example/);
  assert.match(listing.stdout, /RELEASE_MANIFEST\.json/);

  const layout = await makeDeployLayout(t);
  const deployed = run("bash", [
    deployScript,
    "--dry-run",
    "--archive",
    files.archive,
    "--checksum",
    files.checksum,
    "--release-id",
    "2026-10-01-candidate",
  ], { env: layout.env });
  assert.equal(deployed.status, 0, `${deployed.stdout}\n${deployed.stderr}`);
  assert.match(deployed.stderr, new RegExp(`Prebuilt package gitCommit: ${fixture.full}`));
  assert.match(deployed.stderr, /npm ci was not run/);
  assert.match(deployed.stderr, /Nothing was promoted/);
  assert.match(deployed.stderr, /editor-store\.json was not changed/);
  await assert.rejects(fs.access(path.join(layout.releases, "2026-10-01-candidate")));
  await assert.rejects(fs.access(path.join(layout.releases, ".2026-10-01-candidate.staging")));
  await assert.rejects(fs.access(path.join(layout.env.BACKUP_ROOT, "2026-10-01-candidate", "editor-store.json")));
  await assertStoreUntouched(layout);

  const brokenChecksumFile = path.join(outputDir, "broken.sha256");
  const flipped = checksum[0] === "a" ? `b${checksum.slice(1)}` : `a${checksum.slice(1)}`;
  await fs.writeFile(brokenChecksumFile, flipped);
  const rejected = run("bash", [
    deployScript,
    "--dry-run",
    "--archive",
    files.archive,
    "--checksum",
    brokenChecksumFile,
    "--release-id",
    "checksum-mismatch",
  ], { env: layout.env });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /SHA-256 does not match/);
  await assertStoreUntouched(layout);

  const september = path.join(layout.releases, "6ce0718c6d3d");
  const currentRelease = path.join(layout.releases, "live-now");
  await writeRunnableRelease(september);
  await writeRunnableRelease(currentRelease);
  await fs.symlink(currentRelease, layout.env.CURRENT_LINK);
  await fs.writeFile(path.join(layout.shared, "previous-release"), `${september}\n`);

  const rollback = run("bash", [rollbackScript, "--dry-run", "--release", "6ce0718c6d3d"], { env: layout.env });
  assert.equal(rollback.status, 0, `${rollback.stdout}\n${rollback.stderr}`);
  assert.match(rollback.stderr, /Rollback will not run npm ci, npm install, or a build/);
  assert.match(rollback.stderr, /would switch current/);
  assert.match(rollback.stderr, /no dependencies were installed/);
  assert.equal(await fs.readlink(layout.env.CURRENT_LINK), currentRelease);

  const recorded = run("bash", [rollbackScript, "--dry-run"], { env: layout.env });
  assert.equal(recorded.status, 0, `${recorded.stdout}\n${recorded.stderr}`);
  assert.match(recorded.stderr, /6ce0718c6d3d/);
  assert.equal(await fs.readlink(layout.env.CURRENT_LINK), currentRelease);
  await assertStoreUntouched(layout);

  await fs.rm(path.join(september, "node_modules/.bin/vinext"));
  const missingVinext = run("bash", [rollbackScript, "--dry-run", "--release", "6ce0718c6d3d"], { env: layout.env });
  assert.notEqual(missingVinext.status, 0);
  assert.match(missingVinext.stderr, /vinext is absent/);
  assert.match(missingVinext.stderr, /Dependencies will not be installed/);
  assert.doesNotMatch(missingVinext.stderr, /npm ci --include=dev/);
  assert.equal(await fs.readlink(layout.env.CURRENT_LINK), currentRelease);
});

test("a Mac sharp build is rejected with a linux-x64 rebuild instruction", async (t) => {
  const fixture = await makeSourceFixture(t, { sharp: "darwin" });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-pkg-darwin-"));
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const packaged = packageFixture(fixture.root, outputDir);
  assert.notEqual(packaged.status, 0);
  assert.match(packaged.stderr, /sharp's linux-x64 glibc binary is missing/);
  assert.match(packaged.stderr, /Mac sharp binaries/);
  assert.match(packaged.stderr, /linux\/amd64/);
  assert.match(packaged.stderr, /will not install or rebuild sharp/);
});

test("deploy rejects a package whose sharp binary is not linux-x64 and rejects bundled CMS data", async (t) => {
  const fixture = await makeSourceFixture(t);
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-pkg-mutate-"));
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const packaged = packageFixture(fixture.root, outputDir);
  assert.equal(packaged.status, 0, packaged.stderr);
  const files = await outputFiles(outputDir);
  const layout = await makeDeployLayout(t);

  const sharpWork = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-repack-"));
  t.after(() => fs.rm(sharpWork, { recursive: true, force: true }));
  assert.equal(run("tar", ["-xzf", files.archive, "-C", sharpWork]).status, 0);
  const [sharpName] = await fs.readdir(sharpWork);
  const sharpRoot = path.join(sharpWork, sharpName);
  await fs.rm(path.join(sharpRoot, "node_modules/@img/sharp-linux-x64"), { recursive: true, force: true });
  await fs.rm(path.join(sharpRoot, "node_modules/@img/sharp-libvips-linux-x64"), { recursive: true, force: true });
  await fs.mkdir(path.join(sharpRoot, "node_modules/@img/sharp-darwin-arm64/lib"), { recursive: true });
  await fs.writeFile(path.join(sharpRoot, "node_modules/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node"), "mac-binary");
  writePayloadChecksums(sharpRoot);
  const sharpArchive = path.join(outputDir, "missing-sharp.tar.gz");
  await retar(sharpWork, sharpName, sharpArchive);
  const sharpDeploy = run("bash", [
    deployScript,
    "--dry-run",
    "--archive",
    sharpArchive,
    "--checksum",
    `${sharpArchive}.sha256`,
    "--release-id",
    "missing-sharp",
  ], { env: layout.env });
  assert.notEqual(sharpDeploy.status, 0);
  assert.match(sharpDeploy.stderr, /sharp's linux-x64 glibc binary is missing/);
  assert.match(sharpDeploy.stderr, /Mac sharp binaries/);
  assert.match(sharpDeploy.stderr, /will not install or rebuild sharp/);
  await assertStoreUntouched(layout);

  const cmsWork = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-cms-"));
  t.after(() => fs.rm(cmsWork, { recursive: true, force: true }));
  assert.equal(run("tar", ["-xzf", files.archive, "-C", cmsWork]).status, 0);
  const [cmsName] = await fs.readdir(cmsWork);
  await fs.writeFile(path.join(cmsWork, cmsName, "editor-store.json"), "{\"stories\":[{\"id\":\"bundled\"}]}\n");
  const cmsArchive = path.join(outputDir, "bundled-cms.tar.gz");
  await retar(cmsWork, cmsName, cmsArchive);
  const cmsDeploy = run("bash", [
    deployScript,
    "--dry-run",
    "--archive",
    cmsArchive,
    "--checksum",
    `${cmsArchive}.sha256`,
    "--release-id",
    "bundled-cms",
  ], { env: layout.env });
  assert.notEqual(cmsDeploy.status, 0);
  assert.match(cmsDeploy.stderr, /editor-store\.json/);
  await assertStoreUntouched(layout);
});

test("legacy dry-run does not execute npm ci, and the default mode refuses that archive", async (t) => {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-legacy-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const name = "legacy-release";
  const root = path.join(work, name);
  await fs.mkdir(path.join(root, "dist/server"), { recursive: true });
  await fs.mkdir(path.join(root, "public"), { recursive: true });
  await fs.mkdir(path.join(root, "scripts"), { recursive: true });
  await fs.mkdir(path.join(root, "lib"), { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(root, "package.json"), "{}\n"),
    fs.writeFile(path.join(root, "package-lock.json"), "{}\n"),
    fs.writeFile(path.join(root, "ecosystem.config.cjs"), "module.exports = { apps: [] };\n"),
    fs.writeFile(path.join(root, "dist/server/index.js"), "export {};\n"),
    fs.writeFile(path.join(root, "public/.gitkeep"), ""),
    fs.writeFile(path.join(root, "scripts/.gitkeep"), ""),
    fs.writeFile(path.join(root, "lib/generated-build-info.ts"), "export const generatedBuildInfo = { gitCommit: \"abcdef123456\" } as const;\n"),
  ]);
  writePayloadChecksums(root);
  const archive = path.join(work, `${name}.tar.gz`);
  await retar(work, name, archive);
  const layout = await makeDeployLayout(t);

  const legacy = run("bash", [
    deployScript,
    "--dry-run",
    "--legacy-server-install",
    "--archive",
    archive,
    "--checksum",
    `${archive}.sha256`,
    "--release-id",
    "legacy-rehearsal",
  ], { env: layout.env });
  assert.equal(legacy.status, 0, `${legacy.stdout}\n${legacy.stderr}`);
  assert.match(legacy.stderr, /npm ci was not run/);
  await assertStoreUntouched(layout);

  const prebuilt = run("bash", [
    deployScript,
    "--dry-run",
    "--archive",
    archive,
    "--checksum",
    `${archive}.sha256`,
    "--release-id",
    "legacy-as-prebuilt",
  ], { env: layout.env });
  assert.notEqual(prebuilt.status, 0);
  assert.match(prebuilt.stderr, /does not run npm ci/);
  assert.match(prebuilt.stderr, /no node_modules/);
  await assertStoreUntouched(layout);
});

test("release scripts and owner docs describe the prebuilt path", async () => {
  const [deploy, rollback, deployment, plan, packageJson] = await Promise.all([
    fs.readFile(deployScript, "utf8"),
    fs.readFile(rollbackScript, "utf8"),
    fs.readFile(path.join(projectDir, "RELEASE_DEPLOYMENT.md"), "utf8"),
    fs.readFile(path.join(projectDir, "docs/release-plan-2026-10-01.md"), "utf8"),
    fs.readFile(path.join(projectDir, "package.json"), "utf8").then(JSON.parse),
  ]);
  assert.equal((deploy.match(/^\s*npm ci --include=dev --no-audit --no-fund$/gm) || []).length, 1);
  assert.match(deploy, /--legacy-server-install/);
  assert.match(deploy, /--dry-run/);
  assert.doesNotMatch(rollback, /^\s*npm\b/m);
  assert.match(rollback, /will not run npm ci, npm install, or a build/);
  assert.match(rollback, /6ce0718/);
  assert.match(deployment, /oldseadogs-production:\/var\/www\/oldseadogs\/incoming\//);
  assert.match(deployment, /pm2 pid oldseadogs-web/);
  assert.match(deployment, /chmod 755/);
  assert.match(deployment, /image-derivatives/);
  assert.match(deployment, /6ce0718/);
  assert.match(deployment, /REQUIRES OWNER APPROVAL/);
  assert.match(plan, /oldseadogs-production/);
  assert.match(plan, /shared\/deploy-tools/);
  assert.match(plan, /chmod 755/);
  assert.match(plan, /image-derivatives/);
  assert.match(plan, /REQUIRES OWNER APPROVAL/);
  assert.equal(packageJson.scripts["package:release"], "bash deploy/release-package.sh");
  assert.equal(packageJson.scripts["package:release:linux"], "bash deploy/release-package-docker.sh");

  const help = run("bash", [deployScript, "--help"]);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /prebuilt/);
  assert.match(help.stdout, /not run npm ci/);
});

test("deploy scripts pass shellcheck", (t) => {
  const probe = run("shellcheck", ["-V"]);
  if (probe.error || probe.status !== 0) {
    t.skip("shellcheck is not installed");
    return;
  }
  const result = run("shellcheck", [
    "--severity=warning",
    "-x",
    "deploy/release-common.sh",
    "deploy/release-deploy.sh",
    "deploy/release-rollback.sh",
    "deploy/release-package.sh",
    "deploy/release-package-docker.sh",
  ], { cwd: projectDir });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
