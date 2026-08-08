# OldSeaDogs Production Operations

This file documents the intended DigitalOcean production setup. It is not a go-live command.

## Services That Must Run

Main app:

- Vinext production server on `127.0.0.1:3000`.
- Managed by PM2 using `ecosystem.config.cjs` and `npm run start:do` on DigitalOcean.
- Public traffic handled only by Nginx over HTTPS.

Editor:

- Route: `/editor`.
- API: `/api/editor`.
- Protected by Nginx Basic Auth plus app-level editor email allow-list.
- Usable from desktop and iPhone browsers.

Database:

- Production target: DigitalOcean Managed PostgreSQL.
- Current code state: the shared app no longer imports `cloudflare:workers`, so DigitalOcean Node can start. Database persistence still needs the PostgreSQL adapter before final go-live.

Media:

- Production target: DigitalOcean Spaces.
- Current local development uploads are in `public/uploads`.
- Uploaded images should not rely on the Droplet disk for final production.

Review workflows:

- Scraper/source watch: review-only, no automatic publishing.
- Email press releases: review-only, no automatic publishing.
- Editor approval controls remain the gate before publication.

Advertising:

- Direct sponsor adverts can run through the editor.
- Google AdSense should remain disabled until the site is live, policy-ready and Google approved.

## Environment Variables

Use `deploy/oldseadogs.env.example` as the private server template.

Required at staging:

- `NODE_ENV=production`
- `PORT=3000`
- `OLDSEADOGS_ENV=staging`
- `OLDSEADOGS_SITE_URL=https://staging.oldseadogs.com`
- `NEXT_PUBLIC_SITE_URL=https://staging.oldseadogs.com`
- `NEXT_PUBLIC_ENABLE_DIRECT_ADS=true`
- `OLDSEADOGS_GA4_ID=G-88HT8MHR7T`
- `OLDSEADOGS_ENABLE_ADSENSE=false`
- `OLDSEADOGS_ADSENSE_CLIENT=`
- `OLDSEADOGS_EDITOR_EMAILS=captainoldseadog@gmail.com`
- `OLDSEADOGS_EDITOR_STAGING_SECRET`
- `OLDSEADOGS_EDITOR_STAGING_HOSTS=161.35.168.184,staging.oldseadogs.com`

Required before production go-live:

- `OLDSEADOGS_ENV=production`
- `OLDSEADOGS_GA4_ID=G-88HT8MHR7T`
- `OLDSEADOGS_ENABLE_ADSENSE=false` until Google approval
- `OLDSEADOGS_ADSENSE_CLIENT=`
- canonical public URL: `https://oldseadogs.com`
- `DATABASE_URL`
- `SPACES_ENDPOINT`
- `SPACES_REGION`
- `SPACES_BUCKET`
- `SPACES_ACCESS_KEY_ID`
- `SPACES_SECRET_ACCESS_KEY`
- `UPLOADS_PUBLIC_URL`

AdSense after approval:

- `OLDSEADOGS_ENABLE_ADSENSE=true`
- `OLDSEADOGS_ADSENSE_CLIENT=ca-pub-your-real-id`

## Security Settings

Nginx:

- Force HTTPS.
- Keep app bound to localhost only.
- Set `client_max_body_size 25m` for editor photo uploads.
- Protect `/editor` and `/api/editor` with Basic Auth.
- Clear public spoofed editor identity headers on normal public routes.
- Send the approved editor email header only inside protected editor routes.
- Block dotfiles.

Application:

- Editor routes send `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
- `robots.ts` blocks the whole staging site while `OLDSEADOGS_ENV=staging`.
- `robots.ts` allows public crawling only while `OLDSEADOGS_ENV=production`.
- Production canonical, sitemap, Open Graph and JSON-LD URLs use `https://oldseadogs.com`.
- Sitemap lists public pages only.
- Pre-publish checks block internal workflow phrases.
- DigitalOcean staging editor access uses a private HTTP-only cookie set after entering `OLDSEADOGS_EDITOR_STAGING_SECRET`.

Server:

- SSH keys only where possible.
- UFW firewall: SSH, HTTP and HTTPS only.
- No database port open to the public internet.
- Private environment files mode `600`.
- Regular package updates.

## Logging and Monitoring

PM2 logs:

- `logs/pm2-out.log`
- `logs/pm2-error.log`

Commands:

```bash
pm2 status
pm2 logs oldseadogs-web
pm2 monit
curl -I https://staging.oldseadogs.com/
curl -I https://staging.oldseadogs.com/editor
```

Editor health route:

- `/api/editor/health`
- Must be behind editor auth.
- Checks database, media uploads, source watch, email import settings, review workflow, adverts, ports and clubs.

## Production Content Rules

Public pages must not show:

- Prompt text.
- Scraper notes.
- Internal source-watch wording.
- Draft/review data.
- Debug panels.
- Placeholder copy.
- Thin AI-style filler.

All scraped, emailed or AI-assisted content must:

- Enter the review queue first.
- Be edited/approved before publication.
- Keep source URLs internal unless deliberately disclosed.
- Include image credits where needed.
- Avoid third-party images unless OldSeaDogs has permission.

## Health Checks Before Any Cutover

- `npm run lint`
- `npm run build:do`
- Run a staging crawl.
- Check broken links.
- Check missing images.
- Check `robots.txt`.
- Check sitemap.
- Test editor from iPhone.
- Test image upload.
- Test publish/unpublish/edit.
- Test ad edit/disable.
- Test source-watch review-only flow.
- Test email press-release review-only flow.
- Confirm `OLDSEADOGS_DATA_DIR` is backed up if staging is using the temporary server-side editor store.

## Known Production Blockers

These must be resolved before the DigitalOcean server becomes the official live site:

1. Replace Cloudflare D1 database access with PostgreSQL access or a supported compatibility layer.
2. Replace Cloudflare R2 media access with DigitalOcean Spaces access.
3. Move staging file-store editor data from `OLDSEADOGS_DATA_DIR` into the production database.
4. Create and test a real database/media migration.
5. Run a staging crawl against a reachable staging URL.
6. Confirm editor auth has no local-host bypass in production traffic.

## Cutover Principle

Until a formal go-live decision is made:

- The live `oldseadogs.com` remains production.
- The DigitalOcean deployment remains staging.
- Production DNS is not changed.
- The production Nginx template stays disabled.
