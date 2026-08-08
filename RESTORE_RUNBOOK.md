# OldSeaDogs Restore Runbook

Restores are deliberately two-step:

1. Plan the restore.
2. Apply only after the plan has been reviewed and explicitly approved.

Do not run `restore:apply` during investigation. Do not restore story data without approval.

Backups are never restored automatically. `npm run backup:stories`, application startup and deployment checks only create or verify backups; they do not replace the live store.

## Plan A Restore

Plan from the latest backup:

```bash
npm run restore:plan
```

Plan from a specific backup:

```bash
npm run restore:plan -- --backup /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-manual
```

Write a plan file under `/var/www/Oldseadogsbackups/restore-plans`:

```bash
npm run restore:plan -- --backup /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-manual --write-plan
```

The plan verifies the backup, compares current and backup story counts where possible, and lists exactly what would be replaced.

## Recover One Story Or Email For Review

For investigation or manual recovery, inspect the readable backup copies first. This does not alter the live site:

```bash
ls /var/www/Oldseadogsbackups/stories/YYYYMMDD-HHMMSS-label
ls /var/www/Oldseadogsbackups/emails/YYYYMMDD-HHMMSS-label
```

Story recovery files are JSON records with the story body, status, schedule, tags, lead image/video fields, homepage flags and `/api/media/...` references. Email recovery files include the original EML text, parsed JSON, attachment metadata and an import log. Use these files to compare or manually re-enter content in The Bridge. Do not copy them over the live store unless a restore plan has been reviewed and approved.

To verify a readable backup package before using it:

```bash
npm run backup:verify -- --backup /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-label
```

## Apply A Restore

Only run this after approval:

```bash
npm run restore:apply -- --backup /var/www/Oldseadogsbackups/YYYYMMDD-HHMMSS-manual --confirm-restore
```

`restore:apply` does the following:

- verifies the selected backup first
- creates a fresh pre-restore backup
- replaces `editor-store.json` atomically
- replaces `media/` through a staging directory
- preserves the previous media folder as `media.pre-restore-YYYYMMDD-HHMMSS`
- writes `restore-history.jsonl`

Private config is not restored automatically. Review `private-config/` manually if configuration recovery is needed.

## After Restore

Run:

```bash
npm run check:storage -- --store /var/www/oldseadogs-data/editor-store.json
npm run check:data -- --store /var/www/oldseadogs-data/editor-store.json --base-url https://oldseadogs.com
pm2 reload oldseadogs --update-env
```

Then verify:

- homepage loads
- recent stories are present
- editor opens
- story pages open
- uploaded images load through `/api/media/...`

## Rollback Versus Restore

Use `rollback` for app-code rollback from a safe deployment snapshot.

Use `restore:plan` and `restore:apply` for story/media data restore.

These are separate on purpose. A bad app deploy should not automatically roll back story data.
