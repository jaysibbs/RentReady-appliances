import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("dist/sourcing-dashboard.html", "utf8");
const script = await readFile("dist/sourcing-dashboard.js", "utf8");
const worker = await readFile("dist/_worker.js", "utf8");

assert.match(html, /styles\.css\?v=20260604c/, "dashboard must load the agent-domain stylesheet version");
assert.match(html, /sourcing-dashboard\.js\?v=20260604c/, "dashboard must load the agent-domain script version");
assert.match(html, /id="opportunitySource"/, "dashboard must include the opportunity source selector");
assert.match(html, /Contracts Finder only/, "dashboard must expose Contracts Finder mode");
assert.match(html, /Goods contract matcher/, "dashboard must use contract-first wording");
assert.match(html, /Saved contract and tender opportunities/, "dashboard must save opportunities instead of buyer records");
assert.match(html, /Stock fulfilment agent/, "dashboard must rank stock against selected opportunities");
assert.match(html, /Most viable live opportunities/, "highlighted contract area must be the live opportunity board");
assert.match(html, /Manual opportunity fallback/, "manual paste must be demoted to fallback workflow");

assert.match(script, /CONTRACTS_FINDER_SEARCH_BASE/, "front end must generate Contracts Finder search links");
assert.match(script, /GOODS_SIGNAL_TERMS/, "front end must score goods signals");
assert.match(script, /SERVICE_RISK_TERMS/, "front end must score service-heavy risk");
assert.match(script, /goodsScore/, "front end must show goods-fit scoring");
assert.match(script, /opportunityUnitValue/, "front end must convert contract value into per-unit stock value");
assert.match(script, /recordMeetsDeadline/, "front end must check stock timing against submission deadline");
assert.match(script, /stockProjectionForTender/, "front end must project stock coverage for each opportunity");
assert.match(script, /opportunityBoardScore/, "front end must rank opportunities by stock and economics viability");
assert.match(script, /Stock available before submission/, "bid readiness must include deadline-based stock coverage");
assert.doesNotMatch(script, /buyer request before purchase review/i, "dashboard must not instruct users to work from old saved-buyer wording");
assert.ok(script.includes("source=${encodeURIComponent(settings.source)}"), "front end must pass the selected live source to the API");
assert.ok(script.includes("valueCap=${encodeURIComponent(settings.valueCap)}"), "front end must pass the starter cap to the API");

assert.match(worker, /CONTRACTS_FINDER_RESULTS_URL/, "manual-deploy worker must fetch Contracts Finder");
assert.match(worker, /CONTRACTS_FINDER_API_URL/, "manual-deploy worker must use the official Contracts Finder JSON API");
assert.match(worker, /parseContractsFinderResults/, "manual-deploy worker must parse Contracts Finder results");
assert.match(worker, /www\.contractsfinder\.service\.gov\.uk/, "detail loader must allow Contracts Finder notice URLs");
assert.match(worker, /agent\.rentalreadyappliances\.com/, "worker must route the agent subdomain to the sourcing dashboard");
assert.match(worker, /sourcing-dashboard\.html/, "agent subdomain root must serve the sourcing dashboard");

console.log("Sourcing contract dashboard verification passed.");
