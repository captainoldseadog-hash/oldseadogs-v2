# Release plan: 1 October 2026 candidate

This note is for the owner. It describes the draft release on branch `release/2026-10-01-candidate`. It is not a go-ahead to change the live site.

Every command below that runs on the Droplet, reads live files, or changes Cloudflare is marked **REQUIRES OWNER APPROVAL**. Do not run those commands until you have decided to go ahead. Nothing in this plan should be run against production from a helper machine without that decision.

The live site stays on commit `6ce0718c6d3de4bbfe8c43ea4bebccdbe05f8508` until you switch it. Do not use, merge, or deploy branch `main`.

## What this release contains

Four draft changes, merged on top of the live production commit, with their history kept:

1. Guide buttons. “Send Guide feedback” and “Official marina information” use dark harbour text on a white button, so they can be read on the pale guide panels.
2. Small HTML fixes. `/favicon.ico` is the existing brand mark. The homepage has one main heading. If a picture’s stored description is only a file name, the public page uses the caption, then the title. The stored Helm fields are not rewritten.
3. Newsletter. A Substack sign-up sits on the homepage and at the bottom of Marina and Harbour guides. The footer and social page link to https://oldseadogs1.substack.com. The off-topic aNewFN investor advert is hidden in the two homepage slots where it was repeated. Any other advert in those slots still shows.
4. Caching and lighter pictures. Anonymous public HTML can be cached for a short time. Editor, API, preview, form posts, and requests that already carry an Old Sea Dogs cookie are marked private and not stored. Guide and story pictures can be served as smaller WebP files from `/img/{width}/`. The original uploaded files are not replaced.

## What this release must not change

- Do not replace `/var/www/oldseadogs-data/editor-store.json`.
- Do not replace `/var/www/oldseadogs-data/media`.
- Do not copy a local or git copy of stories, guides, or uploads onto the Droplet.
- Do not run a full site build (`npm run build:do`) on the Droplet.
- Do not point this release at branch `main`.

## Documents and scripts this plan follows

Use these:

- `deploy/release-deploy.sh` and `deploy/release-common.sh` put a finished package in a new folder under `/var/www/oldseadogs/releases`, then point `/var/www/oldseadogs/current` at it and restart PM2 process `oldseadogs-web`.
- `deploy/release-rollback.sh` switches back to an older release folder and restarts that same PM2 process.
- `BACKUP_RUNBOOK.md` is the backup to take before a deploy: `npm run backup:create` and `npm run backup:verify`.
- `npm run build:do` is the DigitalOcean build. It is run off the Droplet.
- `lib/generated-build-info.ts` records the git commit that was built. `scripts/write-build-info.mjs` writes a 12-character commit id. For the live site that id is `6ce0718c6d3d`.
- `lib/image-derivatives.ts` is where the picture cache path comes from.

Do not use these for this release:

- `npm run deploy:safe` and `npm run rollback`. `SAFE_DEPLOYMENT.md` says that rsync process is historical and must not be used for new production package deployments.
- `BACKUP.md` shows an older `ln -sfn` plus `pm2 reload` example. The release scripts do the switch and the PM2 restart themselves. Follow the scripts, not that older example.
- The files `scripts/create-*-package.mjs`. Each one is hardcoded to an older release name. Do not run them for this candidate.

`SAFE_DEPLOYMENT.md` points at `RELEASE_DEPLOYMENT.md`. That file is not in the repository. Where this plan cannot quote a documented step, it says so.

## 1. Pre-flight, before any new code is switched on

Do this on the Droplet as the account that already runs PM2. Older notes call that account `oldseadogs`. If `pm2 status` does not list `oldseadogs-web` for the account you are using, stop.

**REQUIRES OWNER APPROVAL**

```bash
pm2 status
readlink -f /var/www/oldseadogs/current
test -L /var/www/oldseadogs/current && echo "current is a symlink"
test -x /var/www/oldseadogs/current/node_modules/.bin/vinext && echo "current release can start on its own"
test -r /var/www/oldseadogs-data/editor-store.json && echo "editor store is readable"
test -r /etc/oldseadogs/oldseadogs.env && echo "env file is readable"
```

Write down the folder name printed by `readlink`. That folder is the live release. You will need that exact name for rollback. `release-rollback.sh` rolls back by folder name, not by git commit.

Confirm the live build is the 30 September production commit. The build file stores the first 12 characters of the commit:

**REQUIRES OWNER APPROVAL**

```bash
grep gitCommit /var/www/oldseadogs/current/lib/generated-build-info.ts
```

You want `6ce0718c6d3d`. That is the start of `6ce0718c6d3de4bbfe8c43ea4bebccdbe05f8508`. If the file says something else, stop. The repository does not document another way to prove which git commit is inside the live folder.

Also confirm PM2 is not still running the old process name `oldseadogs`. `deploy/release-deploy.sh` stops immediately if a process with that exact name is online. Only `oldseadogs-web` should be the live app.

Take the backup the runbook requires. Run it from the live app directory so you are backing up the server’s data, not a copy on another computer. This creates a new timestamped folder. It does not overwrite the live store or the media folder.

**REQUIRES OWNER APPROVAL**

```bash
cd /var/www/oldseadogs/current
npm run backup:create
npm run backup:verify
```

Write down the new backup path. Do not continue if verify fails.

The deploy script also keeps the current release folder where it is, and it copies `editor-store.json` into `/var/www/Oldseadogsbackups/release-deployments/<release-id>/` before it switches. It does not make a second full copy of the release folder. The repository does not document an extra copy of that folder. The rollback copy is the folder you wrote down from `readlink`.

Stop here if any of these are true:

- `current` is not a symlink into `/var/www/oldseadogs/releases`.
- `node_modules/.bin/vinext` is missing from that folder. The rollback script will refuse a release that cannot start on its own, and the repository does not document a different rollback.
- The editor store backup did not verify.

## 2. Build the package off the Droplet

On a computer that is not the Droplet, with Node 22.13 or newer:

```bash
git fetch origin release/2026-10-01-candidate
git checkout release/2026-10-01-candidate
npm ci
npm run build:do
```

`npm run build:do` deletes `dist`, writes `lib/generated-build-info.ts`, builds, and checks that the server bundle has no Cloudflare worker imports. This is the build. Do not run it on the Droplet.

There is no packaging command in `package.json` for this release. The older `scripts/create-*-package.mjs` files show the shape the deploy script accepts, but they are tied to old release names. A valid package is a `.tar.gz` with exactly one top folder. `deploy/release-deploy.sh` refuses the archive unless that folder contains:

- `package.json`
- `package-lock.json`
- `ecosystem.config.cjs`
- `dist` and `dist/server/index.js`
- `public`
- `scripts`
- `lib/generated-build-info.ts`
- `SHA256SUMS` (one checksum line per file inside the folder)

The script also refuses the archive if it contains `editor-store.json`, a `.env` file, `node_modules`, `.git`, a log, or a nested `.tar.gz`. Do not put the Helm store or uploaded media in the package.

The script then wants a second small file, next to the archive, whose line is the SHA-256 of the `.tar.gz` and the archive’s file name. The older package scripts write that as `<archive>.sha256`.

The repository does not contain a finished command that builds this particular archive. Do not invent extra files to satisfy the script. Match the checks in `deploy/release-deploy.sh`.

## 3. Put the package on the Droplet as a new release

The repository does not document the copy onto the Droplet. `deploy/release-deploy.sh` expects the archive and the checksum file to already be on the server. Copy those two files only. Do not rsync the app over `/var/www/oldseadogs`, and do not copy anything into `/var/www/oldseadogs-data`.

**REQUIRES OWNER APPROVAL** for the copy, and for the command below.

Run the deploy script from a copy of this release’s `deploy/` folder, as the PM2 account. Choose a new release id that does not already exist under `/var/www/oldseadogs/releases`. The script refuses if that folder exists. It creates `/var/www/oldseadogs/releases/<release-id>` itself. You do not create or overwrite that folder by hand.

```bash
bash deploy/release-deploy.sh \
  --archive /path/to/the-package.tar.gz \
  --checksum /path/to/the-package.tar.gz.sha256 \
  --release-id 2026-10-01-candidate
```

Use the real paths of the two files you copied. The example id `2026-10-01-candidate` is a name, not a commit. Any other new id that matches the script’s character rule is fine. Write the id down.

What the script does, in order:

1. Checks Node is 22.13 or newer.
2. Stops if PM2 process `oldseadogs` is online.
3. Checks it can read the live editor store and `/etc/oldseadogs/oldseadogs.env`. It does not write the live store.
4. Checks the archive checksum, then unpacks into a hidden staging folder under `/var/www/oldseadogs/releases`.
5. Runs `npm ci --include=dev --no-audit --no-fund` inside that new folder.

This install conflicts with the standing rule not to run `npm ci` on the Droplet. The script has no flag to skip it. It also rejects a package that already contains `node_modules`, so the supported script cannot start the site without this install. It is not `npm run build:do`. The build must already be inside the archive. On a 4 GB Droplet this install is the heavy step. Do not run the script until you accept that install, in the new folder only.

6. Runs `node scripts/check-digitalocean-build.mjs`, `npm run check:bridge`, and `npm run check:controlled-media` in the staged folder.
7. Starts the staged site on port 3099 with a temporary copy of the editor store. It deletes that temporary copy afterwards. It does not write the copy back over the live store.
8. Copies the live `editor-store.json` into `/var/www/Oldseadogsbackups/release-deployments/<release-id>/` and checks the copy.
9. Points `/var/www/oldseadogs/current` at the new folder with `mv -Tf` (an atomic symlink replace).
10. Restarts PM2. If `oldseadogs-web` is already running with this new folder as its working directory, it runs `pm2 startOrReload` on that release’s `ecosystem.config.cjs` with `--only oldseadogs-web --env production --update-env`. If the working directory is different, which it will be on a normal switch, it runs `pm2 delete oldseadogs-web` and then `pm2 start` on the new ecosystem file with the same flags. It does not delete any other PM2 process.
11. Checks that PM2 is online in the new folder and that `http://127.0.0.1:3000/editor` returns HTTP 200.
12. Records the new folder and the previous folder in `/var/www/oldseadogs/shared/`, then runs `pm2 save`.

If the new site fails those last checks, the script points `current` back at the previous folder and starts that folder again.

Do not follow this with `npm ci`, `npm run build:do`, or `pm2 reload` by hand. The script has already done the switch and the restart.

## 4. Picture cache folder

Resized WebP files are written outside the release, so a later code rollback does not delete them, and they are not written beside the originals.

The code uses `OLDSEADOGS_IMAGE_CACHE_DIR` if that variable is set. Otherwise it uses `$OLDSEADOGS_DATA_DIR/cache/image-derivatives`. On the live server the data directory is `/var/www/oldseadogs-data`, so the normal folder is:

```text
/var/www/oldseadogs-data/cache/image-derivatives
```

No deploy script creates this folder. The app will try to create it on the first picture request if the parent directory is writable by the PM2 user. If that write is refused, the picture is still sent, but the next request has to encode it again. The code refuses to use a cache folder inside `public/`, or inside `media/originals`, `media/web`, or `media/thumbnails`.

The repository does not document an owner or a permission mode for this new folder. Create it as the same account that runs `oldseadogs-web`, before visitors hit the new release, and do not change the editor store or the media tree while you do it.

**REQUIRES OWNER APPROVAL**

```bash
mkdir -p /var/www/oldseadogs-data/cache/image-derivatives
test -w /var/www/oldseadogs-data/cache/image-derivatives && echo "picture cache is writable"
```

If the account that runs PM2 cannot write there, stop and fix the owner of that new folder only. Do not chmod the whole data directory, and do not copy anything into `media`.

## 5. Checks after the switch

The deploy script has already checked PM2 and `/editor` on port 3000. These are the extra checks for this release. Run the `curl` commands on the Droplet against `http://127.0.0.1:3000`. That talks to the app directly. A check through `https://oldseadogs.com` goes through Cloudflare, which can change caching headers. Looking at the public site in a browser is still worth doing for the words and the buttons.

**REQUIRES OWNER APPROVAL**

| What to open | What you should see |
| --- | --- |
| `http://127.0.0.1:3000/favicon.ico` and https://oldseadogs.com/favicon.ico | HTTP 200 and content type `image/x-icon`. The brand mark, not a broken image. |
| https://oldseadogs.com/ | One main heading, “Old Sea Dogs”. A newsletter block titled “Letters from the water”, with “Subscribe on Substack” linking to https://oldseadogs1.substack.com/subscribe. The repeated aNewFN investor advert is not shown. Story pictures still load. |
| https://oldseadogs.com/guides/solent/hamble-point-marina | The guide loads. Near the verified facilities, “Official marina information” is dark text on a white button. Near the bottom, “Send Guide feedback” is the same. Under that, a newsletter block titled “New marina guides, berth notes and stories”. The large hero is served from a path starting `/img/` and the response type is `image/webp`. |
| https://oldseadogs.com/social | A Substack entry for @oldseadogs1. |
| Footer of a public page | A Substack link to https://oldseadogs1.substack.com. |
| https://oldseadogs.com/editor | The editor still asks you to sign in. It must not be cached for the public. |
| A normal story page, for example the current lead story | The story is still there. Pictures load. This confirms the Helm store was left in place. |

Header checks from the Droplet. Anonymous HTML needs `Accept: text/html`.

**REQUIRES OWNER APPROVAL**

```bash
curl -sI -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' http://127.0.0.1:3000/ | grep -i -E 'HTTP/|cache-control|cdn-cache-control'
curl -sI -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' http://127.0.0.1:3000/editor | grep -i -E 'HTTP/|cache-control|cdn-cache-control'
curl -sI http://127.0.0.1:3000/api/editor/health | grep -i -E 'HTTP/|cache-control|cdn-cache-control'
curl -sI -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' 'http://127.0.0.1:3000/?preview=1' | grep -i -E 'HTTP/|cache-control|cdn-cache-control'
curl -sI -X POST -H 'Accept: text/html' http://127.0.0.1:3000/ | grep -i -E 'HTTP/|cache-control|cdn-cache-control'
curl -sI -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' -H 'Cookie: oldseadogs_cookie_consent_v2=1' http://127.0.0.1:3000/ | grep -i -E 'HTTP/|cache-control|cdn-cache-control'
curl -sI http://127.0.0.1:3000/favicon.ico | grep -i -E 'HTTP/|content-type'
```

The homepage line should include `public, max-age=60, s-maxage=120, stale-while-revalidate=300` and a CDN header `public, max-age=120, stale-while-revalidate=300`.

The editor, API, preview, POST, and cookie lines should include `private, no-store`.

The favicon line should include `200` and `image/x-icon`.

Then confirm the live store was not replaced. The backup from step 1 and the file now on disk should be the same story file you started with, plus any Helm edit you made yourself during the check. The deploy script does not write that file.

**REQUIRES OWNER APPROVAL**

```bash
pm2 describe oldseadogs-web | sed -n '1,40p'
readlink -f /var/www/oldseadogs/current
```

The working directory and `current` should both be the new release folder. The previous folder should still be on disk.

Until the optional Cloudflare step below, anonymous HTML may still show `cf-cache-status: DYNAMIC` at https://oldseadogs.com even though the Droplet is sending public cache headers. That is expected. Cloudflare does not cache ordinary HTML unless a cache rule says so.

## 6. Rollback to the 6ce0718 release

Use this if the new site is wrong. It does not restore stories or media. It only points the site back at the release folder you wrote down, then restarts PM2 the same way the deploy script does.

The new deploy writes the previous folder into `/var/www/oldseadogs/shared/previous-release`. Running the rollback script with no extra name uses that record. To name the 30 September folder yourself, use the folder name from step 1, not the git commit.

**REQUIRES OWNER APPROVAL**

```bash
bash deploy/release-rollback.sh --release THE_FOLDER_NAME_YOU_WROTE_DOWN
```

That folder name is the last part of the `readlink` path, the directory under `/var/www/oldseadogs/releases/`. The script checks the folder is inside `releases`, checks it can start on its own, switches `current` with the same atomic rename, then `pm2 delete` plus `pm2 start` or `pm2 startOrReload` for `oldseadogs-web`, then `pm2 save`. If the old release fails its health check, the script switches back to whatever was current when you started the rollback.

After it finishes, `grep gitCommit` on `current/lib/generated-build-info.ts` should again show `6ce0718c6d3d`, and the homepage should be the site you had before this release.

Do not delete the new release folder as part of rollback. The script leaves it in place.

The repository does not document a rollback for the case where the 30 September folder has no `node_modules/.bin/vinext`. Do not improvise an install on the Droplet to make rollback work. That is the situation the pre-flight test is there to catch.

## 7. Optional later step: Cloudflare cache rules

Do this only after the site switch looks right, and only if you want Cloudflare to store anonymous HTML. It is not part of `release-deploy.sh`. No code change does this. The recommendations are the ones from the caching work, matched to `lib/public-cache-policy.ts`.

**REQUIRES OWNER APPROVAL** for every Cloudflare change. Do not enable a zone-wide “cache everything” setting.

1. HTML is not in Cloudflare’s default list of cacheable file types. Add a Cache Rule that caches GET and HEAD responses whose content type is `text/html`. Bypass `/editor`, `/api` (the media responses can stay cached), paths ending in `.rsc`, preview queries, the `oldseadogs_editor_staging` cookie, and requests that carry `RSC`, `Next-Router-Prefetch`, or `Next-Router-Segment-Prefetch`. Include those headers in the cache key if they are not bypassed. Do not cache 5xx responses.
2. Leave the edge TTL respecting the origin. The `CDN-Cache-Control` header is the one that keeps stale-while-revalidate. An `s-maxage` value on `Cache-Control` turns that off at Cloudflare.
3. Set Browser Cache TTL to “Respect Existing Headers”. Live images are currently rewritten by Cloudflare to `public, max-age=14400, must-revalidate`, and `must-revalidate` turns off stale-while-revalidate.
4. `/api/media/:id` has no file extension, so Cloudflare does not cache it by default. `/img/…png` ends in `.png` and can be stored. Add an explicit rule for `/api/media/*` and `/img/*` that respects the origin headers and ignores cookies.
5. Cloudflare Polish or Image Resizing can add AVIF at the edge. Avoid `no-transform` if you want Polish.
6. A cache key that ignores cookies will serve the anonymous page to a visitor who already has a consent cookie. That page does not contain their choice. Bypassing the cache for the consent cookie would send returning visitors back to the Droplet every time.
7. Do not make Cloudflare “respect” the long `Vary` list unless the cache key also includes the RSC and router headers. The HTML address stays HTML.

After this optional step, an anonymous homepage request can be served from Cloudflare for about 120 seconds, and then reused while a refresh happens for up to 300 seconds. `/editor` stays uncached. The Helm store is still read on the Droplet whenever a page is actually rendered.

## Open points

- `RELEASE_DEPLOYMENT.md` is named in `SAFE_DEPLOYMENT.md` and is missing from the repo.
- There is no current packaging script for this candidate. Section 2 lists the checks the deploy script enforces.
- The repo does not document how to copy the archive onto the Droplet, or the owner and mode of the new picture-cache folder.
- `deploy/release-deploy.sh` runs `npm ci` in the new release folder. That is the supported promotion path, and it disagrees with the rule against installs on the Droplet. There is no documented alternative that still uses this script.
- Do not merge this candidate, and do not restart PM2, until you have approved it.
