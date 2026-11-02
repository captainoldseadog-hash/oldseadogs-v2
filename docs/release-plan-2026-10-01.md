# Release plan: 1 October 2026 candidate

This note is for the owner. It describes the draft release on branch `release/2026-10-01-candidate`, and the packaging change on branch `deploy/prebuilt-package`. It is not a go-ahead to change the live site.

The live site stays on commit `6ce0718c6d3de4bbfe8c43ea4bebccdbe05f8508` until you switch it. Do not use, merge, or deploy branch `main`.

Every command below that runs on the Droplet, reads live files, or changes Cloudflare is marked **REQUIRES OWNER APPROVAL**. Commands you run only on your Mac are not marked.

The fuller notes are in `RELEASE_DEPLOYMENT.md`. Follow this plan for this release. Where a server command appears, use the copy in this plan.

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
- Do not run `npm ci`, `npm install`, or `npm run build:do` on the Droplet.
- Do not point this release at branch `main`.
- Do not use `npm run deploy:safe` or the old `npm run rollback`. Those belong to the historical rsync notes in `SAFE_DEPLOYMENT.md`.

## How the new site gets onto the server

The site is built on another computer, packed with the libraries it needs, and copied to the Droplet as one archive. A script then points the live folder at that new copy and restarts the app.

The Droplet does not download libraries and does not rebuild the site. That matters because the Droplet has 4 GB of memory, and because `sharp` (the library that makes the smaller pictures) must be the Linux version. A package built the ordinary way on a Mac would contain the Mac version, and picture resizing would fail.

The live app is PM2 process `oldseadogs-web`. The script only restarts that process.

## 1. Look at the live site before changing anything

Do this on the Droplet as the account that already runs PM2. Older notes call that account `oldseadogs`. If `pm2 status` does not list `oldseadogs-web` for the account you are using, stop.

**REQUIRES OWNER APPROVAL**

```bash
pm2 status
readlink -f /var/www/oldseadogs/current
test -L /var/www/oldseadogs/current && echo "current is a symlink"
test -x /var/www/oldseadogs/current/node_modules/.bin/vinext && echo "current release can start on its own"
test -r /var/www/oldseadogs-data/editor-store.json && echo "editor store is readable"
test -r /etc/oldseadogs/oldseadogs.env && echo "env file is readable"
grep gitCommit /var/www/oldseadogs/current/lib/generated-build-info.ts
```

Write down the folder name printed by `readlink`. That folder is the live release. You will need that exact name if you want to go back. The rollback script uses the folder name, not the git commit.

The `gitCommit` line should show `6ce0718c6d3d`. That is the start of `6ce0718c6d3de4bbfe8c43ea4bebccdbe05f8508`. If it says something else, stop.

Also confirm PM2 is not still running an old process named exactly `oldseadogs`. The deploy script stops if that name is online. Only `oldseadogs-web` should be the live app.

The line about `vinext` matters for going back. The 30 September folder can be restored only if that file is already there. The rollback script will not install anything to recreate it. If the test does not print `current release can start on its own`, stop. Do not run `npm ci` on the Droplet to fix it.

Take the backup the runbook requires. Run it from the live app directory so you are backing up the server’s data. This creates a new timestamped folder. It does not overwrite the live store or the media folder. `npm run backup:create` is not an install and it is not a site build.

**REQUIRES OWNER APPROVAL**

```bash
cd /var/www/oldseadogs/current
npm run backup:create
npm run backup:verify
```

Write down the new backup path. Do not continue if verify fails.

Stop here if any of these are true:

- `current` is not a symlink into `/var/www/oldseadogs/releases`.
- `node_modules/.bin/vinext` is missing from that folder.
- The editor store backup did not verify.
- `gitCommit` is not `6ce0718c6d3d`.

## 2. Build the package on your Mac, not on the Droplet

You need branch `deploy/prebuilt-package`. It contains the 1 October site changes and the new packaging scripts. Do this on your Mac.

```bash
git fetch origin deploy/prebuilt-package
git checkout deploy/prebuilt-package
```

Pick one of the two ways below. Both build Linux libraries. Neither one logs into the Droplet.

### Way A. GitHub, if you would rather not use Docker

1. Open https://github.com/captainoldseadog-hash/oldseadogs-v2 in the browser.
2. Click Actions.
3. Click **Build release package**.
4. Click **Run workflow**.
5. Choose branch `deploy/prebuilt-package`.
6. Wait until the run is green.
7. Download the artifact named `oldseadogs-prebuilt-release`.
8. Unzip it. GitHub puts the real files inside a zip. You want three files: a `.tar.gz`, a `.sha256`, and a `.manifest.json`.

That workflow only builds a file you can download. It does not know the Droplet address, it does not use passwords, and it does not change Cloudflare.

### Way B. Docker on the Mac

Install Docker Desktop if it is not already installed. From the repository folder:

```bash
bash deploy/release-package-docker.sh
```

This starts a Linux container on your Mac, builds the site there, and writes the same three files into the `outputs` folder. It can take a while. The archive is large because it includes the libraries the site needs, including `vinext` and the Linux `sharp`.

### Then check the files on your Mac

Open the `.manifest.json` file in TextEdit. You want to see:

- `gitCommit` set to a long id. On your Mac, `git rev-parse HEAD` after the checkout above should print the same id. It must not start with `6ce0718`. That id is the site that is already live.
- `productionDataIncluded` set to `false`.
- `platform` set to `linux`, `arch` set to `x64`, and `libc` set to `glibc`.

In the folder that contains the three files, check the archive has not been damaged. Use the real file name:

```bash
shasum -a 256 -c oldseadogs-THE-REAL-NAME.tar.gz.sha256
```

It should print `OK`.

## 3. Copy the package to the Droplet

The live server still has an older deploy script that would run `npm ci` and would refuse a package that already contains libraries. Do not run the script that sits inside the live site folder. Copy the new scripts to a tools folder first.

The server name on your Mac is the alias `oldseadogs-production`.

**REQUIRES OWNER APPROVAL**

```bash
ssh oldseadogs-production 'mkdir -p /var/www/oldseadogs/shared/deploy-tools /var/www/oldseadogs/incoming'
scp deploy/release-common.sh deploy/release-deploy.sh deploy/release-rollback.sh oldseadogs-production:/var/www/oldseadogs/shared/deploy-tools/
scp outputs/oldseadogs-THE-REAL-NAME.tar.gz outputs/oldseadogs-THE-REAL-NAME.tar.gz.sha256 oldseadogs-production:/var/www/oldseadogs/incoming/
```

Use the real file name from `outputs`. Copy only those files. Do not copy anything into `/var/www/oldseadogs-data`. Do not copy the archive on top of `/var/www/oldseadogs` or `/var/www/oldseadogs/current`.

The same copy can be done with rsync. It is the same files and the same folders.

**REQUIRES OWNER APPROVAL**

```bash
rsync -av --progress deploy/release-common.sh deploy/release-deploy.sh deploy/release-rollback.sh oldseadogs-production:/var/www/oldseadogs/shared/deploy-tools/
rsync -av --progress outputs/oldseadogs-THE-REAL-NAME.tar.gz outputs/oldseadogs-THE-REAL-NAME.tar.gz.sha256 oldseadogs-production:/var/www/oldseadogs/incoming/
```

## 4. Create the picture cache folder

The smaller WebP pictures are saved outside the code folder, so going back to the old code does not delete them, and so they are not written on top of the original uploads.

The folder is:

```text
/var/www/oldseadogs-data/cache/image-derivatives
```

`ecosystem.config.cjs` does not name a Unix account. It only names the PM2 process `oldseadogs-web`. The older setup notes create an account called `oldseadogs` and start PM2 as that user. Confirm the live account before you create the folder. If the command prints a different user, use that user instead of `oldseadogs` in the `chown` line.

**REQUIRES OWNER APPROVAL**

```bash
ps -o user=,group= -p "$(pm2 pid oldseadogs-web)"
```

When the user is `oldseadogs`, run:

**REQUIRES OWNER APPROVAL**

```bash
sudo mkdir -p /var/www/oldseadogs-data/cache/image-derivatives
sudo chown oldseadogs:oldseadogs /var/www/oldseadogs-data/cache /var/www/oldseadogs-data/cache/image-derivatives
sudo chmod 755 /var/www/oldseadogs-data/cache /var/www/oldseadogs-data/cache/image-derivatives
sudo -u oldseadogs test -w /var/www/oldseadogs-data/cache/image-derivatives && echo "picture cache is writable"
```

These commands create and set the owner of the two cache folders only. They do not change `editor-store.json`. They do not change `media`. They do not change the permissions of `/var/www/oldseadogs-data` itself. Mode `755` means the PM2 account can write the cache. Do not use mode `777`.

If the writable test does not succeed, stop. Fix only this new folder.

## 5. Rehearse the deploy

This checks the package on the server and does not switch the site. It does not install libraries. It does read the live editor store, so it still needs your approval.

**REQUIRES OWNER APPROVAL**

```bash
ssh oldseadogs-production
bash /var/www/oldseadogs/shared/deploy-tools/release-deploy.sh \
  --dry-run \
  --archive /var/www/oldseadogs/incoming/oldseadogs-THE-REAL-NAME.tar.gz \
  --checksum /var/www/oldseadogs/incoming/oldseadogs-THE-REAL-NAME.tar.gz.sha256 \
  --release-id 2026-10-01-candidate
```

A good rehearsal says `npm ci was not run` and `Nothing was promoted`. It also prints the package `gitCommit`. That id should match the manifest you read on your Mac.

If the script talks about running `npm ci`, stop. You are running the old script from the live site folder. Use the path `/var/www/oldseadogs/shared/deploy-tools/release-deploy.sh`.

If it says `sharp`'s linux-x64 binary is missing, stop. The package was built for the wrong computer. Build it again with Way A or Way B. Do not install `sharp` on the Droplet.

## 6. Switch the site on

Use the same command without `--dry-run`.

**REQUIRES OWNER APPROVAL**

```bash
bash /var/www/oldseadogs/shared/deploy-tools/release-deploy.sh \
  --archive /var/www/oldseadogs/incoming/oldseadogs-THE-REAL-NAME.tar.gz \
  --checksum /var/www/oldseadogs/incoming/oldseadogs-THE-REAL-NAME.tar.gz.sha256 \
  --release-id 2026-10-01-candidate
```

What you should see it do:

1. Check the archive matches its checksum.
2. Unpack it into a new folder under `/var/www/oldseadogs/releases`. It will refuse if `2026-10-01-candidate` already exists. It does not replace the 30 September folder.
3. Check the libraries inside the package, including `vinext` and Linux `sharp`. It does not run `npm ci`.
4. Start the new copy on a spare port, using a temporary copy of the story file, then delete that temporary copy. It does not write the copy back over the live story file.
5. Save a backup copy of the story file under `/var/www/Oldseadogsbackups/release-deployments/2026-10-01-candidate/`.
6. Point `/var/www/oldseadogs/current` at the new folder.
7. Restart PM2 process `oldseadogs-web`.
8. If the new site does not come up healthy, point `current` back at the previous folder and start that folder again.

Do not run `npm ci`, `npm run build:do`, or `pm2 reload` yourself afterwards.

## 7. Checks after the switch

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

Then confirm the live store was not replaced, and that PM2 is in the new folder.

**REQUIRES OWNER APPROVAL**

```bash
pm2 describe oldseadogs-web | sed -n '1,40p'
readlink -f /var/www/oldseadogs/current
```

The working directory and `current` should both be `/var/www/oldseadogs/releases/2026-10-01-candidate`. The previous folder should still be on disk.

Until the optional Cloudflare step below, anonymous HTML may still show `cf-cache-status: DYNAMIC` at https://oldseadogs.com even though the Droplet is sending public cache headers. That is expected. Cloudflare does not cache ordinary HTML unless a cache rule says so.

## 8. Go back to the 30 September site

Use this if the new site is wrong. It does not restore stories or media. It points the site back at the folder you wrote down in step 1, then restarts PM2. It does not run `npm ci` or any other install. The 30 September folder already has its own libraries from the day it was put live. That is why step 1 checks `vinext` before you switch.

**REQUIRES OWNER APPROVAL**

```bash
bash /var/www/oldseadogs/shared/deploy-tools/release-rollback.sh --release THE_FOLDER_NAME_YOU_WROTE_DOWN
```

You can rehearse that switch without changing the site:

**REQUIRES OWNER APPROVAL**

```bash
bash /var/www/oldseadogs/shared/deploy-tools/release-rollback.sh --dry-run --release THE_FOLDER_NAME_YOU_WROTE_DOWN
```

The folder name is the last part of the `readlink` path from step 1. It is the directory under `/var/www/oldseadogs/releases/`. It is not the git id `6ce0718`.

If you leave off `--release`, the script uses the previous folder recorded by the new deploy. Prefer the name you wrote down.

After it finishes, this should show `6ce0718c6d3d` again:

**REQUIRES OWNER APPROVAL**

```bash
grep gitCommit /var/www/oldseadogs/current/lib/generated-build-info.ts
```

The homepage should be the site you had before this release. Do not delete the new release folder as part of going back. The script leaves it in place.

If the script says `vinext is absent`, it has refused to install libraries. Stop. Do not run `npm ci` on the Droplet. The step 1 check is there to catch that before the switch.

## 9. Optional later step: Cloudflare cache rules

Do this only after the site switch looks right, and only if you want Cloudflare to store anonymous HTML. It is not part of the deploy script. No code change does this.

**REQUIRES OWNER APPROVAL** for every Cloudflare change. Do not turn on a setting that caches the whole zone.

1. HTML is not in Cloudflare’s default list of cacheable file types. Add a Cache Rule that caches GET and HEAD responses whose content type is `text/html`. Bypass `/editor`, `/api` (the media responses can stay cached), paths ending in `.rsc`, preview queries, the `oldseadogs_editor_staging` cookie, and requests that carry `RSC`, `Next-Router-Prefetch`, or `Next-Router-Segment-Prefetch`. Include those headers in the cache key if they are not bypassed. Do not cache 5xx responses.
2. Leave the edge TTL respecting the origin. The `CDN-Cache-Control` header is the one that keeps stale-while-revalidate. An `s-maxage` value on `Cache-Control` turns that off at Cloudflare.
3. Set Browser Cache TTL to “Respect Existing Headers”. Live images are currently rewritten by Cloudflare to `public, max-age=14400, must-revalidate`, and `must-revalidate` turns off stale-while-revalidate.
4. `/api/media/:id` has no file extension, so Cloudflare does not cache it by default. `/img/…png` ends in `.png` and can be stored. Add an explicit rule for `/api/media/*` and `/img/*` that respects the origin headers and ignores cookies.
5. Cloudflare Polish or Image Resizing can add AVIF at the edge. Avoid `no-transform` if you want Polish.
6. A cache key that ignores cookies will serve the anonymous page to a visitor who already has a consent cookie. That page does not contain their choice. Bypassing the cache for the consent cookie would send returning visitors back to the Droplet every time.
7. Do not make Cloudflare “respect” the long `Vary` list unless the cache key also includes the RSC and router headers. The HTML address stays HTML.

After this optional step, an anonymous homepage request can be served from Cloudflare for about 120 seconds, and then reused while a refresh happens for up to 300 seconds. `/editor` stays uncached. The Helm store is still read on the Droplet whenever a page is actually rendered.

## Still to confirm before you approve

- The PM2 Unix account is not written into `ecosystem.config.cjs`. Step 4’s `ps` command is the check. The setup notes expect `oldseadogs`.
- The live release folder name is on the server. Step 1 is where you write it down. Git does not know that folder name.
- The GitHub workflow builds a downloadable package only. It does not deploy.
- The archive is large because it includes the libraries. Copying it can take a few minutes.
- Do not merge this work, and do not restart PM2, until you have approved it.
