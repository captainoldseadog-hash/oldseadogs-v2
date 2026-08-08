import { recordSocialEvent } from "../../../../lib/site-content";
import { canEditSite, forbiddenResponse } from "../../../../lib/editor-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Visitor-facing pages are read-only. Social-event persistence is available
  // only to an authenticated CMS session (for example, editor-generated posts).
  if (!await canEditSite(request)) return forbiddenResponse();

  try {
    const payload = await request.json() as {
      type?: "social_click" | "outbound_click" | "generated_post";
      platform?: string;
      target?: string;
      storySlug?: string;
    };

    if (!payload.type) {
      return Response.json({ ok: false, error: "Missing analytics event type." }, { status: 400 });
    }

    await recordSocialEvent({
      type: payload.type,
      platform: payload.platform,
      target: payload.target,
      storySlug: payload.storySlug,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
