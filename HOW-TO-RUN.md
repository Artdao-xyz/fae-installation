# How to run the FAE installation

For exhibition staff. No coding needed.

## Before the exhibition (new Mac)

macOS does **not** include Node.js. Install **Node.js 20.x** (**v20.20.2**) **once** on each kiosk Mac before opening day.

Do **not** use the main nodejs.org homepage — that offers the newest LTS (v22/v24), not the version this app is tested with.

### Option A — helper script (easiest)

1. Double-click **`Install Node (optional).command`** in this folder.
2. Follow the prompts (may open your browser or use Homebrew if you have it).
3. In Terminal, confirm: `node -v` should print `v20…` (e.g. `v20.20.2`).

### Option B — download Node 20.x from nodejs.org

**macOS installer (recommended)** — one `.pkg` for Apple Silicon and Intel:

**[nodejs.org/dist/latest-v20.x/node-v20.20.2.pkg](https://nodejs.org/dist/latest-v20.x/node-v20.20.2.pkg)**

**Version archive page** (same release, all platforms):

**[nodejs.org/en/download/archive/v20.20.2](https://nodejs.org/en/download/archive/v20.20.2)**

Under **Installer Packages**, use `node-v20.20.2.pkg` for macOS.

Run the `.pkg`, then check in Terminal: `node -v`.

Then continue with **Start the installation** below.

## Start the installation (Mac)

1. **Plug in** the thermal printer (USB + power).
2. **Double-click** `Start FAE Installation.command` in this folder.
3. Wait. The first run may take a few minutes to build.
4. Your browser opens to the kiosk. **Leave the Terminal window open** while the show is running.

To stop: close the Terminal window, or press `Ctrl+C` in it.

## Admin panel (printer setup)

1. Open **http://localhost:3000/admin** in a browser.
2. Log in with PIN: **`fae`**
3. Select the printer from the list → **Save printer** → **Test print**.

This writes `installation.local.json` in this folder. You usually do not need to edit that file by hand.

QR codes for receipt scans use the machine's LAN address automatically — no setup needed.

## Finding your printer interface

The app needs a **printer interface** string (saved as `printerInterface` in `installation.local.json`). Prefer **Admin → Save printer**; use the steps below if the printer does not appear in the list or you are editing the file manually.

### Mac — System Settings (UI)

1. Open **System Settings → Printers & Scanners** (older macOS: **System Preferences → Printers & Scanners**).
2. Plug in the printer via USB (or add a network printer with **+**).
3. Wait until the printer shows as **Connected** / **Idle** (not “Paused” or “Offline”).
4. Note the **exact name** shown in the list (e.g. `Receipt_Printer`).
5. In `installation.local.json`, set:

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

In this folder (same level as `package.json`):

1. Copy `installation.local.json.example` to `installation.local.json` if the file does not exist.
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
| “No production build” / build errors | In Terminal: `npm run build` then double-click the command file again. |
| Printer not in the list | Check USB cable and power. Add the printer in Mac **System Settings → Printers & Scanners**, then **Refresh** in `/admin`. See **Finding your printer interface** above. |
| Print fails | Use **Test print** in `/admin`. Read the error shown there. |
| Site has no content | The `data/` folder may be missing. Ask for the full installation package. |
| Node.js missing / too old | Need **Node.js 20.x** (**v20.20.2**). Run **`Install Node (optional).command`** or install [node-v20.20.2.pkg](https://nodejs.org/dist/latest-v20.x/node-v20.20.2.pkg) — not the main nodejs.org “latest LTS” page. |

## Manual start (optional)

In Terminal, from this folder:

```bash
npm run installation:start
```

Or:

```bash
npm run build
npm run start
```

Then open http://localhost:3000

## Do not use for the exhibition

- `npm run dev` — development only, not for the show.

---

## For developers (packaging to send)

From the repo root, after `data/` is ready:

```bash
npm run release
```

This builds the app and creates `release/FAE-Installation/` — zip that folder and send it.

```bash
cd release && zip -ry FAE-Installation.zip FAE-Installation
```

Use `zip -ry` (not plain `zip -r`) so `node_modules/.bin` symlinks survive the archive.

Use `npm run release:quick` to reuse an existing production build (faster iteration).

Use `npm run release -- --skip-node` to skip bundling Node (dev machines only; not for exhibition zips).
