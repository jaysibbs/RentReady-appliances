import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dist = join(root, "dist");
const agentDist = join(root, "dist-agent");

const agentFiles = [
  "_headers",
  "_redirects",
  "_worker.js",
  "robots.txt",
  "site.webmanifest",
  "sourcing-dashboard.html",
  "sourcing-dashboard.js",
  "styles.css",
  "theme-init.js",
];

function resetDirectory(target) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
}

function copyDirectory(source, target, ignoredNames = new Set()) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    if (ignoredNames.has(entry)) continue;
    const sourcePath = join(source, entry);
    const targetPath = join(target, entry);
    if (statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath, ignoredNames);
    } else {
      cpSync(sourcePath, targetPath);
    }
  }
}

function copyFiles(files, target) {
  for (const file of files) {
    cpSync(join(dist, file), join(target, file));
  }
}

const siteBuild = spawnSync(process.execPath, ["scripts/build_site.mjs"], {
  cwd: root,
  stdio: "inherit",
});

if (siteBuild.status !== 0) {
  throw new Error("Site build failed before agent split could be prepared.");
}

resetDirectory(agentDist);
copyFiles(agentFiles, agentDist);
cpSync(join(dist, "sourcing-dashboard.html"), join(agentDist, "index.html"));
copyDirectory(join(dist, "brand"), join(agentDist, "brand"));

if (existsSync(join(dist, "functions"))) {
  copyDirectory(join(dist, "functions"), join(agentDist, "functions"));
}

console.log(`Built RentalReady AI agent into ${agentDist}`);
