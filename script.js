const prices = [
  ["Fridge freezer", "From £229", "Starting price. Final quote depends on brand, size, finish, condition, and quality."],
  ["Electric cooker", "From £179", "Starting price. Final quote depends on brand, condition, and electrical requirements."],
  ["Washing machine", "From £179", "Starting price. Final quote depends on brand, drum size, condition, and quality."],
  ["Dryer", "From £144", "Starting price. Final quote depends on brand, type, condition, and ventilation requirements."],
  ["Washing machine and dryer bundle", "From £389", "Starting bundle price for standard used units. Higher-quality brands may cost more."],
  ["Dishwasher", "From £109", "Starting price. Final quote depends on brand, condition, and installation requirements."],
  ["Microwave", "From £89", "Countertop starting price. Combination and over-hob requests may cost more."],
  ["Studio serviced apartment appliance pack", "From £799", "Starting package price for compact serviced apartments, studios, and short-stay units."],
  ["Landlord turnover set", "From £1,299", "Starting package price. Bundle savings available. Final quote depends on selected appliance brands and quality tier."],
  ["HMO / multi-unit appliance pack", "Quote-led", "For repeatable appliance choices across multiple rooms, flats, or units."],
  ["Construction handover / batch request", "Quote-led", "For contractors, developers, and refurbishment teams ordering appliances across multiple plots or units."],
  ["Operator refresh pack", "Quote-led", "For serviced apartment operators, letting agencies, and portfolios that need a consistent appliance standard."],
];

const priceRows = document.querySelector("#priceRows");

if (priceRows) {
  prices.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    priceRows.appendChild(tr);
  });
}

const quoteForm = document.querySelector("#quoteForm");
const buildBrief = document.querySelector("#buildBrief");
const emailBrief = document.querySelector("#emailBrief");
const briefOutput = document.querySelector("#briefOutput");
const smartQuoteBrief = document.querySelector("#smartQuoteBrief");

function fieldValue(name) {
  const field = quoteForm?.elements[name];
  if (!field) return "";
  return String(field.value || "").trim();
}

function checkedValues(name) {
  return Array.from(quoteForm?.querySelectorAll(`input[name="${name}"]:checked`) || [])
    .map((item) => item.value)
    .join(", ");
}

function buildSmartBrief() {
  if (!quoteForm) return "";

  const appliance = fieldValue("item") || "appliance request";
  const propertyType = fieldValue("property_type") || "property";
  const quantity = fieldValue("quantity") || "1";
  const postcode = fieldValue("postcode") || "postcode to confirm";
  const quality = fieldValue("quality") || "quality to confirm";
  const condition = fieldValue("condition_route") || "condition route to confirm";
  const urgency = fieldValue("urgency") || "timing to confirm";
  const measurements = fieldValue("measurements") || "measurements to confirm";
  const date = fieldValue("date") || "date to confirm";
  const services = checkedValues("services") || "no extra services selected";
  const notes = fieldValue("notes");

  const brief = [
    `Request: ${quantity} x ${appliance}`,
    `Property: ${propertyType}`,
    `Postcode: ${postcode}`,
    `Quality: ${quality}`,
    `Condition route: ${condition}`,
    `Measurements/access: ${measurements}`,
    `Timing: ${urgency}; preferred date ${date}`,
    `Extra services: ${services}`,
    notes ? `Customer notes: ${notes}` : "Customer notes: none added yet",
  ].join("\n");

  if (smartQuoteBrief) smartQuoteBrief.value = brief;
  if (briefOutput) briefOutput.textContent = brief;
  if (emailBrief) {
    const subject = encodeURIComponent(`RentalReady quote request - ${appliance}`);
    const body = encodeURIComponent(`${brief}\n\nPlease reply with next steps and any questions needed to prepare the quote.`);
    emailBrief.setAttribute("href", `mailto:sibbslani@rentreadyappliances.org?subject=${subject}&body=${body}`);
  }
  return brief;
}

buildBrief?.addEventListener("click", buildSmartBrief);
emailBrief?.addEventListener("click", buildSmartBrief);
quoteForm?.addEventListener("submit", buildSmartBrief);
