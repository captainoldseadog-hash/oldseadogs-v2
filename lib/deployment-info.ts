import { sourceWatchSites } from "../content/source-watch";
import { generatedBuildInfo } from "./generated-build-info";
import { getLocalMediaStorageInfo } from "./local-media-storage";
import { getEditorStorageStatus } from "./site-content";

type RuntimeProcessLike = {
  cwd?: () => string;
  env?: Record<string, string | undefined>;
  versions?: {
    node?: string;
  };
};

const serverStartedAt = new Date().toISOString();

function runtimeProcess() {
  return (globalThis as typeof globalThis & { process?: RuntimeProcessLike }).process;
}

async function hostname() {
  const process = runtimeProcess();
  const envHost = process?.env?.OLDSEADOGS_HOSTNAME || process?.env?.HOSTNAME || "";
  if (envHost) return envHost;
  if (!process?.versions?.node) return "non-node-runtime";

  try {
    const osSpecifier = "node:os";
    const os = await import(/* @vite-ignore */ osSpecifier) as {
      hostname(): string;
    };
    return os.hostname();
  } catch {
    return "unknown";
  }
}

export async function getDeploymentInfo() {
  const process = runtimeProcess();
  const storage = await getEditorStorageStatus();
  const media = await getLocalMediaStorageInfo();
  const runtime = process?.versions?.node ? "node" : "edge-or-worker";
  const digitalOceanMode =
    process?.env?.OLDSEADOGS_RUNTIME === "node" ||
    Boolean(process?.env?.OLDSEADOGS_DATA_DIR) ||
    Boolean(process?.env?.OLDSEADOGS_EDITOR_STAGING_SECRET);

  return {
    buildTimestamp: process?.env?.OLDSEADOGS_BUILD_TIMESTAMP || generatedBuildInfo.buildTimestamp,
    gitCommit: process?.env?.OLDSEADOGS_GIT_COMMIT || generatedBuildInfo.gitCommit,
    gitBranch: process?.env?.OLDSEADOGS_GIT_BRANCH || generatedBuildInfo.gitBranch,
    deploymentTimestamp: process?.env?.OLDSEADOGS_DEPLOYED_AT || serverStartedAt,
    serverStartedAt,
    serverHostname: await hostname(),
    dataDir: storage.dataPath || process?.env?.OLDSEADOGS_DATA_DIR || "",
    mediaDir: media.mediaDir,
    runtime,
    digitalOceanMode,
    latestPreviewPublishCodeActive: true,
    features: {
      newsroomPreviewEnabled: true,
      emailPublishEnabled: true,
      protectedPreviewRouteEnabled: true,
      photoPreviewEnabled: true,
      directNewsroomPublishEnabled: true,
      scraperExpandedSourcesEnabled: sourceWatchSites.length > 4,
    },
  };
}
