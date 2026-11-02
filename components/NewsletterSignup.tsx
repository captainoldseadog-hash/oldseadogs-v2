import { oldSeaDogsNewsletter } from "../content/newsletter";

type NewsletterSignupProps = {
  placement: "homepage" | "guide";
  headingId?: string;
};

export function NewsletterSignup({ placement, headingId }: NewsletterSignupProps) {
  const copy = oldSeaDogsNewsletter[placement];
  const titleId = headingId || `${placement}-newsletter-title`;

  return (
    <section
      className={`newsletter-signup newsletter-signup--${placement}`}
      aria-labelledby={titleId}
    >
      <div className="newsletter-signup-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id={titleId}>{copy.title}</h2>
        <p>{copy.body}</p>
      </div>
      <a
        className="newsletter-signup-cta"
        href={oldSeaDogsNewsletter.subscribeUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {copy.cta}
      </a>
    </section>
  );
}
