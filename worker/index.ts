/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { setRuntimeBindings, type D1Binding, type MediaBucket } from "../db";
import { retiredMarinaGuideRedirect } from "../lib/marina-library-redirect";
import { cacheHeadersForPolicyRequest } from "../lib/public-cache-policy";
import { getLegacyRedirectPath } from "../lib/redirects";

type Fetcher = {
  fetch(request: Request): Promise<Response>;
};

interface Env {
  ASSETS: Fetcher;
  DB: D1Binding;
  MEDIA: MediaBucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setRuntimeBindings(env);

    const url = new URL(request.url);
    const legacyRedirectPath = getLegacyRedirectPath(url.pathname);

    if (legacyRedirectPath) {
      return Response.redirect(
        `https://oldseadogs.com${legacyRedirectPath}${url.search}`,
        301
      );
    }

    if (url.hostname === "www.oldseadogs.com") {
      return Response.redirect(
        `https://oldseadogs.com${url.pathname}${url.search}`,
        301
      );
    }

    const marinaLibrary = retiredMarinaGuideRedirect(url.pathname);
    if (marinaLibrary) {
      const headers = new Headers();
      const cacheHeaders = cacheHeadersForPolicyRequest({
        header: (name) => request.headers.get(name),
        method: request.method,
        pathname: url.pathname,
        searchParams: url.searchParams,
      });
      if (cacheHeaders) {
        for (const [key, value] of Object.entries(cacheHeaders)) headers.set(key, value);
      }
      headers.set("Location", marinaLibrary);
      return new Response(null, {
        status: 301,
        headers,
      });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
