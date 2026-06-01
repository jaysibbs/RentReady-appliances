const FIND_TENDER_RESULTS_URL = "https://www.find-tender.service.gov.uk/Search/Results";

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
  const pattern = new RegExp(`<dt[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, "i");
  return stripTags(block.match(pattern)?.[1] || "");
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
        url: href,
      };
    })
    .filter((item) => item.title && item.url)
    .slice(0, 12);
}

function safeNoticeUrl(value) {
  const url = new URL(value);
  if (url.hostname !== "www.find-tender.service.gov.uk") {
    throw new Error("Only Find a Tender notice URLs are supported.");
  }
  if (!url.pathname.startsWith("/Notice/")) {
    throw new Error("Only Find a Tender notice pages are supported.");
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

async function handleTenderSearch(request) {
  const url = new URL(request.url);
  const keywords = url.searchParams.get("keywords") || "white goods appliances";
  const region = url.searchParams.get("region") || "";
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
    return Response.json(
      { ok: false, error: `Find a Tender returned HTTP ${response.status}`, sourceUrl: search.toString(), results: [] },
      { status: 502 },
    );
  }

  const html = await response.text();
  return Response.json({
    ok: true,
    sourceUrl: search.toString(),
    keywords,
    region,
    results: parseTenderResults(html),
  });
}

async function handleTenderDetail(request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  if (!target) {
    return Response.json({ ok: false, error: "Missing Find a Tender notice URL." }, { status: 400 });
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
        "referer": "https://www.find-tender.service.gov.uk/Search/Results",
        "user-agent": "RentalReadyAppliancesTenderMatcher/1.0 (+https://rentalreadyappliances.com)",
      },
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: `Find a Tender notice details could not be loaded server-side. Open the tender link and paste the notice detail text into Tender detail notes. (${error.message})`,
      url: noticeUrl.toString(),
    });
  }

  if (!response.ok) {
    return Response.json({
      ok: false,
      error: `Find a Tender notice details returned HTTP ${response.status}. Open the tender link and paste the notice detail text into Tender detail notes.`,
      url: noticeUrl.toString(),
    });
  }

  return Response.json({ ok: true, detail: parseNotice(await response.text(), noticeUrl) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/tenders") {
      return handleTenderSearch(request);
    }

    if (url.pathname === "/api/tender-detail") {
      return handleTenderDetail(request);
    }

    return env.ASSETS.fetch(request);
  },
};
