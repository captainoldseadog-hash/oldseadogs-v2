import { getMediaBucket } from "../../../../db";
import { getMediaAsset } from "../../../../lib/site-content";

type MediaRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: MediaRouteProps) {
  const { id } = await params;
  const [asset, bucket] = await Promise.all([getMediaAsset(id), getMediaBucket()]);

  if (!asset || !bucket) {
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
