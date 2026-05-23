# RentalReady Appliances - Launch Plan For Tomorrow

## Goal

Move RentalReady Appliances from temporary preview to a proper hosted website, then begin controlled outreach to potential clients.

## Current Assets Ready

- Website source and deploy folder: `dist/`
- Deploy zip: `outputs/rentalready_appliances_site_dist.zip`
- Quote form destination: `sibbslani@rentreadyappliances.org`
- Brochure PDFs: `outputs/brochures/`
- CRM workbook: `outputs/rentready_appliances_crm.xlsx`
- Hosting support files: `robots.txt`, `site.webmanifest`, `_headers`, and `_redirects`
- Purchased domains: `rentalreadyappliances.com` and `rentalreadyappliances.uk`
- Domain connection guide: `operations/domain_connection_and_testing_guide.md`
- Current temporary preview: replace with permanent domain once hosting is complete.

## Decisions To Confirm First

- Domain: use `rentalreadyappliances.com` as the primary domain and redirect `rentalreadyappliances.uk` to it.
- Service area wording: choose one of:
  - Initial local launch: specific city/region.
  - Regional launch: e.g. Midlands / West Midlands.
  - UK sourcing language: UK-focused, logistics quoted separately.
- Contact details:
  - Business phone / WhatsApp number.
  - Final email address.
  - Whether to show Gmail temporarily or only use the form.
- Launch offer:
  - Example: "Pilot pricing for first 10 landlord or agency quote requests."
  - Avoid discount promises until fulfilment costs are clearer.

## Recommended Hosting Route

Use Cloudflare Pages first.

Why:
- Static site fits Cloudflare Pages well.
- We are already testing through Cloudflare.
- Custom domain and HTTPS can be handled cleanly.
- The `dist/` folder is already deployment-ready.

## Cloudflare Pages Deployment Checklist

1. Create or open a Cloudflare account.
2. Add `rentalreadyappliances.com`.
3. Create a Pages project named `rentalreadyappliances`.
4. Deploy the contents of `dist/`.
5. Connect `rentalreadyappliances.com` as the primary custom domain.
6. Confirm HTTPS is active.
7. Add `rentalreadyappliances.uk` as a redirect to `rentalreadyappliances.com`.
8. Confirm clean URL aliases work:
   - `/how-it-works`
   - `/fridges`
   - `/landlord-turnover-sets`
   - `/delivery-haul-away`
9. Test these pages:
   - `/index.html`
   - `/how-it-works.html`
   - `/fridge-freezers.html`
   - `/landlord-turnover-sets.html`
   - `/privacy.html`
   - `/terms.html`
   - `/warranty-returns.html`
   - `/delivery-haul-away.html`
10. Send one test quote from desktop.
11. Send one test quote from mobile.
12. Confirm both emails arrive at `sibbslani@rentreadyappliances.org`.

## Final Website Checks Before Outreach

- Replace placeholder phone number if using WhatsApp publicly.
- Confirm service area wording.
- Confirm domain links work without `.html` if the host supports clean URLs.
- Add sitemap and canonical URLs after the permanent domain is confirmed.
- Check mobile homepage, quote form, and landlord turnover page.
- Check all footer policy links.
- Confirm the smart quote brief appears in the FormSubmit email.
- Confirm image load speed on mobile data.

## First Outreach Targets

Start with 30-50 warm, practical prospects:

- Letting agencies with property management departments.
- Independent estate agents offering lettings.
- HMO landlords and HMO management companies.
- Serviced accommodation operators.
- Small refurbishment contractors.
- Build-to-rent and new-build handover contacts.
- Property maintenance companies.

## First Outreach Rhythm

Day 1:
- Send 20 highly targeted emails.
- Send 10 LinkedIn connection/message attempts.
- Send WhatsApp Business link to warm contacts only.

Day 2:
- Follow up with any opens/replies.
- Call the most relevant 5-10 letting/property management offices.
- Record every reply in the CRM.

Day 3:
- Adjust messaging based on objections.
- Add FAQs to website if the same questions repeat.

## Success Metrics For Week 1

- 50 targeted prospects contacted.
- 10 conversations started.
- 3 quote requests submitted.
- 1 pilot order or serious procurement conversation.
- Clear notes on most requested appliances, budgets, delivery demand, and haul-away demand.

## Do Not Overpromise Yet

- Do not promise guaranteed brands unless stock is confirmed.
- Do not present delivery or haul-away as included.
- Do not promise installation unless a qualified route is arranged.
- Do not describe gas appliances as ready to use without Gas Safe testing.
- Do not hide that starter prices change by brand, condition, size, finish, and quality.
