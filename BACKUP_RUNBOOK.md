# OldSeaDogs Backup Runbook

Phase 1 backup tooling protects the current DigitalOcean file-store setup:

- Live data: `/var/www/oldseadogs-data`
- Story store: `/var/www/oldseadogs-data/editor-store.json`
- Media: `/var/www/oldseadogs-data/media`
- Primary backup root: `/var/www/Oldseadogsbackups`
- Legacy-compatible backup root: `/var/www/oldseadogs-backups`

Backups are private operational data. They may contain raw press-release emails, sender details, draft material, image metadata and private environment references.

## Commands

List backups:

```bash
npm run backup:list
```

Create a backup:

```bash
npm run backup:create
```

For the standard story/editor backup command, use:

```bash
npm run backup:stories
```

This command creates a new timestamped directory and refuses to overwrite an existing backup. It includes the full `editor-store.json`, story metadata (Draft, Scheduled, Published and Unpublished), schedules, tags, lead image/video fields, uploaded-media references, homepage feature settings and the media tree.

Verify the latest backup:

```bash
npm run backup:verify
```

Verify a specific backup:

```bash
npm run backup:verify -- --backup /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-manual
```

## What A Backup Contains

Each new backup is written to a timestamped directory under `/var/www/Oldseadogsbackups`. `backup:list`, `backup:verify` and `restore:plan` also remain compatible with existing backups under `/var/www/oldseadogs-backups` unless a specific `--backup-dir` is passed.

The backup root also keeps the operational folders expected on production:

- `app-snapshots/`
- `stories/`
- `media/`
- `editor/`
- `gallery/`
- `instagram/`
- `emails/`
- `exports/`
- `database/`
- `logs/`

Each backup contains:

- `editor-store.json`
- `stories/` readable per-story JSON exports plus `stories/index.json`
- `media/`
- `emails/` readable email recovery package with `original-eml/`, `parsed-json/`, `attachments/` and `import-log.json`
- `story-metadata.json`
- `guide-content.json`
- `homepage-guide-visibility.json`
- `uploaded-media-records.json`
- `gallery-metadata.json` (gallery categories, approval queue, story/boat/marina/club/event associations and Instagram import records)
- `email-imports.json`
- `scraped-story-queue.json`
- `homepage-settings.json`
- `video-metadata.json`
- `private-config/` for readable server config references
- `manifest.json`
- `manifest.sha256`

The full `editor-store.json` remains the source of truth for story data, guide content, story metadata, uploaded media records, captions, credits, copyright, locations, dates taken, gallery records, Instagram imports, email imports, scraped story queue items, homepage settings and video metadata. The backed-up `media/` tree includes originals, web versions and thumbnails. The extra JSON snapshots make that coverage easy to inspect without editing the live store.

The protected `private-config/` copy also includes `instagram-credentials.json` and `instagram-sync-log.json` when present under `OLDSEADOGS_DATA_DIR`. These files remain mode-`0600` inside the mode-`0700` backup and must never be exposed through The Bridge, reports or logs.

Readable story copies are also mirrored under `/var/www/Oldseadogsbackups/stories/<backup-id>/`. Readable email copies are mirrored under `/var/www/Oldseadogsbackups/emails/<backup-id>/`. These mirrors do not duplicate media files; they retain `/api/media/...` references and attachment metadata so a story or imported email can be recovered from the backup directory without rebuilding the public website.

The manifest records each copied file, byte size and SHA256 hash. Verification recalculates hashes, confirms the story store is valid JSON with a `stories` array, and checks the required coverage items are present.

## Private Config

The backup command attempts to copy safe operational references where readable:

- `/etc/oldseadogs/oldseadogs.env`
- `/etc/nginx/sites-available/oldseadogs`
- `/etc/nginx/sites-enabled/oldseadogs`
- `/etc/nginx/oldseadogs.htpasswd`
- `/var/www/oldseadogs/ecosystem.config.cjs`
- `/var/www/oldseadogs/package.json`

Unreadable files are recorded in the manifest `skipped` list. The command must not print private file contents.

## Server Setup

Create the backup directory once on the server:

```bash
sudo mkdir -p /var/www/Oldseadogsbackups /var/www/oldseadogs-backups
sudo chown oldseadogs:oldseadogs /var/www/Oldseadogsbackups /var/www/oldseadogs-backups
sudo chmod 700 /var/www/Oldseadogsbackups /var/www/oldseadogs-backups
```

Confirm the data directory is outside the app deployment directory:

```bash
test -f /var/www/oldseadogs-data/editor-store.json
test -d /var/www/oldseadogs-data/media
```

## Minimum Pre-Deployment Rule

Before any deploy, migration, repair or restore:

```bash
npm run backup:create
npm run backup:verify
```

Do not continue if verification fails.

## Story Continuity Check

After application restart, compare the verified backup with the live store and confirm the newest published story remains on the homepage:

```bash
npm run check:stories -- --before /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-pre-deploy/editor-store.json --after /var/www/oldseadogs-data/editor-store.json --base-url http://127.0.0.1:3000
```

The safe deployment command runs this check automatically. A failure stops deployment completion.

Backups under `/var/www/Oldseadogsbackups` are separate from application releases and the live data directory. Application sync, restart and rollback commands must never delete or prune this directory. Retention cleanup requires a separately approved operation after a verified newer backup exists.

Backup manifest schema 4 also requires `analytics-settings.json`, readable story exports and readable email exports. `story-metadata.json` includes workflow status history, and `homepage-settings.json` includes ordered Lead/Latest/Editor’s Choice/hidden selections. Secret GA4 and inbox credentials remain protected in the private environment configuration copy rather than being exposed in CMS JSON.
