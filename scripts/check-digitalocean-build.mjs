import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const serverDir = path.join(process.cwd(), "dist", "server");
const cloudflareProtocolPattern = /from\s+["']cloudflare:|import\(["']cloudflare:/;

async function collectJavaScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(m?js|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

let files;
try {
  files = await collectJavaScriptFiles(serverDir);
} catch (error) {
  console.error(`DigitalOcean build check could not read ${serverDir}.`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const offenders = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  if (cloudflareProtocolPattern.test(source)) {
    offenders.push(path.relative(process.cwd(), file));
  }
}

if (offenders.length > 0) {
  console.error("DigitalOcean build is not Node-compatible yet.");
  console.error("The server bundle still imports Cloudflare-only modules:");
  for (const file of offenders) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("DigitalOcean build check passed: no cloudflare: imports in dist/server.");
