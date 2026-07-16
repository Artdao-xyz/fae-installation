# How to run the FAE installation

For exhibition staff. No coding needed.

## Every show day

1. Plug in the thermal printer (USB + power).
2. Double-click **`Start FAE Installation.command`**.
3. Leave Terminal open.

To stop: close Terminal or press **Ctrl+C**.

## First time on this Mac

1. Unzip **FAE-Installation.zip**.

2. Double-click **`Prepare FAE Installation.command`**.

   macOS may show a warning that the file cannot be opened.

3. Open **System Settings → Privacy & Security** and scroll down.

4. Click **Allow** (or **Open Anyway**) next to the message about the blocked app.

5. Go back to the **FAE-Installation** folder.

6. Double-click **`Prepare FAE Installation.command`** again.

   A Terminal window opens, runs for a moment, then says you are ready. You can close it.

7. Double-click **`Start FAE Installation.command`**.

   A Terminal window opens — **leave it open** while the show is running. Your browser opens to the kiosk.

## Printer setup (once)

1. Open **http://localhost:3000/admin**
2. PIN: **`fae`**
3. Select the printer → **Save printer** → **Test print**

## Receipt QR (phones at home)

Printed QR codes must open a **public** website, not localhost.

1. Deploy the receipt viewer to **your** Vercel account.
2. On the kiosk, set the QR URL to your Vercel URL (e.g. `https://fae-processing.vercel.app`):
   - **Admin** → QR code → Custom hostname override → Save, **or**
   - Set `NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL` before running `npm run release`.

After a test print, scan the QR on your phone (cellular). It should open the digital receipt with a **Download receipt** button at the bottom.

## If something goes wrong

| Problem | What to do |
|--------|------------|
| macOS blocks Prepare or Start | **System Settings → Privacy & Security** → **Allow**, then try again |
| “Port 3000 already in use” | Close any other Terminal window running the app |
| Printer missing or print fails | Check USB and power. Add the printer in **System Settings → Printers & Scanners**, then **Refresh** in `/admin` and **Test print** |
| Site has no content | Ask for a new zip |

---

## For developers (packaging)

```bash
npm run release
cd release && zip -ry FAE-Installation.zip FAE-Installation
```

Use `zip -ry` so `node_modules/.bin` symlinks survive the archive.
