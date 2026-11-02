export class SourceFetchError extends Error {
  readonly code: "invalid-url" | "timeout" | "http" | "content-type" | "too-large" | "network";

  constructor(message: string, code: "invalid-url" | "timeout" | "http" | "content-type" | "too-large" | "network") {
    super(message);
    this.name = "SourceFetchError";
    this.code = code;
  }
}

export async function fetchSourceText(value: string, options: {
  accept: string;
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SourceFetchError(`Invalid source URL: ${value}`, "invalid-url");
  }
  if (!/^https?:$/.test(url.protocol)) throw new SourceFetchError("Only HTTP and HTTPS source URLs are supported.", "invalid-url");

  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxBytes = options.maxBytes ?? 2_000_000;
  let response: Response;
  try {
    response = await (options.fetchImpl || fetch)(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        accept: options.accept,
        "user-agent": "OldSeaDogsSourceWatch/1.0 (+https://oldseadogs.com)",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const timedOut = /timeout|aborted/i.test(message) || (error instanceof Error && error.name === "TimeoutError");
    throw new SourceFetchError(timedOut ? `Source request timed out after ${timeoutMs}ms.` : `Source request failed: ${message}`, timedOut ? "timeout" : "network");
  }
  if (!response.ok) throw new SourceFetchError(`Source returned HTTP ${response.status}.`, "http");
  const contentType = response.headers.get("content-type") || "";
  if (contentType && !/(html|xml|rss|atom|text\/plain)/i.test(contentType)) {
    throw new SourceFetchError(`Unsupported source content type: ${contentType}.`, "content-type");
  }
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new SourceFetchError(`Source response exceeds the ${maxBytes}-byte limit.`, "too-large");
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new SourceFetchError(`Source response exceeds the ${maxBytes}-byte limit.`, "too-large");
  return { text, finalUrl: response.url || url.toString(), contentType, status: response.status };
}
