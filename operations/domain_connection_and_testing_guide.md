# Domain Connection And Testing Guide

Use this to connect `rentalreadyappliances.com`, redirect `rentalreadyappliances.uk`, deploy the website, and test quote capture.

## 1. Prepare The Domain

Primary domain:

`rentalreadyappliances.com`

Redirect/protection domain:

`rentalreadyappliances.uk`

Recommended setup:

- Host the site on Cloudflare Pages.
- Use Cloudflare DNS for both domains.
- Set `rentalreadyappliances.com` as the primary website.
- Redirect `rentalreadyappliances.uk` to `rentalreadyappliances.com`.

## 2. Add The Domain To Cloudflare

1. Log in to Cloudflare.
2. Go to **Websites**.
3. Select **Add a site**.
4. Enter `rentalreadyappliances.com`.
5. Choose the Free plan unless you already know you need a paid plan.
6. Let Cloudflare scan existing DNS records.
7. Keep any email-related records if the domain already has email configured.
8. Cloudflare will show two nameservers. Copy them.

## 3. Update Nameservers At The Registrar

Do this wherever the domains were purchased, for example Squarespace Domains, Namecheap, GoDaddy, 123 Reg, or another registrar.

For `rentalreadyappliances.com`:

1. Open the domain settings.
2. Find **Nameservers** or **DNS settings**.
3. If DNSSEC is enabled, disable it before changing nameservers unless the registrar gives Cloudflare-specific DNSSEC values.
4. Replace the current nameservers with the two Cloudflare nameservers.
5. Save.

Repeat for `rentalreadyappliances.uk`.

DNS changes can take minutes, but allow up to 24-48 hours if a registrar is slow.

## 4. Deploy The Website To Cloudflare Pages

The deploy folder is:

`dist/`

The deploy zip is:

`outputs/rentalready_appliances_site_dist.zip`

Steps:

1. In Cloudflare, go to **Workers & Pages**.
2. Select **Create application**.
3. Select **Pages**.
4. Name the Pages project `rentalreadyappliances`.
5. Use **Direct Upload** if you are not connecting GitHub yet.
6. Upload the contents of the `dist/` folder, or use the deploy zip if Cloudflare accepts the zip upload.
7. Wait for the temporary Pages URL to deploy.
8. Open the temporary Pages URL and check the homepage.

Project naming:

- Public brand: `RentalReady Appliances`
- Cloudflare Pages project slug: `rentalreadyappliances`
- Expected Pages preview style: `https://rentalreadyappliances.pages.dev`

## 5. Connect The Custom Domain

Inside the Cloudflare Pages project:

1. Open the Pages project.
2. Go to **Custom domains**.
3. Add `rentalreadyappliances.com`.
4. Add `www.rentalreadyappliances.com` if Cloudflare asks separately.
5. Wait for SSL/HTTPS to become active.
6. Test:
   - `https://rentalreadyappliances.com/`
   - `https://www.rentalreadyappliances.com/`

Recommended final behaviour:

- `rentalreadyappliances.com` should load the site.
- `www.rentalreadyappliances.com` should also load the site or redirect to the non-www domain.

## 6. Redirect The `.uk` Domain

In Cloudflare, add `rentalreadyappliances.uk` as a zone if it is not already added.

Current status to fix:

- `rentalreadyappliances.uk` is using Cloudflare nameservers.
- The domain still needs DNS/custom-domain routing before the redirect can work.
- `www.rentalreadyappliances.com` also needs a DNS/custom-domain record.

Recommended Cloudflare Pages setup:

1. Open Cloudflare.
2. Go to **Workers & Pages**.
3. Open the `rentalreadyappliances` Pages project.
4. Go to **Custom domains**.
5. Add these domains:
   - `www.rentalreadyappliances.com`
   - `rentalreadyappliances.uk`
   - `www.rentalreadyappliances.uk`
6. Let Cloudflare create the DNS records automatically where possible.
7. If Cloudflare asks for manual DNS records, create proxied CNAME records:
   - `www` in the `.com` zone -> `rentalreadyappliances.pages.dev`
   - `@` in the `.uk` zone -> `rentalreadyappliances.pages.dev`
   - `www` in the `.uk` zone -> `rentalreadyappliances.pages.dev`
8. Wait for SSL/HTTPS to become active for each custom domain.

The site redirect file now also includes domain-level redirects:

`https://rentalreadyappliances.uk/*` -> `https://rentalreadyappliances.com/$1`

Also redirect:

`https://www.rentalreadyappliances.uk/*` -> `https://rentalreadyappliances.com/$1`

After setup, test:

- `https://rentalreadyappliances.uk/`
- `https://www.rentalreadyappliances.uk/`
- `https://rentalreadyappliances.uk/fridges`

Each should end up on the `.com` website.

## 7. Test Email Capture

The current quote form sends to:

`sibbslani@rentreadyappliances.org`

The form service is:

`https://formsubmit.co/sibbslani@rentreadyappliances.org`

Test from desktop:

1. Open `https://rentalreadyappliances.com/`.
2. Go to the quote form.
3. Fill in a test enquiry using obvious test details.
4. Click **Build quote brief**.
5. Confirm the smart brief preview appears.
6. Click **Send quote request**.
7. Check `sibbslani@rentreadyappliances.org`.
8. If FormSubmit sends an activation email, click the activation link, then repeat the test.
9. Confirm the email contains:
   - Contact name
   - Email
   - Postcode
   - Appliance needed
   - Budget / quality preference
   - Smart quote brief

Test from mobile:

1. Open the site on mobile data, not only Wi-Fi.
2. Repeat the quote submission.
3. Confirm the email arrives.

Fallback test:

1. Fill in the form.
2. Click **Build quote brief**.
3. Click **Email quote brief**.
4. Confirm the email app opens with the quote details prefilled.

## 8. Connect WhatsApp

WhatsApp Business number:

`+447440454109`

WhatsApp is shown in:

- Header
- Hero call-to-action area
- Quote section

Recommended WhatsApp link format:

`https://wa.me/447440454109?text=Hi%20RentalReady%20Appliances%2C%20I%20would%20like%20a%20quote.%0A%0A1.%20Name%2Fcompany%3A%0A2.%20Property%20postcode%3A%0A3.%20Appliance(s)%20needed%3A%0A4.%20Quantity%20%2F%20number%20of%20units%3A%0A5.%20Property%20type%3A%0A6.%20Budget%20or%20quality%20level%3A%20Value%20%2F%20Standard%20%2F%20Premium%0A7.%20Needed%20by%20%2F%20urgency%3A%0A8.%20Delivery%20needed%3F%20Yes%20%2F%20No%0A9.%20Old%20appliance%20removal%3F%20Yes%20%2F%20No%0A10.%20Access%20notes%20or%20measurements%3A`

After the number is added, test:

1. Open the website on desktop.
2. Click the WhatsApp button.
3. Confirm WhatsApp Web opens with the prefilled message.
4. Open the website on mobile.
5. Click the WhatsApp button.
6. Confirm WhatsApp opens with the prefilled message.

## 9. Final Checks Before Outreach

- Homepage loads on `.com`.
- `.uk` redirects to `.com`.
- Quote form submits.
- Email fallback opens correctly.
- WhatsApp opens correctly.
- Payment instructions are not published until the business account, refund policy, and payment reference process are ready.
- Sitemap loads at `https://rentalreadyappliances.com/sitemap.xml`.
- Robots file loads at `https://rentalreadyappliances.com/robots.txt`.
- Clean links work:
  - `/how-it-works`
  - `/fridges`
  - `/landlord-turnover-sets`
  - `/delivery-haul-away`

## 10. Payment And Refund Readiness

Before linking any business account to the website:

1. Open the business account.
2. Decide whether first payments will be bank transfer, invoice, Stripe Payment Links, or another provider.
3. Keep customer sourcing funds separate from operating funds in the CRM and accounts.
4. Decide the sourcing window and refund timing.
5. Add clear payment wording to quote emails and WhatsApp replies.
6. Confirm the first live refund test can be completed before taking marketing traffic at scale.

Internal plan:

`operations/payments_refunds_readiness.md`
