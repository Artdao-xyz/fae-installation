# How to run the FAE installation

For exhibition staff. No coding needed.

## What’s in this folder

- **Start FAE Installation.command** — double-click this to run the show
- **Install Node (optional).command** — fallback only if bundled Node is missing
- **HOW-TO-RUN.md** — this file
- **app/** — the application (pre-built; includes `app/.node/` for offline use)

## Before the exhibition (new Mac)

The release package **includes Node.js v20.20.2** inside `app/.node/` (Apple Silicon + Intel). You do **not** need Wi‑Fi or a separate Node install to run the kiosk.

At your **prep meeting** (when you have Wi‑Fi), still:

1. Double-click **`Start FAE Installation.command`** and confirm the kiosk loads.
2. Open **`/admin`** → set up the printer → **Test print**.

### If Node is missing (damaged copy only)

Only if Terminal says bundled Node is unavailable:

1. Double-click **`Install Node (optional).command`**, or  
2. Install **Node 20.x** manually: [node-v20.20.2.pkg](https://nodejs.org/dist/latest-v20.x/node-v20.20.2.pkg) · [archive page](https://nodejs.org/en/download/archive/v20.20.2)

Do **not** use the main nodejs.org homepage (that offers v22/v24, not v20).

## Start the installation (Mac)

1. **Plug in** the thermal printer (USB + power).
2. **Double-click** `Start FAE Installation.command` in this folder.
3. Wait a moment for the server to start (this package is pre-built).
4. Your browser opens to the kiosk. **Leave the Terminal window open** while the show is running.

To stop: close the Terminal window, or press `Ctrl+C` in it.

## Admin panel (printer setup)

1. Open **http://localhost:3000/admin** in a browser.
2. Log in with PIN: **`fae`**
3. Select the printer from the list → **Save printer** → **Test print**.

This writes `app/installation.local.json`. You usually do not need to edit that file by hand.

QR codes for receipt scans use the machine's LAN address automatically — no setup needed.

## Finding your printer interface

The app needs a **printer interface** string (saved as `printerInterface` in `app/installation.local.json`). Prefer **Admin → Save printer**; use the steps below if the printer does not appear in the list or you are editing the file manually.

### Mac — System Settings (UI)

1. Open **System Settings → Printers & Scanners** (older macOS: **System Preferences → Printers & Scanners**).
2. Plug in the printer via USB (or add a network printer with **+**).
3. Wait until the printer shows as **Connected** / **Idle** (not “Paused” or “Offline”).
4. Note the **exact name** shown in the list (e.g. `Receipt_Printer`).
5. In `app/installation.local.json`, set:

   ```json
   "printerInterface": "printer:Receipt_Printer"
   ```

   Use the word `printer:` followed by the name from System Settings (spaces and underscores must match).

6. Restart the app, open `/admin`, and run **Test print**.

### Mac — Terminal (command line)

List printers CUPS knows about:

```bash
lpstat -p
```

Example line: `printer Receipt_Printer is idle.` → use `"printerInterface": "printer:Receipt_Printer"`.

See device URIs (USB, network, etc.):

```bash
lpstat -v
```

Discover printers on the network (optional):

```bash
lpinfo -v
```

After you know the CUPS name, the interface string is always:

```text
printer:THE_CUPS_NAME
```

**Network printer (raw TCP, port 9100)** — if you print over IP without adding the printer in System Settings:

```json
"printerInterface": "tcp://192.168.1.50:9100"
```

Replace with the printer’s IP (and port if not 9100).

### Manual `installation.local.json`

Inside the **app/** folder:

1. Copy `app/installation.local.json.example` to `app/installation.local.json` if the file does not exist.
2. Set `printerInterface` using one of the formats above.
3. Restart the installation and check **Admin → Status → Printer configured** shows **OK**.

Example:

```json
{
  "printerInterface": "printer:Receipt_Printer",
  "receiptPrintMode": "raster",
  "receiptViewBaseUrl": "",
  "adminPin": "fae"
}
```

`receiptPrintMode` can be `"raster"` or `"escpos-text"` (try `raster` if text mode looks wrong).

## If something goes wrong

| Problem | What to do |
|--------|------------|
| “Port 3000 already in use” | Close any other copy of the app or Terminal running the site. |
| Printer not in the list | Check USB cable and power. Add the printer in Mac **System Settings → Printers & Scanners**, then **Refresh** in `/admin`. See **Finding your printer interface** above. |
| Print fails | Use **Test print** in `/admin`. Read the error shown there. |
| Site has no content | The package may be incomplete. Ask for a new zip. |
| Node.js missing / too old | Release packages include Node in `app/.node/`. If missing, run **`Install Node (optional).command`** or [node-v20.20.2.pkg](https://nodejs.org/dist/latest-v20.x/node-v20.20.2.pkg). |
| “Cannot find module … require-hook” after unzip | Re-zip with `zip -ry`, or in Terminal: `cd app && rm -rf node_modules && npm ci --omit=dev` (needs internet). |

## Manual start (optional)

In Terminal:

```bash
cd app
npm run start
```

Then open http://localhost:3000

## Do not use for the exhibition

- `npm run dev` — development only, not included in this package.
