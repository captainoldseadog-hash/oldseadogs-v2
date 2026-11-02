# Lake Yard marina — unpublish (reference only)

Lake Yard asked to be taken down: the marina is fully sold, members only, and not open to visitors. This directory is the Droplet procedure. It does not change the running server.

- `unpublish-lake-yard.mjs` sets the `lake-yard-marina` guide to `draft` in `editor-store.json` and clears links from other guides. Dry run unless `--apply`. Refuses to run when `DATABASE_URL` is set (use the editor in that case). Requires `OLDSEADOGS_DATA_DIR`.
- `nginx-lake-yard.conf` is the redirect that belongs inside the oldseadogs `server` block, before the proxied `location /`:

```
location ~ ^/guides/poole-harbour/lake-yard-marina/?$ { return 301 https://oldseadogs.com/guides/poole-harbour; }
```

The guide is not a source seed in this repository. Unpublished state lives in the editor store on the server, which this pull request does not modify.
