# OldSeaDogs release deployment

This is the procedure for putting a finished release on the production Droplet. It replaces the missing notes that `SAFE_DEPLOYMENT.md` points at.

The Droplet does not install dependencies and does not build the site. You build a package on a Linux x86_64 machine, or in Docker on a Mac, or with the GitHub Actions workflow. That package already contains `node_modules`, including the Linux build of `sharp`. You copy the package to the server and run `deploy/release-deploy.sh`. The script checks the package, starts it on a spare port, then points `/var/www/oldseadogs/current` at the new folder.

Every command that logs into the Droplet, reads live files, or changes Cloudflare is marked **REQUIRES OWNER APPROVAL**.

Do not use `npm run deploy:safe` for this. That older rsync path is historical.

## What the scripts will not do

- They will not run `npm ci`, `npm install`, or `npm run build` on the Droplet in the normal path.
- They will not write `/var/www/oldseadogs-data`, `editor-store.json`, or `media`.
- They will not replace an existing release folder. Pick a new release id.
- They will not switch `current` if the archive checksum, the file list, `vinext`, or `sharp`'s linux-x64 binary is wrong.
- If the new site fails its health check after the switch, the deploy script points `current` back at the previous folder and starts that folder again.
- Rollback never installs packages. It only switches to a release folder that can already start.

`--legacy-server-install` still runs `npm ci` for an old archive that has no `node_modules`. Do not use that flag on the production Droplet.

## What has to be true before a deploy

- Node on the Droplet is 22.13 or newer. The script checks.
- PM2 process `oldseadogs-web` is the live app. If a process named exactly `oldseadogs` is online, the script stops.
- `/var/www/oldseadogs/current` is a symlink into `/var/www/oldseadogs/releases`.
- That current folder contains `node_modules/.bin/vinext`, so it can be started again without installing anything. This is what makes rollback to the 30 September 2026 release (`6ce0718`) possible.
- `/var/www/oldseadogs-data/editor-store.json` and `/etc/oldseadogs/oldseadogs.env` are readable.
- You have a fresh backup from `BACKUP_RUNBOOK.md`.

**REQUIRES OWNER APPROVAL**

```bash
pm2 status
readlink -f /var/www/oldseadogs/current
test -L /var/www/oldseadogs/current && echo "current is a symlink"
test -x /var/www/oldseadogs/current/node_modules/.bin/vinext && echo "current release can start on its own"
test -r /var/www/oldseadogs-data/editor-store.json && echo "editor store is readable"
test -r /etc/oldseadogs/oldseadogs.env && echo "env file is readable"
grep gitCommit /var/www/oldseadogs/current/lib/generated-build-info.ts
cd /var/www/oldseadogs/current
npm run backup:create
npm run backup:verify
```

Write down the folder name from `readlink`. Rollback uses that folder name, not the git commit. For the live site, `gitCommit` in the build file should be `6ce0718c6d3d`.

`npm run backup:create` on the server reads the live store and writes a new backup folder. It is not `npm ci` and it does not rebuild the site. Do not continue if verify fails.

## Build the package off the Droplet

The package must be built where `npm ci` installs Linux binaries. The Droplet is Ubuntu on x86_64 with glibc. A normal `npm ci` on a Mac installs Mac binaries for `sharp`, and the site would fail when it tries to resize pictures.

`vinext` is a devDependency, and PM2 starts the site with `npm run start:do`, which runs `vinext`. The package therefore contains the full `npm ci` tree, not a production-only install. `sharp` must be the `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` packages.

Three files are produced:

- `outputs/<name>.tar.gz` — one top-level folder, the built site, and `node_modules`
- `outputs/<name>.tar.gz.sha256` — the SHA-256 of that archive
- `outputs/<name>.manifest.json` — includes `gitCommit`

The same manifest is inside the archive as `RELEASE_MANIFEST.json`.

### Option A. GitHub Actions

This does not deploy and does not use server credentials.

1. Open the repository on GitHub: `captainoldseadog-hash/oldseadogs-v2`.
2. Click Actions.
3. Click **Build release package**.
4. Click **Run workflow**.
5. Choose the branch that contains this packaging script (`deploy/prebuilt-package`, or `release/2026-10-01-candidate` after this work is merged).
6. When the run is green, download the artifact `oldseadogs-prebuilt-release`.
7. GitHub wraps the artifact in a zip. Unzip it on your Mac. You should see the `.tar.gz`, the `.sha256`, and the `.manifest.json`.

### Option B. Docker on a Mac

From the repository root, with Docker Desktop running:

```bash
git fetch origin deploy/prebuilt-package
git checkout deploy/prebuilt-package
bash deploy/release-package-docker.sh
```

That command starts a `linux/amd64` Debian container, installs git, runs `npm ci` and `npm run build:do` inside the container, and writes the three files into `outputs/` on your Mac. It does not log into the Droplet.

### Option C. A Linux x86_64 machine

On a Linux x86_64 glibc machine (not Alpine, and not the Droplet):

```bash
git fetch origin deploy/prebuilt-package
git checkout deploy/prebuilt-package
npm ci --include=dev --no-audit --no-fund
npm run build:do
npm run package:release
```

`deploy/release-package.sh` refuses to run on macOS. That is intentional.

### Check the package on your Mac before copying it

Open the `.manifest.json` file. `gitCommit` is the full commit that was built. `productionDataIncluded` must be `false`. `platform` must be `linux`, `arch` must be `x64`, and `libc` must be `glibc`.

Confirm the checksum. In the directory that contains the three files:

```bash
shasum -a 256 -c NAME.tar.gz.sha256
```

Use the real file name. `shasum` prints `OK` when the archive matches. This command stays on your Mac.

## Copy the new scripts and the package

The copy of `deploy/release-deploy.sh` inside the live release still runs `npm ci` and rejects `node_modules`. Do not run that copy. Copy the scripts from this branch onto the server, outside the live app and outside the CMS data directory.

The host alias is `oldseadogs-production`.

**REQUIRES OWNER APPROVAL**

```bash
ssh oldseadogs-production 'mkdir -p /var/www/oldseadogs/shared/deploy-tools /var/www/oldseadogs/incoming'
scp deploy/release-common.sh deploy/release-deploy.sh deploy/release-rollback.sh oldseadogs-production:/var/www/oldseadogs/shared/deploy-tools/
scp outputs/NAME.tar.gz outputs/NAME.tar.gz.sha256 oldseadogs-production:/var/www/oldseadogs/incoming/
```

Replace `NAME` with the real file name. The same copy with rsync is:

**REQUIRES OWNER APPROVAL**

```bash
rsync -av --progress deploy/release-common.sh deploy/release-deploy.sh deploy/release-rollback.sh oldseadogs-production:/var/www/oldseadogs/shared/deploy-tools/
rsync -av --progress outputs/NAME.tar.gz outputs/NAME.tar.gz.sha256 oldseadogs-production:/var/www/oldseadogs/incoming/
```

Do not copy the archive into `/var/www/oldseadogs-data`. Do not rsync the repository over `/var/www/oldseadogs` or `/var/www/oldseadogs/current`.

## Picture cache folder

Resized WebP files are stored outside the release so a code rollback does not delete them, and they are not written next to the original uploads.

`lib/image-derivatives.ts` uses `OLDSEADOGS_IMAGE_CACHE_DIR` when that variable is set. Otherwise it uses `$OLDSEADOGS_DATA_DIR/cache/image-derivatives`. On the live server the data directory is `/var/www/oldseadogs-data`, so the folder is:

```text
/var/www/oldseadogs-data/cache/image-derivatives
```

`ecosystem.config.cjs` does not set a Unix user, uid, or gid. It only names the PM2 process `oldseadogs-web`. The setup notes in `DEPLOYMENT.md` create an account called `oldseadogs` and start PM2 as that user. `SAFE_DEPLOYMENT.md` and `BACKUP_RUNBOOK.md` use the same account. Treat `oldseadogs` as the expected owner, then confirm it on the server. If the command below prints a different user, use that user and group instead.

**REQUIRES OWNER APPROVAL**

```bash
ps -o user=,group= -p "$(pm2 pid oldseadogs-web)"
```

When that user is `oldseadogs`, create only the cache folders. `mkdir -p` does not change the mode of `/var/www/oldseadogs-data` if it already exists. The `chown` and `chmod` lines name the cache folders only. They do not change `editor-store.json` or `media`.

**REQUIRES OWNER APPROVAL**

```bash
sudo mkdir -p /var/www/oldseadogs-data/cache/image-derivatives
sudo chown oldseadogs:oldseadogs /var/www/oldseadogs-data/cache /var/www/oldseadogs-data/cache/image-derivatives
sudo chmod 755 /var/www/oldseadogs-data/cache /var/www/oldseadogs-data/cache/image-derivatives
sudo -u oldseadogs test -w /var/www/oldseadogs-data/cache/image-derivatives && echo "picture cache is writable"
```

Mode `755` lets the owner create files. Do not use `777`. Do not chmod `/var/www/oldseadogs-data` itself. The app still serves the original picture if this folder is not writable, but it will resize that picture again on the next request.

## Rehearse, then deploy

A dry run checks the checksum, unpacks into a temporary staging folder, checks `vinext` and `sharp`, and deletes that staging folder. It does not switch `current`, does not restart PM2, and does not run `npm ci`. It does read the live editor store and the env file, so it still needs approval.

**REQUIRES OWNER APPROVAL**

```bash
ssh oldseadogs-production
bash /var/www/oldseadogs/shared/deploy-tools/release-deploy.sh \
  --dry-run \
  --archive /var/www/oldseadogs/incoming/NAME.tar.gz \
  --checksum /var/www/oldseadogs/incoming/NAME.tar.gz.sha256 \
  --release-id 2026-10-01-candidate
```

The script prints `npm ci was not run` and `Nothing was promoted` when the rehearsal passes. If it says it is going to run `npm ci`, you are on the old script. Stop.

The real deploy uses the same command without `--dry-run`.

**REQUIRES OWNER APPROVAL**

```bash
bash /var/www/oldseadogs/shared/deploy-tools/release-deploy.sh \
  --archive /var/www/oldseadogs/incoming/NAME.tar.gz \
  --checksum /var/www/oldseadogs/incoming/NAME.tar.gz.sha256 \
  --release-id 2026-10-01-candidate
```

Run it as the account that already owns PM2. What it does, in order:

1. Checks Node is 22.13 or newer.
2. Stops if PM2 process `oldseadogs` is online.
3. Checks it can read the live editor store and `/etc/oldseadogs/oldseadogs.env`. It records the store checksum and later refuses to finish if that file changed.
4. Checks the archive checksum and refuses unsafe paths.
5. Unpacks into a hidden staging folder under `/var/www/oldseadogs/releases`. It refuses if the release id already exists.
6. Checks `SHA256SUMS`, then refuses CMS data, `.env` files, logs, nested archives, and `.git`.
7. Reads `RELEASE_MANIFEST.json` and requires a linux-x64 glibc prebuilt package with a `gitCommit`.
8. Requires `node_modules/.bin/vinext` to be executable, and requires `sharp`'s linux-x64 `.node` binary plus the matching `libvips` library. If those are missing, it stops. It does not install them.
9. Runs `node scripts/check-digitalocean-build.mjs`, `npm run check:bridge`, and `npm run check:controlled-media`. Those commands do not install or build.
10. Starts the staged site on port 3099 with a temporary copy of the editor store, checks the homepage, `/editor`, the health API, and the featured story, then deletes the temporary copy.
11. Copies `editor-store.json` into `/var/www/Oldseadogsbackups/release-deployments/<release-id>/` and checks the copy. The live file is not replaced.
12. Points `/var/www/oldseadogs/current` at the new folder with an atomic symlink replace.
13. Restarts PM2 process `oldseadogs-web` only. If the health check fails, it points `current` back at the previous folder and starts that folder again.
14. Records the new and previous folders under `/var/www/oldseadogs/shared/`, then runs `pm2 save`.

Do not follow this with `npm ci`, `npm run build:do`, or a hand-run `pm2 reload`.

## Checks after the switch

**REQUIRES OWNER APPROVAL**

```bash
pm2 describe oldseadogs-web | sed -n '1,40p'
readlink -f /var/www/oldseadogs/current
grep gitCommit /var/www/oldseadogs/current/lib/generated-build-info.ts
curl -sI http://127.0.0.1:3000/editor | grep -i -E 'HTTP/|cache-control'
curl -sI http://127.0.0.1:3000/ | grep -i -E 'HTTP/|cache-control'
```

`current` and the PM2 working directory should be the new release folder. The previous folder should still be on disk. `/editor` should be HTTP 200. The release plan for 1 October 2026 lists the extra page and cache-header checks for that release.

## Rollback

Rollback does not install, build, or restore stories. The 30 September release (`6ce0718`) rolls back only if the folder you wrote down still contains `node_modules/.bin/vinext`. The pre-flight test is there so you know that before you switch. If `vinext` is missing, the script stops and tells you it will not install dependencies. Do not run `npm ci` to repair that folder.

**REQUIRES OWNER APPROVAL**

```bash
bash /var/www/oldseadogs/shared/deploy-tools/release-rollback.sh --release THE_FOLDER_NAME_YOU_WROTE_DOWN
```

With no `--release`, the script uses `/var/www/oldseadogs/shared/previous-release`, which the deploy writes just before a successful switch.

`--dry-run` prints the switch it would make and does not change `current`.

**REQUIRES OWNER APPROVAL**

```bash
bash /var/www/oldseadogs/shared/deploy-tools/release-rollback.sh --dry-run --release THE_FOLDER_NAME_YOU_WROTE_DOWN
```

After a real rollback, `grep gitCommit` on `current/lib/generated-build-info.ts` should show `6ce0718c6d3d` again when that folder is the 30 September release. The new release folder is left on disk.

## Optional Cloudflare cache rules

Do this only after the site switch looks right. No script does this. Do not enable a zone-wide “cache everything” setting.

**REQUIRES OWNER APPROVAL** for every Cloudflare change.

1. HTML is not in Cloudflare’s default cacheable file types. Add a Cache Rule for GET and HEAD responses whose content type is `text/html`. Bypass `/editor`, `/api` (media responses can stay cached), paths ending in `.rsc`, preview queries, the `oldseadogs_editor_staging` cookie, and requests that carry `RSC`, `Next-Router-Prefetch`, or `Next-Router-Segment-Prefetch`. Include those headers in the cache key if they are not bypassed. Do not cache 5xx responses.
2. Leave the edge TTL respecting the origin. `CDN-Cache-Control` is what keeps stale-while-revalidate. An `s-maxage` value on `Cache-Control` turns that off at Cloudflare.
3. Set Browser Cache TTL to “Respect Existing Headers”.
4. Add an explicit rule for `/api/media/*` and `/img/*` that respects the origin headers and ignores cookies.
5. Avoid `no-transform` if you want Cloudflare Polish to add AVIF.
6. A cache key that ignores cookies can serve the anonymous page to a visitor who already has a consent cookie. Bypassing the cache for that cookie sends returning visitors to the Droplet every time.
7. Do not make Cloudflare “respect” the long `Vary` list unless the cache key also includes the RSC and router headers.
