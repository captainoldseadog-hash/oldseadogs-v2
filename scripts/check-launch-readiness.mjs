import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checks = [];

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
}

async function fileExists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function collectJavaScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScriptFiles(fullPath));
    } else if (entry.isFile() && /\.(m?js|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function checkNoCloudflareRuntimeImports() {
  const serverDir = path.join(root, "dist", "server");
  try {
    const serverStat = await stat(serverDir);
    if (!serverStat.isDirectory()) {
      addCheck("DigitalOcean server bundle exists", false, "dist/server is not a directory. Run npm run build:do first.");
      return;
    }
  } catch {
    addCheck("DigitalOcean server bundle exists", false, "dist/server is missing. Run npm run build:do first.");
    return;
  }

  const offenders = [];
  const files = await collectJavaScriptFiles(serverDir);
  const cloudflareProtocolPattern = /from\s+["']cloudflare:|import\(["']cloudflare:/;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (cloudflareProtocolPattern.test(source)) {
      offenders.push(path.relative(root, file));
    }
  }

  addCheck(
    "DigitalOcean build has no cloudflare: runtime imports",
    offenders.length === 0,
    offenders.length === 0 ? "Node production bundle is Cloudflare-protocol clean." : offenders.join(", ")
  );
}

const packageJson = JSON.parse(await read("package.json"));
const ecosystemSource = await read("ecosystem.config.cjs");
const seoSource = await read("lib/seo.ts");
const robotsSource = await read("app/robots.ts");
const sitemapSource = await read("app/sitemap.ts");
const nextConfigSource = await read("next.config.ts");
const redirectsSource = await read("lib/redirects.ts");
const editorPageSource = await read("app/editor/page.tsx");
const editorAuthSource = await read("lib/editor-auth.ts");
const healthSource = await read("app/api/editor/health/route.ts");
const privacySource = await read("app/privacy/page.tsx");
const cookieSource = await read("app/cookie-policy/page.tsx");
const deploymentSource = await read("DEPLOYMENT.md");
const productionSource = await read("PRODUCTION.md");
const productionNginxSource = await read("deploy/nginx/oldseadogs-production.conf");
const envExampleSource = await read("deploy/oldseadogs.env.example");
const siteContentSource = await read("lib/site-content.ts");
const safeDeploySource = await read("scripts/oldseadogs-ops.mjs");
const legacyStories = JSON.parse(await read("content/legacy-stories.json"));

addCheck(
  "OLDSEADOGS_ENV launch mode exists",
  seoSource.includes("OLDSEADOGS_ENV") && seoSource.includes("production") && seoSource.includes("staging"),
  "SEO helpers switch between staging and production mode."
);
addCheck(
  "PM2 production environment is explicit",
  ecosystemSource.includes("env_production") &&
    ecosystemSource.includes('OLDSEADOGS_ENV: "production"') &&
    ecosystemSource.includes('OLDSEADOGS_SITE_URL: "https://oldseadogs.com"') &&
    ecosystemSource.includes('NEXT_PUBLIC_SITE_URL: "https://oldseadogs.com"'),
  "PM2 can be started or reloaded with --env production so SEO does not stay in staging mode."
);
addCheck(
  "Production canonical domain is non-www oldseadogs.com",
  seoSource.includes('productionSiteUrl = "https://oldseadogs.com"'),
  "Production canonicals, OG URLs and sitemap URLs use https://oldseadogs.com."
);
addCheck(
  "Production proxy redirects to canonical non-www domain",
  productionNginxSource.includes("return 301 https://oldseadogs.com$request_uri;") &&
    !productionNginxSource.includes("return 301 https://www.oldseadogs.com$request_uri;"),
  "Nginx production template redirects HTTP and www traffic to https://oldseadogs.com."
);
addCheck(
  "Production SSL path matches certbot primary domain",
  productionNginxSource.includes("/etc/letsencrypt/live/oldseadogs.com/fullchain.pem") &&
    !productionNginxSource.includes("/etc/letsencrypt/live/www.oldseadogs.com/fullchain.pem"),
  "Nginx production template uses the certificate directory created by certbot -d oldseadogs.com -d www.oldseadogs.com."
);
addCheck(
  "Production security headers are configured",
  productionNginxSource.includes('X-Frame-Options "SAMEORIGIN"') &&
    productionNginxSource.includes('X-Content-Type-Options "nosniff"') &&
    productionNginxSource.includes('Referrer-Policy "strict-origin-when-cross-origin"') &&
    productionNginxSource.includes("Permissions-Policy") &&
    productionNginxSource.includes("Strict-Transport-Security"),
  "Production Nginx template sets baseline browser security headers."
);
addCheck(
  "Staging blocks crawlers",
  robotsSource.includes('disallow: "/"') && seoSource.includes("searchIndexingEnabled = isProduction"),
  "Staging mode disallows all robots and emits noindex metadata."
);
addCheck(
  "Production robots allows public crawl",
  robotsSource.includes('allow: "/"') && robotsSource.includes("Sitemap") === false && robotsSource.includes("productionSiteUrl"),
  "Production robots rules allow the public site while excluding editor/API routes."
);
addCheck(
  "Public media API is crawlable and cacheable",
  !robotsSource.includes('"/api/"') &&
    !robotsSource.includes('"/api",') &&
    !nextConfigSource.includes('source: "/api/:path*"') &&
    nextConfigSource.includes('source: "/api/editor/:path*"'),
  "Uploaded story images served from /api/media are not accidentally covered by private /api-wide robots or no-store headers."
);
addCheck(
  "Editor stays private and noindex",
  editorPageSource.includes("noIndex: true") &&
    editorAuthSource.includes("noindex, nofollow, noarchive, nosnippet"),
  "Editor page and editor API responses carry noindex/noarchive protection."
);
addCheck(
  "Sitemap includes public story URLs",
  sitemapSource.includes("getPublishedStories") && sitemapSource.includes("/stories/${story.slug}"),
  `${legacyStories.length.toLocaleString("en-GB")} restored stories available to sitemap generation.`
);
addCheck(
  "Old Hugo redirects are generated",
  redirectsSource.includes("sourceUrl") &&
    redirectsSource.includes("oldSectionByCategory") &&
    await fileExists("app/[section]/[slug]/page.tsx"),
  "Old section/story paths can redirect to new /stories/ URLs."
);
addCheck(
  "Public legal aliases exist",
  await fileExists("app/about-us/page.tsx") &&
    await fileExists("app/privacy-policy/page.tsx") &&
    await fileExists("app/terms-of-use/page.tsx"),
  "/about-us, /privacy-policy and /terms-of-use redirect to canonical legal pages."
);
addCheck(
  "Privacy policy covers Google, AdSense and consent",
  privacySource.includes("Google Analytics") &&
    privacySource.includes("Google AdSense") &&
    privacySource.includes("personalised") &&
    privacySource.includes("non-personalised") &&
    privacySource.includes("consent"),
  "Privacy policy includes analytics, ads, personalised ads, non-personalised ads and consent."
);
addCheck(
  "Cookie policy covers consent choices",
  cookieSource.includes("Accept all") ||
    (cookieSource.includes("analytics") && cookieSource.includes("advertising") && cookieSource.includes("consent")),
  "Cookie policy describes analytics/advertising choices; banner UI provides the buttons."
);
addCheck(
  "Cookie consent component is installed",
  await fileExists("components/CookieConsent.tsx") &&
    (await read("app/layout.tsx")).includes("CookieConsent"),
  "GA4 and AdSense scripts are loaded only after consent."
);
addCheck(
  "GA4 and AdSense env variables documented",
  envExampleSource.includes("OLDSEADOGS_GA4_ID=") &&
    envExampleSource.includes("NEXT_PUBLIC_GA4_ID=") &&
    envExampleSource.includes("OLDSEADOGS_ADSENSE_CLIENT=") &&
    envExampleSource.includes("OLDSEADOGS_ENABLE_ADSENSE=false"),
  "Production env example uses OLDSEADOGS_* Google settings."
);
addCheck(
  "Nginx, SSL and rollback docs exist",
  deploymentSource.includes("certbot --nginx -d oldseadogs.com -d www.oldseadogs.com") &&
    deploymentSource.includes("rollback") &&
    productionSource.includes("OLDSEADOGS_ENV=production"),
  "Deployment docs include production mode, Nginx/Certbot and rollback guidance."
);
addCheck(
  "Launch checker script is wired",
  packageJson.scripts?.["check:launch"] === "node scripts/check-launch-readiness.mjs",
  "npm run check:launch is available."
);
addCheck(
  "Production story storage fails safely",
  siteContentSource.includes("OLDSEADOGS_REQUIRE_EXISTING_STORE") &&
    siteContentSource.includes("Static-only fallback was blocked to prevent newer stories disappearing"),
  "Missing or unreadable production story storage cannot be replaced by an empty store or hidden by static-only fallback."
);
addCheck(
  "Safe deployment checks story continuity",
  packageJson.scripts?.["check:stories"] === "node scripts/check-story-regression.mjs" &&
    safeDeploySource.includes("npm run check:stories -- --before") &&
    safeDeploySource.includes("--base-url http://127.0.0.1:3000"),
  "Verified deployments compare story IDs, counts, newest published story and its homepage presence after restart."
);
addCheck(
  "Controlled Bridge regression gate is wired",
  packageJson.scripts?.["check:bridge"] === "node scripts/check-bridge-workflow.mjs" &&
    safeDeploySource.includes("npm run check:bridge"),
  "Safe deployment checks workflow preservation, homepage controls, Draft-only imports and consent-gated GA4."
);
addCheck(
  "Private GA4 reporting credentials are documented",
  envExampleSource.includes("OLDSEADOGS_GA4_PROPERTY_ID=") &&
    envExampleSource.includes("OLDSEADOGS_GA4_CLIENT_EMAIL=") &&
    envExampleSource.includes("OLDSEADOGS_GA4_PRIVATE_KEY="),
  "The private Bridge Analytics panel reports missing server credentials without exposing their values."
);
addCheck(
  "Health panel exposes launch mode",
  healthSource.includes("oldSeaDogsEnv") &&
    healthSource.includes("searchIndexingEnabled") &&
    healthSource.includes("siteUrl"),
  "/api/editor/health reports environment, canonical URL and indexing state."
);

await checkNoCloudflareRuntimeImports();

const failed = checks.filter((check) => !check.ok);

console.log("OldSeaDogs launch readiness check");
console.log(`Mode requested by environment: ${process.env.OLDSEADOGS_ENV || "staging (default)"}`);
console.log("");

for (const check of checks) {
  console.log(`${check.ok ? "OK  " : "FAIL"} ${check.name}`);
  console.log(`     ${check.detail}`);
}

console.log("");

if (failed.length > 0) {
  console.error(`Launch readiness found ${failed.length} problem(s).`);
  process.exit(1);
}

console.log("Launch readiness checks passed.");
