# FAE Installation

Offline exhibition kiosk for Future Art Ecosystems. Next.js app that runs locally with content from `data/catalog.json` and images in `data/media/`.

## Requirements

- Node.js 20.x
- macOS (for thermal printer + release package)

## Run locally

```bash
npm install
npm run installation:start
```

Opens the kiosk at `http://localhost:3000`. Admin panel: `/admin` (default PIN: `fae`).

For development:

```bash
cp .env.example .env.local
npm run dev
```

## Content

The installation reads **local data** when `data/catalog.json` exists (default). No live CMS connection is required on the show machine.

To refresh content from exports in `new-data/`:

```bash
npm run import:new-data
```

See `data/README.txt` for details.

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run installation:start` | Production kiosk |
| `npm run import:new-data` | Build `data/` from `new-data/` |
| `npm run release` | Package for exhibition (`release/FAE-Installation/`) |

## Docs

- **[HOW-TO-RUN.md](./HOW-TO-RUN.md)** — for exhibition staff (start kiosk, printer, troubleshooting)
