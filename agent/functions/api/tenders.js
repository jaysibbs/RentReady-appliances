const FIND_TENDER_RESULTS_URL = "https://www.find-tender.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_RESULTS_URL = "https://www.contractsfinder.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_API_URL = "https://www.contractsfinder.service.gov.uk/api/rest/2/search_notices/json";
const DEFAULT_ACQUISITION_KEYWORDS = "white goods supply OR domestic appliances 39700000 OR electrical domestic appliances 39710000 OR temporary accommodation appliances OR void property appliances OR housing association white goods";
const PUBLIC_FEED_TIMEOUT_MS = 8500;
const REGIONAL_SWEEP_TIMEOUT_MS = 22000;
const REGIONAL_BUYER_SWEEPS = [
  {
    name: "East Midlands district buyers",
    buyerQuery: "Leicester City Council OR Leicestershire County Council OR Rutland County Council OR Nottingham City Council OR Nottinghamshire County Council OR Derby City Council OR Derbyshire County Council OR Lincolnshire County Council OR West Northamptonshire Council OR North Northamptonshire Council",
  },
  {
    name: "West Midlands council and housing buyers",
    buyerQuery: "Birmingham City Council OR Coventry City Council OR City of Wolverhampton Council OR Sandwell Metropolitan Borough Council OR Walsall Council OR Dudley Metropolitan Borough Council OR Solihull Metropolitan Borough Council OR Warwickshire County Council OR Staffordshire County Council OR West Midlands Combined Authority",
  },
  {
    name: "Yorkshire and Humber councils",
    buyerQuery: "Leeds City Council OR Sheffield City Council OR City of Bradford Metropolitan District Council OR City of York Council OR Wakefield Council OR Kirklees Council OR Barnsley Council OR Doncaster Council OR Hull City Council OR East Riding of Yorkshire Council",
  },
  {
    name: "North East and Cumbria councils",
    buyerQuery: "Newcastle City Council OR Gateshead Council OR Sunderland City Council OR Durham County Council OR Northumberland County Council OR Middlesbrough Council OR Redcar and Cleveland Borough Council OR Cumberland Council OR Westmorland and Furness Council",
  },
  {
    name: "East of England councils",
    buyerQuery: "Cambridgeshire County Council OR Peterborough City Council OR Norfolk County Council OR Suffolk County Council OR Essex County Council OR Hertfordshire County Council OR Luton Borough Council OR Central Bedfordshire Council OR Southend-on-Sea City Council OR Thurrock Council",
  },
  {
    name: "London boroughs",
    buyerQuery: "London Borough OR City of London Corporation OR Greater London Authority OR Westminster City Council OR Royal Borough of Greenwich OR London Borough of Barnet OR London Borough of Croydon OR London Borough of Waltham Forest OR London Borough of Newham OR London Borough of Southwark OR London Borough of Lambeth",
  },
  {
    name: "South East councils",
    buyerQuery: "Surrey County Council OR West Sussex County Council OR East Sussex County Council OR Brighton and Hove City Council OR Hampshire County Council OR Portsmouth City Council OR Southampton City Council OR Oxfordshire County Council OR Buckinghamshire Council OR Milton Keynes City Council",
  },
  {
    name: "South West councils",
    buyerQuery: "Bristol City Council OR Bath and North East Somerset Council OR South Gloucestershire Council OR Gloucestershire County Council OR Somerset Council OR Dorset Council OR Devon County Council OR Plymouth City Council OR Cornwall Council OR Wiltshire Council",
  },
  {
    name: "Housing and temporary accommodation buyers",
    buyerQuery: "housing association OR registered provider OR temporary accommodation OR homelessness accommodation OR void property OR private sector leasing OR supported living OR social housing",
  },
  {
    name: "Education and public estates buyers",
    buyerQuery: "university OR college OR academy trust OR school trust OR student accommodation OR estates department OR facilities management",
  },
];
const REGIONAL_SWEEP_LIVE_QUERIES = {
  "East Midlands district buyers": "Leicester Leicestershire Rutland Nottingham Derby Lincolnshire Northamptonshire council housing supply",
  "West Midlands council and housing buyers": "Birmingham Coventry Wolverhampton Sandwell Walsall Dudley Solihull Warwickshire Staffordshire council housing supply",
  "Yorkshire and Humber councils": "Leeds Sheffield Bradford York Wakefield Kirklees Barnsley Doncaster Hull East Riding council housing supply",
  "North East and Cumbria councils": "Newcastle Gateshead Sunderland Durham Northumberland Middlesbrough Cumberland Cumbria council housing supply",
  "East of England councils": "Cambridgeshire Peterborough Norfolk Suffolk Essex Hertfordshire Luton Bedfordshire Southend Thurrock council housing supply",
  "London boroughs": "London borough housing temporary accommodation appliances supply",
  "South East councils": "Surrey Sussex Brighton Hampshire Portsmouth Southampton Oxfordshire Buckinghamshire Milton Keynes council housing supply",
  "South West councils": "Bristol Bath Gloucestershire Somerset Dorset Devon Plymouth Cornwall Wiltshire council housing supply",
  "Housing and temporary accommodation buyers": "housing association registered provider temporary accommodation homelessness void property supported living appliance supply",
  "Education and public estates buyers": "university college academy school student accommodation estates facilities appliance equipment supply",
};

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

function procurementRegion(value = "") {
  const region = String(value || "").trim();
  return /^(whole uk|uk-wide|united kingdom|national small lots)$/i.test(region) ? "" : region;
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = PUBLIC_FEED_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Public feed timed out after ${Math.round(timeoutMs / 1000)} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function compactRegionalKeywords(keywords, sweep) {
  const baseTerms = String(keywords || DEFAULT_ACQUISITION_KEYWORDS)
    .replace(/\bOR\b/gi, " ")
    .replace(/\b397\d+\b/g, " ")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !["the", "and", "for", "with", "supply"].includes(term.toLowerCase()));
  const uniqueBaseTerms = [...new Set(baseTerms)].slice(0, 8).join(" ");
  return `${uniqueBaseTerms || "white goods domestic appliances"} ${REGIONAL_SWEEP_LIVE_QUERIES[sweep.name] || sweep.name}`;
}

function fieldFromBlock(block, label) {
  const dtPattern = new RegExp(`<dt[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, "i");
  const entryPattern = new RegExp(`<div[^>]*class="[^"]*search-result-entry[^"]*"[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>\\s*([\\s\\S]*?)<\\/div>`, "i");
  return stripTags(block.match(dtPattern)?.[1] || block.match(entryPattern)?.[1] || "");
}

function parseFindTenderResults(html) {
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

async function fetchFindTenderResults(keywords, region) {
  region = procurementRegion(region);
  const search = new URL(FIND_TENDER_RESULTS_URL);
  search.searchParams.set("keywords", [keywords, region].filter(Boolean).join(" "));
  search.searchParams.set("sort", "unix_published_date:DESC");

  const response = await fetchWithTimeout(search.toString(), {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "user-agent": "RentalReadyAppliancesTenderMatcher/1.0 (+https://rentalreadyappliances.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Find a Tender returned HTTP ${response.status}`);
  }

  return {
    sourceUrl: search.toString(),
    results: parseFindTenderResults(await response.text()),
  };
}

async function fetchContractsFinderResults(keywords, region, postcode, valueCap, widened = false, timeoutMs = PUBLIC_FEED_TIMEOUT_MS) {
  region = procurementRegion(region);
  if (!region) postcode = "";
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

  const response = await fetchWithTimeout(CONTRACTS_FINDER_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "user-agent": "RentalReadyAppliancesContractMatcher/1.0 (+https://rentalreadyappliances.com)",
    },
    body: JSON.stringify(body),
  }, timeoutMs);

  if (!response.ok) {
    throw new Error(`Contracts Finder returned HTTP ${response.status}`);
  }

  return {
    sourceUrl: sourceUrl.toString(),
    results: parseContractsFinderResults(await response.json()),
    widened,
  };
}

async function fetchRegionalBuyerSweepResults(keywords, valueCap) {
  const sweeps = REGIONAL_BUYER_SWEEPS.map((sweep) => {
    const sweepKeywords = compactRegionalKeywords(keywords, sweep);
    return fetchContractsFinderResults(sweepKeywords, "", "", valueCap, true, REGIONAL_SWEEP_TIMEOUT_MS)
      .then((result) => ({
        sourceUrl: result.sourceUrl,
        results: result.results.map((item) => ({
          ...item,
          platform: `${item.platform} - ${sweep.name}`,
          description: [item.description, `Regional buyer sweep: ${sweep.name}`].filter(Boolean).join(" "),
        })),
      }));
  });
  const settled = await Promise.allSettled(sweeps);
  return {
    sourceUrls: settled.filter((item) => item.status === "fulfilled").map((item) => item.value.sourceUrl),
    results: settled.flatMap((item) => item.status === "fulfilled" ? item.value.results : []),
    warnings: settled.filter((item) => item.status === "rejected").map((item) => item.reason.message),
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

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const keywords = url.searchParams.get("keywords") || DEFAULT_ACQUISITION_KEYWORDS;
  const region = url.searchParams.get("region") || "";
  const apiRegion = procurementRegion(region);
  const postcode = apiRegion ? url.searchParams.get("postcode") || "" : "";
  const source = url.searchParams.get("source") || "all";
  const valueCap = Number(url.searchParams.get("valueCap")) || 0;

  try {
    const fetches = [];
    if (source === "all" || source === "contracts") {
      fetches.push(fetchContractsFinderResults(keywords, apiRegion, postcode, valueCap).then(async (result) => {
        if (!result.results.length && (apiRegion || postcode)) {
          return fetchContractsFinderResults(keywords, "", "", valueCap, true);
        }
        return result;
      }));
    }
    if (source === "all" || source === "tenders") fetches.push(fetchFindTenderResults(keywords, apiRegion));
    if (source === "all" || source === "regional") fetches.push(fetchRegionalBuyerSweepResults(keywords, valueCap));
    const settled = await Promise.allSettled(fetches);
    const results = uniqueResults(settled.flatMap((item) => item.status === "fulfilled" ? item.value.results : [])).slice(0, 18);
    const sourceUrls = settled
      .filter((item) => item.status === "fulfilled")
      .flatMap((item) => item.value.sourceUrls || item.value.sourceUrl || []);
    const errors = settled
      .filter((item) => item.status === "rejected")
      .map((item) => item.reason.message)
      .concat(settled
        .filter((item) => item.status === "fulfilled")
        .flatMap((item) => item.value.warnings || []));

    if (!results.length && errors.length) {
      return Response.json(
        { ok: false, error: errors.join(" | "), sourceUrls, keywords, region: region || "Whole UK", source, results: [] },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      sourceUrl: sourceUrls.join(" | "),
      sourceUrls,
      source,
      keywords,
      region: region || "Whole UK",
      results,
      warnings: errors,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message, keywords, region: region || "Whole UK", source, results: [] },
      { status: 502 },
    );
  }
}
