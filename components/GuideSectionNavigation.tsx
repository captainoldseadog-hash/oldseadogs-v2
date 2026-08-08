export function GuideSectionNavigation({
  sections,
  wrapped = false,
}: {
  sections: Array<{ anchor: string; heading: string }>;
  wrapped?: boolean;
}) {
  return (
    <nav className={`guide-section-navigation ${wrapped ? "guide-section-navigation--wrapped" : ""}`} aria-label="Guide sections">
      <div className="guide-section-navigation-desktop">
        <strong>In this Guide</strong>
        <div>
          {sections.map((section) => (
            <a key={section.anchor} href={`#${section.anchor}`}>{section.heading}</a>
          ))}
        </div>
      </div>
      <details className="guide-section-navigation-mobile">
        <summary>Jump to section</summary>
        <div>
          {sections.map((section) => (
            <a key={section.anchor} href={`#${section.anchor}`}>{section.heading}</a>
          ))}
        </div>
      </details>
    </nav>
  );
}
