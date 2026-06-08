const DEFAULT_WEIGHTS = {
  demand: 20,
  category: 28,
  roi: 22,
  budget: 18,
  quality: 18,
  urgency: 16,
  logistics: 14,
  availability: 14,
  source: 12,
};
const DEFAULT_LEARNING_MODEL = {
  version: "20260608-continuous-learning",
  createdAt: "",
  updatedAt: "",
  sourceStats: {},
  categoryStats: {},
  routeStats: {},
  buyerStats: {},
  outcomeStats: {},
  decisionLog: [],
};

const DEFAULT_ROI_TARGET = 45;
const STARTUP_ANCHOR_MIN = 15000;
const STARTUP_ANCHOR_SWEET_MAX = 90000;
const STARTUP_ANCHOR_MAX = 140000;
const JOHN_PYE_SEARCH_BASE = "https://www.johnpye.co.uk/";
const FIND_TENDER_SEARCH_BASE = "https://www.find-tender.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_SEARCH_BASE = "https://www.contractsfinder.service.gov.uk/Search/Results";
const PUBLIC_PROCUREMENT_SOURCES = [
  {
    name: "Contracts Finder",
    mode: "live",
    remit: "UK central government and wider public-sector contract opportunities above the low-value threshold.",
    urlFor: (term, settings) => contractsFinderSearchUrl(term, settings),
  },
  {
    name: "Find a Tender",
    mode: "live",
    remit: "High-value UK public procurement notices and early engagement.",
    urlFor: (term, settings) => findTenderSearchUrl(term, settings),
  },
  {
    name: "Public Contracts Scotland",
    mode: "watchlist",
    remit: "Scottish public bodies and local-authority goods opportunities.",
    urlFor: (term) => `https://www.publiccontractsscotland.gov.uk/Search/Search_MainPage.aspx?Keywords=${encodeURIComponent(term)}`,
  },
  {
    name: "Sell2Wales",
    mode: "watchlist",
    remit: "Welsh public-sector contracts and supplier opportunities.",
    urlFor: (term) => `https://www.sell2wales.gov.wales/Search/Search_MainPage.aspx?Keywords=${encodeURIComponent(term)}`,
  },
  {
    name: "eTendersNI",
    mode: "watchlist",
    remit: "Northern Ireland public-sector procurement notices.",
    urlFor: (term) => `https://etendersni.gov.uk/epps/cft/listContractDocuments.do?resourceId=&keyword=${encodeURIComponent(term)}`,
  },
  {
    name: "Crown Commercial Service",
    mode: "route",
    remit: "Framework and supplier-route research for growth after first contract wins.",
    urlFor: () => "https://www.crowncommercial.gov.uk/start-supplying",
  },
];
const STOCK_SOURCES = [
  {
    name: "John Pye general auctions",
    urlFor: (term) => `https://www.johnpye.co.uk/?s=${encodeURIComponent(term)}`,
    fetchable: true,
  },
  {
    name: "John Pye trade auctions",
    urlFor: (term) => `https://www.johnpye.co.uk/trade-auctions/?s=${encodeURIComponent(term)}`,
    fetchable: true,
  },
  {
    name: "John Pye Trade latest stock",
    urlFor: () => "https://www.johnpyetrade.co.uk/product-category/uncategorized/",
    fetchable: true,
  },
  {
    name: "BPI Auctions",
    urlFor: (term) => `https://www.bpiauctions.com/?s=${encodeURIComponent(term)}`,
    fetchable: true,
  },
  {
    name: "BidSpotter",
    urlFor: (term) => `https://www.bidspotter.co.uk/en-gb/search-results?searchTerm=${encodeURIComponent(term)}`,
    fetchable: true,
  },
  {
    name: "i-bidder",
    urlFor: (term) => `https://www.i-bidder.com/en-gb/search-results?searchTerm=${encodeURIComponent(term)}`,
    fetchable: false,
  },
  {
    name: "William George",
    urlFor: (term) => `https://www.williamgeorge.com/search?query=${encodeURIComponent(term)}`,
    fetchable: false,
  },
  {
    name: "Eddisons",
    urlFor: (term) => `https://www.eddisons.com/auctions/search/?search=${encodeURIComponent(term)}`,
    fetchable: false,
  },
  {
    name: "NCM Auctions",
    urlFor: (term) => `https://www.ncmauctions.co.uk/auction-search/?search=${encodeURIComponent(term)}`,
    fetchable: false,
  },
];

const STRONG_BRANDS = [
  "bosch",
  "samsung",
  "lg",
  "aeg",
  "siemens",
  "neff",
  "miele",
  "hotpoint",
  "beko",
  "zanussi",
  "indesit",
];

const GOODS_SIGNAL_TERMS = [
  "39700000",
  "39710000",
  "39711110",
  "39713100",
  "supply",
  "goods",
  "equipment",
  "appliances",
  "white goods",
  "washing machine",
  "washer",
  "fridge",
  "freezer",
  "cooker",
  "oven",
  "hob",
  "dryer",
  "dishwasher",
  "microwave",
  "kitchen equipment",
  "domestic appliance",
  "electrical goods",
  "furniture",
  "materials",
  "stock",
];

const STARTUP_ROUTE_TERMS = [
  "temporary accommodation",
  "homelessness",
  "private sector leasing",
  "psl",
  "void property",
  "voids",
  "housing association",
  "registered provider",
  "social housing",
  "local authority",
  "supported living",
  "care home",
  "student accommodation",
  "letting agency",
  "landlord",
  "facilities management",
  "fm",
  "property maintenance",
  "repairs",
  "estates",
];

const PIPELINE_ROUTE_TERMS = [
  "pipeline",
  "future opportunity",
  "early engagement",
  "market engagement",
  "prior information",
  "pre-procurement",
  "pre procurement",
];

const SERVICE_RISK_TERMS = [
  "service specification",
  "consultancy",
  "maintenance service",
  "servicing",
  "installation works",
  "mechanical works",
  "taxi",
  "transport",
  "passenger assistant",
  "driver",
  "cleaning service",
  "staffing",
  "training",
  "design and build",
  "minor works",
  "repair service",
  "managed service",
];

const state = {
  brief: load("rentalready_sourcing_brief", {}),
  demands: load("rentalready_sourcing_demands", []),
  activeDemandId: load("rentalready_sourcing_active_demand", ""),
  candidates: load("rentalready_sourcing_candidates", []),
  feedback: load("rentalready_sourcing_feedback", []),
  runHistory: load("rentalready_sourcing_run_history", []),
  learningModel: load("rentalready_sourcing_learning_model", DEFAULT_LEARNING_MODEL),
  weights: load("rentalready_sourcing_weights", DEFAULT_WEIGHTS),
};

state.weights = { ...DEFAULT_WEIGHTS, ...state.weights };
if ((state.weights.availability || 0) < 10) state.weights.availability = DEFAULT_WEIGHTS.availability;
state.learningModel = normaliseLearningModel(state.learningModel);

const briefForm = document.querySelector("#briefForm");
const candidateForm = document.querySelector("#candidateForm");
const scorePreview = document.querySelector("#scorePreview");
const candidateList = document.querySelector("#candidateList");
const weightsList = document.querySelector("#weightsList");
const memoryStats = document.querySelector("#memoryStats");
const modelHealth = document.querySelector("#modelHealth");
const sourceLearning = document.querySelector("#sourceLearning");
const routeLearning = document.querySelector("#routeLearning");
const outcomeLearning = document.querySelector("#outcomeLearning");
const activeDemand = document.querySelector("#activeDemand");
const demandList = document.querySelector("#demandList");
const tenderSummary = document.querySelector("#tenderSummary");
const tenderSearchLinks = document.querySelector("#tenderSearchLinks");
const tenderResults = document.querySelector("#tenderResults");
const tenderWorkspace = document.querySelector("#tenderWorkspace");
const liveTenderStatus = document.querySelector("#liveTenderStatus");
const agentRunSummary = document.querySelector("#agentRunSummary");
const bidPack = document.querySelector("#bidPack");
const agentSummary = document.querySelector("#agentSummary");
const agentSearchLinks = document.querySelector("#agentSearchLinks");
const agentResults = document.querySelector("#agentResults");
let activeTenderReview = null;
const workflowTabs = [...document.querySelectorAll("[data-step-tab]")];
const workflowPanels = [...document.querySelectorAll("[data-step-panel]")];
const STEP_HASH_MAP = {
  brief: "brief",
  briefForm: "brief",
  demand: "demand",
  tenders: "tenders",
  agent: "agent",
  candidate: "candidate",
  candidateForm: "candidate",
  shortlist: "shortlist",
};

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function blankLearningBucket() {
  return {
    seen: 0,
    approved: 0,
    rejected: 0,
    submitted: 0,
    won: 0,
    lost: 0,
    noBid: 0,
    totalScore: 0,
    totalRoi: 0,
    totalProfit: 0,
    lastSeen: "",
  };
}

function normaliseLearningModel(model = {}) {
  const createdAt = model.createdAt || new Date().toISOString();
  return {
    ...DEFAULT_LEARNING_MODEL,
    ...model,
    version: DEFAULT_LEARNING_MODEL.version,
    createdAt,
    updatedAt: model.updatedAt || createdAt,
    sourceStats: model.sourceStats || {},
    categoryStats: model.categoryStats || {},
    routeStats: model.routeStats || {},
    buyerStats: model.buyerStats || {},
    outcomeStats: model.outcomeStats || {},
    decisionLog: Array.isArray(model.decisionLog) ? model.decisionLog.slice(0, 250) : [],
  };
}

function learningKey(value, fallback = "Unknown") {
  return String(value || fallback).trim() || fallback;
}

function learningBucket(map, key) {
  const safeKey = learningKey(key);
  map[safeKey] = { ...blankLearningBucket(), ...(map[safeKey] || {}) };
  return map[safeKey];
}

function updateLearningBucket(bucket, event = {}) {
  const status = normalise(event.status);
  bucket.seen += 1;
  bucket.totalScore += number(event.score);
  bucket.totalRoi += number(event.roi);
  bucket.totalProfit += number(event.profit);
  bucket.lastSeen = event.createdAt || new Date().toISOString();
  if (status.includes("approved") || status.includes("matched")) bucket.approved += 1;
  if (status.includes("rejected") || status.includes("closed")) bucket.rejected += 1;
  if (status.includes("submitted")) bucket.submitted += 1;
  if (status.includes("won")) bucket.won += 1;
  if (status.includes("lost")) bucket.lost += 1;
  if (status.includes("no bid") || status.includes("no-bid")) bucket.noBid += 1;
}

function bucketAverage(bucket, key) {
  return bucket?.seen ? number(bucket[key]) / bucket.seen : 0;
}

function bucketConfidence(bucket) {
  if (!bucket?.seen) return 58;
  const positive = bucket.approved + bucket.submitted * 1.2 + bucket.won * 2;
  const negative = bucket.rejected + bucket.lost * 1.4 + bucket.noBid;
  const avgRoi = bucketAverage(bucket, "totalRoi");
  const avgProfit = bucketAverage(bucket, "totalProfit");
  const sampleBoost = Math.min(18, Math.log2(bucket.seen + 1) * 6);
  return clamp(48 + positive * 9 - negative * 8 + sampleBoost + Math.min(14, avgRoi / 7) + Math.min(10, avgProfit / 120));
}

function modelConfidence() {
  const model = state.learningModel;
  const decisions = model.decisionLog.length;
  const sources = Object.values(model.sourceStats).filter((item) => item.seen).length;
  const categories = Object.values(model.categoryStats).filter((item) => item.seen).length;
  const outcomes = Object.values(model.outcomeStats).reduce((sum, item) => sum + item.seen, 0);
  return clamp(
    Math.min(35, decisions * 2.5) +
    Math.min(25, sources * 6) +
    Math.min(20, categories * 5) +
    Math.min(20, outcomes * 4)
  );
}

function sourceLearningScore(source) {
  return bucketConfidence(state.learningModel.sourceStats[learningKey(source, "Supplier TBC")]);
}

function routeLearningScore(tenderOrDemand) {
  const tender = tenderOrDemand?.tender || tenderOrDemand || {};
  const hits = startupRouteProfile(tender, tenderSettings()).routeHits || [];
  if (!hits.length) return 58;
  const scores = hits.map((route) => bucketConfidence(state.learningModel.routeStats[learningKey(route)]));
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 58;
}

function topLearningRows(map, emptyLabel) {
  const rows = Object.entries(map || {})
    .map(([name, bucket]) => ({ name, bucket, confidence: bucketConfidence(bucket) }))
    .filter((item) => item.bucket.seen)
    .sort((a, b) => b.confidence - a.confidence || b.bucket.seen - a.bucket.seen)
    .slice(0, 6);
  if (!rows.length) return `<p class="empty-state">${emptyLabel}</p>`;
  return rows.map((item) => `
    <div class="learning-row">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${item.confidence}% confidence</span>
      <em>${item.bucket.seen} signal(s) • ${item.bucket.approved} approved • ${item.bucket.won} won • ${item.bucket.rejected + item.bucket.lost + item.bucket.noBid} negative</em>
    </div>
  `).join("");
}

function stepFromHash(hash = window.location.hash) {
  return STEP_HASH_MAP[String(hash || "").replace(/^#/, "")] || "";
}

function activeWorkflowStep() {
  return stepFromHash() || load("rentalready_sourcing_active_step", "brief");
}

function showWorkflowStep(step, updateHash = true) {
  const nextStep = STEP_HASH_MAP[step] || "brief";
  workflowPanels.forEach((panel) => {
    panel.hidden = panel.dataset.stepPanel !== nextStep;
  });
  workflowTabs.forEach((tab) => {
    const active = tab.dataset.stepTab === nextStep;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  save("rentalready_sourcing_active_step", nextStep);
  if (updateHash && window.location.hash !== `#${nextStep}`) {
    history.replaceState(null, "", `#${nextStep}`);
  }
  const activePanel = workflowPanels.find((panel) => panel.dataset.stepPanel === nextStep);
  if (activePanel && (updateHash || stepFromHash())) {
    window.setTimeout(() => {
      activePanel.scrollIntoView({ block: "start" });
      window.scrollBy(0, -220);
    }, 0);
  }
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function activeDemandRecord() {
  return state.demands.find((item) => item.id === state.activeDemandId) || null;
}

function activeBrief() {
  const demand = activeDemandRecord();
  return demand?.brief || state.brief || formData(briefForm);
}

function demandLabel(demand) {
  const brief = demand?.brief || {};
  const tender = demand?.tender || {};
  const quantity = number(brief.quantity) || 1;
  const authority = brief.customer || tender.authority || "Contract authority TBC";
  const item = brief.item || tender.item || "goods";
  return `${authority} - ${quantity} x ${item}`;
}

function demandValue(brief) {
  return (number(brief.quantity) || 1) * number(brief.budget);
}

function opportunityUnitValue(tender) {
  const value = number(tender?.value);
  const quantity = number(tender?.quantity) || 1;
  return value && quantity ? Math.round(value / quantity) : 0;
}

function opportunityDeadline(brief = activeBrief()) {
  const demand = activeDemandRecord();
  return demand?.tender?.deadline || demand?.brief?.deadline || brief?.deadline || parseDateFromText(brief?.notes || "") || "";
}

function recordMeetsDeadline(record, deadline) {
  if (!deadline) return true;
  const availableBy = record?.candidate?.availableBy;
  if (!availableBy) return false;
  return new Date(`${availableBy}T12:00:00`) <= new Date(`${deadline}T12:00:00`);
}

function recordQuantity(record) {
  return number(record?.candidate?.quantityAvailable) || 1;
}

function stockCoverageForDemand(demandId) {
  const records = state.candidates.filter((record) => record.demandId === demandId && record.status !== "Rejected");
  const approved = records.filter((record) => record.status === "Approved");
  const viable = records.filter((record) => record.result?.financials?.passes);
  const quantityAvailable = viable.reduce((sum, record) => sum + recordQuantity(record), 0);
  const approvedQuantity = approved.reduce((sum, record) => sum + recordQuantity(record), 0);
  const roiValues = viable.map((record) => number(record.result?.financials?.roi)).filter(Boolean);
  const lowestRoi = roiValues.length ? Math.min(...roiValues) : 0;
  const landedCost = viable.reduce((sum, record) => sum + number(record.result?.financials?.landed) * recordQuantity(record), 0);
  const targetSale = viable.reduce((sum, record) => sum + number(record.result?.financials?.sale) * recordQuantity(record), 0);

  return {
    records,
    viable,
    approved,
    quantityAvailable,
    approvedQuantity,
    lowestRoi,
    landedCost,
    targetSale,
    projectedProfit: targetSale - landedCost,
  };
}

function sourceNameFor(record) {
  const supplier = normalise(record?.candidate?.supplier);
  if (supplier.includes("john pye")) return "John Pye";
  if (supplier.includes("bpi")) return "BPI Auctions";
  if (supplier.includes("bidspotter")) return "BidSpotter";
  if (supplier.includes("clearance")) return "Clearance / outlet";
  if (supplier.includes("auction")) return "Auction source";
  return record?.candidate?.supplier || "Supplier TBC";
}

function procurementSourceLinks(terms, settings) {
  const uniqueTerms = [...new Set(terms.filter(Boolean))].slice(0, 4);
  return PUBLIC_PROCUREMENT_SOURCES.map((source) => `
    <div class="source-route-card ${source.mode}">
      <strong>${source.name}</strong>
      <span>${source.mode === "live" ? "Live feed" : source.mode === "watchlist" ? "Watchlist route" : "Supplier route"}</span>
      <p>${source.remit}</p>
      <div>
        ${uniqueTerms.map((term) => `<a class="button secondary" href="${source.urlFor(term, settings)}" target="_blank" rel="noopener">${term}</a>`).join("")}
      </div>
    </div>
  `).join("");
}

function stockSourceSummary(coverage, requiredQuantity = 1) {
  const sources = new Map();
  coverage.viable.forEach((record) => {
    const source = sourceNameFor(record);
    const existing = sources.get(source) || {
      source,
      quantity: 0,
      approvedQuantity: 0,
      projectedProfit: 0,
      lowestRoi: Infinity,
      lines: [],
    };
    const quantity = recordQuantity(record);
    existing.quantity += quantity;
    if (record.status === "Approved") existing.approvedQuantity += quantity;
    existing.projectedProfit += number(record.result?.financials?.profit) * quantity;
    existing.lowestRoi = Math.min(existing.lowestRoi, number(record.result?.financials?.roi) || Infinity);
    existing.lines.push(record);
    sources.set(source, existing);
  });

  const sourceList = [...sources.values()].map((source) => ({
    ...source,
    lowestRoi: Number.isFinite(source.lowestRoi) ? source.lowestRoi : 0,
  })).sort((a, b) => b.quantity - a.quantity || a.source.localeCompare(b.source));

  const completeSources = sourceList.filter((source) => source.quantity >= requiredQuantity);
  const approvedCompleteSources = sourceList.filter((source) => source.approvedQuantity >= requiredQuantity);
  const gap = Math.max(0, requiredQuantity - coverage.quantityAvailable);
  const approvedGap = Math.max(0, requiredQuantity - coverage.approvedQuantity);

  let decision = "Stock gap";
  let tone = "hold";
  let message = `Need ${gap || requiredQuantity} more viable unit(s) before this can be priced confidently.`;

  if (approvedCompleteSources.length) {
    decision = "Single approved source";
    tone = "pass";
    message = `${approvedCompleteSources[0].source} can cover the full requirement with approved stock.`;
  } else if (completeSources.length) {
    decision = "Single source possible";
    tone = "prepare";
    message = `${completeSources[0].source} can cover the full requirement, but stock still needs approval.`;
  } else if (coverage.quantityAvailable >= requiredQuantity && sourceList.length > 1) {
    decision = "Multi-source fulfilment";
    tone = coverage.approvedQuantity >= requiredQuantity ? "pass" : "prepare";
    message = coverage.approvedQuantity >= requiredQuantity
      ? "Approved stock covers the requirement across multiple sources."
      : `Use multiple suppliers and approve ${approvedGap} more unit(s) before submission.`;
  } else if (coverage.quantityAvailable > 0) {
    decision = "Partial stock found";
    tone = "hold";
    message = `${coverage.quantityAvailable} of ${requiredQuantity} unit(s) matched. More stock is needed before bidding.`;
  }

  return { sourceList, completeSources, approvedCompleteSources, gap, approvedGap, decision, tone, message };
}

function renderStockSourceSummary(summary, requiredQuantity) {
  const sourceCards = summary.sourceList.map((source) => `
    <div class="source-coverage-card ${source.quantity >= requiredQuantity ? "complete" : "partial"}">
      <strong>${escapeHtml(source.source)}</strong>
      <span>${source.quantity}/${requiredQuantity} viable • ${source.approvedQuantity} approved</span>
      <em>Lowest ROI ${source.lowestRoi ? percent(source.lowestRoi) : "TBC"} • Profit ${money(source.projectedProfit)}</em>
    </div>
  `).join("") || `<p class="empty-state">No source has matched stock yet. Search John Pye, BPI Auctions, and BidSpotter, then add viable lots to this opportunity.</p>`;

  return `
    <div class="source-coverage-summary ${summary.tone}">
      <div>
        <span>Stock source plan</span>
        <strong>${summary.decision}</strong>
        <p>${summary.message}</p>
      </div>
      <div class="source-coverage-grid">${sourceCards}</div>
    </div>
  `;
}

function renderStockEvidencePanel(tender) {
  const evidence = tender?.stockEvidence;
  if (!evidence) {
    return `
      <details class="stock-evidence-panel">
        <summary>Auction evidence routes</summary>
        <p>No live stock evidence has been attached to this opportunity yet. Run test-and-learn or open the stock source links, then add verified lots to the shortlist.</p>
      </details>
    `;
  }
  const leadRows = evidence.records.slice(0, 10).map((record) => `
    <div class="stock-line">
      <strong>${recordQuantity(record)} x ${escapeHtml(record.candidate.title || "Stock lead")}</strong>
      <span>${escapeHtml(record.candidate.supplier)} • ${escapeHtml(record.candidate.location || "location TBC")} • ${record.result.financials?.passes ? "ROI/timing lead" : "needs verification"}</span>
      <em>Bid ${money(record.result.financials?.bid)} • landed ${money(record.result.financials?.landed)} • ROI ${percent(record.result.financials?.roi)} • available ${escapeHtml(record.candidate.availableBy || "TBC")}</em>
      ${record.candidate.url ? `<a href="${record.candidate.url}" target="_blank" rel="noopener">Open stock lead</a>` : ""}
    </div>
  `).join("") || `<p class="empty-state">No parsed stock leads were returned. Use the source URLs below to verify manually.</p>`;
  const sourceLinks = evidence.sourceUrls.slice(0, 12).map((url) => `<a class="button secondary" href="${url}" target="_blank" rel="noopener">Source search</a>`).join("");
  const warnings = evidence.warnings?.length ? `<p>${escapeHtml(evidence.warnings.join(" | "))}</p>` : "";

  return `
    <details class="stock-evidence-panel" open>
      <summary>Auction evidence routes</summary>
      <div class="agent-run-grid">
        <div><span>Evidence terms</span><strong>${evidence.terms.length}</strong></div>
        <div><span>Parsed leads</span><strong>${evidence.records.length}</strong></div>
        <div><span>Fetched</span><strong>${new Date(evidence.fetchedAt).toLocaleString("en-GB")}</strong></div>
      </div>
      <div class="stock-lines">${leadRows}</div>
      ${warnings}
      <div class="dashboard-actions">${sourceLinks}</div>
    </details>
  `;
}

function tenderDetailRows(tender) {
  return [
    ["Contracting authority", tender.authority || "TBC"],
    ["Title", tender.title || "TBC"],
    ["Opportunity type", tender.opportunityType || tender.noticeType || "Contract / tender"],
    ["Category", tender.item || "TBC"],
    ["Required stock", `${number(tender.quantity) || 1} unit(s)`],
    ["Estimated value", tender.value ? money(tender.value) : "TBC"],
    ["Region", tender.region || "TBC"],
    ["Deadline", tender.deadline || "TBC"],
    ["Source", tender.source || "Find a Tender"],
  ];
}

function renderTenderDetails(tender) {
  return `
    <details class="tender-details" open>
      <summary>Tender details</summary>
      <dl>
        ${tenderDetailRows(tender).map(([key, value]) => `
          <div><dt>${key}</dt><dd>${escapeHtml(value)}</dd></div>
        `).join("")}
      </dl>
      <p>${escapeHtml(tender.notes || "No tender detail text pasted yet.")}</p>
    </details>
  `;
}

function renderStockCoverage(demand, readiness = null) {
  const tender = demand?.tender || {};
  const required = readiness?.requiredQuantity || number(demand?.brief?.quantity) || number(tender.quantity) || 1;
  const coverage = readiness?.coverage || stockCoverageForDemand(demand?.id);
  const sourceSummary = stockSourceSummary(coverage, required);
  const matchedPercent = required ? clamp((coverage.quantityAvailable / required) * 100) : 0;
  const approvedPercent = required ? clamp((coverage.approvedQuantity / required) * 100) : 0;
  const deadline = tender.deadline || demand?.brief?.deadline || "";
  const lines = coverage.viable.map((record) => `
    <div class="stock-line">
      <strong>${recordQuantity(record)} x ${escapeHtml(record.candidate.title || record.candidate.category || "Matched stock")}</strong>
      <span>${escapeHtml(sourceNameFor(record))} • ${escapeHtml(record.candidate.location || "Location TBC")} • ${record.status}</span>
      <em>Landed ${money(record.result?.financials?.landed)} • ROI ${percent(record.result?.financials?.roi)} • Available ${escapeHtml(record.candidate.availableBy || "TBC")}${deadline ? ` • ${recordMeetsDeadline(record, deadline) ? "before submission" : "after/unknown submission timing"}` : ""}</em>
    </div>
  `).join("") || `<p class="empty-state">No viable matched stock yet. Add auction lots to this contract/tender opportunity before deciding to bid.</p>`;

  return `
    <div class="stock-coverage">
      <div class="coverage-kpis">
        <div><span>Required</span><strong>${required}</strong></div>
        <div><span>Matched</span><strong>${coverage.quantityAvailable}</strong><meter min="0" max="100" value="${matchedPercent}"></meter></div>
        <div><span>Approved</span><strong>${coverage.approvedQuantity}</strong><meter min="0" max="100" value="${approvedPercent}"></meter></div>
        <div><span>Lowest ROI</span><strong>${coverage.lowestRoi ? percent(coverage.lowestRoi) : "TBC"}</strong></div>
        <div><span>Profit</span><strong>${money(coverage.projectedProfit)}</strong></div>
        <div><span>Deadline</span><strong>${deadline || "TBC"}</strong></div>
      </div>
      ${renderStockSourceSummary(sourceSummary, required)}
      <div class="stock-lines">${lines}</div>
    </div>
  `;
}

function fillForm(form, values) {
  Object.entries(values || {}).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value;
  });
}

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function number(value) {
  const parsed = Number(String(value || "").replace(/[£,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function postcodeArea(postcode) {
  return normalise(postcode).match(/^[a-z]+/)?.[0] || "";
}

function daysUntil(dateValue) {
  if (!dateValue) return 14;
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date();
  return Math.ceil((target - today) / 86400000);
}

function money(value) {
  return `£${Math.round(number(value)).toLocaleString("en-GB")}`;
}

function percent(value) {
  return `${Math.round(number(value))}%`;
}

function currentAgentSettings() {
  const brief = activeBrief();
  const savedBudget = number(brief.budget || briefForm?.elements.budget?.value);
  return {
    targetSale: number(document.querySelector("#targetSalePrice")?.value) || savedBudget,
    targetRoi: number(document.querySelector("#targetRoi")?.value) || DEFAULT_ROI_TARGET,
    buyerPremium: number(document.querySelector("#buyerPremium")?.value),
    feeVat: number(document.querySelector("#feeVat")?.value),
    logistics: number(document.querySelector("#logisticsBuffer")?.value),
    refurb: number(document.querySelector("#refurbBuffer")?.value),
    postcode: document.querySelector("#agentPostcode")?.value || brief.postcode || briefForm?.elements.postcode?.value || "",
    maxMiles: number(document.querySelector("#maxMiles")?.value) || 75,
  };
}

function multiplierFromSettings(settings) {
  const premium = settings.buyerPremium / 100;
  const feeVat = settings.feeVat / 100;
  return 1 + premium + (premium * feeVat);
}

function landedCostFromBid(bid, settings) {
  return number(bid) * multiplierFromSettings(settings) + settings.logistics + settings.refurb;
}

function roiPercent(targetSale, landedCost) {
  if (!targetSale || !landedCost) return 0;
  return ((targetSale - landedCost) / landedCost) * 100;
}

function maxLandedCost(settings) {
  if (!settings.targetSale) return 0;
  return settings.targetSale / (1 + settings.targetRoi / 100);
}

function maxSafeBid(settings) {
  const maxCost = maxLandedCost(settings) - settings.logistics - settings.refurb;
  if (maxCost <= 0) return 0;
  return maxCost / multiplierFromSettings(settings);
}

function candidateFinancials(brief, candidate) {
  const baseSettings = currentAgentSettings();
  const settings = {
    ...baseSettings,
    targetSale: number(candidate.targetSale) || number(brief.budget) || baseSettings.targetSale,
    targetRoi: number(candidate.targetRoi) || baseSettings.targetRoi,
  };
  const bid = number(candidate.price);
  const manualFees = number(candidate.fees);
  const estimatedLanded = bid ? landedCostFromBid(bid, settings) : manualFees;
  const landed = manualFees > estimatedLanded ? manualFees : estimatedLanded;
  const sale = settings.targetSale;
  const profit = sale && landed ? sale - landed : 0;
  const roi = roiPercent(sale, landed);
  const maxBid = maxSafeBid(settings);

  return {
    settings,
    bid,
    sale,
    landed,
    profit,
    roi,
    maxBid,
    marginGap: bid && maxBid ? maxBid - bid : 0,
    passes: Boolean(sale && landed && roi >= settings.targetRoi && profit > 0),
  };
}

function categoryScore(brief, candidate) {
  return normalise(brief.item) === normalise(candidate.category) ? 100 : 38;
}

function demandScore(brief) {
  const demand = activeDemandRecord();
  let score = demand ? 70 : 24;
  if (demand?.tender) score += 10;
  if (brief.customer || demand?.tender?.authority) score += 6;
  if (number(brief.budget)) score += 8;
  if (brief.postcode) score += 5;
  if (number(brief.quantity) > 0) score += 4;
  if (opportunityDeadline(brief)) score += 5;
  if (normalise(brief.notes).length > 80 || normalise(demand?.tender?.notes).length > 80) score += 4;
  return clamp(score);
}

function budgetScore(brief, candidate) {
  const budget = number(brief.budget);
  const total = number(candidate.price) + number(candidate.fees);
  if (!budget || !total) return 58;
  if (total <= budget * 0.82) return 100;
  if (total <= budget) return 88;
  if (total <= budget * 1.18) return 58;
  return 24;
}

function roiScore(brief, candidate) {
  const financials = candidateFinancials(brief, candidate);
  if (!financials.sale || !financials.landed) return 46;
  if (financials.roi >= financials.settings.targetRoi + 20) return 100;
  if (financials.roi >= financials.settings.targetRoi) return 88;
  if (financials.roi >= financials.settings.targetRoi - 10) return 58;
  if (financials.profit > 0) return 34;
  return 10;
}

function qualityScore(brief, candidate) {
  const quality = normalise(brief.quality);
  const condition = normalise(candidate.condition);
  const visual = normalise(candidate.visual);
  const brand = normalise(candidate.brand);
  const brandBoost = STRONG_BRANDS.some((item) => brand.includes(item)) ? 14 : 0;
  let score = 54 + brandBoost;

  if (condition.includes("new")) score += 26;
  if (condition.includes("graded")) score += 18;
  if (condition.includes("refurbished")) score += quality === "value" ? 18 : 8;
  if (condition.includes("unknown")) score -= 24;
  if (visual === "excellent") score += 18;
  if (visual === "good") score += 10;
  if (visual === "acceptable") score -= 2;
  if (visual === "risky") score -= 28;
  if (quality === "premium" && !condition.includes("new") && visual !== "excellent") score -= 16;

  return clamp(score);
}

function urgencyScore(brief, candidate) {
  const urgency = normalise(brief.urgency);
  const days = daysUntil(candidate.availableBy);
  if (urgency.includes("today")) return days <= 1 ? 100 : days <= 3 ? 62 : 22;
  if (urgency.includes("week")) return days <= 7 ? 100 : days <= 14 ? 72 : 38;
  if (urgency.includes("month")) return days <= 30 ? 92 : 54;
  return 76;
}

function availabilityScore(brief, candidate) {
  const deadline = opportunityDeadline(brief);
  if (deadline) {
    if (!candidate.availableBy) return 32;
    const candidateDate = new Date(`${candidate.availableBy}T12:00:00`);
    const deadlineDate = new Date(`${deadline}T12:00:00`);
    const daysBeforeDeadline = Math.floor((deadlineDate - candidateDate) / 86400000);
    if (daysBeforeDeadline >= 7) return 100;
    if (daysBeforeDeadline >= 3) return 88;
    if (daysBeforeDeadline >= 0) return 68;
    return 12;
  }
  const days = daysUntil(candidate.availableBy);
  if (days <= 1) return 82;
  if (days <= 4) return 100;
  if (days <= 7) return 90;
  if (days <= 14) return 72;
  if (days <= 30) return 48;
  return 28;
}

function logisticsScore(brief, candidate) {
  const area = postcodeArea(brief.postcode);
  const location = normalise(candidate.location);
  let score = 54;
  if (area && location.includes(area)) score += 28;
  if (location.includes("birmingham") || location.includes("midlands")) score += 18;
  if (location.includes("nottingham") || location.includes("derby")) score += 12;
  if (!location) score -= 14;
  if (normalise(candidate.notes).includes("collection only")) score -= 12;
  return clamp(score);
}

function sourceScore(candidate) {
  let score = sourceLearningScore(candidate.supplier);
  const supplier = normalise(candidate.supplier);
  if (supplier.includes("john pye")) score += 6;
  if (supplier.includes("trade")) score += 4;
  if (supplier.includes("unknown") || !supplier) score -= 14;
  if (normalise(candidate.notes).includes("verify auction fees")) score -= 4;
  return clamp(score);
}

function scoreCandidateData(brief, candidate) {
  const dimensions = {
    demand: demandScore(brief),
    category: categoryScore(brief, candidate),
    roi: roiScore(brief, candidate),
    budget: budgetScore(brief, candidate),
    quality: qualityScore(brief, candidate),
    urgency: urgencyScore(brief, candidate),
    logistics: logisticsScore(brief, candidate),
    availability: availabilityScore(brief, candidate),
    source: sourceScore(candidate),
  };
  const totalWeight = Object.keys(dimensions).reduce((sum, key) => sum + (state.weights[key] || DEFAULT_WEIGHTS[key] || 0), 0);
  const score = Object.entries(dimensions).reduce((sum, [key, value]) => {
    return sum + value * ((state.weights[key] || DEFAULT_WEIGHTS[key] || 0) / totalWeight);
  }, 0);
  const financials = candidateFinancials(brief, candidate);

  return {
    score: Math.round(score),
    dimensions,
    financials,
    recommendation: recommendationFor(score, dimensions, financials),
  };
}

function recommendationFor(score, dimensions, financials) {
  if (dimensions.demand < 55) {
    return "Hold - save or select a contract/tender opportunity before purchase review.";
  }
  if (dimensions.availability < 40) {
    return "Hold - stock timing does not clearly fit the contract submission window.";
  }
  if (financials.sale && financials.landed && !financials.passes) {
    return `Hold - ROI is ${percent(financials.roi)}, below the ${percent(financials.settings.targetRoi)} target. Max safe bid is ${money(financials.maxBid)}.`;
  }
  if (score >= 84) return "Strong match - review photos and fees, then consider approving.";
  if (score >= 68) return "Usable match - check condition, delivery, and final cost before buying.";
  if (dimensions.roi < 45) return "Weak match - does not protect the target sourcing ROI.";
  if (dimensions.budget < 45) return "Weak match - likely too expensive for the stated brief.";
  if (dimensions.quality < 45) return "Weak match - condition or quality risk is too high.";
  return "Weak match - keep as backup only.";
}

function renderScore(result) {
  return `
    <div class="score-card">
      <strong>${result.score}% fit</strong>
      <span>${result.recommendation}</span>
      ${result.financials?.sale ? `
        <div class="roi-strip">
          <div><span>Target sale</span><strong>${money(result.financials.sale)}</strong></div>
          <div><span>Landed cost</span><strong>${money(result.financials.landed)}</strong></div>
          <div><span>Profit</span><strong>${money(result.financials.profit)}</strong></div>
          <div><span>ROI</span><strong>${percent(result.financials.roi)}</strong></div>
          <div><span>Max bid</span><strong>${money(result.financials.maxBid)}</strong></div>
        </div>
      ` : ""}
      <div class="score-bars">
        ${Object.entries(result.dimensions).map(([key, value]) => `
          <div>
            <span>${label(key)}</span>
            <meter min="0" max="100" value="${value}"></meter>
            <em>${Math.round(value)}%</em>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function label(value) {
  if (value === "demand") return "Opportunity";
  if (value === "availability") return "Deadline fit";
  if (value === "source") return "Source trust";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function searchTermsFor(item) {
  const base = normalise(item);
  const terms = {
    "fridge freezer": ["fridge freezer", "american fridge freezer", "under counter fridge"],
    "electric cooker": ["electric cooker", "single oven", "oven hob"],
    "washing machine": ["washing machine", "washer dryer", "8kg washing machine"],
    "dryer": ["tumble dryer", "heat pump dryer", "condenser dryer"],
    "dishwasher": ["dishwasher", "slimline dishwasher", "freestanding dishwasher"],
    "microwave": ["microwave", "combination microwave", "over hob microwave"],
    "landlord turnover set": ["white goods", "washing machine fridge freezer cooker", "appliances"],
    "serviced apartment pack": ["white goods", "small appliances", "microwave fridge"],
    "portfolio / batch request": ["white goods", "appliances", "washing machines"],
  };
  return terms[base] || [base || "white goods"];
}

function johnPyeSearchUrl(term) {
  return `${JOHN_PYE_SEARCH_BASE}?s=${encodeURIComponent(term)}`;
}

function tenderSettings() {
  return {
    source: document.querySelector("#opportunitySource")?.value || "all",
    region: document.querySelector("#tenderRegion")?.value || "East Midlands",
    valueCap: number(document.querySelector("#tenderValueCap")?.value) || 120000,
    roi: number(document.querySelector("#tenderRoi")?.value) || DEFAULT_ROI_TARGET,
    postcode: document.querySelector("#tenderPostcode")?.value || state.brief.postcode || "",
    keywords: (document.querySelector("#tenderKeywords")?.value || "")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function findTenderSearchUrl(term, settings) {
  const query = [term, settings.region].filter(Boolean).join(" ");
  return `${FIND_TENDER_SEARCH_BASE}?keywords=${encodeURIComponent(query)}`;
}

function contractsFinderSearchUrl(term, settings) {
  const query = [term, settings.region].filter(Boolean).join(" ");
  const search = new URL(CONTRACTS_FINDER_SEARCH_BASE);
  search.searchParams.set("keywords", query);
  search.searchParams.set("tender", "1");
  search.searchParams.set("planning", "1");
  search.searchParams.set("speculative", "1");
  search.searchParams.set("awarded", "0");
  if (settings.postcode) search.searchParams.set("postcode", settings.postcode);
  return search.toString();
}

function sourceSearchLinks(terms) {
  const uniqueTerms = [...new Set(terms.filter(Boolean))].slice(0, 4);
  return STOCK_SOURCES.map((source) => `
    <div class="source-route-card ${source.fetchable ? "live" : "watchlist"}">
      <strong>${source.name}</strong>
      <span>${source.fetchable ? "Live evidence route" : "Manual verification route"}</span>
      ${uniqueTerms.map((term) => `<a class="button secondary" href="${source.urlFor(term)}" target="_blank" rel="noopener">${term}</a>`).join("")}
    </div>
  `).join("");
}

function renderTenderSummary() {
  if (!tenderSummary) return;
  const settings = tenderSettings();
  tenderSummary.innerHTML = `
    <div class="agent-kpis">
      <div><span>Region</span><strong>${settings.region}</strong></div>
      <div><span>Anchor cap</span><strong>${money(settings.valueCap)}</strong></div>
      <div><span>ROI gate</span><strong>${percent(settings.roi)}</strong></div>
      <div><span>Feed</span><strong>${settings.source === "contracts" ? "Contracts" : settings.source === "tenders" ? "Tenders" : settings.source === "regional" ? "Regional watch" : "Gov routes"}</strong></div>
      <div><span>Mode</span><strong>Test and learn</strong></div>
    </div>
    <p>Start with medium local/regional anchor contracts: temporary accommodation, void-property, housing association, student accommodation, FM subcontract supply, and goods/material supply. The agent downgrades service-heavy notices unless the stock requirement can be fulfilled and priced before submission.</p>
  `;
}

function generateTenderSearches() {
  renderTenderSummary();
  if (!tenderSearchLinks) return;
  const settings = tenderSettings();
  const terms = settings.keywords.length ? settings.keywords : ["white goods", "appliances", "kitchen equipment"];
  tenderSearchLinks.innerHTML = `
    <strong>Live contract searches</strong>
    <div>
      <a class="button secondary" href="https://www.contractsfinder.service.gov.uk/Search" target="_blank" rel="noopener">Contracts Finder advanced</a>
      <a class="button secondary" href="https://www.find-tender.service.gov.uk/Search" target="_blank" rel="noopener">Find a Tender advanced</a>
      <a class="button secondary" href="https://www.contractsfinder.service.gov.uk/Search/Results?planning=1&speculative=1&tender=1&awarded=0" target="_blank" rel="noopener">Pipeline and early engagement</a>
      <a class="button secondary" href="https://www.crowncommercial.gov.uk/start-supplying" target="_blank" rel="noopener">CCS supplier routes</a>
    </div>
    <div class="source-route-grid">${procurementSourceLinks(terms, settings)}</div>
    <strong>Stock source searches</strong>
    <div class="source-route-grid">${sourceSearchLinks(terms)}</div>
  `;
}

function tenderKeywordsQuery(settings) {
  return settings.keywords.length
    ? settings.keywords.join(" OR ")
    : "white goods supply OR domestic appliances 39700000 OR electrical domestic appliances 39710000 OR temporary accommodation appliances OR void property appliances OR housing association white goods";
}

function stockSearchKeywordsForTender(tender) {
  return [...new Set([
    ...tenderSearchTerms(tender),
    normalise(tender.item).includes("portfolio") ? "white goods job lot" : "",
    normalise(tender.item).includes("portfolio") ? "appliance bundle" : "",
    "graded appliances",
    "domestic appliance auction",
  ].filter(Boolean))].slice(0, 6);
}

function stockEvidenceRecordForTender(item, tender, settings) {
  const unitValue = opportunityUnitValue(tender);
  const candidate = {
    supplier: item.source || "Auction source",
    url: item.url || "",
    title: item.title || item.term || "Auction stock evidence",
    category: inferCategory(`${item.title || ""} ${item.term || ""}`, tender.item),
    brand: inferBrand(item.title || ""),
    price: number(item.price),
    quantityAvailable: number(item.quantityAvailable) || 1,
    fees: "",
    targetSale: unitValue || "",
    targetRoi: String(settings.roi || DEFAULT_ROI_TARGET),
    location: item.location || "",
    condition: inferCondition(`${item.title || ""} ${item.description || ""}`),
    availableBy: item.availableBy || "",
    visual: "Good",
    notes: [
      item.description || "",
      item.searchUrl ? `Source search: ${item.searchUrl}` : "",
      item.confidence ? `Evidence confidence: ${item.confidence}` : "",
      "Verify auction fees, lot condition, VAT, collection window, and quantity before approval.",
    ].filter(Boolean).join(" "),
  };
  const baseSettings = currentAgentSettings();
  const financialSettings = {
    ...baseSettings,
    targetSale: unitValue || baseSettings.targetSale,
    targetRoi: settings.roi || baseSettings.targetRoi || DEFAULT_ROI_TARGET,
  };
  const bid = number(candidate.price);
  const landed = bid ? landedCostFromBid(bid, financialSettings) : 0;
  const profit = unitValue && landed ? unitValue - landed : 0;
  const roi = roiPercent(unitValue, landed);
  const maxBid = maxSafeBid(financialSettings);
  const timingOk = recordMeetsDeadline({ candidate }, tender.deadline);
  const passes = Boolean(unitValue && landed && roi >= financialSettings.targetRoi && profit > 0 && timingOk);

  return {
    id: `evidence-${item.source || "source"}-${item.url || item.title || Math.random()}`,
    createdAt: new Date().toISOString(),
    demandId: "",
    demandSnapshot: null,
    brief: tenderBrief(tender, settings),
    candidate,
    result: {
      score: passes ? 82 : roi >= financialSettings.targetRoi ? 68 : 42,
      dimensions: {
        demand: 86,
        category: candidateMatchesTender(candidate, tender) ? 90 : 48,
        roi: roi >= financialSettings.targetRoi ? 88 : 38,
        budget: unitValue && landed <= unitValue ? 84 : 34,
        quality: qualityScore(tenderBrief(tender, settings), candidate),
        urgency: availabilityScore(tenderBrief(tender, settings), candidate),
        logistics: logisticsScore(tenderBrief(tender, settings), candidate),
        availability: timingOk ? 86 : 30,
      },
      financials: {
        settings: financialSettings,
        bid,
        sale: unitValue,
        landed,
        profit,
        roi,
        maxBid,
        marginGap: bid && maxBid ? maxBid - bid : 0,
        passes,
      },
      recommendation: passes
        ? "Evidence match - verify auction details, then add to shortlist if the lot is real and reserveable."
        : "Evidence lead - keep searching or manually verify before adding to the bid plan.",
    },
    status: "Evidence",
  };
}

async function fetchStockEvidenceForTender(tender, settings) {
  const terms = stockSearchKeywordsForTender(tender);
  const response = await fetch(`/api/stock-search?terms=${encodeURIComponent(terms.join("|"))}&targetSale=${encodeURIComponent(opportunityUnitValue(tender))}&roi=${encodeURIComponent(settings.roi)}&deadline=${encodeURIComponent(tender.deadline || "")}`);
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Stock evidence search failed.");
  const records = (payload.results || [])
    .map((item) => stockEvidenceRecordForTender(item, tender, settings))
    .filter((record) => candidateMatchesTender(record.candidate, tender));
  return {
    terms,
    records,
    sourceUrls: payload.sourceUrls || [],
    warnings: payload.warnings || [],
    fetchedAt: payload.fetchedAt || new Date().toISOString(),
  };
}

function renderRunSummary(run) {
  if (!agentRunSummary) return;
  if (!run) {
    agentRunSummary.innerHTML = "";
    return;
  }
  const warningText = run.warnings.length ? `<p>${escapeHtml(run.warnings.slice(0, 4).join(" | "))}</p>` : "";
  agentRunSummary.innerHTML = `
    <div class="agent-run-grid">
      <div><span>Run status</span><strong>${escapeHtml(run.status)}</strong></div>
      <div><span>Opportunities tested</span><strong>${run.opportunitiesTested}</strong></div>
      <div><span>Stock leads found</span><strong>${run.stockLeadsFound}</strong></div>
      <div><span>Bid-ready candidates</span><strong>${run.bidReady}</strong></div>
      <div><span>Last run</span><strong>${new Date(run.createdAt).toLocaleString("en-GB")}</strong></div>
    </div>
    ${warningText}
  `;
}

async function runTestLearn() {
  renderTenderSummary();
  renderRunSummary({
    status: "Running",
    opportunitiesTested: 0,
    stockLeadsFound: 0,
    bidReady: 0,
    warnings: [],
    createdAt: new Date().toISOString(),
  });
  if (liveTenderStatus) {
    liveTenderStatus.innerHTML = `<strong>Running full test-and-learn cycle...</strong><span>Fetching government opportunities, ranking goods-led contracts, then checking stock evidence across auction routes.</span>`;
  }

  const settings = tenderSettings();
  const tenders = await fetchLiveTenders();
  const ranked = (state.lastTenderRun || [])
    .slice()
    .sort((a, b) => b.boardScore - a.boardScore)
    .slice(0, 6);
  if (!ranked.length && !tenders.length) {
    const run = {
      id: crypto.randomUUID(),
      status: "No live opportunities returned",
      opportunitiesTested: 0,
      stockLeadsFound: 0,
      bidReady: 0,
      warnings: ["Broaden keywords or use regional watchlist routes."],
      createdAt: new Date().toISOString(),
    };
    state.runHistory.unshift(run);
    persist();
    renderRunSummary(run);
    return;
  }

  const warnings = [];
  const enriched = await Promise.all(ranked.map(async (item) => {
    try {
      const stockEvidence = await fetchStockEvidenceForTender(item.tender, settings);
      const tender = { ...item.tender, stockEvidence };
      const result = tenderScore(tender, settings);
      const projection = stockProjectionForTender(tender, settings);
      return { tender, result, projection, boardScore: opportunityBoardScore(result, projection) };
    } catch (error) {
      warnings.push(`${item.tender.title}: ${error.message}`);
      return item;
    }
  }));

  const stockLeadsFound = enriched.reduce((sum, item) => sum + (item.tender.stockEvidence?.records?.length || 0), 0);
  const bidReady = enriched.filter((item) => item.projection.coveragePercent >= 100 && item.projection.lowestRoi >= settings.roi).length;
  const run = {
    id: crypto.randomUUID(),
    status: bidReady ? "Bid-pack candidates found" : stockLeadsFound ? "Stock leads found, approval needed" : "No stock coverage yet",
    opportunitiesTested: enriched.length,
    stockLeadsFound,
    bidReady,
    warnings,
    createdAt: new Date().toISOString(),
  };
  state.runHistory.unshift(run);
  state.runHistory = state.runHistory.slice(0, 20);
  persist();
  renderTenderMatches(enriched.map((item) => item.tender), settings, `Full test-and-learn run completed. ${stockLeadsFound} stock lead(s) checked across John Pye general, John Pye Trade latest stock, and comparable auction routes.`);
  renderRunSummary(run);
  if (liveTenderStatus) {
    liveTenderStatus.innerHTML = `<strong>${escapeHtml(run.status)}.</strong><span>${enriched.length} opportunity/opportunities tested. ${stockLeadsFound} stock lead(s) found. Save a viable opportunity, verify stock, then export the bid pack.</span>`;
  }
}

async function fetchLiveTenders() {
  renderTenderSummary();
  const settings = tenderSettings();
  if (settings.source === "regional") {
    generateTenderSearches();
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>Regional government watchlist generated.</strong><span>Scotland, Wales, Northern Ireland, CCS and local portal routes need portal-side verification before they can be treated as live fetched results. Run test-and-learn with Government goods routes for automatic Contracts Finder and Find a Tender consolidation.</span>`;
    }
    tenderResults.innerHTML = `<p class="empty-state">Regional portal links are ready above. Use them for manual source checking, then paste any relevant notice into the fallback if a portal does not expose a stable live feed.</p>`;
    activeTenderReview = null;
    renderTenderWorkspace(null);
    return [];
  }
  if (liveTenderStatus) {
    liveTenderStatus.innerHTML = `<strong>Fetching live contract opportunities...</strong><span>Searching ${escapeHtml(tenderKeywordsQuery(settings))} in ${escapeHtml(settings.region)} with ${escapeHtml(settings.source === "all" ? "Contracts Finder + Find a Tender" : settings.source)}.</span>`;
  }

  try {
    const response = await fetch(`/api/tenders?keywords=${encodeURIComponent(tenderKeywordsQuery(settings))}&region=${encodeURIComponent(settings.region)}&postcode=${encodeURIComponent(settings.postcode)}&source=${encodeURIComponent(settings.source)}&valueCap=${encodeURIComponent(settings.valueCap)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Live tender search failed.");

    const tenders = payload.results.map((item) => tenderFromApiResult(item, settings));
    if (!tenders.length) {
      if (liveTenderStatus) liveTenderStatus.innerHTML = `<strong>No live results returned.</strong><span>Try broader goods keywords or open the generated contract search links.</span>`;
      tenderResults.innerHTML = "";
      activeTenderReview = null;
      renderTenderWorkspace(null);
      return [];
    }

    const warning = payload.warnings?.length ? ` Partial feed warning: ${payload.warnings.join(" | ")}` : "";
    renderTenderMatches(tenders, settings, `Live results from ${settings.source === "all" ? "Contracts Finder and Find a Tender" : settings.source}.${warning} Source: ${payload.sourceUrl}`);
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>${tenders.length} live contract result(s) loaded.</strong><span>Goods-based opportunities are ranked ahead of service-heavy notices. Review stock coverage before starting a bid pack.</span>`;
    }
    return tenders;
  } catch (error) {
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>Live contract fetch unavailable.</strong><span>${escapeHtml(error.message)} Use the generated Contracts Finder / Find a Tender links, then paste relevant results into the matcher.</span>`;
    }
    return [];
  }
}

function renderAgentSummary() {
  if (!agentSummary) return;
  const settings = currentAgentSettings();
  const demand = activeDemandRecord();
  const deadline = opportunityDeadline();
  const maxBid = maxSafeBid(settings);
  const maxCost = maxLandedCost(settings);
  agentSummary.innerHTML = `
    <div class="agent-kpis">
      <div><span>Opportunity</span><strong>${demand ? "Selected" : "Select first"}</strong></div>
      <div><span>Value / unit</span><strong>${settings.targetSale ? money(settings.targetSale) : "Add value"}</strong></div>
      <div><span>ROI target</span><strong>${percent(settings.targetRoi)}</strong></div>
      <div><span>Max landed cost</span><strong>${settings.targetSale ? money(maxCost) : "TBC"}</strong></div>
      <div><span>Max safe bid</span><strong>${settings.targetSale ? money(maxBid) : "TBC"}</strong></div>
      <div><span>Submission deadline</span><strong>${deadline || "TBC"}</strong></div>
    </div>
    ${demand ? `<p><strong>${demandLabel(demand)}</strong> is the active contract/tender opportunity. Rank lots only if they can cover the required quantity before the submission deadline and protect the ROI gate.</p>` : `<p><strong>No contract selected.</strong> Save or select a contract/tender first so stock is matched to a live opportunity before purchase review.</p>`}
    <p>Formula uses ROI = profit divided by landed cost. Landed cost includes bid, buyer premium, VAT on buyer premium, logistics, and testing/refurb buffer. Check each auction lot before bidding because fees and collection rules can vary by sale.</p>
  `;
}

function generateSearches() {
  renderAgentSummary();
  if (!agentSearchLinks) return;
  const demand = activeDemandRecord();
  const brief = activeBrief();
  const terms = searchTermsFor(brief.item);
  agentSearchLinks.innerHTML = `
    <strong>${demand ? `Stock searches for ${demandLabel(demand)}.` : "No contract/tender selected yet. Save or select an opportunity before approving stock."}</strong>
    <div>
      ${terms.map((term) => `<a class="button secondary" href="${johnPyeSearchUrl(term)}" target="_blank" rel="noopener">${term}</a>`).join("")}
      <a class="button secondary" href="https://www.johnpye.co.uk/general-auctions/" target="_blank" rel="noopener">General auctions</a>
      <a class="button secondary" href="https://www.johnpye.co.uk/live-auctions/" target="_blank" rel="noopener">Live auctions</a>
    </div>
  `;
}

function parseMoneyFromText(text) {
  const match = String(text).match(/£\s?([0-9]+(?:,[0-9]{3})*(?:\.\d{1,2})?)/);
  return match ? number(match[1]) : 0;
}

function parseMoneyLoose(value) {
  const matches = [...String(value || "").matchAll(/£?\s?([0-9]+(?:,[0-9]{3})*(?:\.\d{1,2})?)/g)]
    .map((match) => number(match[1]))
    .filter(Boolean);
  return matches.length ? Math.max(...matches) : 0;
}

function isoFromTenderDate(value) {
  const text = String(value || "");
  const direct = parseDateFromText(text);
  if (direct) return direct;
  const monthMap = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };
  const match = text.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/);
  if (!match) return "";
  return `${match[3]}-${monthMap[match[2].toLowerCase()] || "01"}-${String(match[1]).padStart(2, "0")}`;
}

function parseDateFromText(text) {
  const iso = String(text).match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const uk = String(text).match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (uk) return `${uk[3]}-${String(uk[2]).padStart(2, "0")}-${String(uk[1]).padStart(2, "0")}`;
  return "";
}

function parseQuantityFromText(text) {
  const value = String(text);
  const direct = value.match(/\b(?:qty|quantity|units?|appliances?|machines?|items?)\s*[:x-]?\s*(\d{1,4})\b/i);
  if (direct) return number(direct[1]);
  const leading = value.match(/\b(\d{1,4})\s*(?:x\s*)?(?:washing machines?|washers?|fridge freezers?|fridges?|cookers?|ovens?|dryers?|dishwashers?|microwaves?|units?|appliances?)\b/i);
  return leading ? number(leading[1]) : 1;
}

function inferAuthority(text) {
  const parts = String(text).split(/\s+\|\s+|\t+/).map((item) => item.trim()).filter(Boolean);
  return parts.find((part) => /council|nhs|housing|authority|school|college|university|trust|borough|county/i.test(part)) || parts[0] || "Public sector buyer";
}

function inferRegion(text, fallback) {
  const value = normalise(text);
  const regions = ["East Midlands", "West Midlands", "Leicester", "Nottingham", "Derby", "Birmingham", "Coventry", "Warwickshire", "Leicestershire"];
  return regions.find((region) => value.includes(normalise(region))) || fallback || "";
}

function tenderSearchTerms(tender) {
  return [...new Set([
    ...searchTermsFor(tender.item),
    tender.item,
    "white goods",
    "appliances",
    "equipment supply",
    "domestic appliances",
    "39700000",
    "39710000",
  ].filter(Boolean))];
}

function opportunityText(tender) {
  return normalise([
    tender.title,
    tender.authority,
    tender.item,
    tender.source,
    tender.noticeType,
    tender.opportunityType,
    tender.cpv,
    tender.description,
    tender.notes,
  ].filter(Boolean).join(" "));
}

function termHits(text, terms) {
  const value = normalise(text);
  return terms.filter((term) => value.includes(normalise(term)));
}

function opportunityProfile(tender) {
  const text = opportunityText(tender);
  const goodsHits = termHits(text, GOODS_SIGNAL_TERMS);
  const serviceHits = termHits(text, SERVICE_RISK_TERMS);
  const supplyLed = goodsHits.length >= 2 || /\bsupply(?:ing)?\b/.test(text);
  const serviceHeavy = serviceHits.length >= 2 || (!goodsHits.length && /\b(service|services|works|consultancy|maintenance)\b/.test(text));
  return {
    goodsHits,
    serviceHits,
    supplyLed,
    serviceHeavy,
    goodsScore: clamp(40 + goodsHits.length * 14 - serviceHits.length * 10 + (supplyLed ? 18 : 0) - (serviceHeavy ? 24 : 0)),
  };
}

function startupRouteProfile(tender, settings) {
  const text = opportunityText(tender);
  const value = number(tender.value);
  const routeHits = termHits(text, STARTUP_ROUTE_TERMS);
  const pipelineHits = termHits(text, PIPELINE_ROUTE_TERMS);
  const cpvHits = termHits(text, ["39700000", "39710000", "39711110", "39713100", "domestic appliances", "electrical domestic appliances"]);
  const anchorValue = Boolean(value && value >= STARTUP_ANCHOR_MIN && value <= Math.min(settings.valueCap || STARTUP_ANCHOR_MAX, STARTUP_ANCHOR_MAX));
  const sweetValue = Boolean(value && value >= STARTUP_ANCHOR_MIN && value <= STARTUP_ANCHOR_SWEET_MAX);
  const oversize = Boolean(value && value > STARTUP_ANCHOR_MAX);
  const belowProof = Boolean(value && value > 0 && value < STARTUP_ANCHOR_MIN);
  let score = 34;

  if (routeHits.length) score += Math.min(30, routeHits.length * 8);
  if (cpvHits.length) score += 18;
  if (anchorValue) score += 22;
  if (sweetValue) score += 10;
  if (pipelineHits.length) score += 8;
  if (belowProof) score -= 4;
  if (oversize) score -= 24;

  return {
    routeHits,
    pipelineHits,
    cpvHits,
    anchorValue,
    sweetValue,
    oversize,
    belowProof,
    score: clamp(score),
  };
}

function parseTenderLine(line, settings) {
  const url = String(line).match(/https?:\/\/\S+/)?.[0] || "";
  const cleanLine = String(line).replace(url, "").trim();
  const value = parseMoneyFromText(cleanLine);
  const item = inferCategory(cleanLine, "Portfolio / batch request");
  const quantity = parseQuantityFromText(cleanLine);
  const authority = inferAuthority(cleanLine);
  const region = inferRegion(cleanLine, settings.region);
  const deadline = parseDateFromText(cleanLine);
  return {
    authority,
    title: cleanLine.split(/\s+\|\s+|\t+/).find((part) => !/£|value|deadline|region/i.test(part) && part !== authority)?.trim() || `${item} supply opportunity`,
    source: cleanLine.includes("contractsfinder.service.gov.uk") ? "Contracts Finder pasted result" : "Find a Tender pasted result",
    url,
    item,
    quantity,
    value,
    region,
    deadline,
    noticeType: cleanLine.match(/opportunity|future opportunity|early engagement|tender/i)?.[0] || "",
    opportunityType: cleanLine.includes("contractsfinder.service.gov.uk") ? "Contract opportunity" : "Tender",
    notes: cleanLine,
  };
}

function tenderFromApiResult(result, settings) {
  const notes = [
    result.title,
    result.description,
    result.noticeType ? `Notice type: ${result.noticeType}` : "",
    result.value ? `Value: ${result.value}` : "",
    result.location ? `Location: ${result.location}` : "",
    result.deadline ? `Deadline: ${result.deadline}` : "",
    result.published ? `Published: ${result.published}` : "",
  ].filter(Boolean).join(" | ");

  return {
    authority: result.buyer || "Public sector buyer",
    title: result.title || "Contract opportunity",
    source: result.platform ? `${result.platform} live result` : "Public procurement live result",
    url: result.url || "",
    item: inferCategory(`${result.title || ""} ${result.description || ""}`, "Portfolio / batch request"),
    quantity: parseQuantityFromText(`${result.title || ""} ${result.description || ""}`),
    value: parseMoneyLoose(result.value),
    region: inferRegion(`${result.location || ""} ${result.description || ""}`, settings.region),
    deadline: isoFromTenderDate(result.deadline),
    notes,
    description: result.description || "",
    noticeType: result.noticeType || "",
    opportunityType: result.opportunityType || result.platform || "Contract opportunity",
    platform: result.platform || "",
    cpv: result.cpv || "",
  };
}

function tenderBrief(tender, settings = tenderSettings()) {
  const unitValue = opportunityUnitValue(tender);
  return {
    customer: tender.authority,
    source: tender.source || "Public contract",
    item: tender.item,
    quantity: String(number(tender.quantity) || 1),
    postcode: settings.postcode || "",
    budget: unitValue ? String(unitValue) : "",
    quality: "Standard",
    urgency: tender.deadline && daysUntil(tender.deadline) <= 7 ? "This week" : "This month",
    deadline: tender.deadline || "",
    notes: `${tender.title || ""}\n${tender.notes || ""}${tender.url ? `\n${tender.url}` : ""}`,
  };
}

function candidateMatchesTender(candidate, tender) {
  const category = normalise(candidate?.category);
  const item = normalise(tender?.item);
  const text = normalise([candidate?.title, candidate?.category, candidate?.notes, candidate?.brand].filter(Boolean).join(" "));
  const terms = tenderSearchTerms(tender).map(normalise);
  return Boolean(
    (category && item && (category === item || category.includes(item) || item.includes(category))) ||
    terms.some((term) => term && text.includes(term))
  );
}

function projectedRecordForTender(record, tender, settings) {
  const unitValue = opportunityUnitValue(tender);
  const landed = number(record?.result?.financials?.landed) || number(record?.candidate?.fees) || (number(record?.candidate?.price) + number(record?.candidate?.fees));
  const roi = roiPercent(unitValue, landed);
  const profit = unitValue && landed ? unitValue - landed : 0;
  const passes = Boolean(unitValue && landed && roi >= settings.roi && profit > 0 && recordMeetsDeadline(record, tender.deadline));
  return {
    ...record,
    result: {
      ...(record.result || {}),
      financials: {
        ...(record.result?.financials || {}),
        sale: unitValue,
        landed,
        profit,
        roi,
        passes,
      },
    },
  };
}

function stockProjectionForTender(tender, settings) {
  const required = number(tender.quantity) || 1;
  const unitValue = opportunityUnitValue(tender);
  const evidenceRecords = (tender.stockEvidence?.records || []).filter((record) => candidateMatchesTender(record.candidate, tender));
  const matchingRecords = state.candidates
    .filter((record) => record.status !== "Rejected" && candidateMatchesTender(record.candidate, tender))
    .map((record) => projectedRecordForTender(record, tender, settings))
    .concat(evidenceRecords);
  const viable = matchingRecords.filter((record) => record.result?.financials?.passes);
  const approved = viable.filter((record) => record.status === "Approved");
  const quantityAvailable = viable.reduce((sum, record) => sum + recordQuantity(record), 0);
  const approvedQuantity = approved.reduce((sum, record) => sum + recordQuantity(record), 0);
  const timedQuantity = viable.filter((record) => recordMeetsDeadline(record, tender.deadline)).reduce((sum, record) => sum + recordQuantity(record), 0);
  const timedApprovedQuantity = approved.filter((record) => recordMeetsDeadline(record, tender.deadline)).reduce((sum, record) => sum + recordQuantity(record), 0);
  const roiValues = viable.map((record) => number(record.result?.financials?.roi)).filter(Boolean);
  const landedValues = viable.map((record) => number(record.result?.financials?.landed)).filter(Boolean);
  const lowestRoi = roiValues.length ? Math.min(...roiValues) : 0;
  const lowestLanded = landedValues.length ? Math.min(...landedValues) : 0;
  const landedCost = viable.reduce((sum, record) => sum + number(record.result?.financials?.landed) * recordQuantity(record), 0);
  const targetSale = viable.reduce((sum, record) => sum + unitValue * recordQuantity(record), 0);
  const coverage = {
    records: matchingRecords,
    viable,
    approved,
    quantityAvailable,
    approvedQuantity,
    lowestRoi,
    landedCost,
    targetSale,
    projectedProfit: targetSale - landedCost,
  };
  const sourceSummary = stockSourceSummary(coverage, required);
  const coveragePercent = required ? clamp((quantityAvailable / required) * 100) : 0;
  const approvedPercent = required ? clamp((approvedQuantity / required) * 100) : 0;
  const scheduleDays = daysUntil(tender.deadline);
  const scheduleScore = !tender.deadline ? 42 : scheduleDays < 3 ? 12 : scheduleDays <= 14 ? 78 : 92;
  const maxLanded = unitValue ? unitValue / (1 + settings.roi / 100) : 0;
  const economicsScore = unitValue && lowestLanded
    ? clamp(((maxLanded - lowestLanded) / maxLanded) * 100 + 70)
    : 34;

  return {
    required,
    unitValue,
    maxLanded,
    coverage,
    sourceSummary,
    coveragePercent,
    approvedPercent,
    timedQuantity,
    timedApprovedQuantity,
    lowestLanded,
    lowestRoi,
    scheduleDays,
    scheduleScore,
    economicsScore,
  };
}

function opportunityBoardScore(tenderResult, projection) {
  return Math.round(
    tenderResult.score * 0.34 +
    number(tenderResult.startupScore) * 0.22 +
    projection.coveragePercent * 0.22 +
    projection.economicsScore * 0.14 +
    projection.scheduleScore * 0.08
  );
}

function tenderScore(tender, settings) {
  const value = number(tender.value);
  const deadlineDays = daysUntil(tender.deadline);
  const regionMatch = normalise(tender.region).includes(normalise(settings.region)) || normalise(settings.region).includes(normalise(tender.region));
  const profile = opportunityProfile(tender);
  const startupProfile = startupRouteProfile(tender, settings);
  const localMatch = regionMatch || ["leicester", "nottingham", "derby", "birmingham", "midlands"].some((place) => opportunityText(tender).includes(place));
  const keywordHit = tenderSearchTerms(tender).some((term) => opportunityText(tender).includes(normalise(term)));
  const valueOk = !value || value <= settings.valueCap;
  const valueWatch = value && value > settings.valueCap && value <= settings.valueCap * 1.5;
  const deadlineOk = deadlineDays >= 5 && deadlineDays <= 60;
  const deadlineRisk = deadlineDays < 5;
  const contractsFinder = normalise(tender.source).includes("contracts finder") || normalise(tender.platform).includes("contracts finder");
  let score = 34;

  if (value && valueOk) score += 24;
  if (valueWatch) score += 8;
  if (contractsFinder) score += 8;
  if (localMatch) score += 18;
  if (keywordHit) score += 14;
  if (profile.supplyLed) score += 18;
  if (profile.serviceHeavy) score -= 28;
  if (startupProfile.routeHits.length) score += Math.min(18, startupProfile.routeHits.length * 5);
  if (startupProfile.cpvHits.length) score += 8;
  if (startupProfile.anchorValue) score += 12;
  if (startupProfile.sweetValue) score += 6;
  if (startupProfile.pipelineHits.length) score += 5;
  if (startupProfile.oversize) score -= 20;
  score += Math.round((profile.goodsScore - 50) * 0.25);
  score += Math.round((startupProfile.score - 50) * 0.2);
  if (deadlineDays >= 5 && deadlineDays <= 28) score += 12;
  if (deadlineDays > 28 && deadlineDays <= 60) score += 6;
  if (deadlineDays < 3) score -= 18;
  if (!value) score -= 6;

  const viable = score >= 72 && profile.goodsScore >= 58 && (!profile.serviceHeavy || profile.supplyLed) && (!value || value <= settings.valueCap * 1.5) && !deadlineRisk && !startupProfile.oversize;
  const decision = viable && startupProfile.anchorValue ? "Anchor contract target" : viable ? "Worth checking stock" : score >= 58 ? "Needs goods review" : "Poor fit";
  const tone = viable ? "pass" : score >= 58 ? "prepare" : "hold";
  const checks = [
    { label: "Local/regional fit", pass: localMatch, detail: localMatch ? "Matches your region focus." : "Buyer/location needs manual checking." },
    { label: "Startup acquisition route", pass: startupProfile.score >= 58, detail: startupProfile.routeHits.length ? `Route signals: ${startupProfile.routeHits.slice(0, 4).join(", ")}.` : "No housing, temporary accommodation, FM, or void-property route signal found." },
    { label: "Anchor contract size", pass: !value || startupProfile.anchorValue || startupProfile.sweetValue, detail: value ? `${money(value)} target range: ${money(STARTUP_ANCHOR_MIN)}-${money(Math.min(settings.valueCap || STARTUP_ANCHOR_MAX, STARTUP_ANCHOR_MAX))}.` : "Value not published." },
    { label: "Goods supply fit", pass: profile.goodsScore >= 58, detail: profile.goodsHits.length ? `Goods signals: ${profile.goodsHits.slice(0, 4).join(", ")}.` : "No clear goods/appliance/material signals found." },
    { label: "CPV/category fit", pass: Boolean(startupProfile.cpvHits.length || keywordHit), detail: startupProfile.cpvHits.length ? `CPV/category signals: ${startupProfile.cpvHits.slice(0, 4).join(", ")}.` : "No domestic-appliance CPV signal found; check the specification." },
    { label: "Service risk", pass: !profile.serviceHeavy, detail: profile.serviceHits.length ? `Service signals: ${profile.serviceHits.slice(0, 4).join(", ")}.` : "No major service-heavy signals found." },
    { label: "Material fit", pass: keywordHit, detail: keywordHit ? "Appliance/material keywords found." : "Specification may not match target stock." },
    { label: "Value within starter cap", pass: valueOk || valueWatch, detail: value ? `${money(value)} against ${money(settings.valueCap)} cap.` : "Value not published." },
    { label: "Deadline workable", pass: deadlineOk, detail: tender.deadline ? `${deadlineDays} day(s) left.` : "Deadline not captured." },
  ];

  return {
    score: clamp(score),
    viable,
    decision,
    tone,
    checks,
    localMatch,
    keywordHit,
    goodsScore: profile.goodsScore,
    goodsHits: profile.goodsHits,
    serviceHits: profile.serviceHits,
    serviceHeavy: profile.serviceHeavy,
    supplyLed: profile.supplyLed,
    startupScore: startupProfile.score,
    routeHits: startupProfile.routeHits,
    cpvHits: startupProfile.cpvHits,
    anchorValue: startupProfile.anchorValue,
    pipelineHits: startupProfile.pipelineHits,
    oversize: startupProfile.oversize,
    deadlineDays,
    recommendation: viable
      ? "Save opportunity - validate stock coverage, delivery capacity, deadline timing, and 45% ROI before bidding. Use this as an anchor-contract route if the requirement can be fulfilled."
      : "Hold - either service-heavy, too broad, too large for current proof level, too close to deadline, or not enough local/material fit.",
  };
}

function bidReadiness(demand) {
  const tender = demand?.tender || {};
  const brief = demand?.brief || {};
  const requiredQuantity = number(brief.quantity) || number(tender.quantity) || 1;
  const coverage = stockCoverageForDemand(demand?.id);
  const details = document.querySelector("#tenderDetailNotes")?.value || tender.notes || brief.notes || "";
  const hasTenderLink = Boolean(tender.url || /find-tender\.service\.gov\.uk|contractsfinder\.service\.gov\.uk/i.test(String(brief.notes || "")));
  const hasDetails = normalise(details).length > 120;
  const hasApprovedStock = coverage.approvedQuantity >= requiredQuantity;
  const hasViableStock = coverage.quantityAvailable >= requiredQuantity;
  const hasMargin = coverage.lowestRoi >= DEFAULT_ROI_TARGET;
  const hasDeadline = Boolean(tender.deadline);
  const timedViableQuantity = coverage.viable
    .filter((record) => recordMeetsDeadline(record, tender.deadline))
    .reduce((sum, record) => sum + recordQuantity(record), 0);
  const timedApprovedQuantity = coverage.approved
    .filter((record) => recordMeetsDeadline(record, tender.deadline))
    .reduce((sum, record) => sum + recordQuantity(record), 0);
  const hasTimedStock = !tender.deadline || timedViableQuantity >= requiredQuantity;
  const hasTimedApprovedStock = !tender.deadline || timedApprovedQuantity >= requiredQuantity;
  const checks = [
    { label: "Opportunity details reviewed", pass: hasDetails, advice: "Paste the specification, delivery requirements, award criteria, and authority questions into Contract detail notes." },
    { label: "Public notice link available", pass: hasTenderLink, advice: "Open the notice and confirm the application route, deadline, and required documents." },
    { label: "Stock covers full quantity", pass: hasViableStock, advice: `Need ${requiredQuantity} unit(s); currently matched ${coverage.quantityAvailable}.` },
    { label: "Approved stock covers full quantity", pass: hasApprovedStock, advice: "Approve the stock candidates that will be reserved for this bid." },
    { label: "Stock available before submission", pass: hasTimedStock, advice: `Need ${requiredQuantity} unit(s) available before ${tender.deadline || "the deadline"}; currently ${timedViableQuantity}.` },
    { label: "Approved timed stock covers full quantity", pass: hasTimedApprovedStock, advice: `Approve enough stock available before ${tender.deadline || "the deadline"}.` },
    { label: "45% ROI protected", pass: hasMargin, advice: "Only proceed if the lowest matched ROI is at least 45% after fees, logistics, and refurb buffer." },
    { label: "Deadline captured", pass: hasDeadline, advice: "Confirm the submission deadline and leave time for clarification questions." },
  ];
  const passed = checks.filter((item) => item.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const decision = score >= 84 && hasApprovedStock && hasTimedApprovedStock && hasMargin ? "Proceed to manual application" : score >= 60 ? "Prepare, but do not submit yet" : "No-bid until gaps are closed";

  return { checks, score, decision, coverage, requiredQuantity, details, timedViableQuantity, timedApprovedQuantity };
}

function bidPackText(demand, readiness) {
  const tender = demand?.tender || {};
  const brief = demand?.brief || {};
  const coverage = readiness.coverage;
  const stockLines = coverage.viable.map((record) => {
    return `- ${recordQuantity(record)} x ${record.candidate.title || record.candidate.category || "matched stock"} | ${record.candidate.supplier || "supplier TBC"} | available ${record.candidate.availableBy || "TBC"} | before deadline ${recordMeetsDeadline(record, tender.deadline) ? "yes" : "no/unknown"} | landed ${money(record.result?.financials?.landed)} | ROI ${percent(record.result?.financials?.roi)} | status ${record.status}`;
  }).join("\n") || "- No viable stock attached yet.";
  const evidenceLines = (tender.stockEvidence?.records || []).map((record) => {
    return `- ${recordQuantity(record)} x ${record.candidate.title || "stock lead"} | ${record.candidate.supplier || "source TBC"} | link ${record.candidate.url || "TBC"} | landed ${money(record.result?.financials?.landed)} | ROI ${percent(record.result?.financials?.roi)} | ${record.result?.financials?.passes ? "financially viable lead" : "verify before use"}`;
  }).join("\n") || "- No live auction evidence attached to this opportunity yet.";
  const sourceSummary = stockSourceSummary(coverage, readiness.requiredQuantity);
  const missingItems = readiness.checks.filter((item) => !item.pass);

  return [
    `RentalReady Appliances - Contract application pack`,
    ``,
    `Opportunity`,
    `Contracting authority: ${brief.customer || tender.authority || "TBC"}`,
    `Title: ${tender.title || "TBC"}`,
    `Source: ${brief.source || tender.source || "Find a Tender"}`,
    `Opportunity link: ${tender.url || "TBC"}`,
    `Deadline: ${tender.deadline || "TBC"}`,
    `Estimated value: ${tender.value ? money(tender.value) : "TBC"}`,
    `Required quantity: ${readiness.requiredQuantity}`,
    ``,
    `Bid decision`,
    `Readiness: ${readiness.score}%`,
    `Recommendation: ${readiness.decision}`,
    `Matched stock quantity: ${coverage.quantityAvailable}`,
    `Approved stock quantity: ${coverage.approvedQuantity}`,
    `Matched before deadline: ${readiness.timedViableQuantity}`,
    `Approved before deadline: ${readiness.timedApprovedQuantity}`,
    `Lowest matched ROI: ${coverage.lowestRoi ? percent(coverage.lowestRoi) : "TBC"}`,
    `Projected profit from matched stock: ${money(coverage.projectedProfit)}`,
    `Stock source plan: ${sourceSummary.decision} - ${sourceSummary.message}`,
    ``,
    `Matched stock evidence`,
    stockLines,
    ``,
    `Live auction evidence leads`,
    evidenceLines,
    ``,
    `Draft response - executive summary`,
    `RentalReady Appliances proposes to fulfil the authority's appliance, material, or equipment requirement using stock-led procurement matched to the published specification, delivery window, and commercial value. The offer is built around rapid sourcing, manual lot verification, transparent cost control, and replacement planning so the buyer receives compliant goods without overpaying for unnecessary service scope.`,
    ``,
    `Draft response - fulfilment method`,
    `1. Confirm specification, required quantities, delivery locations, access constraints, packaging, warranty expectations, and any installation or removal exclusions.`,
    `2. Reserve only stock that passes condition, fee, VAT, collection, lead-time, and ROI checks.`,
    `3. Build the fulfilment schedule against the submission deadline and buyer delivery dates, including buffer for collection, test, clean, and re-delivery.`,
    `4. Keep a documented substitution route if any auction lot becomes unavailable before award or purchase approval.`,
    `5. Provide final delivery notes, serial/model references where available, and invoice/VAT status on completion.`,
    ``,
    `Draft response - commercial offer`,
    `- Price should be submitted only after stock coverage is approved for the full requirement.`,
    `- Maintain a minimum ${percent(DEFAULT_ROI_TARGET)} sourcing ROI after buyer premium, VAT on fees, logistics, testing/refurb buffer, and contingency.`,
    `- If the contract allows partial lots, price each category separately. If it requires full fulfilment, do not submit until approved stock covers ${readiness.requiredQuantity}/${readiness.requiredQuantity} units.`,
    `- State that equivalent brands/models may be supplied where the specification permits equivalent or better quality.`,
    ``,
    `Draft response - quality and risk controls`,
    `- Goods will be checked for visible condition, working order evidence, missing parts, delivery suitability, and specification fit before purchase.`,
    `- Risk items with unclear damage, no power-test evidence, missing dimensions, or collection restrictions should be excluded from the final bid.`,
    `- Stock availability is time-sensitive; final commitment depends on the auction source still holding the goods at award/purchase point.`,
    ``,
    `Likely buyer requirements to evidence`,
    `- Company registration and trading details.`,
    `- Public/product liability insurance level required by the notice.`,
    `- Bank account and refund process for unavailable goods or failed sourcing.`,
    `- VAT status wording on invoice as applicable.`,
    `- Delivery method, lead times, returns/replacement terms, and named contact.`,
    `- Any portal-specific supplier questionnaire, declarations, modern slavery statement if requested, and conflict-of-interest declarations.`,
    ``,
    `Missing items to confirm before submission`,
    ...(missingItems.length ? missingItems.map((item) => `- ${item.label}: ${item.advice}`) : ["- No readiness gaps detected, but manually verify the notice and portal before submission."]),
    ``,
    `Clarification questions to ask the buyer if not stated`,
    `- Are equivalent brands/models acceptable if performance and condition match the specification?`,
    `- Is graded/refurbished stock acceptable, or must every item be new?`,
    `- Are deliveries required in one drop or phased drops?`,
    `- Are installation, old-appliance removal, PAT testing, or disposal included or excluded?`,
    `- What evidence is required at delivery: photos, serial numbers, delivery note, warranty statement, or invoice?`,
    ``,
    `Contract detail notes`,
    readiness.details || "No tender detail notes pasted yet.",
  ].join("\n");
}

function renderBidPack() {
  if (!bidPack) return;
  const demand = activeDemandRecord();
  if (!demand?.tender) {
    bidPack.innerHTML = `<p class="empty-state">Select or add a public contract opportunity first. The bid desk only prepares application packs for contract-backed opportunities.</p>`;
    return;
  }

  const readiness = bidReadiness(demand);
  const text = bidPackText(demand, readiness);
  bidPack.innerHTML = `
    <div class="candidate-topline">
      <span>${readiness.decision}</span>
      <strong>${readiness.score}% ready</strong>
    </div>
    <h3>${demand.tender.title || "Tender opportunity"}</h3>
    <div class="decision-panel ${readiness.decision.includes("Proceed") ? "pass" : readiness.decision.includes("Prepare") ? "prepare" : "hold"}">
      <strong>${readiness.decision.includes("Proceed") ? "Worth applying for" : readiness.decision.includes("Prepare") ? "Potentially worth it" : "Not worth applying yet"}</strong>
      <span>${readiness.decision}</span>
      <p>${readiness.coverage.approvedQuantity >= readiness.requiredQuantity ? "Approved stock covers the full requirement." : `Stock gap: approve or source ${Math.max(0, readiness.requiredQuantity - readiness.coverage.approvedQuantity)} more unit(s) before submission.`}</p>
    </div>
    ${renderTenderDetails(demand.tender)}
    ${renderStockCoverage(demand, readiness)}
    <div class="roi-strip">
      <div><span>Required</span><strong>${readiness.requiredQuantity}</strong></div>
      <div><span>Matched</span><strong>${readiness.coverage.quantityAvailable}</strong></div>
      <div><span>Approved</span><strong>${readiness.coverage.approvedQuantity}</strong></div>
      <div><span>Lowest ROI</span><strong>${readiness.coverage.lowestRoi ? percent(readiness.coverage.lowestRoi) : "TBC"}</strong></div>
      <div><span>Profit</span><strong>${money(readiness.coverage.projectedProfit)}</strong></div>
    </div>
    <div class="bid-checklist">
      ${readiness.checks.map((item) => `
        <div class="${item.pass ? "pass" : "hold"}">
          <strong>${item.pass ? "Ready" : "Gap"}</strong>
          <span>${item.label}</span>
          <em>${item.advice}</em>
        </div>
      `).join("")}
    </div>
    <label>
      Application pack
      <textarea rows="18" readonly>${escapeHtml(text)}</textarea>
    </label>
    <div class="dashboard-actions">
      ${demand.tender.url ? `<a class="button secondary" href="${demand.tender.url}" target="_blank" rel="noopener">Open opportunity details</a>` : ""}
      <button class="button secondary" type="button" id="exportBidPack">Export bid pack</button>
    </div>
  `;
}

function inferCategory(text, fallback) {
  const value = normalise(text);
  if (value.includes("fridge")) return "Fridge freezer";
  if (value.includes("washer") || value.includes("washing")) return "Washing machine";
  if (value.includes("dryer")) return "Dryer";
  if (value.includes("dishwasher")) return "Dishwasher";
  if (value.includes("microwave")) return "Microwave";
  if (value.includes("oven") || value.includes("cooker") || value.includes("hob")) return "Electric cooker";
  return fallback || "Washing machine";
}

function inferBrand(text) {
  const value = normalise(text);
  return STRONG_BRANDS.find((brand) => value.includes(brand)) || "";
}

function inferLocation(text) {
  const locations = ["Nottingham", "Birmingham", "Chesterfield", "Marchington", "Edinburgh", "Bo'ness", "Derby"];
  return locations.find((location) => normalise(text).includes(normalise(location))) || "";
}

function inferCondition(text) {
  const value = normalise(text);
  if (value.includes("new boxed") || value.includes("brand new")) return "New boxed";
  if (value.includes("graded") || value.includes("ex-display") || value.includes("display")) return "Graded";
  if (value.includes("used") || value.includes("return") || value.includes("refurb")) return "Refurbished / used";
  return "Unknown / needs checking";
}

function parseLotLine(line, brief) {
  const parts = String(line).split(/\s+\|\s+|\t+/).map((item) => item.trim()).filter(Boolean);
  const url = String(line).match(/https?:\/\/\S+/)?.[0] || "";
  const cleanLine = String(line).replace(url, "").trim();
  const price = parseMoneyFromText(cleanLine);
  const title = parts.find((part) => !part.includes("http") && !/£|bid|ends|location|saleroom/i.test(part)) || cleanLine.slice(0, 90);
  return {
    supplier: cleanLine.toLowerCase().includes("john pye") ? "John Pye Auctions" : "John Pye / auction source",
    url,
    title,
    category: inferCategory(cleanLine, brief.item),
    brand: inferBrand(cleanLine),
    price,
    quantityAvailable: parseQuantityFromText(cleanLine),
    fees: "",
    targetSale: brief.budget || "",
    targetRoi: String(DEFAULT_ROI_TARGET),
    location: inferLocation(cleanLine),
    condition: inferCondition(cleanLine),
    availableBy: parseDateFromText(cleanLine),
    visual: cleanLine.toLowerCase().includes("damage") ? "Risky" : "Good",
    notes: cleanLine,
  };
}

function rankLots() {
  renderAgentSummary();
  const demand = activeDemandRecord();
  if (!demand) {
    agentResults.innerHTML = `<p class="empty-state">Select a saved contract/tender opportunity first. The agent only ranks stock against an active opportunity with quantity, value, and timing.</p>`;
    return;
  }
  const importBox = document.querySelector("#lotImport");
  const raw = importBox?.value || "";
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    agentResults.innerHTML = `<p class="empty-state">Paste one or more auction lots first. Keep one lot per line for best results.</p>`;
    return;
  }

  const brief = activeBrief();
  const ranked = lines
    .map((line) => {
      const candidate = parseLotLine(line, brief);
      const result = scoreCandidateData(brief, candidate);
      return { candidate, result };
    })
    .sort((a, b) => {
      if (a.result.financials.passes !== b.result.financials.passes) return a.result.financials.passes ? -1 : 1;
      return b.result.score - a.result.score;
    });

  agentResults.innerHTML = ranked.map((item, index) => `
    <article class="agent-result ${item.result.financials.passes ? "pass" : "hold"}">
      <div class="candidate-topline">
        <span>${item.result.financials.passes ? "Contract-backed" : "Hold"}</span>
        <strong>#${index + 1} · ${item.result.score}% fit</strong>
      </div>
      <h3>${item.candidate.title || "Auction lot"}</h3>
      <p class="demand-match">Matched to ${demandLabel(demand)} before ${opportunityDeadline(brief) || "deadline TBC"}</p>
      <p>${item.candidate.supplier} • ${recordQuantity({ candidate: item.candidate })} available • ${item.candidate.category} • ${item.candidate.location || "location TBC"}</p>
      ${renderScore(item.result)}
      <p class="candidate-note">${item.candidate.notes}</p>
      <div class="dashboard-actions">
        ${item.candidate.url ? `<a class="button secondary" href="${item.candidate.url}" target="_blank" rel="noopener">Open lot</a>` : ""}
        <button class="button primary" type="button" data-agent-add="${encodeURIComponent(JSON.stringify(item.candidate))}">Add to shortlist</button>
      </div>
    </article>
  `).join("");
}

function rankTenders() {
  renderTenderSummary();
  if (!tenderResults) return;
  const settings = tenderSettings();
  const raw = document.querySelector("#tenderImport")?.value || "";
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    tenderResults.innerHTML = `<p class="empty-state">Use Fetch live contracts for the main workflow. The manual fallback is only for opportunities the live feed misses.</p>`;
    activeTenderReview = null;
    renderTenderWorkspace(null);
    return;
  }

  const tenders = lines.map((line) => parseTenderLine(line, settings));
  renderTenderMatches(tenders, settings, "Manual fallback opportunities ranked locally.");
}

function renderTenderMatches(tenders, settings, sourceNote = "") {
  const ranked = tenders
    .map((tender) => {
      const result = tenderScore(tender, settings);
      const projection = stockProjectionForTender(tender, settings);
      return { tender, result, projection, boardScore: opportunityBoardScore(result, projection) };
    })
    .sort((a, b) => b.boardScore - a.boardScore || b.result.score - a.result.score);

  activeTenderReview = ranked[0] ? { ...ranked[0], index: 0, settings } : null;
  state.lastTenderRun = ranked;
  tenderResults.innerHTML = `
    ${sourceNote ? `<div class="live-tender-source">${escapeHtml(sourceNote)}</div>` : ""}
    <div class="tender-result-list">
    ${ranked.map((item, index) => {
    const required = number(item.tender.quantity) || 1;
    const value = number(item.tender.value);
    const deadlineLabel = item.tender.deadline || "TBC";
    const daysLabel = Number.isFinite(item.result.deadlineDays) ? `${item.result.deadlineDays} day(s)` : "Confirm";
    const unitValue = item.projection.unitValue;
    const costLabel = item.projection.lowestLanded
      ? `${money(item.projection.lowestLanded)} / ${unitValue ? money(unitValue) : "TBC"}`
      : `Need stock / ${unitValue ? money(unitValue) : "TBC"}`;
    const scheduleLabel = item.tender.deadline
      ? `${item.projection.timedQuantity}/${required} before deadline`
      : "Deadline TBC";
    const stockTone = item.projection.coveragePercent >= 100 ? "pass" : item.projection.coveragePercent > 0 ? "prepare" : "hold";
    const isSelected = activeTenderReview?.tender?.title === item.tender.title && activeTenderReview?.tender?.authority === item.tender.authority;
    const encoded = encodeURIComponent(JSON.stringify({ tender: item.tender, result: item.result, index, settings }));
    return `
      <article class="tender-result-card ${stockTone} ${isSelected ? "selected" : ""}">
        <button class="tender-result-summary" type="button" data-tender-review="${encoded}">
          <span class="result-rank">#${index + 1}</span>
          <div class="tender-summary-main">
            <h3>${escapeHtml(item.tender.title)}</h3>
            <p>${escapeHtml(item.tender.authority)} • ${escapeHtml(item.tender.region || "region TBC")}</p>
          </div>
          <div class="summary-metrics">
            <div><span>Viability</span><strong>${item.boardScore}%</strong></div>
            <div><span>Acquisition</span><strong>${Math.round(item.result.startupScore || 0)}%</strong></div>
            <div><span>Stock cover</span><strong>${item.projection.coverage.quantityAvailable}/${required}</strong></div>
            <div><span>Cost/value</span><strong>${costLabel}</strong></div>
            <div><span>Schedule</span><strong>${scheduleLabel}</strong></div>
          </div>
          <div class="decision-badge ${stockTone}">
            <strong>${item.projection.sourceSummary.decision}</strong>
            <span>${value ? money(value) : "Value TBC"} • ${daysLabel} left</span>
          </div>
        </button>
      </article>
    `;
  }).join("")}
    </div>
  `;
  renderTenderWorkspace(activeTenderReview);
}

function renderTenderWorkspace(review) {
  if (!tenderWorkspace) return;
  if (!review) {
    tenderWorkspace.innerHTML = `<p class="empty-state">Select a contract opportunity to review the full figures, goods match percentage, service risk, stock source plan, and bid-pack action.</p>`;
    return;
  }

  const { tender, result, settings, index = 0 } = review;
  const terms = tenderSearchTerms(tender);
  const required = number(tender.quantity) || 1;
  const value = number(tender.value);
  const valuePerUnit = value && required ? value / required : 0;
  const projection = stockProjectionForTender(tender, settings);
  const boardScore = opportunityBoardScore(result, projection);

  tenderWorkspace.innerHTML = `
    <div class="tender-workspace-header">
      <div>
        <span class="result-rank">Selected opportunity #${index + 1}</span>
        <h3>${escapeHtml(tender.title)}</h3>
        <p>${escapeHtml(tender.authority)} • ${escapeHtml(tender.region || "region TBC")} • ${escapeHtml(tender.source || "Find a Tender")}</p>
      </div>
      <div class="decision-badge ${projection.coveragePercent >= 100 ? "pass" : projection.coveragePercent > 0 ? "prepare" : result.tone}">
        <strong>${boardScore}% viable</strong>
        <span>${projection.sourceSummary.decision}</span>
      </div>
    </div>

    <div class="tender-fact-grid">
      <div><span>Estimated value</span><strong>${value ? money(value) : "TBC"}</strong><em>${valuePerUnit ? `${money(valuePerUnit)} per required unit` : "Confirm in notice"}</em></div>
      <div><span>Required stock</span><strong>${required}</strong><em>${escapeHtml(tender.item || "Category TBC")}</em></div>
      <div><span>Matched stock</span><strong>${projection.coverage.quantityAvailable}/${required}</strong><em>${Math.round(projection.coveragePercent)}% coverage</em></div>
      <div><span>Cost vs value</span><strong>${projection.lowestLanded ? `${money(projection.lowestLanded)} / ${valuePerUnit ? money(valuePerUnit) : "TBC"}` : "Stock needed"}</strong><em>Max landed ${projection.maxLanded ? money(projection.maxLanded) : "TBC"} at ${percent(settings.roi)} ROI</em></div>
      <div><span>Delivery schedule</span><strong>${projection.timedQuantity}/${required}</strong><em>${tender.deadline ? `available before ${tender.deadline}` : "deadline TBC"}</em></div>
      <div><span>Acquisition fit</span><strong>${Math.round(result.startupScore || 0)}%</strong><em>${result.routeHits?.length ? result.routeHits.slice(0, 3).join(", ") : "route signal TBC"}</em></div>
      <div><span>Anchor size</span><strong>${result.anchorValue ? "Target" : result.oversize ? "Too large" : "Check"}</strong><em>${value ? `${money(value)} total` : "value not published"}</em></div>
      <div><span>Goods fit</span><strong>${Math.round(result.goodsScore || result.score)}%</strong><em>${result.serviceHeavy ? "Service-heavy risk found" : "Supply-led check"}</em></div>
      <div><span>Deadline</span><strong>${tender.deadline || "TBC"}</strong><em>${Number.isFinite(result.deadlineDays) ? `${result.deadlineDays} day(s) left` : "Confirm deadline"}</em></div>
      <div><span>ROI gate</span><strong>${percent(settings.roi)}</strong><em>Only bid if landed stock protects this</em></div>
    </div>

    <div class="eligibility-grid">
      ${result.checks.map((check) => `
        <div class="${check.pass ? "pass" : "hold"}">
          <strong>${check.pass ? "Pass" : "Check"}</strong>
          <span>${check.label}</span>
          <em>${check.detail}</em>
        </div>
      `).join("")}
    </div>

    <div class="stock-source-plan">
      <strong>Stock availability and delivery review</strong>
      <p>${projection.coverage.quantityAvailable
        ? `${projection.sourceSummary.message} Lowest landed cost is ${projection.lowestLanded ? money(projection.lowestLanded) : "TBC"} against ${valuePerUnit ? money(valuePerUnit) : "the contract value"} per unit. ${projection.timedQuantity >= required ? "Matched stock fits the submission schedule." : `Only ${projection.timedQuantity}/${required} unit(s) are currently available before the deadline.`}`
        : "No matching stock is attached yet. Save this opportunity, run the stock agent, and add John Pye, BPI, or BidSpotter lots before starting a bid pack."}</p>
      ${renderStockSourceSummary(projection.sourceSummary, required)}
      ${sourceSearchLinks(terms)}
    </div>

    ${renderStockEvidencePanel(tender)}

    <details class="tender-details tender-result-details" open>
      <summary>Full contract / tender information</summary>
      <dl>
        ${tenderDetailRows(tender).map(([key, value]) => `
          <div><dt>${key}</dt><dd>${escapeHtml(value)}</dd></div>
        `).join("")}
      </dl>
      <p>${escapeHtml(tender.notes || "No tender detail text pasted yet.")}</p>
    </details>

    <p class="candidate-note">${escapeHtml(result.recommendation)}</p>
    <div class="dashboard-actions">
      ${tender.url ? `<a class="button secondary" href="${tender.url}" target="_blank" rel="noopener">Open opportunity</a>` : ""}
      ${tender.url ? `<button class="button secondary" type="button" data-tender-detail="${encodeURIComponent(tender.url)}">Load details</button>` : ""}
      <button class="button primary" type="button" data-tender-add="${encodeURIComponent(JSON.stringify(tender))}">Save opportunity & match stock</button>
    </div>
  `;
}

function addTenderDemand(encodedTender) {
  const tender = JSON.parse(decodeURIComponent(encodedTender));
  const settings = tenderSettings();
  const brief = tenderBrief(tender, settings);
  const demand = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "Tender",
    tender,
    brief,
  };
  state.demands.unshift(demand);
  state.activeDemandId = demand.id;
  state.brief = brief;
  fillForm(briefForm, brief);
  persist();
  render();
  showWorkflowStep("agent");
  scorePreview.textContent = `${demandLabel(demand)} saved from ${tender.source || "public procurement"}. Now match supplier stock before bid review.`;
}

async function loadTenderDetails(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  const notesBox = document.querySelector("#tenderDetailNotes");
  if (liveTenderStatus) {
    liveTenderStatus.innerHTML = `<strong>Loading opportunity details...</strong><span>${escapeHtml(url)}</span>`;
  }

  try {
    const response = await fetch(`/api/tender-detail?url=${encodeURIComponent(url)}`);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { ok: false, error: await response.text() || "Tender detail fetch failed." };
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Tender detail fetch failed.");

    if (notesBox) {
      notesBox.value = [
        payload.detail.title,
        payload.detail.url,
        payload.detail.text,
      ].filter(Boolean).join("\n\n");
    }
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>Opportunity details loaded.</strong><span>Review the detail notes, add the opportunity to demand, then match stock coverage.</span>`;
    }
    renderBidPack();
  } catch (error) {
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>Opportunity detail fetch unavailable.</strong><span>${escapeHtml(error.message)} Open the opportunity, copy the specification text, and paste it into Contract detail notes.</span>`;
    }
  }
}

function addAgentCandidate(encodedCandidate) {
  const demand = activeDemandRecord();
  const brief = activeBrief();
  const candidate = JSON.parse(decodeURIComponent(encodedCandidate));
  fillForm(candidateForm, candidate);
  const result = scoreCandidateData(brief, candidate);
  state.candidates.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    demandId: demand?.id || "",
    demandSnapshot: demand || null,
    brief,
    candidate,
    result,
    status: "Review",
  });
  persist();
  render();
}

function scoreCurrentCandidate() {
  const brief = activeBrief();
  const candidate = formData(candidateForm);
  const result = scoreCandidateData(brief, candidate);
  scorePreview.innerHTML = renderScore(result);
  return { brief, candidate, result };
}

function saveBrief() {
  state.brief = formData(briefForm);
  save("rentalready_sourcing_brief", state.brief);
  scorePreview.textContent = "Manual opportunity brief saved. Select it or a live contract before scoring stock.";
  renderAgentSummary();
}

function saveDemand() {
  saveBrief();
  const brief = { ...state.brief };
  if (!brief.customer && !brief.notes) {
    scorePreview.textContent = "Add the contracting authority or opportunity notes before saving.";
    return;
  }

  const demand = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "Live",
    brief,
  };

  state.demands.unshift(demand);
  state.activeDemandId = demand.id;
  persist();
  render();
  showWorkflowStep("agent");
  scorePreview.textContent = `${demandLabel(demand)} saved as an opportunity. Rank stock against this contract before purchase review.`;
}

function addCandidate(event) {
  event.preventDefault();
  const demand = activeDemandRecord();
  if (!demand) {
    scorePreview.textContent = "Select a saved contract/tender opportunity before adding stock to the shortlist.";
    showWorkflowStep("demand");
    return;
  }
  const { brief, candidate, result } = scoreCurrentCandidate();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    demandId: demand?.id || "",
    demandSnapshot: demand || null,
    brief,
    candidate,
    result,
    status: "Review",
  };
  state.brief = brief;
  state.candidates.unshift(record);
  persist();
  render();
}

function selectDemand(id) {
  const demand = state.demands.find((item) => item.id === id);
  if (!demand) return;
  state.activeDemandId = id;
  state.brief = demand.brief;
  fillForm(briefForm, demand.brief);
  save("rentalready_sourcing_active_demand", state.activeDemandId);
  persist();
  render();
  scorePreview.textContent = `${demandLabel(demand)} selected. Search and rank lots against this contract/tender opportunity.`;
}

function updateDemandStatus(id, status) {
  const demand = state.demands.find((item) => item.id === id);
  if (!demand) return;
  demand.status = status;
  demand.updatedAt = new Date().toISOString();
  trackDemandLearning(demand, status);
  if (["Submitted", "Closed", "Won", "Lost", "No Bid"].includes(status)) {
    state.activeDemandId = state.activeDemandId === id ? "" : state.activeDemandId;
  }
  persist();
  render();
}

function updateStatus(id, status) {
  const record = state.candidates.find((item) => item.id === id);
  if (!record) return;
  record.status = status;
  record.reviewedAt = new Date().toISOString();
  if (record.demandId && status === "Approved") {
    const demand = state.demands.find((item) => item.id === record.demandId);
    if (demand) {
      demand.status = "Matched";
      demand.updatedAt = record.reviewedAt;
    }
  }
  state.feedback.unshift({
    id: crypto.randomUUID(),
    candidateId: id,
    status,
    score: record.result.score,
    dimensions: record.result.dimensions,
    financials: record.result.financials,
    item: record.brief.item,
    brand: record.candidate.brand,
    supplier: record.candidate.supplier,
    createdAt: record.reviewedAt,
  });
  trackCandidateLearning(record, status);
  adjustWeights(record.result.dimensions, status);
  persist();
  render();
}

function trackCandidateLearning(record, status) {
  const createdAt = new Date().toISOString();
  const event = {
    type: "stock_decision",
    status,
    createdAt,
    score: record.result?.score,
    roi: record.result?.financials?.roi,
    profit: record.result?.financials?.profit,
    source: sourceNameFor(record),
    category: record.candidate?.category || record.brief?.item,
    buyer: record.demandSnapshot?.tender?.authority || record.brief?.customer || "",
  };
  updateLearningBucket(learningBucket(state.learningModel.sourceStats, event.source), event);
  updateLearningBucket(learningBucket(state.learningModel.categoryStats, event.category), event);
  if (event.buyer) updateLearningBucket(learningBucket(state.learningModel.buyerStats, event.buyer), event);
  updateLearningBucket(learningBucket(state.learningModel.outcomeStats, status), event);
  state.learningModel.decisionLog.unshift(event);
  state.learningModel.decisionLog = state.learningModel.decisionLog.slice(0, 250);
  state.learningModel.updatedAt = createdAt;
}

function trackDemandLearning(demand, status) {
  const createdAt = new Date().toISOString();
  const tender = demand?.tender || {};
  const coverage = stockCoverageForDemand(demand?.id);
  const event = {
    type: "opportunity_outcome",
    status,
    createdAt,
    score: coverage.quantityAvailable ? Math.min(100, coverage.quantityAvailable * 18) : 0,
    roi: coverage.lowestRoi,
    profit: coverage.projectedProfit,
    source: tender.source || demand?.brief?.source || "Opportunity source TBC",
    category: demand?.brief?.item || tender.item,
    buyer: tender.authority || demand?.brief?.customer || "",
  };
  updateLearningBucket(learningBucket(state.learningModel.categoryStats, event.category), event);
  updateLearningBucket(learningBucket(state.learningModel.sourceStats, event.source), event);
  if (event.buyer) updateLearningBucket(learningBucket(state.learningModel.buyerStats, event.buyer), event);
  const routeHits = startupRouteProfile(tender, tenderSettings()).routeHits || [];
  routeHits.forEach((route) => updateLearningBucket(learningBucket(state.learningModel.routeStats, route), event));
  updateLearningBucket(learningBucket(state.learningModel.outcomeStats, status), event);
  state.learningModel.decisionLog.unshift(event);
  state.learningModel.decisionLog = state.learningModel.decisionLog.slice(0, 250);
  state.learningModel.updatedAt = createdAt;
}

function adjustWeights(dimensions, status) {
  const entries = Object.entries(dimensions).sort((a, b) => b[1] - a[1]);
  const strongest = entries.slice(0, 2).map(([key]) => key);
  const weakest = entries.slice(-2).map(([key]) => key);

  if (status === "Approved") {
    strongest.forEach((key) => state.weights[key] = clamp(state.weights[key] + 2, 8, 44));
  } else {
    weakest.forEach((key) => state.weights[key] = clamp(state.weights[key] + 2, 8, 44));
  }

  const total = Object.values(state.weights).reduce((sum, value) => sum + value, 0);
  Object.keys(state.weights).forEach((key) => {
    state.weights[key] = Math.round((state.weights[key] / total) * 100);
  });
}

function persist() {
  save("rentalready_sourcing_brief", state.brief);
  save("rentalready_sourcing_demands", state.demands);
  save("rentalready_sourcing_active_demand", state.activeDemandId);
  save("rentalready_sourcing_candidates", state.candidates);
  save("rentalready_sourcing_feedback", state.feedback);
  save("rentalready_sourcing_run_history", state.runHistory);
  save("rentalready_sourcing_learning_model", state.learningModel);
  save("rentalready_sourcing_weights", state.weights);
}

function render() {
  fillForm(briefForm, state.brief);
  renderDemandQueue();
  renderCandidates();
  renderLearning();
  renderTenderSummary();
  renderBidPack();
  syncAgentDefaults();
}

function renderDemandQueue() {
  const demand = activeDemandRecord();
  if (activeDemand) {
    const deadline = demand?.tender?.deadline || demand?.brief?.deadline || "";
    activeDemand.innerHTML = demand ? `
      <strong>${demandLabel(demand)}</strong>
      <span>${demand.brief.quality || "Quality TBC"} • deadline ${deadline || "TBC"} • ${demand.brief.postcode || "Postcode TBC"} • ${money(demandValue(demand.brief))} contract value</span>
    ` : "No contract/tender opportunity selected yet.";
  }

  if (!demandList) return;
  if (!state.demands.length) {
    demandList.innerHTML = `<p class="empty-state">No saved contract or tender opportunities yet. Fetch live contracts in Step 3 or save a manual opportunity.</p>`;
    return;
  }

  demandList.innerHTML = state.demands.map((item) => {
    const brief = item.brief || {};
    const isActive = item.id === state.activeDemandId;
    const required = number(brief.quantity) || number(item.tender?.quantity) || 1;
    const coverage = item.tender ? stockCoverageForDemand(item.id) : null;
    const sourceSummary = coverage ? stockSourceSummary(coverage, required) : null;
    const deadline = item.tender?.deadline || brief.deadline || "";
    return `
      <article class="demand-card ${isActive ? "active" : ""}">
        <div class="candidate-topline">
          <span>${item.status}</span>
          <strong>${number(brief.quantity) || 1} needed</strong>
        </div>
        <h3>${demandLabel(item)}</h3>
        <dl>
          <div><dt>Value/unit</dt><dd>${number(brief.budget) ? money(brief.budget) : "TBC"}</dd></div>
          <div><dt>Contract value</dt><dd>${number(brief.budget) ? money(demandValue(brief)) : "TBC"}</dd></div>
          <div><dt>Fulfilment</dt><dd>${brief.postcode || "TBC"}</dd></div>
          <div><dt>Deadline</dt><dd>${deadline || "TBC"}</dd></div>
        </dl>
        ${sourceSummary ? `
          <div class="demand-source-status ${sourceSummary.tone}">
            <strong>${sourceSummary.decision}</strong>
            <span>${coverage.quantityAvailable}/${required} viable stock matched • ${coverage.approvedQuantity} approved</span>
          </div>
        ` : ""}
        <p>${brief.notes || "No opportunity notes saved."}</p>
        <div class="dashboard-actions">
          <button class="button primary" type="button" data-demand-select="${item.id}">${isActive ? "Selected" : "Use for matching"}</button>
          <button class="button secondary" type="button" data-demand-status="Bid Pack" data-demand-id="${item.id}">Bid pack</button>
          <button class="button secondary" type="button" data-demand-status="Submitted" data-demand-id="${item.id}">Submitted</button>
          <button class="button secondary" type="button" data-demand-status="Won" data-demand-id="${item.id}">Won</button>
          <button class="button secondary" type="button" data-demand-status="Lost" data-demand-id="${item.id}">Lost</button>
          <button class="button secondary" type="button" data-demand-status="No Bid" data-demand-id="${item.id}">No bid</button>
          <button class="button secondary danger" type="button" data-demand-status="Closed" data-demand-id="${item.id}">Close</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderCandidates() {
  if (!state.candidates.length) {
    candidateList.innerHTML = `<p class="empty-state">No candidates yet. Add a supplier product to begin the sourcing review.</p>`;
    return;
  }

  candidateList.innerHTML = state.candidates.map((record) => `
    <article class="candidate-card ${record.status.toLowerCase()}">
      <div class="candidate-topline">
        <span>${record.status}</span>
        <strong>${record.result.score}% fit</strong>
      </div>
      <h3>${record.candidate.title || "Untitled candidate"}</h3>
      <p class="demand-match">${record.demandSnapshot ? `Contract-backed: ${demandLabel(record.demandSnapshot)}` : "No saved contract/tender opportunity attached."}</p>
      <p>${record.candidate.supplier || "Supplier to confirm"} • ${record.candidate.category || "Category to confirm"} • ${record.candidate.brand || "Brand unknown"}</p>
      <dl>
        <div><dt>Landed est.</dt><dd>${money(record.result.financials?.landed || number(record.candidate.price) + number(record.candidate.fees))}</dd></div>
        <div><dt>ROI</dt><dd>${record.result.financials?.sale ? percent(record.result.financials.roi) : "TBC"}</dd></div>
        <div><dt>Quantity</dt><dd>${recordQuantity(record)} available</dd></div>
        <div><dt>Opportunity</dt><dd>${record.brief.quantity || 1} x ${record.brief.item || "item"} for ${record.brief.postcode || "postcode TBC"}</dd></div>
        <div><dt>Timing</dt><dd>deadline ${record.brief.deadline || record.demandSnapshot?.tender?.deadline || "TBC"} / available ${record.candidate.availableBy || "TBC"}</dd></div>
        <div><dt>Quality</dt><dd>${record.brief.quality || "TBC"} / ${record.candidate.condition || "TBC"}</dd></div>
      </dl>
      ${renderScore(record.result)}
      <p class="candidate-note">${record.candidate.notes || "No candidate notes added."}</p>
      <div class="dashboard-actions">
        ${record.candidate.url ? `<a class="button secondary" href="${record.candidate.url}" target="_blank" rel="noopener">Open supplier lot</a>` : ""}
        <button class="button primary" type="button" data-status="Approved" data-id="${record.id}">Approve</button>
        <button class="button secondary danger" type="button" data-status="Rejected" data-id="${record.id}">Reject</button>
      </div>
    </article>
  `).join("");
}

function renderLearning() {
  weightsList.innerHTML = Object.entries(state.weights).map(([key, value]) => `
    <div>
      <span>${label(key)}</span>
      <meter min="0" max="100" value="${value}"></meter>
      <strong>${value}%</strong>
    </div>
  `).join("");

  const approved = state.feedback.filter((item) => item.status === "Approved").length;
  const rejected = state.feedback.filter((item) => item.status === "Rejected").length;
  const liveDemand = state.demands.filter((item) => ["Live", "Tender", "Matched", "Bid Pack"].includes(item.status)).length;
  const submitted = state.demands.filter((item) => item.status === "Submitted").length;
  const won = state.demands.filter((item) => item.status === "Won").length;
  const lost = state.demands.filter((item) => item.status === "Lost").length;
  const lastRun = state.runHistory[0];
  const confidence = modelConfidence();
  memoryStats.innerHTML = `
    <strong>${state.feedback.length}</strong>
    <span>review decisions recorded</span>
    <p>${approved} approved, ${rejected} rejected. ${liveDemand} live or matched contract/tender opportunities are available for stock-led fulfilment. ${submitted} submitted, ${won} won, ${lost} lost.${lastRun ? ` Last test-and-learn run: ${lastRun.status} with ${lastRun.stockLeadsFound} stock lead(s).` : ""}</p>
  `;
  if (modelHealth) {
    modelHealth.innerHTML = `
      <div><span>Model confidence</span><strong>${confidence}%</strong><em>${confidence >= 70 ? "Marketable training base forming" : confidence >= 40 ? "Useful but needs more outcomes" : "Needs more decisions and bid outcomes"}</em></div>
      <div><span>Learning version</span><strong>${escapeHtml(state.learningModel.version.replace("20260608-", ""))}</strong><em>Updated ${state.learningModel.updatedAt ? new Date(state.learningModel.updatedAt).toLocaleDateString("en-GB") : "today"}</em></div>
      <div><span>Run history</span><strong>${state.runHistory.length}</strong><em>Full test-and-learn cycles stored</em></div>
      <div><span>Outcome signals</span><strong>${Object.values(state.learningModel.outcomeStats).reduce((sum, item) => sum + item.seen, 0)}</strong><em>Submitted, won, lost and no-bid memory</em></div>
    `;
  }
  if (sourceLearning) {
    sourceLearning.innerHTML = topLearningRows(state.learningModel.sourceStats, "No source decisions yet. Approve or reject stock to teach source reliability.");
  }
  if (routeLearning) {
    const combined = {
      ...state.learningModel.routeStats,
      ...Object.fromEntries(Object.entries(state.learningModel.buyerStats).map(([key, value]) => [`Buyer: ${key}`, value])),
    };
    routeLearning.innerHTML = topLearningRows(combined, "No route or buyer outcomes yet. Mark bids as submitted, won, lost, or no-bid.");
  }
  if (outcomeLearning) {
    outcomeLearning.innerHTML = topLearningRows(state.learningModel.outcomeStats, "No bid outcomes recorded yet.");
  }
}

function syncAgentDefaults() {
  const targetField = document.querySelector("#targetSalePrice");
  const postcodeField = document.querySelector("#agentPostcode");
  const brief = activeBrief();
  if (targetField && !targetField.value && brief.budget) targetField.placeholder = `Opportunity value/unit ${money(brief.budget)}`;
  if (postcodeField && !postcodeField.value && brief.postcode) postcodeField.placeholder = `Fulfilment postcode ${brief.postcode}`;
  renderAgentSummary();
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    brand: "RentalReady Appliances",
    brief: state.brief,
    activeDemandId: state.activeDemandId,
    demands: state.demands,
    candidates: state.candidates,
    feedback: state.feedback,
    runHistory: state.runHistory,
    learningModel: state.learningModel,
    weights: state.weights,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rentalready-sourcing-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(reader.result);
      state.brief = payload.brief || state.brief || {};
      state.activeDemandId = payload.activeDemandId || state.activeDemandId || "";
      state.demands = Array.isArray(payload.demands) ? payload.demands : state.demands;
      state.candidates = Array.isArray(payload.candidates) ? payload.candidates : state.candidates;
      state.feedback = Array.isArray(payload.feedback) ? payload.feedback : state.feedback;
      state.runHistory = Array.isArray(payload.runHistory) ? payload.runHistory : state.runHistory;
      state.learningModel = normaliseLearningModel(payload.learningModel || payload.model || state.learningModel);
      state.weights = { ...DEFAULT_WEIGHTS, ...(payload.weights || state.weights) };
      persist();
      render();
      scorePreview.textContent = "Learning data imported. The sourcing agent now has the imported memory available for future scoring.";
    } catch (error) {
      scorePreview.textContent = `Import failed: ${error.message}`;
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function exportActiveBidPack() {
  const demand = activeDemandRecord();
  if (!demand?.tender) return;
  const readiness = bidReadiness(demand);
  const blob = new Blob([bidPackText(demand, readiness)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeOpportunity = normalise(demand.brief?.customer || demand.tender?.title || "contract").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `rentalready-bid-pack-${safeOpportunity || "contract"}-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearData() {
  if (!confirm("Clear all saved sourcing dashboard data in this browser?")) return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith("rentalready_sourcing_"))
    .forEach((key) => localStorage.removeItem(key));
  state.brief = {};
  state.demands = [];
  state.activeDemandId = "";
  state.candidates = [];
  state.feedback = [];
  state.runHistory = [];
  state.learningModel = normaliseLearningModel({});
  state.weights = { ...DEFAULT_WEIGHTS };
  render();
}

document.querySelector("#saveBrief")?.addEventListener("click", saveBrief);
document.querySelector("#saveDemand")?.addEventListener("click", saveDemand);
document.querySelector("#scoreCandidate")?.addEventListener("click", scoreCurrentCandidate);
document.querySelector("#generateSearches")?.addEventListener("click", generateSearches);
document.querySelector("#rankLots")?.addEventListener("click", rankLots);
document.querySelector("#generateTenderSearches")?.addEventListener("click", generateTenderSearches);
document.querySelector("#fetchLiveTenders")?.addEventListener("click", fetchLiveTenders);
document.querySelector("#runTestLearn")?.addEventListener("click", runTestLearn);
document.querySelector("#rankTenders")?.addEventListener("click", rankTenders);
document.querySelector("#prepareBidPack")?.addEventListener("click", renderBidPack);
workflowTabs.forEach((tab) => {
  tab.addEventListener("click", () => showWorkflowStep(tab.dataset.stepTab));
});
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const step = stepFromHash(link.getAttribute("href"));
  if (!step) return;
  event.preventDefault();
  showWorkflowStep(step);
});
window.addEventListener("hashchange", () => {
  const step = stepFromHash();
  if (step) showWorkflowStep(step, false);
});
candidateForm?.addEventListener("submit", addCandidate);
demandList?.addEventListener("click", (event) => {
  const selectButton = event.target.closest("button[data-demand-select]");
  if (selectButton) selectDemand(selectButton.dataset.demandSelect);

  const statusButton = event.target.closest("button[data-demand-status]");
  if (statusButton) updateDemandStatus(statusButton.dataset.demandId, statusButton.dataset.demandStatus);
});
candidateList?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-status]");
  if (button) updateStatus(button.dataset.id, button.dataset.status);
});
agentResults?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-agent-add]");
  if (button) addAgentCandidate(button.dataset.agentAdd);
});
tenderResults?.addEventListener("click", (event) => {
  const reviewButton = event.target.closest("button[data-tender-review]");
  if (reviewButton) {
    activeTenderReview = JSON.parse(decodeURIComponent(reviewButton.dataset.tenderReview));
    renderTenderWorkspace(activeTenderReview);
    tenderResults.querySelectorAll(".tender-result-card.selected").forEach((card) => card.classList.remove("selected"));
    reviewButton.closest(".tender-result-card")?.classList.add("selected");
  }

  const detailButton = event.target.closest("button[data-tender-detail]");
  if (detailButton) loadTenderDetails(detailButton.dataset.tenderDetail);

  const button = event.target.closest("button[data-tender-add]");
  if (button) addTenderDemand(button.dataset.tenderAdd);
});
tenderWorkspace?.addEventListener("click", (event) => {
  const detailButton = event.target.closest("button[data-tender-detail]");
  if (detailButton) loadTenderDetails(detailButton.dataset.tenderDetail);

  const button = event.target.closest("button[data-tender-add]");
  if (button) addTenderDemand(button.dataset.tenderAdd);
});
bidPack?.addEventListener("click", (event) => {
  if (event.target.closest("#exportBidPack")) exportActiveBidPack();
});
document.querySelector("#exportData")?.addEventListener("click", exportData);
document.querySelector("#importData")?.addEventListener("change", importData);
document.querySelector("#clearData")?.addEventListener("click", clearData);

render();
showWorkflowStep(activeWorkflowStep(), false);
