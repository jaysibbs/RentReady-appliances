const FIND_TENDER_RESULTS_URL = "https://www.find-tender.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_RESULTS_URL = "https://www.contractsfinder.service.gov.uk/Search/Results";
const CONTRACTS_FINDER_API_URL = "https://www.contractsfinder.service.gov.uk/api/rest/2/search_notices/json";

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
  const search = new URL(FIND_TENDER_RESULTS_URL);
  search.searchParams.set("keywords", [keywords, region].filter(Boolean).join(" "));
  search.searchParams.set("sort", "unix_published_date:DESC");

  const response = await fetch(search.toString(), {
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

  if (!response.ok) {
    throw new Error(`Contracts Finder returned HTTP ${response.status}`);
  }

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

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const keywords = url.searchParams.get("keywords") || "white goods appliances";
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
