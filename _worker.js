const FIND_TENDER_RESULTS_URL = "https://www.find-tender.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_RESULTS_URL = "https://www.contractsfinder.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_API_URL = "https://www.contractsfinder.service.gov.uk/api/rest/2/search_notices/json";
const DEFAULT_ACQUISITION_KEYWORDS = "white goods supply OR domestic appliances 39700000 OR electrical domestic appliances 39710000 OR temporary accommodation appliances OR void property appliances OR housing association white goods";
const AUCTION_STOCK_SOURCES = [
  {
    name: "John Pye general auctions",
    fetchable: true,
    urlFor: (term) => `https://www.johnpye.co.uk/?s=${encodeURIComponent(term)}`,
  },
  {
    name: "John Pye trade auctions",
    fetchable: true,
    urlFor: (term) => `https://www.johnpye.co.uk/trade-auctions/?s=${encodeURIComponent(term)}`,
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

function absolutiseUrl(href, base) {
  try {
    return new URL(decodeEntities(href), base).toString();
  } catch {
    return "";
  }
}

function stockTermHit(text, term) {
  const value = normalise(text);
  return normalise(term)
    .split(/\s+/)
    .filter((part) => part.length > 2 && !["and", "the", "for", "lot", "with"].includes(part))
    .some((part) => value.includes(part));
}

function parseAuctionCandidates(html, source, sourceUrl, term) {
  const results = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html)) && results.length < 10) {
    const href = absolutiseUrl(match[1], sourceUrl);
    const title = stripTags(match[2]);
    if (!href || title.length < 8 || title.length > 180) continue;
    if (/login|account|privacy|terms|basket|register|calendar|contact|about|valuation|selling/i.test(title)) continue;
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
    results: parseAuctionCandidates(await response.text(), source, sourceUrl, term),
    warning: "",
  };
}

function fieldFromBlock(block, label) {
  const dtPattern = new RegExp(`<dt[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, "i");
  const entryPattern = new RegExp(`<div[^>]*class="[^"]*search-result-entry[^"]*"[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>\\s*([\\s\\S]*?)<\\/div>`, "i");
  return stripTags(block.match(dtPattern)?.[1] || block.match(entryPattern)?.[1] || "");
}

function parseTenderResults(html) {
  return String(html)
    .split('<div class="search-result">')
    .slice(1)
    .map((block) => {
      const href = decodeEntities(block.match(/<a href="([^"]+)"/i)?.[1] || "");
      const title = stripTags(block.match(/<a[^>]*class="[^"]*search-result-rwh[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || block.match(/<div class="search-result-header" title="([^"]+)"/i)?.[1] || "");
      const buyer = stripTags(block.match(/<div class="search-result-sub-header[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "");
      const description = stripTags(block.match(/<div class="wrap-text" id="[^"]+-description">([\s\S]*?)<\/div>/i)?.[1] || "");
      const value = fieldFromBlock(block, "Total value including VAT") || fieldFromBlock(block, "Total value excluding VAT") || fieldFromBlock(block, "Contract value");
      const location = fieldFromBlock(block, "Contract location");
      const deadline = fieldFromBlock(block, "Submission deadline");
      const published = fieldFromBlock(block, "Publication date");
      const noticeType = fieldFromBlock(block, "Notice type");

      return {
        title,
        buyer,
        description,
        value,
        location,
        deadline,
        published,
        noticeType,
        platform: "Find a Tender",
        opportunityType: "Tender",
        url: href,
      };
    })
    .filter((item) => item.title && item.url)
    .slice(0, 12);
}

function parseContractsFinderResults(payload) {
  return (payload.noticeList || [])
    .map(({ item }) => {
      const valueLow = Number(item?.valueLow) || 0;
      const valueHigh = Number(item?.valueHigh) || 0;
      const value = valueHigh && valueLow && valueHigh !== valueLow
        ? `£${valueLow.toLocaleString("en-GB")} to £${valueHigh.toLocaleString("en-GB")}`
        : valueHigh || valueLow
          ? `£${(valueHigh || valueLow).toLocaleString("en-GB")}`
          : "";
      return {
        title: stripTags(item?.title || ""),
        buyer: stripTags(item?.organisationName || ""),
        description: stripTags([item?.description, item?.cpvDescriptionExpanded || item?.cpvDescription].filter(Boolean).join(" ")),
        value,
        location: stripTags(item?.regionText || item?.region || item?.postcode || ""),
        deadline: item?.deadlineDate || "",
        published: item?.publishedDate || "",
        noticeType: [item?.noticeType, item?.noticeStatus].filter(Boolean).join(" / "),
        platform: "Contracts Finder",
        opportunityType: "Contract opportunity",
        cpv: item?.cpvDescriptionExpanded || item?.cpvDescription || "",
        url: item?.id ? `https://www.contractsfinder.service.gov.uk/notice/${item.id}` : "",
      };
    })
    .filter((item) => item.title && item.url)
    .slice(0, 12);
}

function safeNoticeUrl(value) {
  const url = new URL(value);
  const allowedHosts = ["www.find-tender.service.gov.uk", "www.contractsfinder.service.gov.uk"];
  if (!allowedHosts.includes(url.hostname)) {
    throw new Error("Only Find a Tender and Contracts Finder notice URLs are supported.");
  }
  if (url.hostname === "www.find-tender.service.gov.uk" && !url.pathname.startsWith("/Notice/")) {
    throw new Error("Only Find a Tender notice pages are supported.");
  }
  if (url.hostname === "www.contractsfinder.service.gov.uk" && !url.pathname.startsWith("/notice/")) {
    throw new Error("Only Contracts Finder notice pages are supported.");
  }
  return url;
}

function parseNotice(html, url) {
  const title = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const body = stripTags(html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html);
  return {
    title,
    url: url.toString(),
    text: body.slice(0, 12000),
  };
}

async function fetchFindTenderResults(keywords, region) {
  const search = new URL(FIND_TENDER_RESULTS_URL);
  search.searchParams.set("keywords", [keywords, region].filter(Boolean).join(" "));
  search.searchParams.set("sort", "unix_published_date:DESC");

  const response = await fetch(search.toString(), {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "user-agent": "RentalReadyAppliancesTenderMatcher/1.0 (+https://rentalreadyappliances.com)",
    },
  });

  if (!response.ok) throw new Error(`Find a Tender returned HTTP ${response.status}`);

  return {
    sourceUrl: search.toString(),
    results: parseTenderResults(await response.text()),
  };
}

async function fetchContractsFinderResults(keywords, region, postcode, valueCap, widened = false) {
  const sourceUrl = new URL(CONTRACTS_FINDER_RESULTS_URL);
  sourceUrl.searchParams.set("keywords", [keywords, region].filter(Boolean).join(" "));
  sourceUrl.searchParams.set("tender", "1");
  sourceUrl.searchParams.set("planning", "1");
  sourceUrl.searchParams.set("speculative", "1");
  sourceUrl.searchParams.set("awarded", "0");
  if (postcode) sourceUrl.searchParams.set("postcode", postcode);
  const body = {
    searchCriteria: {
      types: ["Contract", "Pipeline", "PreProcurement"],
      statuses: ["Open"],
      keyword: keywords,
      regions: widened ? null : region || null,
      postcode: widened ? null : postcode || null,
      valueTo: valueCap || null,
      suitableForSme: true,
    },
    size: 12,
  };

  const response = await fetch(CONTRACTS_FINDER_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "user-agent": "RentalReadyAppliancesContractMatcher/1.0 (+https://rentalreadyappliances.com)",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Contracts Finder returned HTTP ${response.status}`);

  return {
    sourceUrl: sourceUrl.toString(),
    results: parseContractsFinderResults(await response.json()),
    widened,
  };
}

function uniqueResults(results) {
  const seen = new Set();
  return results.filter((item) => {
    const key = `${item.platform}:${item.url || item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function handleTenderSearch(request) {
  const url = new URL(request.url);
  const keywords = url.searchParams.get("keywords") || DEFAULT_ACQUISITION_KEYWORDS;
  const region = url.searchParams.get("region") || "";
  const postcode = url.searchParams.get("postcode") || "";
  const source = url.searchParams.get("source") || "all";
  const valueCap = Number(url.searchParams.get("valueCap")) || 0;

  try {
    const fetches = [];
    if (source === "all" || source === "contracts") {
      fetches.push(fetchContractsFinderResults(keywords, region, postcode, valueCap).then(async (result) => {
        if (!result.results.length && (region || postcode)) {
          return fetchContractsFinderResults(keywords, "", "", valueCap, true);
        }
        return result;
      }));
    }
    if (source === "all" || source === "tenders") fetches.push(fetchFindTenderResults(keywords, region));
    const settled = await Promise.allSettled(fetches);
    const results = uniqueResults(settled.flatMap((item) => item.status === "fulfilled" ? item.value.results : [])).slice(0, 18);
    const sourceUrls = settled
      .filter((item) => item.status === "fulfilled")
      .map((item) => item.value.sourceUrl);
    const errors = settled
      .filter((item) => item.status === "rejected")
      .map((item) => item.reason.message);

    if (!results.length && errors.length) {
      return Response.json(
        { ok: false, error: errors.join(" | "), sourceUrls, keywords, region, source, results: [] },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      sourceUrl: sourceUrls.join(" | "),
      sourceUrls,
      source,
      keywords,
      region,
      results,
      warnings: errors,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message, keywords, region, source, results: [] },
      { status: 502 },
    );
  }
}

async function handleTenderDetail(request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  if (!target) {
    return Response.json({ ok: false, error: "Missing public procurement notice URL." }, { status: 400 });
  }

  let noticeUrl;
  try {
    noticeUrl = safeNoticeUrl(target);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 400 });
  }

  let response;
  try {
    response = await fetch(noticeUrl.toString(), {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "referer": noticeUrl.hostname === "www.contractsfinder.service.gov.uk"
          ? "https://www.contractsfinder.service.gov.uk/Search/Results"
          : "https://www.find-tender.service.gov.uk/Search/Results",
        "user-agent": "RentalReadyAppliancesContractMatcher/1.0 (+https://rentalreadyappliances.com)",
      },
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: `Public procurement notice details could not be loaded server-side. Open the opportunity link and paste the detail text into Contract detail notes. (${error.message})`,
      url: noticeUrl.toString(),
    });
  }

  if (!response.ok) {
    return Response.json({
      ok: false,
      error: `Public procurement notice details returned HTTP ${response.status}. Open the opportunity link and paste the detail text into Contract detail notes.`,
      url: noticeUrl.toString(),
    });
  }

  return Response.json({ ok: true, detail: parseNotice(await response.text(), noticeUrl) });
}

async function handleStockSearch(request) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const agentHost = url.hostname === "agent.rentalreadyappliances.com";

    if (url.pathname === "/api/tenders") {
      return handleTenderSearch(request);
    }

    if (url.pathname === "/api/tender-detail") {
      return handleTenderDetail(request);
    }

    if (url.pathname === "/api/stock-search") {
      return handleStockSearch(request);
    }

    if (agentHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const dashboardUrl = new URL(request.url);
      dashboardUrl.pathname = "/sourcing-dashboard.html";
      const response = await env.ASSETS.fetch(new Request(dashboardUrl, request));
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      headers.set("Cache-Control", "private, no-store");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    return env.ASSETS.fetch(request);
  },
};
