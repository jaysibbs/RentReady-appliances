const AUCTION_STOCK_SOURCES = [
  {
    name: "John Pye general auctions",
    fetchable: true,
    urlFor: (term) => `https://www.johnpye.co.uk/?s=${encodeURIComponent(term)}`,
  },
  {
    name: "John Pye trade auctions",
    fetchable: false,
    urlFor: (term) => `https://www.johnpye.co.uk/trade-auctions/?s=${encodeURIComponent(term)}`,
  },
  {
    name: "John Pye Trade latest stock",
    fetchable: true,
    parser: "johnPyeTrade",
    urlFor: () => "https://www.johnpyetrade.co.uk/product-category/uncategorized/",
  },
  {
    name: "BPI Auctions",
    fetchable: true,
    urlFor: (term) => `https://www.bpiauctions.com/?s=${encodeURIComponent(term)}`,
  },
  {
    name: "BidSpotter",
    fetchable: true,
    urlFor: (term) => `https://www.bidspotter.co.uk/en-gb/search-results?searchTerm=${encodeURIComponent(term)}`,
  },
  {
    name: "i-bidder",
    fetchable: false,
    urlFor: (term) => `https://www.i-bidder.com/en-gb/search-results?searchTerm=${encodeURIComponent(term)}`,
  },
  {
    name: "William George",
    fetchable: false,
    urlFor: (term) => `https://www.williamgeorge.com/search?query=${encodeURIComponent(term)}`,
  },
  {
    name: "Eddisons",
    fetchable: false,
    urlFor: (term) => `https://www.eddisons.com/auctions/search/?search=${encodeURIComponent(term)}`,
  },
  {
    name: "NCM Auctions",
    fetchable: false,
    urlFor: (term) => `https://www.ncmauctions.co.uk/auction-search/?search=${encodeURIComponent(term)}`,
  },
];

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&pound;|&#163;/g, "£")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeEntities(String(value).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalise(value = "") {
  return String(value || "").trim().toLowerCase();
}

function number(value) {
  const parsed = Number(String(value || "").replace(/[£,%]/g, "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMoneyLoose(value) {
  const matches = [...String(value || "").matchAll(/£\s?([0-9]+(?:,[0-9]{3})*(?:\.\d{1,2})?)/g)]
    .map((match) => number(match[1]))
    .filter(Boolean);
  return matches.length ? Math.min(...matches) : 0;
}

function parseIsoDateLoose(value) {
  const text = String(value || "");
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const uk = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (uk) return `${uk[3]}-${String(uk[2]).padStart(2, "0")}-${String(uk[1]).padStart(2, "0")}`;
  return "";
}

function parseCurrentPriceLoose(value) {
  const text = String(value || "");
  const current = text.match(/Current price is:\s*£\s?([0-9]+(?:,[0-9]{3})*(?:\.\d{1,2})?)/i);
  if (current) return number(current[1]);
  return parseMoneyLoose(text);
}

function parseQuantityLoose(value) {
  const text = String(value || "");
  const units = text.match(/\b(?:approx\.?\s*)?([0-9]+(?:,[0-9]{3})?)\s*(?:x\s*)?units?\b/i);
  if (units) return Math.max(1, Math.round(number(units[1])));
  const leading = text.match(/\b([0-9]+)\s*x\s+(?:pallet|pallets|truckload|truckloads|box|boxes)\b/i);
  if (leading) return Math.max(1, Math.round(number(leading[1])));
  const pallets = text.match(/\b([0-9]+)\s+pallets?\b/i);
  if (pallets) return Math.max(1, Math.round(number(pallets[1])));
  return 1;
}

function absolutiseUrl(href, base) {
  try {
    return new URL(decodeEntities(href), base).toString();
  } catch {
    return "";
  }
}

function stockTermHit(text, term) {
  const value = normalise(text);
  const query = normalise(term);
  const applianceTerms = [
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
    "domestic appliance",
    "freestanding",
  ];
  const applianceQuery = query.includes("white goods") || query.includes("domestic appliance") || query.includes("appliance") || query.includes("397");
  if (applianceQuery && applianceTerms.some((item) => value.includes(item))) return true;
  if (query === "white goods") return false;
  const parts = query
    .split(/\s+/)
    .filter((part) => part.length > 2 && !["and", "the", "for", "lot", "with", "white", "goods", "machine"].includes(part));
  return parts.length ? parts.every((part) => value.includes(part)) : false;
}

function parseAuctionCandidates(html, source, sourceUrl, term) {
  const results = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html)) && results.length < 10) {
    const href = absolutiseUrl(match[1], sourceUrl);
    const title = stripTags(match[2]);
    if (!href || title.length < 8 || title.length > 180) continue;
    if (/login|account|privacy|terms|basket|register|calendar|contact|about|valuation|selling|all farm|all metalworking|consumer goods|plant & machinery|refine search|machine tools|attachments|drilling|doweling|van|sprinter|mercedes|daf|diesel|tractor|vehicle|chassis|cab/i.test(title)) continue;
    if (/\/for-sale\/|search-filter|\/Browse\/|RefineSearch=1/i.test(href) && !/lot|Event\/LotDetails/i.test(href)) continue;
    if (!stockTermHit(title, term)) continue;
    const context = stripTags(html.slice(Math.max(0, match.index - 700), Math.min(html.length, match.index + 1100)));
    const price = parseMoneyLoose(context);
    const availableBy = parseIsoDateLoose(context);
    results.push({
      source: source.name,
      title,
      url: href,
      price,
      quantityAvailable: 1,
      location: context.match(/\b(Nottingham|Birmingham|Chesterfield|Marchington|Derby|Leicester|Manchester|Leeds|London|Bristol|Bo'ness|Edinburgh)\b/i)?.[0] || "",
      availableBy,
      term,
      searchUrl: sourceUrl,
      confidence: price ? "parsed-price" : "title-match",
      description: context.slice(0, 420),
    });
  }
  return results;
}

function parseJohnPyeTradeCandidates(html, source, sourceUrl, term) {
  return String(html)
    .split(/<div class="product-small col has-hover/i)
    .slice(1)
    .map((block) => `<div class="product-small col has-hover${block}`)
    .filter((block) => !/outofstock|out-of-stock-label|>\s*SOLD\s*</i.test(block))
    .map((block) => {
      const titleMatch = block.match(/<p[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>\s*<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      const href = absolutiseUrl(titleMatch?.[1] || "", sourceUrl);
      const title = stripTags(titleMatch?.[2] || "");
      if (!href || !title || !stockTermHit(title, term)) return null;
      const context = stripTags(block);
      const currentPrice = parseCurrentPriceLoose(context);
      const buyerPremiumRate = /\bBuyers Premium\s*\(20%\)/i.test(context) ? 0.2 : 0;
      const acquisitionPrice = currentPrice ? Math.round(currentPrice * (1 + buyerPremiumRate) * 100) / 100 : 0;
      return {
        source: source.name,
        title,
        url: href,
        price: acquisitionPrice,
        quantityAvailable: parseQuantityLoose(title),
        location: "John Pye Trade",
        availableBy: "",
        term,
        searchUrl: sourceUrl,
        confidence: acquisitionPrice ? "trade-price-plus-buyer-premium" : "title-match",
        description: `${context.slice(0, 360)}${buyerPremiumRate ? " Acquisition estimate includes 20% buyer premium before VAT/logistics checks." : ""}`,
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

async function fetchStockSource(source, term) {
  const sourceUrl = source.urlFor(term);
  if (!source.fetchable) {
    return { sourceUrl, results: [], warning: `${source.name} is a manual verification route; open the source search and paste viable lots.` };
  }
  const response = await fetch(sourceUrl, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "user-agent": "RentalReadyAppliancesStockMatcher/1.0 (+https://rentalreadyappliances.com)",
    },
  });
  if (!response.ok) {
    return { sourceUrl, results: [], warning: `${source.name} returned HTTP ${response.status}.` };
  }
  return {
    sourceUrl,
    results: source.parser === "johnPyeTrade"
      ? parseJohnPyeTradeCandidates(await response.text(), source, sourceUrl, term)
      : parseAuctionCandidates(await response.text(), source, sourceUrl, term),
    warning: "",
  };
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const terms = (url.searchParams.get("terms") || "white goods|domestic appliances")
    .split("|")
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 6);
  const fetches = [];
  for (const term of terms) {
    for (const source of AUCTION_STOCK_SOURCES) {
      fetches.push(fetchStockSource(source, term));
    }
  }

  const settled = await Promise.allSettled(fetches);
  const sourceUrls = [];
  const warnings = [];
  const seen = new Set();
  const results = [];

  for (const item of settled) {
    if (item.status === "rejected") {
      warnings.push(item.reason.message);
      continue;
    }
    sourceUrls.push(item.value.sourceUrl);
    if (item.value.warning) warnings.push(item.value.warning);
    for (const result of item.value.results) {
      const key = `${result.source}:${result.url || result.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(result);
    }
  }

  results.sort((a, b) => {
    if (Boolean(a.price) !== Boolean(b.price)) return a.price ? -1 : 1;
    return a.source.localeCompare(b.source) || a.title.localeCompare(b.title);
  });

  return Response.json({
    ok: true,
    terms,
    sourceUrls: [...new Set(sourceUrls)],
    results: results.slice(0, 36),
    warnings: [...new Set(warnings)].slice(0, 18),
    fetchedAt: new Date().toISOString(),
  });
}
