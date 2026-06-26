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

  fs.writeFileSync(
    path.join(appDir, ".env.local"),
    "NEXT_PUBLIC_FAE_INSTALLATION_MODE=1\nFAE_DATA_SOURCE=local\n",
  );

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
