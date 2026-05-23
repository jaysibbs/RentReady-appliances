# Hosting Preflight Checklist

Use this before moving from the temporary Cloudflare tunnel to the permanent hosted website.

## Files

- Confirm `dist/` contains only public website files.
- Confirm `outputs/rentalready_appliances_site_dist.zip` is current.
- Confirm no `theme-options.html` or other mockup pages are in `dist/`.
- Confirm policy pages exist:
  - `privacy.html`
  - `terms.html`
  - `warranty-returns.html`
  - `delivery-haul-away.html`
- Confirm hosting support files are present:
  - `robots.txt`
  - `site.webmanifest`
  - `_headers`
  - `_redirects`
- Add a final `sitemap.xml` using `https://rentalreadyappliances.com/` after the domain is connected, so search engines do not receive a temporary tunnel URL.

## Forms

- Submit one test quote from desktop.
- Submit one test quote from mobile.
- Confirm email arrives at `sibbslani@rentreadyappliances.org`.
- Confirm smart quote brief is included.
- Confirm the email quote brief fallback opens correctly on mobile and desktop.

## Content

- Confirm phone / WhatsApp number.
- Confirm service area.
- Confirm launch offer wording.
- Confirm starter prices match `operations/price_list.csv`.
- Confirm gas warning remains visible on cooker page.
- Confirm delivery and haul-away are clearly separate.

## Technical

- Set primary custom domain to `rentalreadyappliances.com`.
- Redirect `rentalreadyappliances.uk` to `rentalreadyappliances.com`.
- Enable HTTPS.
- Confirm clean URL redirects work, especially `/how-it-works`, `/fridges`, `/landlord-turnover-sets`, and `/delivery-haul-away`.
- Add canonical tags and sitemap URLs after the permanent domain is confirmed.
- Test homepage and all category pages.
- Test footer links.
- Test on mobile data, not only Wi-Fi.
- Save final live URL in CRM and outreach templates.

## Marketing

- Add live domain to email templates.
- Add live domain to brochure email.
- Prepare first 30-50 outreach targets.
- Create WhatsApp Business profile.
- Prepare Google Business Profile only after service area/contact strategy is confirmed.
