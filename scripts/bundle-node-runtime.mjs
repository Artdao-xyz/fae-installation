#!/usr/bin/env node
/**
 * Download official Node.js macOS runtimes into app/.node/{arm64,x64}/ for offline kiosks.
 * Used by npm run release (requires network on the build machine).
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLATFORMS = [
  { id: "arm64", platform: "darwin-arm64" },
  { id: "x64", platform: "darwin-x64" },
];

function readPinnedNodeVersion() {
  const sh = fs.readFileSync(
    path.join(__dirname, "installation-node-version.sh"),
    "utf8",
  );
  const match = sh.match(/INSTALLATION_NODE_VERSION=([0-9.]+)/);
  if (!match) {
    throw new Error(
      "Could not read INSTALLATION_NODE_VERSION from installation-node-version.sh",
    );
  }
  return match[1];
}

function pruneNodeRuntime(runtimeDir) {
  for (const name of ["include", "share"]) {
    const target = path.join(runtimeDir, name);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

async function extractNodeTarball(tarballPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`tar -xJf ${JSON.stringify(tarballPath)} -C ${JSON.stringify(destDir)} --strip-components=1`, {
    stdio: "inherit",
  });
}

/**
 * @param {string} appDir — release app root (contains package.json)
 */
export async function bundleNodeRuntime(appDir) {
  if (process.platform !== "darwin") {
    console.warn(
      "[bundle-node] Skipping — official darwin runtimes are only bundled on macOS builds.",
    );
    return;
  }

  const version = readPinnedNodeVersion();
  const nodeRoot = path.join(appDir, ".node");
  fs.mkdirSync(nodeRoot, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fae-node-"));

  try {
    for (const { id, platform } of PLATFORMS) {
      const folderName = `node-v${version}-${platform}`;
      const tarball = `${folderName}.tar.xz`;
      const url = `https://nodejs.org/dist/v${version}/${tarball}`;
      const dest = path.join(nodeRoot, id);

      console.log(`[bundle-node] ${id}: ${url}`);
      fs.rmSync(dest, { recursive: true, force: true });

      const tarballPath = path.join(tmpDir, tarball);
      await downloadFile(url, tarballPath);
      await extractNodeTarball(tarballPath, dest);
      pruneNodeRuntime(dest);

      const nodeBin = path.join(dest, "bin", "node");
      if (!fs.existsSync(nodeBin)) {
        throw new Error(`Missing ${nodeBin} after extract`);
      }
      fs.chmodSync(nodeBin, 0o755);
    }

    fs.writeFileSync(
      path.join(nodeRoot, "README.txt"),
      [
        `Bundled Node.js v${version} for offline macOS kiosks.`,
        "arm64 — Apple Silicon (M1/M2/M3/M4)",
        "x64   — Intel Mac",
        "",
        "Selected automatically by scripts/start-installation.sh.",
      ].join("\n"),
      "utf8",
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node scripts/bundle-node-runtime.mjs <app-dir>");
    process.exit(1);
  }
  await bundleNodeRuntime(path.resolve(target));
}
