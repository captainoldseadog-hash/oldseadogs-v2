import { fork } from "node:child_process";

export async function startEditorStoreWorker({ projectDir, dataDir, env = {} }) {
  const child = fork("./tests/helpers/editor-store-process.mjs", [], {
    cwd: projectDir,
    env: {
      ...process.env,
      OLDSEADOGS_DATA_DIR: dataDir,
      OLDSEADOGS_ENV: "production",
      OLDSEADOGS_REQUIRE_EXISTING_STORE: "true",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  child.setMaxListeners(0);
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Editor worker did not start.\n${output}`)), 30_000);
    child.once("exit", (code) => reject(new Error(`Editor worker exited during startup: ${code}\n${output}`)));
    child.on("message", (message) => {
      if (message?.type !== "ready") return;
      clearTimeout(timeout);
      resolve();
    });
  });

  let sequence = 0;
  const fetchFromWorker = async (input, init = {}) => {
    const sourceRequest = input instanceof Request ? input : null;
    const url = sourceRequest?.url || String(input);
    const method = init.method || sourceRequest?.method || "GET";
    const headers = Object.fromEntries(new Headers(init.headers || sourceRequest?.headers || {}).entries());
    const suppliedBody = init.body;
    let body = typeof suppliedBody === "string" ? suppliedBody : "";
    let formData = null;

    if (suppliedBody instanceof FormData) {
      formData = await Promise.all(Array.from(suppliedBody.entries()).map(async ([name, value]) => {
        if (typeof value === "string") return { name, kind: "text", value };
        return {
          name,
          kind: "file",
          filename: value.name,
          contentType: value.type,
          value: Buffer.from(await value.arrayBuffer()).toString("base64"),
        };
      }));
      delete headers["content-type"];
    } else if (!body && sourceRequest && method !== "GET" && method !== "HEAD") {
      body = await sourceRequest.clone().text();
    }

    const id = `${process.pid}-${++sequence}`;
    const message = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.off("message", onMessage);
        reject(new Error(`Worker request timed out: ${method} ${url}\n${output}`));
      }, 30_000);
      const onMessage = (responseMessage) => {
        if (responseMessage?.type !== "response" || responseMessage.id !== id) return;
        clearTimeout(timeout);
        child.off("message", onMessage);
        resolve(responseMessage);
      };
      child.on("message", onMessage);
      child.send({ type: "request", id, url, method, headers, body, formData });
    });
    return new Response(message.body, {
      status: message.status,
      headers: message.headers,
    });
  };

  const stop = async () => {
    if (child.exitCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 10_000))]);
  };

  return {
    child,
    fetch: fetchFromWorker,
    output: () => output,
    stop,
  };
}
