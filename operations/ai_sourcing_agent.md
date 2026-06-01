# RentalReady AI Sourcing Agent

## Purpose

The sourcing agent helps review John Pye-style auction and clearance lots against a saved customer brief before RentalReady commits funds.

The preferred operating model is request-led sourcing: capture the buyer demand first, then find stock that can fulfil that exact request at the required margin. This reduces speculative buying and keeps purchase decisions tied to a real customer need.

The agent is built for review, not auto-buying. Every auction lot still needs manual checks for condition, photos, collection rules, buyer premium, VAT, warranty/returns position, and final availability.

The public-sector lane should start with narrow Find a Tender searches for below-cap local/regional material, appliance, and equipment supply opportunities. The aim is not to chase large national frameworks at the beginning; it is to identify smaller demand that can be fulfilled with stock from profitable sources.

## ROI Rule

The dashboard uses ROI as:

```text
ROI = (target sale price - landed cost) / landed cost
```

The default minimum ROI target is 45%.

For example, if the customer budget or target sale price is 250 GBP, the maximum landed cost is:

```text
250 / 1.45 = 172.41 GBP
```

The maximum safe bid is then calculated after allowing for:

- buyer premium percentage
- VAT on buyer premium
- logistics or collection allowance
- testing, cleaning, or refurbishment buffer

This keeps the recommendation focused on profit after real sourcing costs, not just headline auction bid price.

## Current Workflow

1. Save the customer requirement in `sourcing-dashboard.html`.
2. Add the requirement to the buyer demand queue.
3. Select the live buyer request before searching supplier stock.
4. Set the ROI target, buyer premium, VAT on fees, collection/logistics buffer, and refurb buffer.
5. Generate John Pye search links based on the appliance category.
6. Review John Pye lots manually.
7. Paste promising lots into the dashboard, ideally one lot per line.
8. Rank the lots against the selected buyer request.
9. Add suitable lots to the shortlist.
10. Approve or reject candidates so the dashboard learns future scoring preferences.

## Find a Tender Workflow

1. Set the region focus and starter contract cap.
2. Fetch live Find a Tender results from the dashboard or generate Find a Tender searches for white goods, appliances, kitchen equipment, and related material supply terms.
3. Review the returned live results, including buyer, title, description, value, location, notice type, deadline, and source URL.
4. Paste additional opportunities into the tender matcher when needed, one opportunity per line.
5. Rank opportunities by local fit, value cap, deadline risk, and material fit.
6. Open tender details and paste specification text into Tender detail notes if the detail page cannot be loaded server-side.
7. Check stock availability across:
   - John Pye Auctions
   - BPI Auctions
   - BidSpotter
8. Add only viable opportunities to the demand queue.
9. Match supplier stock against the tender demand before any bid decision.
10. Prepare the bid pack only when the tender details, stock coverage, ROI, and deadline checks are strong enough.

The tender lane is designed to create demand signals. It does not submit public-sector bids, make supplier purchases, or claim compliance. Tender submission still needs manual review of eligibility, insurance, delivery capacity, terms, references, and any required supplier registration.

The dashboard uses a Cloudflare Pages Function to fetch live Find a Tender search results because browser-side requests may be blocked by cross-origin rules. John Pye stock availability is shown through matched/imported lots and direct source links because the John Pye auction platform can challenge non-browser programmatic requests. Do not treat unavailable automated John Pye scraping as confirmed stock; only approved matched lots count towards stock coverage.

## Tender Application Readiness

Before applying for a tender, the bid desk checks:

- tender details and specification have been pasted/reviewed
- tender notice link is available
- matched stock covers the full required quantity
- approved stock covers the full required quantity
- lowest matched ROI protects at least 45%
- submission deadline is captured

The dashboard can prepare a bid pack with opportunity details, stock evidence, projected ROI, assumptions, and missing actions. It should not submit the tender automatically. Final submission should be done manually after confirming the buyer portal requirements, declarations, insurances, references, pricing schedule, delivery commitments, and any exclusion grounds or compliance questions.

The bid desk should make the go/no-go decision obvious:

- tender details must remain visible, including buyer, title, category, required quantity, value, region, deadline, and source link
- stock coverage must show required quantity, matched quantity, approved quantity, lowest ROI, and projected profit
- stock lines must show supplier, location, quantity, landed cost, ROI, and approval status
- the decision should clearly say whether the tender is worth applying for, potentially worth preparing, or not worth applying for yet

## Lot Paste Format

The parser works best with one lot per line:

```text
Beko 8kg Washing Machine | Current bid £62 | Nottingham | Ends 2026-06-04 | https://example-lot-url
Bosch Dishwasher graded return | £95 | Birmingham | 04/06/2026 | https://example-lot-url
```

The agent tries to infer:

- appliance category
- brand
- current bid
- location
- condition route
- available date
- lot URL

## Approval Standard

A product should only move from shortlist to purchase consideration when:

- a live buyer request is attached to the candidate
- the estimated landed cost protects at least 45% ROI
- the condition route matches the customer quality level
- the auction photos and notes do not show unacceptable damage
- delivery, collection, testing, and access assumptions are realistic
- the customer or internal buyer has approved the route before funds are committed

## Demand Queue Statuses

- `Live`: customer need has been captured and can be matched.
- `Tender`: public-sector opportunity has been added from Find a Tender and needs stock/margin validation.
- `Matched`: at least one supplier candidate has been approved against the request.
- `Quoted`: a customer-facing quote has been sent or is being prepared.
- `Won`: the customer has accepted and the request is no longer open for sourcing.
- `Closed`: the request is no longer active.

## Future Upgrade

The next permanent version should use a backend worker or server-side integration to fetch supplier data, store decisions centrally, and connect selected lots to the CRM/payment workflow. Browser-only code should not hold API keys or scrape suppliers directly.
