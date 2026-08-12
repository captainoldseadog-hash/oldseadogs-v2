# Guide Draft bulk import contract

The Helm accepts UTF-8 JSON using `oldseadogs.guide-draft` version `1`, or UTF-8 CSV using the fixed columns below. Imports always run as a read-only dry run first and can only create or update private Draft Guides. They cannot publish, schedule, unpublish, delete, or select homepage content.

JSON examples:

- `one-marina.json` — one clearly fictional Marina Draft.
- `three-marina-batch.json` — three fictional records in one atomic create batch.
- `update-draft.json` — update using `externalId` plus the current `updatedAt` token.

CSV columns, in stable order:

`externalId, updatedAt, slug, title, guideType, regionKey, regionName, area, parentGuideId, standfirst, introduction, latitude, longitude, vhfChannel, depths, tidalInformation, officialWebsite, telephone, email, seoTitle, metaDescription, heroMediaId, heroUrl, heroAlt, sections, oldSeaDogsView, practicalNotes, localKnowledge, warnings, approach, hazards, marinaFacilities, gallery, sources, unresolved`

`sections`, `oldSeaDogsView`, `practicalNotes`, `localKnowledge`, `warnings`, `approach`, `hazards`, `marinaFacilities`, `gallery`, `sources`, and `unresolved` are JSON-encoded cells. Blank optional cells are accepted. Media references must identify an asset already in the CMS Media Library; base64 and remote image blobs are rejected.

Spreadsheet-formula prefixes (`=`, `+`, `-`, `@`) are treated as text in downloaded result reports.
