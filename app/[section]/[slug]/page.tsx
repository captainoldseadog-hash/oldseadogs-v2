import { notFound, permanentRedirect } from "next/navigation";
import { getLegacyRedirectPath } from "../../../lib/redirects";

type LegacyTwoPartRouteProps = {
  params: Promise<{
    section: string;
    slug: string;
  }>;
};

export default async function LegacyTwoPartRoute({ params }: LegacyTwoPartRouteProps) {
  const { section, slug } = await params;
  const legacyPath = `/${section}/${slug}`;
  const redirectPath = getLegacyRedirectPath(legacyPath);

  if (redirectPath && redirectPath !== legacyPath) {
    permanentRedirect(redirectPath);
  }

  notFound();
}
