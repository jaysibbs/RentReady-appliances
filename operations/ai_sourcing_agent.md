# RentalReady AI Sourcing Agent

## Purpose

The sourcing agent helps review John Pye-style auction and clearance lots against a saved customer brief before RentalReady commits funds.

The agent is built for review, not auto-buying. Every auction lot still needs manual checks for condition, photos, collection rules, buyer premium, VAT, warranty/returns position, and final availability.

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
2. Set the ROI target, buyer premium, VAT on fees, collection/logistics buffer, and refurb buffer.
3. Generate John Pye search links based on the appliance category.
4. Review John Pye lots manually.
5. Paste promising lots into the dashboard, ideally one lot per line.
6. Rank the lots.
7. Add suitable lots to the shortlist.
8. Approve or reject candidates so the dashboard learns future scoring preferences.

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

- the estimated landed cost protects at least 45% ROI
- the condition route matches the customer quality level
- the auction photos and notes do not show unacceptable damage
- delivery, collection, testing, and access assumptions are realistic
- the customer or internal buyer has approved the route before funds are committed

## Future Upgrade

The next permanent version should use a backend worker or server-side integration to fetch supplier data, store decisions centrally, and connect selected lots to the CRM/payment workflow. Browser-only code should not hold API keys or scrape suppliers directly.
