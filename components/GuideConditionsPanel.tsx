import type { GuideConditionsConfig } from "../content/guide-conditions.ts";
import { GuideTideTimes } from "./GuideTideTimes.tsx";

/**
 * Tide half of the guide conditions panel.
 * Wind figures on the live site come from a Met Office fetch that was not in the exported patches, so this panel does not invent them.
 * When `conditions.tide` is anything other than "none", it is treated as the first-party tide-station slug.
 */
export function GuideConditionsPanel({ title, conditions }: { title: string; conditions: GuideConditionsConfig }) {
  const tideStation = conditions.tide && conditions.tide !== "none"
    ? { slug: conditions.tide, name: title }
    : null;

  return (
    <section className="guide-verified-facilities guide-conditions" aria-labelledby="guide-conditions-title">
      <div>
        <p className="eyebrow">Conditions</p>
        <h2 id="guide-conditions-title">Tide and wind</h2>
        <p>A quick look at the water around {title} before you set off. Always check the full forecast and tide tables.</p>
        <aside className="guide-source-assurance guide-conditions-warning" aria-label="Not for navigation">
          <strong>Not for navigation</strong>
          <p>For general planning only. Use official tide tables, the Met Office shipping and inshore forecasts and your own judgement.</p>
        </aside>
      </div>
      <div className="guide-conditions-body">
        {tideStation ? (
          <>
            <GuideTideTimes slug={tideStation.slug} station={tideStation.name} />
            <p className="guide-conditions-official">
              <a href={conditions.tideLink?.href ?? "https://easytide.admiralty.co.uk/"} rel="noopener noreferrer" target="_blank">{conditions.tideLink?.label ?? "Official tide tables — ADMIRALTY EasyTide"}</a>
            </p>
          </>
        ) : conditions.tideLink || conditions.tideNote ? (
          <div className="guide-conditions-block">
            <h3>Tide times <span>official tables</span></h3>
            {conditions.tideNote ? <p>{conditions.tideNote}</p> : null}
            {conditions.tideLink ? (
              <a className="button-secondary" href={conditions.tideLink.href} rel="noopener noreferrer" target="_blank">{conditions.tideLink.label}</a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
