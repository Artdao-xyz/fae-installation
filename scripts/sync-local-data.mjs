#!/usr/bin/env node
/**
 * Copy latest Strapi backup DB + image originals into `data/` for offline use.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const backupsDir = path.join(projectRoot, "backups");
const dataDir = path.join(projectRoot, "data");
const mediaDir = path.join(dataDir, "media");

function latestDir(parent, prefix) {
  if (!fs.existsSync(parent)) return null;
  const matches = fs
    .readdirSync(parent, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith(prefix))
    .map((d) => d.name)
    .sort()
    .reverse();
  return matches[0] ? path.join(parent, matches[0]) : null;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyMediaTree(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".")) continue;
    copyFile(path.join(srcDir, entry.name), path.join(destDir, entry.name));
    count++;
  }
  return count;
}

function main() {
  const dbBackupDir = latestDir(backupsDir, "backup-");
  const imagesBackupDir = latestDir(backupsDir, "images-");

  if (!dbBackupDir) {
    console.error("No backups/backup-* folder found.");
    process.exit(1);
  }

  const dbSrc = path.join(dbBackupDir, "data.db");
  if (!fs.existsSync(dbSrc)) {
    console.error(`Missing data.db in ${dbBackupDir}`);
    process.exit(1);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(mediaDir, { recursive: true });

  const dbDest = path.join(dataDir, "data.db");
  copyFile(dbSrc, dbDest);
  console.log(`Copied DB: ${dbSrc} → ${dbDest}`);

  let mediaCount = 0;
  if (imagesBackupDir) {
    const strapiMedia = path.join(imagesBackupDir, "strapi-media");
    mediaCount = copyMediaTree(strapiMedia, mediaDir);
    console.log(
      `Copied ${mediaCount} media files from ${strapiMedia} → ${mediaDir}`,
    );
  } else {
    console.warn("No backups/images-* folder found; media not synced.");
  }

  const meta = {
    syncedAt: new Date().toISOString(),
    dbBackup: dbBackupDir,
    imagesBackup: imagesBackupDir,
    mediaFiles: mediaCount,
  };
  fs.writeFileSync(
    path.join(dataDir, "source.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
  console.log("Wrote data/source.json");
  console.log("Next: npm run build:local-catalog");
}

main();
