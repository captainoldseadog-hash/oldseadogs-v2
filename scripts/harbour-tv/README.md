# Harbour TV refresh

The public pages (`/videos`, `/videos/<section>`, `/videos/brands/<brand>`) read `content/harbour-tv/videos.json`. They use the site header and fonts. Playback is a click-to-play YouTube nocookie embed. `app/sitemap-videos.xml/route.ts` publishes the video sitemap, and `app/robots.ts` lists it next to `sitemap.xml`.

`fetch-videos.mjs` is the YouTube Data API v3 refresh. It needs `YOUTUBE_API_KEY` in the environment (never in the browser or in git). `config.json` is the channel and query list. `build-pages.mjs` is the static HTML builder used on the Droplet preview; the Next.js pages are what this repo serves.

## Cron

This is server configuration. Do not install it from this pull request.

The staged Droplet crontab (`video-hub.cron.DISABLED`) was:

```
0 4 */2 * * www-data cd /srv/oldseadogs/video-hub && set -a && . /srv/oldseadogs/shared/.env && set +a && node fetch-videos.mjs data/videos.json && node build-pages.mjs data/videos.json /srv/oldseadogs/staging-videos >> /var/log/video-hub.log 2>&1
```

For this repo, refresh the catalog the pages read:

```
0 4 */2 * * cd /path/to/oldseadogs && set -a && . /etc/oldseadogs/oldseadogs.env && set +a && /usr/bin/node scripts/harbour-tv/fetch-videos.mjs content/harbour-tv/videos.json >> /var/log/video-hub.log 2>&1
```

Every other day at 04:00. If the API fails or the new file is under half the previous size, keep the previous `videos.json` (the fetcher already does that). YouTube API terms require cached API data to be refreshed or deleted within 30 days; a 48-hour run stays inside that.

`indexnow-ping.sh` pings IndexNow only when `HTV_LIVE=1` and `INDEXNOW_KEY` are set. Leave those unset until the key file is hosted.
