# Poole Harbour Guide CMS handoff

This directory contains the approved nine-record `create-draft` contract, the nine editor-supplied source images, and their verified mapping and editorial metadata.

The images are source handoff assets, not a bundled production Media Library. The application release does not contain `editor-store.json`, `.oldseadogs-data`, production uploads, or a replacement media store. Production Media Library IDs must be created by uploading these files through the authenticated Guide Manager/Media Library after the application release is installed. The resulting `/api/media/<id>` references are then assigned to the corresponding Draft Guides. Local rehearsal IDs must never be copied to production.

The automated rehearsal uses a disposable `OLDSEADOGS_DATA_DIR`, uploads every image through `/api/editor/media/upload`, saves metadata through the normal editor API, imports the nine Guides atomically, and confirms that they remain Draft, noindex, unpublished, unscheduled, off the homepage, and sitemap-ineligible. It clears only each `media.heroImage` editorial unresolved item; the 16 safety unresolved items remain intact.

No credit metadata or credit text was supplied in the PNGs or original Guide contract. Credits therefore remain empty rather than being invented. The mapping, alt text, captions, hashes, byte sizes, and dimensions are recorded in `media-manifest.json`.
