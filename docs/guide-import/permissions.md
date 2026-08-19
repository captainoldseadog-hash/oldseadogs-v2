# Guide bulk-import permissions

Poole Harbour uses the existing Guide Manager and its authenticated
`/api/editor` boundary. It does not introduce a Poole-specific endpoint,
editor, data store or role.

- `validateGuideImport` is an authenticated, read-only dry run. It creates a
  short-lived plan in server memory and does not write Guide, story, homepage
  or media records.
- `confirmGuideImport` is an authenticated editorial mutation. It accepts only
  an unexpired server-held plan token and writes the validated batch inside the
  existing locked editor-store transaction.
- Every imported record is forced to Draft, noindex, unpublished, unscheduled
  and off the homepage. Publication remains a separate explicit Guide Manager
  action and continues to enforce media and safety validation.
- Runtime records remain in the configured external editor store. This source
  change does not bundle, seed or migrate production data or media.

Future per-action role enforcement should classify validation as a low-risk
Editor/Administrator action and confirmation as a high-risk
Editor/Administrator action. This note is descriptive and does not weaken or
replace the existing editor authentication gate.
