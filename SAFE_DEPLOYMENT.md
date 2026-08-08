# OldSeaDogs Safe Deployment

> **Production release packages:** use [RELEASE_DEPLOYMENT.md](./RELEASE_DEPLOYMENT.md). The release-directory process stages and verifies a complete runtime before an atomic `current` switch and retains an offline rollback release. The in-place rsync process below is retained for historical reference and must not be used for new production package deployments.

The live story data directory must never be overwritten by local, empty or stale data.

Live runtime data is outside the app:

- `/var/www/oldseadogs-data/editor-store.json`
- `/var/www/oldseadogs-data/media`

Backups are written outside the app:

- `/var/www/Oldseadogsbackups`
- existing backups under `/var/www/oldseadogs-backups` remain readable for restore/list compatibility

## Safe Deploy Command

Run from the permanent local workspace:

```bash
npm run deploy:safe -- --target root@161.35.168.184:/var/www/oldseadogs
```

Without `--apply`, this performs a dry run only.

To deploy after reviewing the dry run:

```bash
npm run deploy:safe -- --target root@161.35.168.184:/var/www/oldseadogs --apply
```

## What Safe Deploy Does

`deploy:safe` refuses to deploy if local runtime data is present in the source tree.

It excludes runtime data from rsync:

- `--exclude=.oldseadogs-data`
- `--exclude=.oldseadogs-data/***`
- `--exclude=oldseadogs-data`
- `--exclude=oldseadogs-data/***`
- `--exclude=/var/www/oldseadogs-data`
- `--exclude=/var/www/oldseadogs-data/***`
- `--exclude=var/www/oldseadogs-data`
- `--exclude=var/www/oldseadogs-data/***`
- `--exclude=editor-store.json`
- `--exclude=*.backup-*`

When `--apply` is used, it:

1. copies the operations script to the server temp directory
2. creates a timestamped server backup in `/var/www/Oldseadogsbackups`
3. verifies the backup SHA256 manifest
4. creates an app-code snapshot under `/var/www/Oldseadogsbackups/app-snapshots`
5. runs an rsync dry run and refuses if runtime data appears
6. runs rsync to `/var/www/oldseadogs`
7. runs server checks/build
8. reloads PM2 process `oldseadogs`
9. writes `deploy-history.jsonl`

## Required Server Setup

The server needs:

- Node 22+
- npm
- rsync
- pm2
- SSH access for the deploy user
- writable `/var/www/Oldseadogsbackups`
- writable `/var/www/oldseadogs`
- readable `/var/www/oldseadogs-data`

The backup directory should be private:

```bash
sudo mkdir -p /var/www/Oldseadogsbackups /var/www/oldseadogs-backups
sudo chown oldseadogs:oldseadogs /var/www/Oldseadogsbackups /var/www/oldseadogs-backups
sudo chmod 700 /var/www/Oldseadogsbackups /var/www/oldseadogs-backups
```

## Deployment History

## Google Analytics / GA4

Add the GA4 Measurement ID to the private server environment file, normally:

```bash
OLDSEADOGS_GA4_ID=G-88HT8MHR7T
NEXT_PUBLIC_GA4_ID=G-88HT8MHR7T
```

Use measurement ID `G-88HT8MHR7T`. `OLDSEADOGS_GA4_ID` is used by the Node runtime and `NEXT_PUBLIC_GA4_ID` remains supported for compatible public-build environments. The application also carries this public measurement ID as its safe build default.

Verification after restart:

- View a public page source: `G-88HT8MHR7T` and the `oldseadogs-google-consent-default` bootstrap should appear once.
- Open `/editor`: GA4 must not load on editor/admin pages.
- Before a choice, Consent Mode must report `analytics_storage: denied` and no GA4 network script or request should load.
- Reject analytics cookies: GA4 must remain unloaded and analytics storage must remain denied.
- Accept analytics cookies: consent must update to granted and the single `oldseadogs-ga4` script should load once.
- Navigate between public pages: one manual `page_view` should be sent per pathname, with query strings omitted.
- Withdraw analytics consent through the footer: consent must update to denied, future page views must stop, and accessible `_ga` cookies must be removed.
- Confirm AdSense settings still follow their own `OLDSEADOGS_ENABLE_ADSENSE` and consent controls.

List deployment history:

```bash
npm run deploy:history
```

Each successful safe deploy records:

- deployment ID
- app target
- verified data backup
- app snapshot path
- PM2 process name
- deploy timestamp

## Rollback Plan

Plan the latest app rollback:

```bash
npm run rollback
```

Plan a specific rollback:

```bash
npm run rollback -- --deployment deploy-YYYYMMDD-HHMMSS
```

Apply an app-code rollback only after approval:

```bash
npm run rollback -- --deployment deploy-YYYYMMDD-HHMMSS --apply --confirm-rollback --restart
```

Rollback does not restore story data. If story data also needs recovery, first run:

```bash
npm run restore:plan -- --backup /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-manual
```

Then apply only after approval.

## Automatic Story Regression Gate

After PM2 restarts, safe deployment compares the verified pre-deployment `editor-store.json` with `/var/www/oldseadogs-data/editor-store.json`. It requires the same story IDs and counts, the same published-story count and newest published story, and confirms that newest published story is linked from the local homepage. The deployment is not recorded as successful if any part fails.

The server build also runs `npm run check:bridge` before replacement is accepted. This checks published/scheduled status preservation, homepage Lead/Latest/Editor’s Choice safeguards, Draft-only email/scrape conversion, duplicate prevention and the GA4 privacy boundary.
