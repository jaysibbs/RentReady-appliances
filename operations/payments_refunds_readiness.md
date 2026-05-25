# Payments And Refunds Readiness

This note prepares RentalReady Appliances for taking sourcing funds through a business account without exposing bank details too early on the website.

## Intended Payment Flow

1. Customer sends a quote request through the website, email, or WhatsApp.
2. RentalReady confirms the requirement, budget, quality route, postcode, access, and timescale.
3. RentalReady sends a written shortlist or sourcing plan before requesting funds.
4. Customer pays a clearly labelled sourcing deposit or purchase fund into the business payment route.
5. Funds are used only for the agreed appliance sourcing request.
6. If a suitable appliance cannot be sourced within the agreed window, the refundable part of the funds is returned.
7. If the customer approves a sourced item, the payment is applied to the purchase and any agreed delivery or haul-away charges.

## Business Account Requirements

Open a business account that supports:

- Clear incoming payment references.
- Fast Payments in and out.
- Exportable transaction statements.
- Refund payments back to the customer where needed.
- Separate tracking for deposits, purchase funds, delivery charges, and refunds.
- Optional second account or savings pot for customer-held sourcing funds.

Recommended internal pots:

- `Operating funds`: general business costs.
- `Customer sourcing funds`: money received for appliance purchase requests.
- `Refund reserve`: funds kept available for cancelled or failed sourcing requests.

Do not mix customer sourcing funds with day-to-day spending unless the purchase has been approved and recorded.

## Payment Provider Recommendation

Start with invoices or payment links rather than publishing raw bank details on the website.

Good first options:

- Bank transfer for trusted landlords, letting agents, and construction firms.
- Stripe Payment Links or invoices for card payments and easier refund handling.
- PayPal Business only if useful for customer trust, but track fees carefully.

Avoid adding a full checkout until pricing, stock approval, and refund terms are stable.

## Website Copy To Add Later

Use this only once the business account and refund process are active:

> Sourcing funds are only requested after we confirm your appliance brief. If we cannot source a suitable appliance within the agreed window, the refundable purchase funds are returned. Any non-refundable sourcing, delivery, or admin fees will be clearly agreed before payment.

Short version for quote page:

> Pay only after we confirm the sourcing route. Refundable purchase funds are returned if suitable stock cannot be sourced within the agreed window.

## Refund Rules To Decide Before Launch

Before taking deposits, decide:

- Is any sourcing/admin fee non-refundable?
- What is the sourcing window: 3 days, 5 days, 7 days, or quote-specific?
- Are refunds returned to the original payment method where possible?
- What happens if a customer changes their mind after approving an item?
- What happens if an appliance is unavailable after supplier confirmation?
- Who pays payment processing fees if a refund is requested?
- How quickly refunds are processed after a failed sourcing attempt.

Recommended starting position:

- Purchase funds are refundable if RentalReady cannot source a suitable option within the agreed window.
- Any non-refundable sourcing fee must be agreed clearly before payment.
- Refunds should be processed within 3-5 working days after the refund decision.
- Approved purchases become subject to supplier availability, delivery, and returns terms.

## Record Keeping

Every paid request should have:

- Customer name and contact details.
- Quote reference.
- Payment reference.
- Amount received.
- What part is refundable purchase fund.
- What part is sourcing, delivery, haul-away, or admin fee.
- Date received.
- Sourcing deadline.
- Item approved or not approved.
- Refund status if applicable.

Add these columns to the CRM before accepting live sourcing funds:

- `Payment status`
- `Payment reference`
- `Amount received`
- `Refundable amount`
- `Non-refundable fee`
- `Sourcing deadline`
- `Refund due`
- `Refund paid date`

## Website Implementation Plan

Phase 1:

- Keep the website as enquiry-first.
- Send payment instructions manually after confirming the brief.
- Add payment/refund wording to the quote confirmation email.

Phase 2:

- Add a secure payment link button after quote approval.
- Use a provider dashboard for refunds.
- Add payment status fields to the sourcing dashboard.

Phase 3:

- Connect a payment API to the sourcing dashboard.
- Auto-create payment links from approved quote briefs.
- Log payment reference and refund status automatically.

## Important Caution

This is an operational plan, not legal or financial advice. Before taking customer sourcing funds at scale, confirm the wording with an accountant or solicitor, especially if funds are held for multiple customers or for larger corporate orders.
