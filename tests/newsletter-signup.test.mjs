import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

test("newsletter wording and Substack destinations live in one module", async () => {
  const newsletter = await read("content/newsletter.ts");
  assert.match(newsletter, /publicationUrl: "https:\/\/oldseadogs1\.substack\.com"/);
  assert.match(newsletter, /subscribeUrl: "https:\/\/oldseadogs1\.substack\.com\/subscribe"/);
  assert.match(newsletter, /Letters from the water/);
  assert.match(newsletter, /New marina guides, berth notes and stories from the water/);
});

test("homepage replaces the investor advert slots with one Substack link", async () => {
  const [homepage, signup, ads] = await Promise.all([
    read("app/page.tsx"),
    read("components/NewsletterSignup.tsx"),
    read("components/AdBlock.tsx"),
  ]);
  assert.match(homepage, /isOffTopicInvestorAdvert\(featuredClubAd\)/);
  assert.match(homepage, /isOffTopicInvestorAdvert\(homepageBottomAd\)/);
  assert.match(homepage, /<NewsletterSignup placement="homepage" \/>/);
  assert.doesNotMatch(homepage, /aNewFN|anewfn\.com/);
  assert.match(ads, /export function isOffTopicInvestorAdvert/);
  assert.match(signup, /oldSeaDogsNewsletter\.subscribeUrl/);
  assert.match(signup, /rel="noopener noreferrer"/);
  assert.doesNotMatch(`${homepage}\n${signup}`, /<iframe|substack\.com\/embed/);
});

test("marina and harbour guides end with the sailor newsletter, and the footer links Substack", async () => {
  const [guide, socialLinks, footer] = await Promise.all([
    read("components/GuidePublicContent.tsx"),
    read("content/social-links.ts"),
    read("components/SiteFooter.tsx"),
  ]);
  assert.match(guide, /guide\.guideType === "Marina" \|\| guide\.guideType === "Harbour"[\s\S]*<NewsletterSignup placement="guide" \/>/);
  assert.match(socialLinks, /substack: oldSeaDogsNewsletter\.publicationUrl/);
  assert.match(socialLinks, /key: "substack"/);
  assert.match(socialLinks, /oldSeaDogsSocialLinks\.substack/);
  assert.match(footer, /socialSettingKeys\[platform\.key\]/);
  assert.doesNotMatch(guide, /<iframe src=.*substack/);
});
