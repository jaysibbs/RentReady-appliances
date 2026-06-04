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

export async function onRequestGet({ request }) {
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
