import { oldSeaDogsNewsletter } from "../content/newsletter";

type NewsletterSignupProps = {
  placement: "homepage" | "guide";
};

export function NewsletterSignup({ placement }: NewsletterSignupProps) {
  const copy = oldSeaDogsNewsletter[placement];
  const headingId = `${placement}-newsletter-title`;

  return (
    <section
      className={`newsletter-signup newsletter-signup--${placement}`}
      aria-labelledby={headingId}
    >
      <div className="newsletter-signup-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id={headingId}>{copy.title}</h2>
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
