# OldSeaDogs Local Development Environment

This document describes the local OldSeaDogs v2 development environment. It is
not the public/live website and must not be used to deploy or update
oldseadogs.com.

## Main Commands

```bash
./start_dev.sh
./check_dev.sh
./stop_dev.sh
```

The underlying app command is:

```bash
npm run dev
```

This normal command uses local editor data and does not enable any homepage
fixture. If the Mac has no saved local story records and a production-style
preview is specifically needed, use the explicit fallback command:

```bash
npm run dev:fixture
```

The fallback is development-only, stale by design, and is never a statement of
what is currently live. It activates only when the explicit command is used and
the selected local editor data source contains no saved story records. The
private health endpoint reports `homepageDataSource: development-only-fixture`
when it is active.

That runs:

```bash
node scripts/patch-cloudflare-vite-runner.mjs && vinext dev --hostname 0.0.0.0 --port 3000
```

## Local URLs

- Development site: http://localhost:3000/
- Editor: http://localhost:3000/editor
- Private editor API: http://localhost:3000/api/editor
- Private health check: http://localhost:3000/api/editor/health

## Services

All editor-related services run inside the same local vinext development server.
There are not separate database, scraper, email, or media daemons to start.

### Development Site

The public-facing local site is served by the vinext app on port `3000`.

### Editor

The private editor is served at `/editor`. It talks to `/api/editor` for saving
stories, photos, adverts, settings, source-review items, and press-release
review items.

### Database

The editor uses the local Cloudflare D1 binding named `DB`, declared in:

```bash
.openai/hosting.json
vite.config.ts
db/schema.ts
db/index.ts
```

Schema setup is handled by the app when editor data is loaded.

### Media And Image Uploads

Image uploads go through `/api/editor` as multipart form data.

For local development, uploaded files are written to:

```bash
public/uploads
```

The editor also stores media metadata in the database. Hosted storage can use the
`MEDIA` R2 binding, but local development should work without publishing.

### Scraper And Rewrite Review

Manual source checking is configured in:

```bash
content/source-watch.ts
lib/source-watch-runner.ts
```

The editor action is `checkSources`. It creates review drafts only; it must not
publish stories automatically.

### Email Press Release Import

Press-release review tools live in:

```bash
lib/press-release-utils.ts
lib/site-content.ts
app/editor/EditorDashboard.tsx
```

Email items are stored in the editor database and must be reviewed before being
saved as story drafts or published.

### Review And Approval Workflow

Stories from source watch or press-release tools stay as drafts/review items
until approved. Pre-publish checks block internal notes, prompt wording,
source-scraping language, duplicate paragraphs, and thin generated stories.

### Ad Management

Advert records are managed through the editor and stored in the database. The
homepage and article pages read active adverts from the local editor data.

### Ports And Clubs Management

Ports and Clubs are story records in the `Ports` and `Clubs` categories. The
editor can update their title, body, photos, credits, status, and feature
rotation settings.

## Safety Rules

Do not run deployment, publishing, upload, sync, or DNS commands from this local
environment unless explicitly preparing a separate release.

Do not run:

```bash
publish.sh
publish_sites.sh
update_sites.sh
deploy
wrangler deploy
```

Use the local scripts only:

```bash
./start_dev.sh
./check_dev.sh
./stop_dev.sh
```
