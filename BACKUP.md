# OldSeaDogs Backup and Recovery Plan

This plan is for the proposed DigitalOcean production setup. It should be tested on staging before launch.

## What Must Be Backed Up

Source code:

- GitHub repository.
- Release archives used for deployment.

Database:

- Stories.
- Editor changes.
- Drafts and approval state.
- Media metadata.
- Advert records.
- Site settings.
- Press-release review queue.
- Blocked sender records.

Media:

- Uploaded article photos.
- Sponsor/ad images.
- Migrated legacy photos.
- Any image credits and captions stored with records.

Server configuration:

- Nginx site files.
- PM2 config.
- Private environment file.
- Editor password file.
- SSL certificates can be regenerated, but renewal status should be monitored.

## Recommended DigitalOcean Backup Strategy

Staging:

- Enable weekly Droplet backups.
- Keep GitHub as the main source backup.
- Export editor data before destructive tests.

Production:

- Enable weekly Droplet backups.
- Use Managed PostgreSQL backups plus scheduled `pg_dump` exports.
- Use Spaces for media, not the Droplet disk.
- Enable Spaces versioning or lifecycle protection where practical.
- Keep at least 30 days of database exports.
- Keep at least one monthly off-platform backup.

## Database Backup Commands

After PostgreSQL migration, run:

```bash
mkdir -p /var/backups/oldseadogs/postgres
pg_dump "$DATABASE_URL" | gzip > "/var/backups/oldseadogs/postgres/oldseadogs-$(date +%F-%H%M).sql.gz"
```

Restore to staging first:

```bash
gunzip -c /var/backups/oldseadogs/postgres/oldseadogs-YYYY-MM-DD-HHMM.sql.gz | psql "$STAGING_DATABASE_URL"
```

Only restore production after confirming the staging restore is sound.

## Media Backup Commands

For DigitalOcean Spaces, use an S3-compatible sync tool such as `awscli` or `rclone`.

Example with `awscli`:

```bash
aws --endpoint-url "$SPACES_ENDPOINT" s3 sync "s3://$SPACES_BUCKET" "/var/backups/oldseadogs/spaces/$SPACES_BUCKET"
```

Example restore to staging:

```bash
aws --endpoint-url "$SPACES_ENDPOINT" s3 sync "/var/backups/oldseadogs/spaces/$SPACES_BUCKET" "s3://$STAGING_SPACES_BUCKET"
```

## Current Local Media Note

The development site currently stores local uploads in:

```text
public/uploads
```

This is fine for local development and emergency export, but it is not the recommended final production store. Production uploads should go to Spaces.

## Release Rollback

Use release directories in production:

```text
/var/www/oldseadogs/releases/2026-06-16-1200
/var/www/oldseadogs/current -> /var/www/oldseadogs/releases/2026-06-16-1200
```

Rollback:

```bash
sudo -iu oldseadogs
cd /var/www/oldseadogs
ln -sfn releases/PREVIOUS_RELEASE current
cd current
pm2 reload oldseadogs-web --update-env
```

## Recovery Scenarios

Bad code deploy:

1. Switch `current` symlink to previous release.
2. Reload PM2.
3. Check homepage, editor and search.

Bad content edit:

1. Restore affected database rows from the latest backup to staging.
2. Confirm the article/editor state.
3. Restore the affected rows to production.

Deleted image:

1. Restore from Spaces version/history or media backup.
2. Confirm the media record URL still works.
3. Reload affected page.

Server loss:

1. Create new Droplet.
2. Install Node, Nginx, PM2.
3. Clone source from GitHub.
4. Restore private env file and editor password file.
5. Restore database and media.
6. Start PM2.
7. Repoint staging DNS first.
8. Only touch production DNS after verification.

## Backup Test Schedule

- Weekly: confirm latest database backup exists.
- Monthly: restore backup to staging and open the editor.
- Before every go-live or large migration: create database export, media sync and source archive.
- Before DNS cutover: confirm rollback path works without needing the old developer machine.
