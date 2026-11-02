import { serveDerivative } from "../../../../lib/image-derivatives";
import { RESPONSIVE_IMAGE_WIDTHS } from "../../../../lib/responsive-image";

export const dynamic = "force-dynamic";

type ImageRouteProps = {
  params: Promise<{
    asset?: string[];
    width: string;
  }>;
};

export async function GET(request: Request, { params }: ImageRouteProps) {
  const { asset = [], width } = await params;
  const numericWidth = Number(width);
  if (!RESPONSIVE_IMAGE_WIDTHS.includes(numericWidth as (typeof RESPONSIVE_IMAGE_WIDTHS)[number])) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  return serveDerivative(request, numericWidth, asset);
}
