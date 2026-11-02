import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const releaseCommon = path.join(projectDir, "deploy", "release-common.sh");

async function createFixture(t, initialCwd) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-pm2-handover-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  const releasesDir = path.join(root, "releases");
  const previousRelease = path.join(releasesDir, "previous-release");
  const nextRelease = path.join(releasesDir, "next-release");
  const dataDir = path.join(root, "production-data-path");
  const fakeBin = path.join(root, "bin");
  const envFile = path.join(root, "oldseadogs.env");
  const pm2Log = path.join(root, "pm2.log");
  const pm2State = path.join(root, "pm2.cwd");

  await Promise.all([
    fs.mkdir(previousRelease, { recursive: true }),
    fs.mkdir(nextRelease, { recursive: true }),
    fs.mkdir(dataDir, { recursive: true }),
    fs.mkdir(fakeBin, { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(path.join(previousRelease, "ecosystem.config.cjs"), "module.exports = { apps: [] };\n"),
    fs.writeFile(path.join(nextRelease, "ecosystem.config.cjs"), "module.exports = { apps: [] };\n"),
    fs.writeFile(envFile, [
      "OLDSEADOGS_GA4_ID=G-88HT8MHR7T",
      "OLDSEADOGS_ENABLE_ADSENSE=true",
      "OLDSEADOGS_ADSENSE_CLIENT=ca-pub-test",
      "NEXT_PUBLIC_ENABLE_ADSENSE=true",
      "NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-test",
      "",
    ].join("\n")),
    fs.writeFile(path.join(fakeBin, "readlink"), `#!/bin/bash
set -euo pipefail
if [[ "\${1:-}" == "-f" ]]; then
  node -e 'process.stdout.write(require("node:fs").realpathSync(process.argv[1]))' "$2"
else
  /usr/bin/readlink "$@"
fi
`, { mode: 0o755 }),
    fs.writeFile(path.join(fakeBin, "pm2"), `#!/bin/bash
set -euo pipefail
command_name="$1"
shift
{
  printf 'CMD\\t%s' "$command_name"
  for argument in "$@"; do printf '\\t%s' "$argument"; done
  printf '\\nENV\\t%s\\t%s\\t%s\\t%s\\t%s\\n' "\${NODE_ENV:-}" "\${OLDSEADOGS_ENV:-}" "\${OLDSEADOGS_DATA_DIR:-}" "\${OLDSEADOGS_GA4_ID:-}" "\${OLDSEADOGS_ADSENSE_CLIENT:-}"
} >>"$PM2_LOG"

case "$command_name" in
  jlist)
    if [[ -f "$PM2_STATE" ]]; then
      node -e 'process.stdout.write(JSON.stringify([{name:"oldseadogs-web",pm2_env:{status:"online",pm_cwd:process.argv[1]}}]))' "$(<"$PM2_STATE")"
    else
      printf '[]'
    fi
    ;;
  delete)
    [[ "$1" == "oldseadogs-web" ]]
    /bin/rm -f "$PM2_STATE"
    ;;
  start)
    [[ "$1" == */ecosystem.config.cjs ]]
    dirname "$1" >"$PM2_STATE"
    ;;
  startOrReload)
    [[ "$1" == */ecosystem.config.cjs ]]
    if [[ ! -f "$PM2_STATE" ]]; then dirname "$1" >"$PM2_STATE"; fi
    ;;
  describe)
    [[ "$1" == "oldseadogs-web" && -f "$PM2_STATE" ]]
    ;;
  *)
    exit 91
    ;;
esac
`, { mode: 0o755 }),
  ]);

  if (initialCwd) await fs.writeFile(pm2State, `${initialCwd}\n`);

  const env = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH}`,
    RELEASES_DIR: releasesDir,
    DATA_DIR: dataDir,
    ENV_FILE: envFile,
    PM2_LOG: pm2Log,
    PM2_STATE: pm2State,
  };

  return { dataDir, env, nextRelease, pm2Log, pm2State, previousRelease };
}

function invoke(fixture, releases) {
  const calls = releases.map((_, index) => `start_or_reload_release "$${index + 1}"`).join("\n");
  const result = spawnSync("/bin/bash", ["-c", `source "$RELEASE_COMMON"\n${calls}`, "test", ...releases], {
    encoding: "utf8",
    env: { ...fixture.env, RELEASE_COMMON: releaseCommon },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

async function commandLog(fixture) {
  const text = await fs.readFile(fixture.pm2Log, "utf8");
  return {
    commands: text.split("\n").filter((line) => line.startsWith("CMD\t")).map((line) => line.split("\t").slice(1)),
    environment: text.split("\n").filter((line) => line.startsWith("ENV\t")).map((line) => line.split("\t").slice(1)),
  };
}

test("same-cwd PM2 process uses a targeted production reload", async (t) => {
  const fixture = await createFixture(t, null);
  await fs.writeFile(fixture.pm2State, `${fixture.nextRelease}\n`);
  invoke(fixture, [fixture.nextRelease]);

  const { commands } = await commandLog(fixture);
  assert.deepEqual(commands.map(([command]) => command), ["jlist", "startOrReload", "describe"]);
  assert.deepEqual(commands[1], [
    "startOrReload",
    path.join(fixture.nextRelease, "ecosystem.config.cjs"),
    "--only",
    "oldseadogs-web",
    "--env",
    "production",
    "--update-env",
  ]);
});

test("different-cwd PM2 process is deleted and recreated only by name", async (t) => {
  const fixture = await createFixture(t, null);
  await fs.writeFile(fixture.pm2State, `${fixture.previousRelease}\n`);
  invoke(fixture, [fixture.nextRelease]);

  const { commands, environment } = await commandLog(fixture);
  assert.deepEqual(commands.map(([command]) => command), ["jlist", "delete", "start", "describe"]);
  assert.deepEqual(commands[1], ["delete", "oldseadogs-web"]);
  assert.deepEqual(commands[2], [
    "start",
    path.join(fixture.nextRelease, "ecosystem.config.cjs"),
    "--only",
    "oldseadogs-web",
    "--env",
    "production",
    "--update-env",
  ]);
  assert.ok(environment.every(([nodeEnv, oldSeaDogsEnv, dataDir, ga4, adsenseClient]) =>
    nodeEnv === "production" &&
    oldSeaDogsEnv === "production" &&
    dataDir === fixture.dataDir &&
    ga4 === "G-88HT8MHR7T" &&
    adsenseClient === "ca-pub-test"
  ));
});

test("missing PM2 process starts from the requested release without a global delete", async (t) => {
  const fixture = await createFixture(t, null);
  invoke(fixture, [fixture.nextRelease]);

  const { commands } = await commandLog(fixture);
  assert.deepEqual(commands.map(([command]) => command), ["jlist", "start", "describe"]);
  assert.equal(await fs.readFile(fixture.pm2State, "utf8").then((value) => value.trim()), fixture.nextRelease);
});

test("automatic rollback recreates the same named process in the previous release", async (t) => {
  const fixture = await createFixture(t, null);
  await fs.writeFile(fixture.pm2State, `${fixture.previousRelease}\n`);
  invoke(fixture, [fixture.nextRelease, fixture.previousRelease]);

  const { commands } = await commandLog(fixture);
  assert.deepEqual(commands.filter(([command]) => command === "delete"), [
    ["delete", "oldseadogs-web"],
    ["delete", "oldseadogs-web"],
  ]);
  assert.deepEqual(commands.filter(([command]) => command === "start").map((command) => command[1]), [
    path.join(fixture.nextRelease, "ecosystem.config.cjs"),
    path.join(fixture.previousRelease, "ecosystem.config.cjs"),
  ]);
  assert.equal(await fs.readFile(fixture.pm2State, "utf8").then((value) => value.trim()), fixture.previousRelease);
});

test("production liveness keeps the exact requested PM2 cwd assertion", async () => {
  const source = await fs.readFile(releaseCommon, "utf8");
  assert.match(source, /const expectedCwd = fs\.realpathSync\(process\.argv\[3\]\)/);
  assert.match(source, /const actualCwd = fs\.realpathSync\(app\.pm2_env\?\.pm_cwd \|\| "\."\)/);
  assert.match(source, /if \(actualCwd !== expectedCwd\) throw new Error/);
  assert.match(source, /export OLDSEADOGS_DATA_DIR="\$DATA_DIR"/);
});
