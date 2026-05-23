const DEFAULT_WEIGHTS = {
  category: 28,
  budget: 24,
  quality: 18,
  urgency: 16,
  logistics: 14,
};

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
  candidates: load("rentalready_sourcing_candidates", []),
  feedback: load("rentalready_sourcing_feedback", []),
  weights: load("rentalready_sourcing_weights", DEFAULT_WEIGHTS),
};

const briefForm = document.querySelector("#briefForm");
const candidateForm = document.querySelector("#candidateForm");
const scorePreview = document.querySelector("#scorePreview");
const candidateList = document.querySelector("#candidateList");
const weightsList = document.querySelector("#weightsList");
const memoryStats = document.querySelector("#memoryStats");

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
  const parsed = Number(value);
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

function categoryScore(brief, candidate) {
  return normalise(brief.item) === normalise(candidate.category) ? 100 : 38;
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
    category: categoryScore(brief, candidate),
    budget: budgetScore(brief, candidate),
    quality: qualityScore(brief, candidate),
    urgency: urgencyScore(brief, candidate),
    logistics: logisticsScore(brief, candidate),
  };
  const totalWeight = Object.values(state.weights).reduce((sum, value) => sum + value, 0);
  const score = Object.entries(dimensions).reduce((sum, [key, value]) => {
    return sum + value * (state.weights[key] / totalWeight);
  }, 0);

  return {
    score: Math.round(score),
    dimensions,
    recommendation: recommendationFor(score, dimensions),
  };
}

function recommendationFor(score, dimensions) {
  if (score >= 84) return "Strong match - review photos and fees, then consider approving.";
  if (score >= 68) return "Usable match - check condition, delivery, and final cost before buying.";
  if (dimensions.budget < 45) return "Weak match - likely too expensive for the stated brief.";
  if (dimensions.quality < 45) return "Weak match - condition or quality risk is too high.";
  return "Weak match - keep as backup only.";
}

function renderScore(result) {
  return `
    <div class="score-card">
      <strong>${result.score}% fit</strong>
      <span>${result.recommendation}</span>
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

function scoreCurrentCandidate() {
  const brief = formData(briefForm);
  const candidate = formData(candidateForm);
  const result = scoreCandidateData(brief, candidate);
  scorePreview.innerHTML = renderScore(result);
  return { brief, candidate, result };
}

function saveBrief() {
  state.brief = formData(briefForm);
  save("rentalready_sourcing_brief", state.brief);
  scorePreview.textContent = "Requirement saved. Add or score a supplier candidate next.";
}

function addCandidate(event) {
  event.preventDefault();
  const { brief, candidate, result } = scoreCurrentCandidate();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
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

function updateStatus(id, status) {
  const record = state.candidates.find((item) => item.id === id);
  if (!record) return;
  record.status = status;
  record.reviewedAt = new Date().toISOString();
  state.feedback.unshift({
    id: crypto.randomUUID(),
    candidateId: id,
    status,
    score: record.result.score,
    dimensions: record.result.dimensions,
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
  save("rentalready_sourcing_candidates", state.candidates);
  save("rentalready_sourcing_feedback", state.feedback);
  save("rentalready_sourcing_weights", state.weights);
}

function render() {
  fillForm(briefForm, state.brief);
  renderCandidates();
  renderLearning();
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
      <p>${record.candidate.supplier || "Supplier to confirm"} • ${record.candidate.category || "Category to confirm"} • ${record.candidate.brand || "Brand unknown"}</p>
      <dl>
        <div><dt>Total est.</dt><dd>£${number(record.candidate.price) + number(record.candidate.fees)}</dd></div>
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
  memoryStats.innerHTML = `
    <strong>${state.feedback.length}</strong>
    <span>review decisions recorded</span>
    <p>${approved} approved, ${rejected} rejected. This browser now favours the patterns behind your reviewed choices.</p>
  `;
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    brand: "RentalReady Appliances",
    brief: state.brief,
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
document.querySelector("#scoreCandidate")?.addEventListener("click", scoreCurrentCandidate);
candidateForm?.addEventListener("submit", addCandidate);
candidateList?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-status]");
  if (button) updateStatus(button.dataset.id, button.dataset.status);
});
document.querySelector("#exportData")?.addEventListener("click", exportData);
document.querySelector("#clearData")?.addEventListener("click", clearData);

render();
