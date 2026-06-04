# RentalReady AI Sourcing Agent

## Purpose

The sourcing agent is contract-first. It finds or stores a live contract/tender opportunity, then checks whether available stock can fulfil the whole requirement before RentalReady commits funds or prepares a bid.

The preferred operating model is opportunity-led sourcing:

1. Find a goods-based contract or tender.
2. Save the opportunity record, including authority, value, quantity, deadline, region, source link, and specification notes.
3. Search John Pye, BPI Auctions, BidSpotter, and similar sources for stock that can satisfy the requirement.
4. Approve only stock that protects margin, meets timing, and can cover the full quantity.
5. Produce a bid/application pack only when the opportunity is viable.

The agent is built for review, not auto-buying or auto-submission. Every lot still needs manual checks for condition, photos, collection rules, buyer premium, VAT, warranty/returns position, final availability, and delivery feasibility.

## ROI Rule

The dashboard uses ROI as:

```text
ROI = (target contract value per unit - landed cost) / landed cost
```

The default minimum ROI target is 45%.

For example, if the contract value per unit is 250 GBP, the maximum landed cost is:

```text
250 / 1.45 = 172.41 GBP
```

The maximum safe bid is then calculated after allowing for:

- buyer premium percentage
- VAT on buyer premium
- logistics or collection allowance
- testing, cleaning, or refurbishment buffer

When a public opportunity has a total value and quantity, the dashboard converts it to a per-unit target value before ranking stock. A 10-unit contract worth 5,000 GBP is therefore treated as 500 GBP per unit, not 5,000 GBP per item.

## Current Workflow

1. Use the `Goods contract matcher` to fetch live Contracts Finder and Find a Tender results.
2. Select an opportunity from the live/pasted results.
3. Review the full opportunity panel: authority, title, value, quantity, value per unit, region, deadline, source, goods fit, service risk, and ranking.
4. Save the contract/tender opportunity.
5. Use the stock fulfilment agent to search John Pye, BPI Auctions, BidSpotter, and similar sources.
6. Paste promising stock lots into the dashboard, one lot per line where possible.
7. Rank lots against the selected opportunity, not against saved customer data.
8. Add viable lots to the shortlist.
9. Approve or reject lots so the dashboard learns future scoring preferences.
10. Prepare a bid pack only when stock coverage, deadline timing, and ROI are strong enough.

Manual opportunities can still be added in Step 1, but they should represent a real contract/tender/portal opportunity rather than a speculative customer wish list.

## Public Contract Workflow

1. Set the region focus and starter contract cap.
2. Use `Goods contracts first` to fetch both Contracts Finder and Find a Tender, with Contracts Finder prioritised for smaller live opportunities.
3. Review returned live results, including authority, title, description, value, location, notice type, source platform, deadline, and source URL.
4. Paste additional Contracts Finder or Find a Tender opportunities into the matcher when needed, one opportunity per line.
5. Rank opportunities by local fit, value cap, deadline risk, goods supply fit, service-heavy risk, and material fit.
6. Open opportunity details and paste specification text into Contract detail notes if the detail page cannot be loaded server-side.
7. Save only viable goods/material/equipment opportunities.
8. Match supplier stock against the saved opportunity before any bid decision.
9. Confirm whether fulfilment can come from one source or requires multiple sources.
10. Prepare the bid pack only when the contract details, stock coverage, ROI, and deadline checks are strong enough.

The public contract lane is designed to find profitable supply opportunities. It does not submit public-sector bids, make supplier purchases, or claim compliance. Submission still needs manual review of eligibility, insurance, delivery capacity, terms, references, supplier registration, pricing schedules, and portal declarations.

The dashboard uses Cloudflare server-side routing to fetch live Contracts Finder and Find a Tender search results because browser-side requests may be blocked by cross-origin rules. For Git-based Cloudflare builds, the same routes are available in `functions/api/`. For manual Cloudflare zip uploads, `_worker.js` must be included in the deploy zip so `/api/tenders` and `/api/tender-detail` return JSON instead of the static homepage.

The live feed supports three modes:

- `Goods contracts first`: merged Contracts Finder and Find a Tender results, ranked with goods opportunities ahead of service-heavy notices.
- `Contracts Finder only`: useful for smaller below-threshold opportunities and local authority supply contracts.
- `Find a Tender only`: useful for larger notices where the specification is clearly supply-led and stock coverage can be validated.

The goods-first score boosts signals such as supply, goods, equipment, appliances, white goods, fridges, washing machines, cookers, dishwashers, microwaves, materials, and stock. It downgrades service-heavy signals such as consultancy, transport, passenger assistant, staffing, cleaning service, managed service, mechanical works, maintenance service, and broad works packages.

John Pye stock availability is shown through matched/imported lots and direct source links because the John Pye auction platform can challenge non-browser programmatic requests. Do not treat unavailable automated John Pye scraping as confirmed stock; only approved matched lots count towards stock coverage.

## Contract Application Readiness

Before applying for a public contract opportunity, the bid desk checks:

- opportunity details and specification have been pasted/reviewed
- public notice link is available
- matched stock covers the full required quantity
- approved stock covers the full required quantity
- stock is available before the submission deadline
- approved timed stock covers the full required quantity
- lowest matched ROI protects at least 45%
- submission deadline is captured

The dashboard can prepare a bid pack with opportunity details, stock evidence, projected ROI, assumptions, and missing actions. It should not submit the contract automatically. Final submission should be done manually after confirming the authority portal requirements, declarations, insurances, references, pricing schedule, delivery commitments, and any exclusion grounds or compliance questions.

The bid desk should make the go/no-go decision obvious:

- contract details must remain visible, including authority, title, opportunity type, category, required quantity, value, region, deadline, and source link
- goods supply fit and service-heavy risk must be visible before a bid pack is started
- stock coverage must show required quantity, matched quantity, approved quantity, lowest ROI, projected profit, and submission deadline
- stock lines must show supplier, location, quantity, available date, landed cost, ROI, and approval status
- the stock source plan must say whether one source can cover the contract or whether multi-source fulfilment is needed
- the decision should clearly say whether the contract is worth applying for, potentially worth preparing, or not worth applying for yet

## Lot Paste Format

The parser works best with one lot per line:

```text
Beko 8kg Washing Machine | Current bid £62 | Nottingham | Ends 2026-06-04 | https://example-lot-url
Bosch Dishwasher graded return | £95 | Birmingham | 04/06/2026 | https://example-lot-url
```

The agent tries to infer:

- appliance/material category
- brand
- current bid
- location
- condition route
- available date
- lot URL

## Approval Standard

A product should only move from shortlist to purchase consideration when:

- a live contract/tender opportunity is attached to the candidate
- the estimated landed cost protects at least 45% ROI
- the stock can be available before the submission deadline
- the condition route matches the opportunity quality requirement
- the auction photos and notes do not show unacceptable damage
- delivery, collection, testing, and access assumptions are realistic
- the operator has approved the route before funds are committed

## Saved Opportunity Statuses

- `Live`: manual contract/tender opportunity has been captured and can be matched.
- `Tender`: public-sector contract or tender opportunity has been added and needs stock/margin validation.
- `Matched`: at least one supplier candidate has been approved against the opportunity.
- `Bid Pack`: application pack is being prepared.
- `Submitted`: application has been submitted manually through the correct portal.
- `Closed`: the opportunity is no longer active.

## Future Upgrade

The next permanent version should use a backend worker or server-side integration to fetch supplier data, store decisions centrally, and connect selected lots to the CRM/payment workflow. Browser-only code should not hold API keys or scrape suppliers directly.
