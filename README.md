# Old Sea Dogs

Old Sea Dogs is a Sites-ready boating and yachting publication with a private
editor for day-to-day updates.

## Adding Stories

Open the private editor at `/editor`.

1. Choose **Stories**.
2. Press **New story**.
3. Add the headline, summary, article text, source details, and photo.
4. Leave the story as **Draft** while you are working.
5. Change it to **Published** and press **Save story** when it is ready.

The **Page address** can be left blank. The site will make one from the
headline.

Before a story can be published, the editor now checks for internal wording,
AI/workflow notes, source-scraping language, duplicate paragraphs, and very
thin article text. If it finds a problem, it keeps the story in draft and shows
what needs fixing.

## Adding Photos

Open **Photos**, add a short description, and upload the image. You can then
pick that photo for the current story.

## Changing Site Words

Open **Site words** to edit the site name, homepage line, footer sentence, and
search description.

## Adding Adverts

Open **Adverts**.

- Use **Manual advert** for a simple advert with a headline, text, image, and
  link.
- Use **Google or advert network** when you need to paste advert code from a
  provider.
- Untick **Show this advert on the site** to pause it without deleting it.

## Email Press Releases

Open **Email Press Releases** in the editor.

Use this as a newsroom review queue, not an automatic publishing tool:

1. Paste a press release, upload a `.eml` file, or add the email details by hand.
2. Add any press photos and check the suggested caption and credit.
3. Mark spam, reject, accept, or block senders/domains as needed.
4. Generate the Old Sea Dogs article only after review.
5. Edit the generated article, then save it as a story draft.
6. Use the final publish button only when the article and photo credit are ready.

On DigitalOcean staging, editor and newsroom changes can be kept in a private
server-side file store while the production database adapter is being prepared:

```bash
OLDSEADOGS_DATA_DIR=/var/www/oldseadogs-data
```

Uploaded staging photos are kept under `OLDSEADOGS_DATA_DIR/media`, with an
original file, thumbnail file, and metadata record for each image.

Inbox fetching can be connected later with environment variables. Do not put
real email passwords or tokens in the code, README, or editor:

```bash
OLDSEADOGS_INBOX_PROVIDER=
OLDSEADOGS_INBOX_USER=
OLDSEADOGS_INBOX_HOST=
OLDSEADOGS_INBOX_PORT=993
OLDSEADOGS_INBOX_SECURE=true
OLDSEADOGS_INBOX_PASSWORD=
OLDSEADOGS_INBOX_TOKEN=
```

## Development

After restarting the Mac, start the local development site and editor with:

```bash
./start_dev.sh
```

This starts the development site at `http://localhost:3000/` and the editor at
`http://localhost:3000/editor`. It is local only and does not publish the live
website.

Check the local site and editor services with:

```bash
./check_dev.sh
```

Before shutting down the Mac, stop the local site and editor cleanly with:

```bash
./stop_dev.sh
```

Search indexing is off by default for development. Only turn it on for the
finished public launch by setting:

```bash
NEXT_PUBLIC_ENABLE_INDEXING=true
```

The editor, editor API, drafts, source review tools, and press-release queue
must stay private and out of the sitemap.

If macOS says the script is not allowed to run, make it executable once:

```bash
chmod +x start_dev.sh stop_dev.sh check_dev.sh
```

```bash
npm install
npm run dev
npm run build
```
