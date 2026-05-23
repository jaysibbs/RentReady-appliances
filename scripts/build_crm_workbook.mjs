import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();

const colors = {
  navy: "#133B5C",
  green: "#49A078",
  cream: "#F7F4EE",
  ink: "#1F2933",
  muted: "#6B7280",
  line: "#D8DEE4",
  gold: "#F5B841",
  red: "#C2410C",
};

function styleHeader(range) {
  range.format = {
    fill: colors.navy,
    font: { name: "Arial", size: 11, color: "#FFFFFF", bold: true },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: "#2F5676" },
  };
}

function styleBody(range) {
  range.format = {
    font: { name: "Arial", size: 10, color: colors.ink },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: colors.line },
  };
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    const col = String.fromCharCode(65 + index);
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = width;
  });
}

const dashboard = workbook.worksheets.add("Dashboard");
const leads = workbook.worksheets.add("Leads CRM");
const inventory = workbook.worksheets.add("Inventory");
const priceList = workbook.worksheets.add("Price List");
const operations = workbook.worksheets.add("Operations");
const settings = workbook.worksheets.add("Settings");

dashboard.getRange("A1:H1").values = [["RentalReady Appliances - Operating Dashboard", null, null, null, null, null, null, null]];
dashboard.getRange("A1:H1").format = {
  fill: colors.navy,
  font: { name: "Arial", size: 18, color: "#FFFFFF", bold: true },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
dashboard.getRange("A2:H2").values = [["Use this sheet as the daily snapshot. Add real leads on the Leads CRM tab and confirmed stock on Inventory.", null, null, null, null, null, null, null]];
dashboard.getRange("A2:H2").format = {
  fill: colors.cream,
  font: { name: "Arial", size: 10, color: colors.muted },
  wrapText: true,
};
dashboard.getRange("A4:D4").values = [["Leads", "Quotes Sent", "Booked Jobs", "Won Revenue"]];
styleHeader(dashboard.getRange("A4:D4"));
dashboard.getRange("A5:D5").formulas = [[
  '=COUNTA(\'Leads CRM\'!A2:A101)',
  '=COUNTIF(\'Leads CRM\'!J2:J101,"Quoted")',
  '=COUNTIF(\'Leads CRM\'!J2:J101,"Booked")',
  '=SUMIF(\'Leads CRM\'!J2:J101,"Won",\'Leads CRM\'!L2:L101)',
]];
dashboard.getRange("A5:D5").format = {
  fill: "#FFFFFF",
  font: { name: "Arial", size: 18, color: colors.ink, bold: true },
  horizontalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: colors.line },
};
dashboard.getRange("D5:D5").format.numberFormat = "£#,##0";

dashboard.getRange("A8:C8").values = [["Source", "Lead Count", "Quote Value"]];
styleHeader(dashboard.getRange("A8:C8"));
dashboard.getRange("A9:A14").values = [["Landlord"], ["Letting agent"], ["Property manager"], ["Facebook"], ["Referral"], ["Other"]];
dashboard.getRange("B9:C14").formulas = [
  ['=COUNTIF(\'Leads CRM\'!F2:F101,A9)', '=SUMIF(\'Leads CRM\'!F2:F101,A9,\'Leads CRM\'!L2:L101)'],
  ['=COUNTIF(\'Leads CRM\'!F2:F101,A10)', '=SUMIF(\'Leads CRM\'!F2:F101,A10,\'Leads CRM\'!L2:L101)'],
  ['=COUNTIF(\'Leads CRM\'!F2:F101,A11)', '=SUMIF(\'Leads CRM\'!F2:F101,A11,\'Leads CRM\'!L2:L101)'],
  ['=COUNTIF(\'Leads CRM\'!F2:F101,A12)', '=SUMIF(\'Leads CRM\'!F2:F101,A12,\'Leads CRM\'!L2:L101)'],
  ['=COUNTIF(\'Leads CRM\'!F2:F101,A13)', '=SUMIF(\'Leads CRM\'!F2:F101,A13,\'Leads CRM\'!L2:L101)'],
  ['=COUNTIF(\'Leads CRM\'!F2:F101,A14)', '=SUMIF(\'Leads CRM\'!F2:F101,A14,\'Leads CRM\'!L2:L101)'],
];
styleBody(dashboard.getRange("A9:C14"));
dashboard.getRange("B9:B14").format.horizontalAlignment = "center";
dashboard.getRange("C9:C14").format.numberFormat = "£#,##0";

dashboard.getRange("E8:H8").values = [["Today / Next Actions", "Contact", "Need", "Follow-Up"]];
styleHeader(dashboard.getRange("E8:H8"));
dashboard.getRange("E9:H13").values = [
  ["Call", "Maria L.", "Washing machine/dryer bundle", "2026-05-16"],
  ["Quote", "Nelson Lettings", "Fridge freezer + electric cooker", "2026-05-16"],
  ["Confirm access", "A. Brooks", "Electric cooker", "2026-05-17"],
  ["Stock check", "Internal", "Clean fridge freezer", "2026-05-17"],
  ["Review", "Internal", "End-of-day CRM cleanup", "2026-05-15"],
];
styleBody(dashboard.getRange("E9:H13"));
dashboard.getRange("H9:H13").format.numberFormat = "yyyy-mm-dd";

dashboard.charts.add("ColumnClustered", {
  title: "Leads by Source",
  categories: ["Landlord", "Letting agent", "Property manager", "Facebook", "Referral", "Other"],
  series: [{ name: "Leads", values: [2, 1, 1, 0, 1, 0] }],
  hasLegend: false,
  from: { row: 15, col: 0 },
  extent: { widthPx: 540, heightPx: 260 },
});
dashboard.freezePanes.freezeRows(4);
setWidths(dashboard, [145, 115, 125, 130, 135, 145, 150, 115]);

const leadHeaders = ["Lead ID", "Date Added", "Contact Name", "Phone", "Email", "Source", "Property Type", "Item Needed", "Budget", "Status", "Next Follow-Up", "Quote Amount", "Notes"];
const leadRows = [
  ["RR-001", new Date("2026-05-15"), "Maria L.", "07123 456789", "maria@example.com", "Landlord", "Maisonette", "Washing machine and dryer bundle", "£375-£450", "Quoted", new Date("2026-05-16"), 389, "Interested in future delivery; confirm stairs."],
  ["RR-002", new Date("2026-05-15"), "Nelson Lettings", "020 7946 0102", "ops@nelson.example", "Letting agent", "4-flat block", "Fridge freezer + electric cooker", "£600-£700", "New", new Date("2026-05-16"), 628, "Ask about cooker connection and fridge width."],
  ["RR-003", new Date("2026-05-15"), "A. Brooks", "07123 456103", "abrooks@example.com", "Facebook", "Terraced house", "Electric cooker", "£175-£225", "Booked", new Date("2026-05-17"), 179, "Booked pending availability window."],
  ["RR-004", new Date("2026-05-15"), "Green Key Rentals", "020 7946 0104", "team@greenkey.example", "Referral", "Flat", "Fridge freezer", "£225-£275", "Won", new Date("2026-05-18"), 249, "Paid deposit; noted future haul-away interest."],
  ["RR-005", new Date("2026-05-15"), "J. Miller", "07123 456105", "jmiller@example.com", "Landlord", "Flat", "Dishwasher", "£100-£150", "Follow up", new Date("2026-05-18"), 109, "Confirm install scope before quote expires."],
];
leads.getRange("A1:M1").values = [leadHeaders];
leads.getRange("A2:M6").values = leadRows;
styleHeader(leads.getRange("A1:M1"));
styleBody(leads.getRange("A2:M101"));
leads.getRange("B2:B101").format.numberFormat = "yyyy-mm-dd";
leads.getRange("K2:K101").format.numberFormat = "yyyy-mm-dd";
leads.getRange("L2:L101").format.numberFormat = "£#,##0";
leads.getRange("J2:J101").dataValidation = {
  allowBlank: true,
  list: { inCellDropDown: true, source: ["New", "Quoted", "Booked", "Won", "Lost", "Follow up"] },
};
leads.getRange("F2:F101").dataValidation = {
  allowBlank: true,
  list: { inCellDropDown: true, source: ["Landlord", "Letting agent", "Property manager", "Facebook", "Referral", "Other"] },
};
leads.freezePanes.freezeRows(1);
setWidths(leads, [82, 92, 135, 105, 170, 125, 110, 150, 105, 98, 115, 110, 260]);

const inventoryHeaders = ["Asset ID", "Appliance Type", "Brand / Model", "Condition", "Purchase Cost", "Repair Cost", "Total Cost", "Target Sale Price", "Status", "Listed On", "Buyer / Lead", "Notes"];
const inventoryRows = [
  ["INV-001", "Fridge freezer", "Whirlpool standard", "Clean / tested", 175, 25, null, 249, "Available", new Date("2026-05-15"), "", "Good landlord unit; verify measurements."],
  ["INV-002", "Electric cooker", "Hotpoint standard", "Clean / tested", 125, 20, null, 179, "Reserved", new Date("2026-05-15"), "A. Brooks", "Reserved for RR-003."],
  ["INV-003", "Washing machine", "Indesit standard", "Clean / tested", 125, 30, null, 179, "Available", new Date("2026-05-15"), "", "Pair with dryer if possible."],
  ["INV-004", "Dryer", "Beko condenser", "Clean / tested", 95, 20, null, 144, "Available", new Date("2026-05-15"), "", "Confirm ventilation or condenser placement."],
];
inventory.getRange("A1:L1").values = [inventoryHeaders];
inventory.getRange("A2:L5").values = inventoryRows;
inventory.getRange("G2:G101").formulas = Array.from({ length: 100 }, (_, i) => [`=IF(A${i + 2}="","",E${i + 2}+F${i + 2})`]);
styleHeader(inventory.getRange("A1:L1"));
styleBody(inventory.getRange("A2:L101"));
inventory.getRange("E2:H101").format.numberFormat = "£#,##0";
inventory.getRange("J2:J101").format.numberFormat = "yyyy-mm-dd";
inventory.getRange("I2:I101").dataValidation = {
  allowBlank: true,
  list: { inCellDropDown: true, source: ["Available", "Reserved", "Sold", "Repair", "Needs cleaning"] },
};
inventory.freezePanes.freezeRows(1);
setWidths(inventory, [82, 125, 155, 120, 105, 95, 95, 120, 105, 100, 125, 240]);

const priceHeaders = ["Item", "Starting Price", "Notes"];
const priceRows = [
  ["Fridge freezer", 249, "Starting price. Final quote depends on brand, size, finish, condition, and quality."],
  ["Electric cooker", 179, "Starting price. Final quote depends on brand, condition, and electrical requirements."],
  ["Washing machine", 179, "Starting price. Final quote depends on brand, drum size, condition, and quality."],
  ["Dryer", 144, "Starting price. Final quote depends on brand, type, condition, and ventilation requirements."],
  ["Washing machine and dryer bundle", 389, "Starting bundle price for standard used units. Higher-quality brands may cost more."],
  ["Dishwasher", 109, "Starting price. Final quote depends on brand, condition, and installation requirements."],
  ["Over-hob microwave", 104, "Starting price. Final quote depends on brand, bracket, and vent setup."],
  ["Landlord turnover set", 1299, "Starting package price. Final quote depends on selected appliance brands and quality tier."],
];
priceList.getRange("A1:C1").values = [priceHeaders];
priceList.getRange("A2:C9").values = priceRows;
styleHeader(priceList.getRange("A1:C1"));
styleBody(priceList.getRange("A2:C30"));
priceList.getRange("B2:B30").format.numberFormat = "£#,##0";
priceList.freezePanes.freezeRows(1);
setWidths(priceList, [245, 130, 520]);

const operationHeaders = ["Operation", "Status", "Demand Signal", "Launch Rule", "Notes"];
const operationRows = [
  ["Delivery", "Separate future operation", "Track postcode, distance, stairs, timing, and access notes", "Launch only when repeat demand supports capacity and margin", "Do not bundle into appliance starter pricing yet."],
  ["Haul-away", "Separate future operation", "Track old appliance type, disposal need, and access notes", "Launch only when removal demand and disposal workflow are proven", "Keep removal interest visible in lead notes."],
];
operations.getRange("A1:E1").values = [operationHeaders];
operations.getRange("A2:E3").values = operationRows;
styleHeader(operations.getRange("A1:E1"));
styleBody(operations.getRange("A2:E20"));
operations.freezePanes.freezeRows(1);
setWidths(operations, [145, 180, 295, 310, 260]);

settings.getRange("A1:B1").values = [["Setting", "Value"]];
settings.getRange("A2:B12").values = [
  ["Business name", "RentalReady Appliances"],
  ["Email", "sibbslani@rentreadyappliances.org"],
  ["WhatsApp", "[add number]"],
  ["Service area", "[add UK postcode/city radius]"],
  ["Delivery", "Separate future operation"],
  ["Haul-away", "Separate future operation"],
  ["Pricing", "Starting prices vary by brand, condition, size, finish, and quality"],
  ["Warranty note", "Confirm terms on invoice"],
  ["Quote expiry", "48 hours unless inventory is paid/reserved"],
  ["Payment methods", "[add accepted methods]"],
  ["Last updated", new Date("2026-05-15")],
];
styleHeader(settings.getRange("A1:B1"));
styleBody(settings.getRange("A2:B12"));
settings.getRange("B12:B12").format.numberFormat = "yyyy-mm-dd";
setWidths(settings, [160, 430]);

for (const sheet of [dashboard, leads, inventory, priceList, operations, settings]) {
  sheet.getRange("A1:Z120").format.font = { name: "Arial", size: 10, color: colors.ink };
}

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

const preview = await workbook.inspect({
  kind: "table",
  range: "Dashboard!A1:H20",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
});
console.log(preview.ndjson);

for (const sheetName of ["Dashboard", "Leads CRM", "Inventory", "Price List", "Operations", "Settings"]) {
  await workbook.render({ sheetName, range: "A1:H20", scale: 1 });
}

await fs.mkdir("outputs/day_1_setup", { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("outputs/day_1_setup/rentready_appliances_crm.xlsx");
