import worker from "../../dist/server/index.js";

if (process.env.OLDSEADOGS_TEST_SCHEDULER === "true") {
  const nativeFetch = globalThis.fetch;
  globalThis.__OLDSEADOGS_SCHEDULER_FETCH__ = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === "127.0.0.1" && url.pathname === "/api/editor") {
      return worker.fetch(new Request("http://localhost/api/editor", init), {});
    }
    return nativeFetch(input, init);
  };
  await import("../../scripts/story-scheduler-hook.mjs");
}

process.on("message", async (message) => {
  if (!message || message.type !== "request") return;
  try {
    const requestHeaders = new Headers(message.headers || {});
    if (!requestHeaders.has("host")) {
      requestHeaders.set("host", new URL(message.url).host);
    }
    let body = message.body || undefined;
    if (Array.isArray(message.formData)) {
      const form = new FormData();
      for (const entry of message.formData) {
        if (entry.kind === "file") {
          form.append(
            entry.name,
            new File([Buffer.from(entry.value, "base64")], entry.filename, { type: entry.contentType })
          );
        } else {
          form.append(entry.name, entry.value);
        }
      }
      body = form;
    }
    const response = await worker.fetch(new Request(message.url, {
      method: message.method || "GET",
      headers: requestHeaders,
      body,
    }), {});
    process.send?.({
      type: "response",
      id: message.id,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    });
  } catch (error) {
    process.send?.({
      type: "response",
      id: message.id,
      status: 599,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    });
  }
});

process.send?.({ type: "ready" });
