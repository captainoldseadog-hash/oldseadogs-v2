import { getMediaBucket } from "../../../../db";
import { readLocalMediaUpload } from "../../../../lib/local-media-storage";
import { getMediaAsset } from "../../../../lib/site-content";

type MediaRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: MediaRouteProps) {
  const { id } = await params;
  const asset = await getMediaAsset(id);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  if (asset.r2Key.startsWith("local:")) {
    const variant = new URL(request.url).searchParams.get("variant") || "web";
    const localAsset = await readLocalMediaUpload(asset.r2Key, variant);

    if (!localAsset) {
      return new Response("Not found", { status: 404 });
    }

    const body = new Uint8Array(localAsset.bytes);
    return new Response(body.buffer, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-disposition": `inline; filename="${localAsset.filename.replace(/"/g, "")}"`,
        "content-type": localAsset.contentType || asset.contentType,
        etag: `"${asset.id}"`,
      },
    });
  }

  const bucket = getMediaBucket();
  if (!bucket) {
    return new Response("Not found", { status: 404 });
  }

  const object = await bucket.get(asset.r2Key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", `"${asset.id}"`);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
