import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const websiteRoot = join(root, "website");
const agentRoot = join(root, "agent");
const sharedRoot = join(root, "shared");

const files = [
  "_headers",
  "_redirects",
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
  "robots.txt",
  "script.js",
  "site.webmanifest",
  "sitemap.xml",
  "styles.css",
  "terms.html",
  "theme-init.js",
  "theme-options.css",
  "theme-options.html",
  "warranty-returns.html",
  "washing-machines.html",
];

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });

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

for (const file of files) {
  cpSync(join(websiteRoot, file), join(dist, file));
}

mkdirSync(join(dist, "assets"), { recursive: true });
copyDirectory(join(websiteRoot, "assets", "product-photos"), join(dist, "assets", "product-photos"), new Set(["source-crops"]));
cpSync(join(websiteRoot, "assets", "appliance-lineup.svg"), join(dist, "assets", "appliance-lineup.svg"));

mkdirSync(join(dist, "brand"), { recursive: true });
for (const file of ["rentalready_logo.svg", "rentalready_logo_square.svg", "rentalready_mark.svg"]) {
  cpSync(join(websiteRoot, "brand", file), join(dist, "brand", file));
}

cpSync(join(sharedRoot, "cloudflare", "_worker.js"), join(dist, "_worker.js"));
cpSync(join(agentRoot, "sourcing-dashboard.html"), join(dist, "sourcing-dashboard.html"));
cpSync(join(agentRoot, "sourcing-dashboard.js"), join(dist, "sourcing-dashboard.js"));

if (existsSync(join(agentRoot, "functions"))) {
  copyDirectory(join(agentRoot, "functions"), join(dist, "functions"));
}

console.log(`Built RentalReady static site into ${dist}`);
