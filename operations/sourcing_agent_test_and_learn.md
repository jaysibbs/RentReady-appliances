# RentalReady Sourcing Agent Test-and-Learn Runbook

## Purpose

The sourcing agent is built to find public-sector goods opportunities first, then prove whether RentalReady can source enough stock before bidding. The goal is not to chase every tender. The goal is to find medium, practical contracts where stock availability, cost, timing, and a minimum 45% ROI all line up.

## Daily Run

1. Open `agent.rentalreadyappliances.com`.
2. Go to `Step 3 - Contracts`.
3. Keep `Opportunity source` on `Government goods routes` for the main run.
4. Use focused goods keywords:
   - `white goods supply`
   - `domestic appliances 39700000`
   - `electrical domestic appliances 39710000`
   - `temporary accommodation appliances`
   - `void property appliances`
   - `housing association white goods`
   - `student accommodation appliances`
   - `kitchen equipment supply`
5. Set the anchor cap to the largest contract you can realistically finance, fulfil, and evidence.
6. Click `Run test-and-learn`.
7. Review the selected opportunity panel, not just the headline list.

## Government Source Coverage

The live automated feed currently consolidates:

- Contracts Finder
- Find a Tender

The watchlist/source route panel also opens:

- Public Contracts Scotland
- Sell2Wales
- eTendersNI
- Crown Commercial Service supplier routes

Regional and framework routes should be manually verified until a stable official feed is added for that portal.

## Stock Source Coverage

The stock evidence route attempts live page searches for:

- John Pye general auctions
- John Pye trade auctions
- BPI Auctions
- BidSpotter

It also provides manual verification routes for:

- i-bidder
- William George
- Eddisons
- NCM Auctions

Parsed stock is evidence only. It is not approved stock. Each lot must still be opened and checked for fees, VAT, lot condition, collection window, quantity, location, and whether the item can be reserved before the bid is submitted.

## Bid / No-Bid Gates

Proceed to bid-pack preparation only when:

- The notice is goods-led, not mostly services or works.
- The value is within the current startup anchor range.
- Required quantity is clear.
- Full stock coverage is possible from one source or a controlled multi-source plan.
- Stock is available before submission and before the contract delivery schedule.
- The lowest viable lot still protects at least 45% ROI after buyer premium, VAT on fees, logistics, and testing/refurb buffer.
- Contract detail notes include the specification, deadline, delivery expectations, application route, and buyer requirements.

Do not submit where:

- The opportunity is mainly consultancy, staffing, transport, or broad managed services.
- The contract requires accreditations, insurance, finance, or delivery capacity RentalReady cannot evidence.
- Stock coverage is partial.
- Auction availability cannot be verified before submission.
- The margin depends on assuming a final auction price that is not yet realistic.

## Learning Loop

Every approved or rejected stock decision changes the scoring weights in the browser. Export the learning data weekly before clearing browser data. The useful learning signals are:

- Which sources consistently return real appliance stock.
- Which sources return false positives or poor condition risk.
- Which product categories protect the 45% ROI target.
- Which buyer routes are achievable for a startup.
- Which deadlines are too close for auction-based fulfilment.

## Bid Pack Output

The bid pack export includes:

- Opportunity summary
- Readiness decision
- Stock source plan
- Matched stock evidence
- Live auction evidence leads
- Draft executive summary
- Fulfilment method
- Commercial assumptions
- Quality and risk controls
- Buyer evidence checklist
- Missing items before submission
- Clarification questions
- Contract detail notes

Use the pack as a controlled first draft. Before sending it to any portal, manually verify the notice instructions and rewrite portal-specific responses into the buyer's required format.
