# How to run the FAE installation

For exhibition staff. No coding needed.

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

## Every show day

1. Plug in the thermal printer (USB + power).
2. Double-click **`Start FAE Installation.command`**.
3. Leave Terminal open.

To stop: close Terminal or press **Ctrl+C**.

## Printer setup (once)

1. Open **http://localhost:3000/admin**
2. PIN: **`fae`**
3. Select the printer → **Save printer** → **Test print**

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
