const DEFAULT_WEIGHTS = {
  demand: 20,
  category: 28,
  roi: 22,
  budget: 18,
  quality: 18,
  urgency: 16,
  logistics: 14,
  availability: 4,
};

const DEFAULT_ROI_TARGET = 45;
const JOHN_PYE_SEARCH_BASE = "https://www.johnpye.co.uk/";
const FIND_TENDER_SEARCH_BASE = "https://www.find-tender.service.gov.uk/Search/Results";
const STOCK_SOURCES = [
  {
    name: "John Pye",
    urlFor: (term) => `https://www.johnpye.co.uk/?s=${encodeURIComponent(term)}`,
  },
  {
    name: "BPI Auctions",
    urlFor: (term) => `https://www.bpiauctions.com/?s=${encodeURIComponent(term)}`,
  },
  {
    name: "BidSpotter",
    urlFor: (term) => `https://www.bidspotter.co.uk/en-gb/search-results?searchTerm=${encodeURIComponent(term)}`,
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

const state = {
  brief: load("rentalready_sourcing_brief", {}),
  demands: load("rentalready_sourcing_demands", []),
  activeDemandId: load("rentalready_sourcing_active_demand", ""),
  candidates: load("rentalready_sourcing_candidates", []),
  feedback: load("rentalready_sourcing_feedback", []),
  weights: load("rentalready_sourcing_weights", DEFAULT_WEIGHTS),
};

state.weights = { ...DEFAULT_WEIGHTS, ...state.weights };

const briefForm = document.querySelector("#briefForm");
const candidateForm = document.querySelector("#candidateForm");
const scorePreview = document.querySelector("#scorePreview");
const candidateList = document.querySelector("#candidateList");
const weightsList = document.querySelector("#weightsList");
const memoryStats = document.querySelector("#memoryStats");
const activeDemand = document.querySelector("#activeDemand");
const demandList = document.querySelector("#demandList");
const tenderSummary = document.querySelector("#tenderSummary");
const tenderSearchLinks = document.querySelector("#tenderSearchLinks");
const tenderResults = document.querySelector("#tenderResults");
const liveTenderStatus = document.querySelector("#liveTenderStatus");
const bidPack = document.querySelector("#bidPack");
const agentSummary = document.querySelector("#agentSummary");
const agentSearchLinks = document.querySelector("#agentSearchLinks");
const agentResults = document.querySelector("#agentResults");

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
  const quantity = number(brief.quantity) || 1;
  return `${brief.customer || "Unnamed buyer"} - ${quantity} x ${brief.item || "appliance"}`;
}

function demandValue(brief) {
  return (number(brief.quantity) || 1) * number(brief.budget);
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

function tenderDetailRows(tender) {
  return [
    ["Buyer", tender.authority || "TBC"],
    ["Title", tender.title || "TBC"],
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
  const matchedPercent = required ? clamp((coverage.quantityAvailable / required) * 100) : 0;
  const approvedPercent = required ? clamp((coverage.approvedQuantity / required) * 100) : 0;
  const lines = coverage.viable.map((record) => `
    <div class="stock-line">
      <strong>${recordQuantity(record)} x ${escapeHtml(record.candidate.title || record.candidate.category || "Matched stock")}</strong>
      <span>${escapeHtml(record.candidate.supplier || "Supplier TBC")} • ${escapeHtml(record.candidate.location || "Location TBC")} • ${record.status}</span>
      <em>Landed ${money(record.result?.financials?.landed)} • ROI ${percent(record.result?.financials?.roi)}</em>
    </div>
  `).join("") || `<p class="empty-state">No viable matched stock yet. Add auction lots to this tender demand before deciding to bid.</p>`;

  return `
    <div class="stock-coverage">
      <div class="coverage-kpis">
        <div><span>Required</span><strong>${required}</strong></div>
        <div><span>Matched</span><strong>${coverage.quantityAvailable}</strong><meter min="0" max="100" value="${matchedPercent}"></meter></div>
        <div><span>Approved</span><strong>${coverage.approvedQuantity}</strong><meter min="0" max="100" value="${approvedPercent}"></meter></div>
        <div><span>Lowest ROI</span><strong>${coverage.lowestRoi ? percent(coverage.lowestRoi) : "TBC"}</strong></div>
        <div><span>Profit</span><strong>${money(coverage.projectedProfit)}</strong></div>
      </div>
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
  let score = activeDemandRecord() ? 68 : 34;
  if (brief.customer) score += 12;
  if (number(brief.budget)) score += 10;
  if (brief.postcode) score += 6;
  if (number(brief.quantity) > 0) score += 4;
  if (normalise(brief.urgency).includes("today") || normalise(brief.urgency).includes("week")) score += 4;
  if (normalise(brief.notes).length > 60) score += 4;
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
    return "Hold - save or select a buyer request before purchase review.";
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
    region: document.querySelector("#tenderRegion")?.value || "East Midlands",
    valueCap: number(document.querySelector("#tenderValueCap")?.value) || 30000,
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

function sourceSearchLinks(terms) {
  const uniqueTerms = [...new Set(terms.filter(Boolean))].slice(0, 4);
  return STOCK_SOURCES.map((source) => `
    <div>
      <strong>${source.name}</strong>
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
      <div><span>Starter cap</span><strong>${money(settings.valueCap)}</strong></div>
      <div><span>ROI gate</span><strong>${percent(settings.roi)}</strong></div>
      <div><span>Sources</span><strong>${STOCK_SOURCES.length}</strong></div>
      <div><span>Mode</span><strong>Demand first</strong></div>
    </div>
    <p>Start with below-cap local/regional supply opportunities. Add only tenders where stock availability, delivery capacity, and margin can be checked before bidding.</p>
  `;
}

function generateTenderSearches() {
  renderTenderSummary();
  if (!tenderSearchLinks) return;
  const settings = tenderSettings();
  const terms = settings.keywords.length ? settings.keywords : ["white goods", "appliances", "kitchen equipment"];
  tenderSearchLinks.innerHTML = `
    <strong>Find a Tender searches</strong>
    <div>
      ${terms.map((term) => `<a class="button secondary" href="${findTenderSearchUrl(term, settings)}" target="_blank" rel="noopener">${term}</a>`).join("")}
      <a class="button secondary" href="https://www.find-tender.service.gov.uk/Search" target="_blank" rel="noopener">Advanced search</a>
    </div>
    <strong>Stock source searches</strong>
    ${sourceSearchLinks(terms)}
  `;
}

function tenderKeywordsQuery(settings) {
  return settings.keywords.length ? settings.keywords.join(" OR ") : "white goods appliances kitchen equipment";
}

async function fetchLiveTenders() {
  renderTenderSummary();
  const settings = tenderSettings();
  if (liveTenderStatus) {
    liveTenderStatus.innerHTML = `<strong>Fetching live Find a Tender results...</strong><span>Searching ${escapeHtml(tenderKeywordsQuery(settings))} in ${escapeHtml(settings.region)}.</span>`;
  }

  try {
    const response = await fetch(`/api/tenders?keywords=${encodeURIComponent(tenderKeywordsQuery(settings))}&region=${encodeURIComponent(settings.region)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Live tender search failed.");

    const tenders = payload.results.map((item) => tenderFromApiResult(item, settings));
    if (!tenders.length) {
      if (liveTenderStatus) liveTenderStatus.innerHTML = `<strong>No live results returned.</strong><span>Try broader keywords or open the Find a Tender search links.</span>`;
      tenderResults.innerHTML = "";
      return;
    }

    renderTenderMatches(tenders, settings, `Live results from Find a Tender. Source: ${payload.sourceUrl}`);
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>${tenders.length} live tender results loaded.</strong><span>Review details, check stock coverage, then add viable opportunities to demand.</span>`;
    }
  } catch (error) {
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>Live tender fetch unavailable.</strong><span>${escapeHtml(error.message)} Use the generated Find a Tender links, then paste relevant results into the matcher.</span>`;
    }
  }
}

function renderAgentSummary() {
  if (!agentSummary) return;
  const settings = currentAgentSettings();
  const demand = activeDemandRecord();
  const maxBid = maxSafeBid(settings);
  const maxCost = maxLandedCost(settings);
  agentSummary.innerHTML = `
    <div class="agent-kpis">
      <div><span>Buyer status</span><strong>${demand ? "Selected" : "Select demand"}</strong></div>
      <div><span>Target sale</span><strong>${settings.targetSale ? money(settings.targetSale) : "Add budget"}</strong></div>
      <div><span>ROI target</span><strong>${percent(settings.targetRoi)}</strong></div>
      <div><span>Max landed cost</span><strong>${settings.targetSale ? money(maxCost) : "TBC"}</strong></div>
      <div><span>Max safe bid</span><strong>${settings.targetSale ? money(maxBid) : "TBC"}</strong></div>
    </div>
    ${demand ? `<p><strong>${demandLabel(demand)}</strong> is the active buyer request. Rank lots only if this request is still live and the customer budget/timing are realistic.</p>` : `<p><strong>No buyer selected.</strong> Add or select a demand request first so stock is matched to a waiting customer before purchase review.</p>`}
    <p>Formula uses ROI = profit divided by landed cost. Landed cost includes bid, buyer premium, VAT on buyer premium, logistics, and testing/refurb buffer. Check each auction lot before bidding because fees and collection rules can vary by sale.</p>
  `;
}

function generateSearches() {
  saveBrief();
  renderAgentSummary();
  if (!agentSearchLinks) return;
  const demand = activeDemandRecord();
  const brief = activeBrief();
  const terms = searchTermsFor(brief.item);
  agentSearchLinks.innerHTML = `
    <strong>${demand ? `Searches for ${demandLabel(demand)}.` : "No buyer request selected yet. Add or select demand before approving stock."}</strong>
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
  const match = String(value || "").match(/£?\s?([0-9]+(?:,[0-9]{3})*(?:\.\d{1,2})?)/);
  return match ? number(match[1]) : 0;
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
  ].filter(Boolean))];
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
    source: "Find a Tender",
    url,
    item,
    quantity,
    value,
    region,
    deadline,
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
    title: result.title || "Tender opportunity",
    source: "Find a Tender live result",
    url: result.url || "",
    item: inferCategory(`${result.title || ""} ${result.description || ""}`, "Portfolio / batch request"),
    quantity: parseQuantityFromText(`${result.title || ""} ${result.description || ""}`),
    value: parseMoneyLoose(result.value),
    region: inferRegion(`${result.location || ""} ${result.description || ""}`, settings.region),
    deadline: isoFromTenderDate(result.deadline),
    notes,
    description: result.description || "",
  };
}

function tenderScore(tender, settings) {
  const value = number(tender.value);
  const deadlineDays = daysUntil(tender.deadline);
  const regionMatch = normalise(tender.region).includes(normalise(settings.region)) || normalise(settings.region).includes(normalise(tender.region));
  const localMatch = regionMatch || ["leicester", "nottingham", "derby", "birmingham", "midlands"].some((place) => normalise(tender.notes).includes(place));
  const keywordHit = tenderSearchTerms(tender).some((term) => normalise(tender.notes).includes(normalise(term)));
  let score = 42;

  if (value && value <= settings.valueCap) score += 24;
  if (value && value > settings.valueCap && value <= settings.valueCap * 1.5) score += 8;
  if (localMatch) score += 18;
  if (keywordHit) score += 14;
  if (deadlineDays >= 5 && deadlineDays <= 28) score += 12;
  if (deadlineDays > 28 && deadlineDays <= 60) score += 6;
  if (deadlineDays < 3) score -= 18;
  if (!value) score -= 6;

  const viable = score >= 72 && (!value || value <= settings.valueCap * 1.5);
  return {
    score: clamp(score),
    viable,
    localMatch,
    keywordHit,
    deadlineDays,
    recommendation: viable
      ? "Add to demand queue - then validate stock availability and margin before bidding."
      : "Hold - either too broad, too large, too close to deadline, or not enough local/material fit.",
  };
}

function bidReadiness(demand) {
  const tender = demand?.tender || {};
  const brief = demand?.brief || {};
  const requiredQuantity = number(brief.quantity) || number(tender.quantity) || 1;
  const coverage = stockCoverageForDemand(demand?.id);
  const details = document.querySelector("#tenderDetailNotes")?.value || tender.notes || brief.notes || "";
  const hasTenderLink = Boolean(tender.url || String(brief.notes || "").includes("find-tender.service.gov.uk"));
  const hasDetails = normalise(details).length > 120;
  const hasApprovedStock = coverage.approvedQuantity >= requiredQuantity;
  const hasViableStock = coverage.quantityAvailable >= requiredQuantity;
  const hasMargin = coverage.lowestRoi >= DEFAULT_ROI_TARGET;
  const hasDeadline = Boolean(tender.deadline);
  const checks = [
    { label: "Tender details reviewed", pass: hasDetails, advice: "Paste the specification, delivery requirements, award criteria, and buyer questions into Tender detail notes." },
    { label: "Tender notice link available", pass: hasTenderLink, advice: "Open the tender notice and confirm the application route, deadline, and required documents." },
    { label: "Stock covers full quantity", pass: hasViableStock, advice: `Need ${requiredQuantity} unit(s); currently matched ${coverage.quantityAvailable}.` },
    { label: "Approved stock covers full quantity", pass: hasApprovedStock, advice: "Approve the stock candidates that will be reserved for this bid." },
    { label: "45% ROI protected", pass: hasMargin, advice: "Only proceed if the lowest matched ROI is at least 45% after fees, logistics, and refurb buffer." },
    { label: "Deadline captured", pass: hasDeadline, advice: "Confirm the submission deadline and leave time for clarification questions." },
  ];
  const passed = checks.filter((item) => item.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const decision = score >= 84 && hasApprovedStock && hasMargin ? "Proceed to manual application" : score >= 60 ? "Prepare, but do not submit yet" : "No-bid until gaps are closed";

  return { checks, score, decision, coverage, requiredQuantity, details };
}

function bidPackText(demand, readiness) {
  const tender = demand?.tender || {};
  const brief = demand?.brief || {};
  const coverage = readiness.coverage;
  const stockLines = coverage.viable.map((record) => {
    return `- ${recordQuantity(record)} x ${record.candidate.title || record.candidate.category || "matched stock"} | ${record.candidate.supplier || "supplier TBC"} | landed ${money(record.result?.financials?.landed)} | ROI ${percent(record.result?.financials?.roi)} | status ${record.status}`;
  }).join("\n") || "- No viable stock attached yet.";

  return [
    `RentalReady Appliances - Tender application pack`,
    ``,
    `Opportunity`,
    `Buyer: ${brief.customer || tender.authority || "TBC"}`,
    `Title: ${tender.title || "TBC"}`,
    `Source: ${brief.source || tender.source || "Find a Tender"}`,
    `Tender link: ${tender.url || "TBC"}`,
    `Deadline: ${tender.deadline || "TBC"}`,
    `Estimated value: ${tender.value ? money(tender.value) : "TBC"}`,
    `Required quantity: ${readiness.requiredQuantity}`,
    ``,
    `Bid decision`,
    `Readiness: ${readiness.score}%`,
    `Recommendation: ${readiness.decision}`,
    `Matched stock quantity: ${coverage.quantityAvailable}`,
    `Approved stock quantity: ${coverage.approvedQuantity}`,
    `Lowest matched ROI: ${coverage.lowestRoi ? percent(coverage.lowestRoi) : "TBC"}`,
    `Projected profit from matched stock: ${money(coverage.projectedProfit)}`,
    ``,
    `Matched stock evidence`,
    stockLines,
    ``,
    `Suggested response points`,
    `- RentalReady Appliances can source and supply the requested appliance/equipment requirement using reviewed stock matched to the specification.`,
    `- Stock is only committed after final condition, collection, delivery, and compliance checks are complete.`,
    `- Delivery planning should confirm postcode, access, timing, and any old-appliance removal or installation exclusions.`,
    `- The bid should state any assumptions around refurbished/graded condition, warranties, replacement route, and lead times.`,
    ``,
    `Missing items to confirm before submission`,
    ...readiness.checks.filter((item) => !item.pass).map((item) => `- ${item.label}: ${item.advice}`),
    ``,
    `Tender detail notes`,
    readiness.details || "No tender detail notes pasted yet.",
  ].join("\n");
}

function renderBidPack() {
  if (!bidPack) return;
  const demand = activeDemandRecord();
  if (!demand?.tender) {
    bidPack.innerHTML = `<p class="empty-state">Select or add a Find a Tender opportunity first. The bid desk only prepares application packs for tender-backed demand.</p>`;
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
      ${demand.tender.url ? `<a class="button secondary" href="${demand.tender.url}" target="_blank" rel="noopener">Open tender details</a>` : ""}
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
  saveBrief();
  renderAgentSummary();
  const demand = activeDemandRecord();
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
        <span>${item.result.financials.passes && demand ? "Buyer-backed" : "Hold"}</span>
        <strong>#${index + 1} · ${item.result.score}% fit</strong>
      </div>
      <h3>${item.candidate.title || "Auction lot"}</h3>
      <p class="demand-match">${demand ? `Matched to ${demandLabel(demand)}` : "No buyer request selected - do not buy yet."}</p>
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
    tenderResults.innerHTML = `<p class="empty-state">Paste one or more Find a Tender opportunities first. Keep one opportunity per line for best results.</p>`;
    return;
  }

  const tenders = lines.map((line) => parseTenderLine(line, settings));
  renderTenderMatches(tenders, settings, "Pasted tender opportunities ranked locally.");
}

function renderTenderMatches(tenders, settings, sourceNote = "") {
  const ranked = tenders
    .map((tender) => ({ tender, result: tenderScore(tender, settings) }))
    .sort((a, b) => b.result.score - a.result.score);

  tenderResults.innerHTML = `
    ${sourceNote ? `<div class="live-tender-source">${escapeHtml(sourceNote)}</div>` : ""}
    ${ranked.map((item, index) => {
    const terms = tenderSearchTerms(item.tender);
    return `
      <article class="agent-result ${item.result.viable ? "pass" : "hold"}">
        <div class="candidate-topline">
          <span>${item.result.viable ? "Tender demand" : "Hold"}</span>
          <strong>#${index + 1} · ${Math.round(item.result.score)}% fit</strong>
        </div>
        <h3>${item.tender.title}</h3>
        <p class="demand-match">${item.tender.authority} • ${item.tender.region || "region TBC"} • ${item.tender.value ? money(item.tender.value) : "value TBC"}</p>
        <p>${item.result.recommendation}</p>
        ${renderTenderDetails(item.tender)}
        <div class="roi-strip">
          <div><span>Required stock</span><strong>${number(item.tender.quantity) || 1}</strong></div>
          <div><span>Deadline</span><strong>${item.tender.deadline || "TBC"}</strong></div>
          <div><span>Days left</span><strong>${Number.isFinite(item.result.deadlineDays) ? item.result.deadlineDays : "TBC"}</strong></div>
          <div><span>Local fit</span><strong>${item.result.localMatch ? "Yes" : "Check"}</strong></div>
          <div><span>ROI gate</span><strong>${percent(settings.roi)}</strong></div>
        </div>
        <div class="agent-search-links">
          <strong>Check stock sources before bidding</strong>
          ${sourceSearchLinks(terms)}
        </div>
        <p class="candidate-note">${item.tender.notes}</p>
        <div class="dashboard-actions">
          ${item.tender.url ? `<a class="button secondary" href="${item.tender.url}" target="_blank" rel="noopener">Open tender</a>` : ""}
          ${item.tender.url ? `<button class="button secondary" type="button" data-tender-detail="${encodeURIComponent(item.tender.url)}">Load details</button>` : ""}
          <button class="button primary" type="button" data-tender-add="${encodeURIComponent(JSON.stringify(item.tender))}">Add as demand</button>
        </div>
      </article>
    `;
  }).join("")}
  `;
}

function addTenderDemand(encodedTender) {
  const tender = JSON.parse(decodeURIComponent(encodedTender));
  const settings = tenderSettings();
  const brief = {
    customer: tender.authority,
    source: "Find a Tender",
    item: tender.item,
    quantity: String(number(tender.quantity) || 1),
    postcode: settings.postcode,
    budget: tender.value ? String(Math.round(number(tender.value))) : "",
    quality: "Standard",
    urgency: tender.deadline && daysUntil(tender.deadline) <= 7 ? "This week" : "This month",
    notes: `${tender.title}\n${tender.notes}${tender.url ? `\n${tender.url}` : ""}`,
  };
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
  scorePreview.textContent = `${demandLabel(demand)} added from Find a Tender. Now match supplier stock before bid review.`;
}

async function loadTenderDetails(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  const notesBox = document.querySelector("#tenderDetailNotes");
  if (liveTenderStatus) {
    liveTenderStatus.innerHTML = `<strong>Loading tender details...</strong><span>${escapeHtml(url)}</span>`;
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
      liveTenderStatus.innerHTML = `<strong>Tender details loaded.</strong><span>Review the detail notes, add the tender to demand, then match stock coverage.</span>`;
    }
    renderBidPack();
  } catch (error) {
    if (liveTenderStatus) {
      liveTenderStatus.innerHTML = `<strong>Tender detail fetch unavailable.</strong><span>${escapeHtml(error.message)} Open the tender, copy the specification text, and paste it into Tender detail notes.</span>`;
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
  scorePreview.textContent = "Requirement saved. Add or score a supplier candidate next.";
  renderAgentSummary();
}

function saveDemand() {
  saveBrief();
  const brief = { ...state.brief };
  if (!brief.customer && !brief.notes) {
    scorePreview.textContent = "Add a customer, company, or enquiry note before adding demand.";
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
  scorePreview.textContent = `${demandLabel(demand)} added to the demand queue. Rank stock against this buyer before purchase review.`;
}

function addCandidate(event) {
  event.preventDefault();
  const { brief, candidate, result } = scoreCurrentCandidate();
  const demand = activeDemandRecord();
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
  scorePreview.textContent = `${demandLabel(demand)} selected. Search and rank lots against this buyer request.`;
}

function updateDemandStatus(id, status) {
  const demand = state.demands.find((item) => item.id === id);
  if (!demand) return;
  demand.status = status;
  demand.updatedAt = new Date().toISOString();
  if (status === "Won" || status === "Closed") {
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
  adjustWeights(record.result.dimensions, status);
  persist();
  render();
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
    activeDemand.innerHTML = demand ? `
      <strong>${demandLabel(demand)}</strong>
      <span>${demand.brief.quality || "Quality TBC"} • ${demand.brief.urgency || "Timing TBC"} • ${demand.brief.postcode || "Postcode TBC"} • ${money(demandValue(demand.brief))} request value</span>
    ` : "No buyer request selected yet.";
  }

  if (!demandList) return;
  if (!state.demands.length) {
    demandList.innerHTML = `<p class="empty-state">No saved buyer demand yet. Add the first live enquiry from the customer requirement form.</p>`;
    return;
  }

  demandList.innerHTML = state.demands.map((item) => {
    const brief = item.brief || {};
    const isActive = item.id === state.activeDemandId;
    return `
      <article class="demand-card ${isActive ? "active" : ""}">
        <div class="candidate-topline">
          <span>${item.status}</span>
          <strong>${number(brief.quantity) || 1} needed</strong>
        </div>
        <h3>${demandLabel(item)}</h3>
        <dl>
          <div><dt>Budget/item</dt><dd>${number(brief.budget) ? money(brief.budget) : "TBC"}</dd></div>
          <div><dt>Total value</dt><dd>${number(brief.budget) ? money(demandValue(brief)) : "TBC"}</dd></div>
          <div><dt>Location</dt><dd>${brief.postcode || "TBC"}</dd></div>
          <div><dt>Urgency</dt><dd>${brief.urgency || "TBC"}</dd></div>
        </dl>
        <p>${brief.notes || "No enquiry notes saved."}</p>
        <div class="dashboard-actions">
          <button class="button primary" type="button" data-demand-select="${item.id}">${isActive ? "Selected" : "Use for matching"}</button>
          <button class="button secondary" type="button" data-demand-status="Quoted" data-demand-id="${item.id}">Quoted</button>
          <button class="button secondary" type="button" data-demand-status="Won" data-demand-id="${item.id}">Won</button>
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
      <p class="demand-match">${record.demandSnapshot ? `Buyer-backed: ${demandLabel(record.demandSnapshot)}` : "No saved buyer request attached."}</p>
      <p>${record.candidate.supplier || "Supplier to confirm"} • ${record.candidate.category || "Category to confirm"} • ${record.candidate.brand || "Brand unknown"}</p>
      <dl>
        <div><dt>Landed est.</dt><dd>${money(record.result.financials?.landed || number(record.candidate.price) + number(record.candidate.fees))}</dd></div>
        <div><dt>ROI</dt><dd>${record.result.financials?.sale ? percent(record.result.financials.roi) : "TBC"}</dd></div>
        <div><dt>Quantity</dt><dd>${recordQuantity(record)} available</dd></div>
        <div><dt>Brief</dt><dd>${record.brief.quantity || 1} x ${record.brief.item || "item"} for ${record.brief.postcode || "postcode TBC"}</dd></div>
        <div><dt>Timing</dt><dd>${record.brief.urgency || "TBC"} / available ${record.candidate.availableBy || "TBC"}</dd></div>
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
  const liveDemand = state.demands.filter((item) => ["Live", "Tender", "Matched"].includes(item.status)).length;
  memoryStats.innerHTML = `
    <strong>${state.feedback.length}</strong>
    <span>review decisions recorded</span>
    <p>${approved} approved, ${rejected} rejected. ${liveDemand} live or matched buyer requests are available for demand-led sourcing.</p>
  `;
}

function syncAgentDefaults() {
  const targetField = document.querySelector("#targetSalePrice");
  const postcodeField = document.querySelector("#agentPostcode");
  if (targetField && !targetField.value && state.brief.budget) targetField.placeholder = `Saved budget ${money(state.brief.budget)}`;
  if (postcodeField && !postcodeField.value && state.brief.postcode) postcodeField.placeholder = `Saved postcode ${state.brief.postcode}`;
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

function exportActiveBidPack() {
  const demand = activeDemandRecord();
  if (!demand?.tender) return;
  const readiness = bidReadiness(demand);
  const blob = new Blob([bidPackText(demand, readiness)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeBuyer = normalise(demand.brief?.customer || "tender").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `rentalready-bid-pack-${safeBuyer || "tender"}-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearData() {
  if (!confirm("Clear all saved sourcing dashboard data in this browser?")) return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith("rentalready_sourcing_"))
    .forEach((key) => localStorage.removeItem(key));
  state.brief = {};
  state.candidates = [];
  state.feedback = [];
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
document.querySelector("#rankTenders")?.addEventListener("click", rankTenders);
document.querySelector("#prepareBidPack")?.addEventListener("click", renderBidPack);
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
  const detailButton = event.target.closest("button[data-tender-detail]");
  if (detailButton) loadTenderDetails(detailButton.dataset.tenderDetail);

  const button = event.target.closest("button[data-tender-add]");
  if (button) addTenderDemand(button.dataset.tenderAdd);
});
bidPack?.addEventListener("click", (event) => {
  if (event.target.closest("#exportBidPack")) exportActiveBidPack();
});
document.querySelector("#exportData")?.addEventListener("click", exportData);
document.querySelector("#clearData")?.addEventListener("click", clearData);

render();
