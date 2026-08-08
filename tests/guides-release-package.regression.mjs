import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

const archiveArgument = argument("--archive");
assert.ok(archiveArgument, "Usage: node tests/guides-release-package.regression.mjs --archive /absolute/release.tar.gz");
const archive = path.resolve(archiveArgument);
await fs.access(archive);

const { stdout: listing } = await execFileAsync("/usr/bin/tar", ["-tzf", archive], {
  env: { ...process.env, COPYFILE_DISABLE: "1" },
  maxBuffer: 32 * 1024 * 1024,
});
const entries = listing.split("\n").filter(Boolean);
assert.ok(entries.length > 0, "Release archive is empty.");
for (const entry of entries) {
  assert.doesNotMatch(entry, /^\//, `Absolute archive path: ${entry}`);
  assert.equal(entry.split("/").includes(".."), false, `Parent traversal in archive path: ${entry}`);
}
const roots = [...new Set(entries.map((entry) => entry.split("/")[0]))];
assert.deepEqual(roots.length, 1, `Expected one archive root, found: ${roots.join(", ")}`);

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guides-package-regression-"));
try {
  await execFileAsync("/usr/bin/tar", ["-xzf", archive, "-C", temporary], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
    maxBuffer: 32 * 1024 * 1024,
  });
  const root = path.join(temporary, roots[0]);
  const required = [
    "app/guides/page.tsx",
    "app/guides/[region]/page.tsx",
    "app/guides/[region]/[guide]/page.tsx",
    "components/GuidePublicContent.tsx",
    "scripts/check-controlled-media.mjs",
    "tests/guides-release-package.regression.mjs",
    "dist/server/index.js",
  ];
  for (const relative of required) await fs.access(path.join(root, relative));
  await assert.rejects(fs.access(path.join(root, "app/guides/[slug]/page.tsx")));

  const checker = await fs.readFile(path.join(root, "scripts/check-controlled-media.mjs"), "utf8");
  const sourceReferences = [...checker.matchAll(/new URL\(["']\.\.\/([^"']+)["']/g)].map((match) => match[1]);
  assert.ok(sourceReferences.length > 0, "Controlled-media checker exposes no source-file checks.");
  for (const relative of sourceReferences) await fs.access(path.join(root, relative));

  const forbidden = [
    "app/marina-guide",
    "app/api/editor/marinas",
    "app/editor/MarinaEditor.tsx",
    "app/editor/preview/marina",
    "lib/marinas",
    "drizzle/0010_flashy_beast.sql",
    "drizzle/0011_clean_peter_quill.sql",
    ".oldseadogs-data",
    "oldseadogs-data",
    "public/uploads",
    "node_modules",
    ".git",
    ".wrangler",
    "logs",
  ];
  for (const relative of forbidden) await assert.rejects(fs.access(path.join(root, relative)), `Forbidden package path: ${relative}`);

  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const relative = path.relative(root, full).split(path.sep).join("/");
      assert.doesNotMatch(entry.name, /^\._|^\.DS_Store$|^__MACOSX$/, `macOS metadata: ${relative}`);
      assert.doesNotMatch(entry.name, /\.before-/, `Backup file: ${relative}`);
      assert.doesNotMatch(entry.name, /^\.env(?:\.|$)/, `Environment file: ${relative}`);
      assert.notEqual(entry.name, "editor-store.json", `Editor store: ${relative}`);
      if (entry.isDirectory()) await visit(full);
    }
  }
  await visit(root);

  const result = await execFileAsync("npm", ["run", "check:controlled-media"], {
    cwd: root,
    env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.match(`${result.stdout}\n${result.stderr}`, /Controlled Bridge\/media regression checks passed/);

  process.stdout.write(`${JSON.stringify({ archive, archiveRoot: roots[0], fileEntries: entries.filter((entry) => !entry.endsWith("/")).length, controlledMediaExitStatus: 0 }, null, 2)}\n`);
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
