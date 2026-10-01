import { absoluteUrl } from "./seo.ts";
import type { ClassifiedListing } from "./classifieds-types.ts";
import type { MailMessage } from "./classifieds-mail.ts";

function pageUrl(path: string) {
  return absoluteUrl(path);
}

function shell(heading: string, paragraphs: string[], action?: { href: string; label: string }) {
  const text = [
    heading,
    "",
    ...paragraphs.flatMap((paragraph) => [paragraph, ""]),
    action ? `${action.label}: ${action.href}` : "",
    "Old Sea Dogs",
    pageUrl("/boats-for-sale"),
  ].filter((line, index, all) => line !== "" || all[index - 1] !== "").join("\n");
  const htmlParagraphs = paragraphs.map((paragraph) => `<p style="font-family:Georgia,serif;font-size:18px;line-height:1.5;color:#172026">${escapeHtml(paragraph)}</p>`).join("");
  const htmlAction = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.href)}" style="display:inline-block;background:#123944;color:#f6f7f3;text-decoration:none;padding:12px 18px;letter-spacing:.08em;text-transform:uppercase;font-family:Inter,Arial,sans-serif;font-size:13px">${escapeHtml(action.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f3;color:#172026"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><p style="font-family:Inter,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#8f3e24">Old Sea Dogs · Boats for Sale</p><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:32px;line-height:1.15">${escapeHtml(heading)}</h1>${htmlParagraphs}${htmlAction}<p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#5f6e72">Old Sea Dogs · <a href="${escapeHtml(pageUrl("/boats-for-sale"))}" style="color:#2f6f67">Boats for Sale</a></p></div></body></html>`;
  return { text, html };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character] || character));
}

export function verifyEmail(listing: ClassifiedListing, token: string): MailMessage {
  const href = pageUrl(`/boats-for-sale/verify/${encodeURIComponent(token)}`);
  const rendered = shell(
    "Confirm your email",
    [
      `Hello ${listing.sellerName},`,
      `Thank you for listing ${listing.title}. Please confirm this email address so we can pass the advertisement to the editor.`,
      "Nothing is published until you confirm, and until we have read it. Listing is free.",
    ],
    { href, label: "Confirm my email" },
  );
  return { to: listing.sellerEmail, subject: "Confirm your email to list your boat on Old Sea Dogs", ...rendered };
}

export function pendingNotice(listing: ClassifiedListing): MailMessage {
  const rendered = shell(
    "A boat advertisement is waiting",
    [
      `${listing.sellerName} has confirmed an advertisement for ${listing.title}.`,
      "It is waiting in The Helm under Boats for Sale. It is not on the public site until you approve it.",
    ],
    { href: pageUrl("/editor/boats"), label: "Open Boats for Sale" },
  );
  return {
    to: notifyAddress(),
    subject: `Boat advertisement waiting: ${listing.title}`,
    ...rendered,
  };
}

export function reminderEmail(listing: ClassifiedListing, manageToken: string): MailMessage {
  const href = pageUrl(`/boats-for-sale/manage/${encodeURIComponent(manageToken)}`);
  const until = listing.expiresAt ? new Date(listing.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "the end of its three months";
  const rendered = shell(
    "Your free advertisement is still running",
    [
      `Hello ${listing.sellerName},`,
      `Your free advertisement for ${listing.title} is still running on Old Sea Dogs. It stays up until ${until}.`,
      "If the boat has sold, or you would like to change the wording or take it down, use the link below. You do not need an account.",
      "We will write again in a fortnight while it is live. There is nothing to pay.",
    ],
    { href, label: "Manage this advertisement" },
  );
  return { to: listing.sellerEmail, subject: "Your free Old Sea Dogs boat advertisement is still running", ...rendered };
}

export function keepRunningEmail(listing: ClassifiedListing, keepToken: string, manageToken: string): MailMessage {
  const keepHref = pageUrl(`/boats-for-sale/keep/${encodeURIComponent(keepToken)}`);
  const manageHref = pageUrl(`/boats-for-sale/manage/${encodeURIComponent(manageToken)}`);
  const rendered = shell(
    "Shall we keep your advertisement running?",
    [
      `Hello ${listing.sellerName},`,
      `Your free advertisement for ${listing.title} has reached the end of its three months.`,
      "If you would like it to run for another three months, open the link below and confirm. It works for 14 days. If we do not hear from you, we will take the advertisement down and write to confirm.",
      `You can also mark it sold or remove it here: ${manageHref}`,
    ],
    { href: keepHref, label: "Keep my ad running for another 3 months" },
  );
  return { to: listing.sellerEmail, subject: "Shall we keep your free boat advertisement running?", ...rendered };
}

export function endedEmail(listing: ClassifiedListing, relistToken: string): MailMessage {
  const href = pageUrl(`/boats-for-sale/relist/${encodeURIComponent(relistToken)}`);
  const rendered = shell(
    "Your advertisement has ended",
    [
      `Hello ${listing.sellerName},`,
      `Your free advertisement for ${listing.title} has come to an end, as we did not hear back within 14 days.`,
      "The page is no longer public. If you would like to list the boat again, the link below sends it back to the editor for another look. It is still free.",
    ],
    { href, label: "List this boat again" },
  );
  return { to: listing.sellerEmail, subject: "Your free Old Sea Dogs boat advertisement has ended", ...rendered };
}

export function enquiryEmail(listing: ClassifiedListing, buyer: { name: string; email: string; message: string }): MailMessage {
  const rendered = shell(
    `A reader has asked about ${listing.title}`,
    [
      `Hello ${listing.sellerName},`,
      `${buyer.name} (${buyer.email}) wrote:`,
      buyer.message,
      "You can reply to them directly. Please take care with any request for a deposit, and do not send bank details before you have met.",
      "Old Sea Dogs has not checked this enquiry. We only passed the message on.",
    ],
  );
  return {
    to: listing.sellerEmail,
    replyTo: buyer.email,
    subject: `Enquiry about ${listing.title}`,
    ...rendered,
  };
}

function notifyAddress() {
  const configured = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.OLDSEADOGS_CLASSIFIEDS_NOTIFY_EMAIL?.trim();
  return configured || "captainoldseadog@gmail.com";
}
