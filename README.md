# Old Sea Dogs

This is a new Sites-ready version of Old Sea Dogs: a boating and yachting
publication with a maintainable story structure, reusable article pages, and
local editorial assets.

## Updating Stories

Stories live in `content/stories.ts`. Each record includes the headline,
category, date, author, source type, image, summary, body paragraphs, tags, and
reading time.

To add a new story:

1. Put the story image in `public/images/`.
2. Add a new story record to `content/stories.ts`.
3. Use a unique `slug`, such as `new-boat-launch-solent`.
4. Run the build before publishing.

The `sourceType`, `sourceName`, and optional `sourceUrl` fields are ready for
future automation from press releases, RSS/search feeds, or email ingestion.

## Useful Commands

```bash
npm install
npm run dev
npm run build
```

## Site Shape

- `app/page.tsx` is the publication home page.
- `app/stories/[slug]/page.tsx` renders every article page.
- `content/stories.ts` is the editorial content model.
- `public/images/` contains the site imagery.
- `.openai/hosting.json` contains Sites hosting metadata.
