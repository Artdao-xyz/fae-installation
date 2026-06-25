Offline CMS snapshot for the installation build.

## Setup

From the repo root:

```bash
npm run sync:local-data      # copy latest backups/ → data/
npm run build:local-catalog  # export data/data.db → data/catalog.json
```

`data/media/` and `data/catalog.json` are gitignored (large binaries). Ship them with the install machine or regenerate from `backups/`.

## Runtime

Set `FAE_DATA_SOURCE` to pick the catalog source:

- `FAE_DATA_SOURCE=local` — offline snapshot (`data/catalog.json` + `data/media/`)
- `FAE_DATA_SOURCE=strapi` — live Strapi API (requires `STRAPI_URL`)

When unset, the app uses local data if `data/catalog.json` exists, otherwise Strapi.

- `FAE_USE_STRAPI_FIXTURE=1` — synthetic dev fixture (overrides both)

Images are served at `/api/media/<filename>` from `data/media/`.
