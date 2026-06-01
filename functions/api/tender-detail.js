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

export async function onRequestGet({ request }) {
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
