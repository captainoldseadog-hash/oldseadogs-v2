import { BoatsMasthead } from "../../components/boats/BoatsMasthead";
import { SiteFooter } from "../../components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function BoatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="boats-root">
      <BoatsMasthead />
      {children}
      <SiteFooter extraLinks={[{ href: "/boats-for-sale/list-your-boat", label: "List your boat free" }]} />
    </div>
  );
}
