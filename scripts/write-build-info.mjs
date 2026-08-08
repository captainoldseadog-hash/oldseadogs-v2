import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function run(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const buildTimestamp = new Date().toISOString();
const gitCommit = run("git rev-parse --short=12 HEAD") || "unknown";
const gitBranch = run("git rev-parse --abbrev-ref HEAD") || "unknown";

writeFileSync(
  "lib/generated-build-info.ts",
  `export const generatedBuildInfo = ${JSON.stringify(
    {
      buildTimestamp,
      gitCommit,
      gitBranch,
    },
    null,
    2
  )} as const;\n`
);
