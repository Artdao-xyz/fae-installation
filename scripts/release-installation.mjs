#!/usr/bin/env node
/**
 * Build a turnkey exhibition package under release/FAE-Installation/.
 *
 * Layout:
 *   FAE-Installation/
 *   ├── HOW-TO-RUN.md
 *   ├── Start FAE Installation.command
 *   └── app/                 ← Next.js runtime (pre-built)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const outputRoot = path.join(projectRoot, "release", "FAE-Installation");
const appDir = path.join(outputRoot, "app");

import { bundleNodeRuntime } from "./bundle-node-runtime.mjs";

const skipBuild = process.argv.includes("--skip-build");
const skipData = process.argv.includes("--skip-data");
const skipNode = process.argv.includes("--skip-node");

function log(step, message) {
  console.log(`[release] ${step}: ${message}`);
}

function run(command, options = {}) {
  execSync(command, {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });
}

function copyPath(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function ensureCatalog() {
  const catalog = path.join(projectRoot, "data", "catalog.json");
  if (fs.existsSync(catalog)) return;
  if (skipData) {
    throw new Error(
      "data/catalog.json is missing. Run npm run prepare:local-data or drop --skip-data.",
    );
  }
  log("data", "catalog missing — running prepare:local-data");
  run("npm run prepare:local-data");
  if (!fs.existsSync(catalog)) {
    throw new Error("data/catalog.json still missing after prepare:local-data");
  }
}

function ensureProductionBuild() {
  const buildId = path.join(projectRoot, ".next", "BUILD_ID");
  if (skipBuild && fs.existsSync(buildId)) {
    log("build", "skipped (--skip-build, existing production build)");
    verifyProductionBuild();
    return;
  }
  log("build", "running production build with installation mode");
  run("npm run build", {
    env: {
      ...process.env,
      NEXT_PUBLIC_FAE_INSTALLATION_MODE: "1",
    },
  });
  if (!fs.existsSync(buildId)) {
    throw new Error("Production build failed — .next/BUILD_ID not found");
  }
  verifyProductionBuild();
}

function verifyProductionBuild() {
  const serverDir = path.join(projectRoot, ".next", "server");
  const webpackRuntime = path.join(serverDir, "webpack-runtime.js");
  if (!fs.existsSync(webpackRuntime)) {
    throw new Error(
      "Release requires a webpack production build (.next/server/webpack-runtime.js missing). Run: npm run build",
    );
  }

  const turbopackRuntime = path.join(serverDir, "chunks", "[turbopack]_runtime.js");
  if (fs.existsSync(turbopackRuntime)) {
    throw new Error(
      "Release build was produced with Turbopack. Rebuild with: npm run build (uses --webpack)",
    );
  }

  const printRoute = path.join(serverDir, "app", "api", "print", "route.js");
  if (fs.existsSync(printRoute)) {
    const source = fs.readFileSync(printRoute, "utf8");
    if (/sharp-[0-9a-f]{8,}/.test(source)) {
      throw new Error(
        "Print route still references Turbopack externalized sharp. Rebuild with: npm run build",
      );
    }
  }

  log("verify", "webpack production build OK (no Turbopack runtime externals)");
}

function writeReleaseDocs() {
  const howTo = fs.readFileSync(
    path.join(__dirname, "HOW-TO-RUN.release.md"),
    "utf8",
  );
  fs.writeFileSync(path.join(outputRoot, "HOW-TO-RUN.md"), howTo);

  const launcher = `#!/bin/bash
cd "$(dirname "$0")/app"
exec bash ./scripts/start-installation.sh
`;
  const launcherPath = path.join(outputRoot, "Start FAE Installation.command");
  fs.writeFileSync(launcherPath, launcher, { mode: 0o755 });

  const installNodeLauncher = `#!/bin/bash
cd "$(dirname "$0")/app"
exec bash ./scripts/install-node.sh
`;
  fs.writeFileSync(
    path.join(outputRoot, "Install Node (optional).command"),
    installNodeLauncher,
    { mode: 0o755 },
  );

  copyPath(
    path.join(__dirname, "prepare-installation.sh"),
    path.join(appDir, "scripts", "prepare-installation.sh"),
  );
  fs.chmodSync(path.join(appDir, "scripts", "prepare-installation.sh"), 0o755);

  const prepareLauncher = `#!/bin/bash
cd "$(dirname "$0")/app"
exec bash ./scripts/prepare-installation.sh
`;
  fs.writeFileSync(
    path.join(outputRoot, "Prepare FAE Installation.command"),
    prepareLauncher,
    { mode: 0o755 },
  );
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const RELEASE_ENV_KEYS = [
  "RECEIPT_ARCHIVE_CLOUD",
  "RECEIPT_ARCHIVE_INSTALLATION_ID",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_RECEIPT_PREFIX",
  "NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL",
];

function writeReleaseEnvLocal() {
  const releaseEnv = parseEnvFile(path.join(projectRoot, ".env.release.local"));
  const devEnv = parseEnvFile(path.join(projectRoot, ".env.local"));
  const merged = { ...devEnv, ...releaseEnv };

  const lines = [
    "NEXT_PUBLIC_FAE_INSTALLATION_MODE=1",
    "FAE_DATA_SOURCE=local",
  ];

  for (const key of RELEASE_ENV_KEYS) {
    const value = merged[key]?.trim();
    if (value) {
      const escaped = /[\s#"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
      lines.push(`${key}=${escaped}`);
    }
  }

  fs.writeFileSync(path.join(appDir, ".env.local"), `${lines.join("\n")}\n`);

  const r2Ready =
    merged.R2_ACCOUNT_ID?.trim() &&
    merged.R2_ACCESS_KEY_ID?.trim() &&
    merged.R2_SECRET_ACCESS_KEY?.trim() &&
    merged.R2_BUCKET_NAME?.trim();

  if (r2Ready) {
    log("env", "R2 cloud archive credentials included in app/.env.local");
    return;
  }

  log(
    "env",
    "No R2 credentials in release — add .env.release.local (see .env.release.local.example) or R2 vars in .env.local",
  );
}

function copyAppRuntime() {
  log("copy", "app runtime files");
  ensureDir(appDir);

  const copyFiles = [
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "installation.local.json.example",
  ];
  for (const file of copyFiles) {
    copyPath(path.join(projectRoot, file), path.join(appDir, file));
  }

  copyPath(path.join(projectRoot, ".next"), path.join(appDir, ".next"));
  copyPath(path.join(projectRoot, "public"), path.join(appDir, "public"));
  copyPath(path.join(projectRoot, "data"), path.join(appDir, "data"));

  ensureDir(path.join(appDir, "scripts"));
  copyPath(
    path.join(projectRoot, "scripts", "start-installation.sh"),
    path.join(appDir, "scripts", "start-installation.sh"),
  );
  copyPath(
    path.join(projectRoot, "scripts", "install-node.sh"),
    path.join(appDir, "scripts", "install-node.sh"),
  );
  copyPath(
    path.join(projectRoot, "scripts", "installation-node-version.sh"),
    path.join(appDir, "scripts", "installation-node-version.sh"),
  );
  copyPath(
    path.join(projectRoot, "scripts", "resolve-bundled-node.sh"),
    path.join(appDir, "scripts", "resolve-bundled-node.sh"),
  );
  fs.chmodSync(path.join(appDir, "scripts", "start-installation.sh"), 0o755);
  fs.chmodSync(path.join(appDir, "scripts", "install-node.sh"), 0o755);
  fs.chmodSync(path.join(appDir, "scripts", "resolve-bundled-node.sh"), 0o755);

  writeReleaseEnvLocal();

  // Stale compiled config from dev machines breaks `next start` in the package.
  const compiledConfig = path.join(appDir, "next.config.compiled.js");
  if (fs.existsSync(compiledConfig)) {
    fs.rmSync(compiledConfig, { force: true });
  }
}

function installProductionDependencies() {
  log("deps", "npm ci --omit=dev in app/");
  run("npm ci --omit=dev", { cwd: appDir });
}

async function bundleNodeForRelease() {
  if (skipNode) {
    log("node", "skipped (--skip-node)");
    return;
  }
  if (process.platform !== "darwin") {
    log("node", "skipped (darwin runtimes require a macOS release build)");
    return;
  }
  log("node", "bundling Node.js 20.x (arm64 + x64) into app/.node/");
  await bundleNodeRuntime(appDir);
}

function summarize() {
  const bytes = directorySize(outputRoot);
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  console.log("");
  console.log("Release package ready:");
  console.log(`  ${outputRoot}`);
  console.log(`  ~${mb} MB`);
  console.log("");
  console.log("Zip and send the FAE-Installation folder:");
  console.log(
    `  cd release && zip -ry FAE-Installation.zip FAE-Installation`,
  );
  console.log("");
  console.log("Use zip -ry so node_modules/.bin symlinks survive the archive.");
}

function directorySize(root) {
  let total = 0;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) total += fs.statSync(full).size;
    }
  }
  return total;
}

async function main() {
  console.log("[release] FAE installation package");
  console.log(`[release] output: ${outputRoot}`);
  console.log("");

  ensureCatalog();
  ensureProductionBuild();

  log("clean", "recreating output folder");
  removeDir(outputRoot);
  ensureDir(outputRoot);

  copyAppRuntime();
  installProductionDependencies();
  await bundleNodeForRelease();
  writeReleaseDocs();
  summarize();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
