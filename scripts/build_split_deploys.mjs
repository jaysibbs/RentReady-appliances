import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dist = join(root, "dist");
const splitRoot = join(root, "dist-split");
const websiteDist = join(splitRoot, "website");
const agentDist = join(splitRoot, "agent");
const outputs = join(root, "outputs");
const stamp = process.argv[2] || "20260608d";

const sharedFiles = [
  "_headers",
  "_redirects",
  "robots.txt",
  "site.webmanifest",
  "styles.css",
  "theme-init.js",
];

const websiteFiles = [
  ...sharedFiles,
  "cookers-ovens.html",
  "delivery-haul-away.html",
  "dishwashers.html",
  "dryers.html",
  "fridge-freezers.html",
  "how-it-works.html",
  "image-credits.html",
  "index.html",
  "landlord-turnover-sets.html",
  "letting-agencies.html",
  "microwaves.html",
  "privacy.html",
  "script.js",
  "sitemap.xml",
  "terms.html",
  "warranty-returns.html",
  "washing-machines.html",
];

const agentFiles = [
  ...sharedFiles,
  "_worker.js",
  "sourcing-dashboard.html",
  "sourcing-dashboard.js",
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

function zipDirectory(source, targetZip) {
  const result = spawnSync("zip", ["-qr", targetZip, "."], {
    cwd: source,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Failed to create ${targetZip}`);
  }
}

if (!existsSync(dist)) {
  throw new Error("dist does not exist. Run scripts/build_site.mjs first.");
}

resetDirectory(splitRoot);
resetDirectory(websiteDist);
resetDirectory(agentDist);
mkdirSync(outputs, { recursive: true });

copyFiles(websiteFiles, websiteDist);
copyDirectory(join(dist, "assets"), join(websiteDist, "assets"));
copyDirectory(join(dist, "brand"), join(websiteDist, "brand"));

copyFiles(agentFiles, agentDist);
cpSync(join(dist, "sourcing-dashboard.html"), join(agentDist, "index.html"));
copyDirectory(join(dist, "brand"), join(agentDist, "brand"));
if (existsSync(join(dist, "functions"))) {
  copyDirectory(join(dist, "functions"), join(agentDist, "functions"));
}

const websiteZip = join(outputs, `rentalready_public_website_${stamp}_cloudflare.zip`);
const agentZip = join(outputs, `rentalready_ai_agent_${stamp}_cloudflare.zip`);
if (existsSync(websiteZip)) rmSync(websiteZip, { force: true });
if (existsSync(agentZip)) rmSync(agentZip, { force: true });
zipDirectory(websiteDist, websiteZip);
zipDirectory(agentDist, agentZip);

console.log(`Built website deploy zip: ${websiteZip}`);
console.log(`Built agent deploy zip: ${agentZip}`);
