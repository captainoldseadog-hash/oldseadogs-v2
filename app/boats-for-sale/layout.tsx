import { BoatsMasthead } from "../../components/boats/BoatsMasthead";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function BoatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="boats-root">
      <SiteHeader current="boats-for-sale" />
      <BoatsMasthead />
      {children}
      <SiteFooter extraLinks={[{ href: "/boats-for-sale/list-your-boat", label: "List your boat free" }]} />
    </div>
  );
}
