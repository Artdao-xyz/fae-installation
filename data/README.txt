Offline CMS snapshot for the installation build.

## Setup

From the repo root, with exports in `new-data/`:

```bash
npm run import:new-data
```

This reads `new-data/content/` + `new-data/images/`, writes `data/catalog.json`,
copies referenced media into `data/media/`, and prunes unused files from
`new-data/images/`.

Optional: `new-data/output-media-overrides.json` maps outputs to image filenames
when media links are not available from the legacy Strapi DB.

`data/catalog.json` and `data/media/` are gitignored (large binaries). Ship them
with the install machine or regenerate from `new-data/`.

## Runtime

Set `FAE_DATA_SOURCE` to pick the catalog source:

- `FAE_DATA_SOURCE=local` — offline snapshot (`data/catalog.json` + `data/media/`)
- `FAE_DATA_SOURCE=strapi` — live Strapi API (requires `STRAPI_URL`)

When unset, the app uses local data if `data/catalog.json` exists, otherwise Strapi.

Images are served at `/api/media/<filename>` from `data/media/`.

## Session receipts

Printed journeys are appended to `data/receipts.jsonl` (one JSON object per line).
Archive runs on `POST /api/print` in the background — failures do not block printing.
Disable with `FAE_RECEIPT_ARCHIVE=0` or override the path with `FAE_RECEIPT_ARCHIVE_PATH`.

Browse and re-render archived receipts at `/v/archive` (list), `/v/archive?i=0`
(by line index), or paste JSON on that page (from R2 or any backup).

## Cloud backup (optional)

When R2 credentials are set in the kiosk `.env`, each print also uploads one JSON
file to your Cloudflare R2 bucket (`receipts/{installation-id}/…`). Direct from
the Mac mini — no webhook or Vercel needed. Local JSONL stays primary; R2 upload
is best-effort and never blocks printing. Disable with `RECEIPT_ARCHIVE_CLOUD=0`.
