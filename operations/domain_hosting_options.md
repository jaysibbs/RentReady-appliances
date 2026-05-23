# Domain And Hosting Recommendation

Updated on 2026-05-20 after purchasing the domains.

## Domains Purchased

Primary domain:

`rentalreadyappliances.com`

Why:
- Best long-term brand asset.
- Strongest fit if RentalReady eventually handles wider or worldwide traffic.
- Easy to say in calls, email signatures, brochures, and agency outreach.
- Suitable as the permanent website domain.

UK redirect domain:

`rentalreadyappliances.uk`

Why:
- Protects the UK-facing version.
- Useful for UK trust in local marketing.
- Should redirect to `rentalreadyappliances.com`.

Existing/secondary domain:

`rentalreadyappliances.org`

Why:
- Can be kept as a backup or redirect if already owned.
- Not the best primary domain now that `.com` is owned.

## Hosting Recommendation

Use Cloudflare Pages for hosting.

Why:
- The site is static and already built in `dist/`.
- Cloudflare Pages supports custom domains.
- The deploy folder already includes Cloudflare-friendly files:
  - `_headers`
  - `_redirects`
  - `robots.txt`
  - `site.webmanifest`
- The temporary preview has already been tested through Cloudflare, so this keeps the launch path simple.

## Recommended Setup

1. Use `rentalreadyappliances.com` as the primary public website.
2. Redirect `rentalreadyappliances.uk` to `rentalreadyappliances.com`.
3. Redirect `rentalreadyappliances.org` as a backup if it remains owned.
4. Create a Cloudflare Pages project named `rentalreadyappliances`.
5. Upload the contents of `dist/`.
6. Connect `rentalreadyappliances.com` as the primary custom domain.
7. Add `rentalreadyappliances.uk` as a redirect or domain alias.
8. After the domain is live, add final canonical URLs and `sitemap.xml`.
9. Run desktop and mobile quote form tests.

## Registrar Options

Best fit:

Cloudflare Registrar

Why:
- Keeps domain, DNS, SSL, and hosting in one place.
- Cloudflare states that Registrar uses at-cost pricing with no markup.
- Less DNS setup work once Cloudflare Pages is used.

Alternative:

Namecheap, Porkbun, GoDaddy, or 123 Reg

Why:
- Familiar domain registration flows.
- Fine if you prefer to buy the domain elsewhere and point DNS to Cloudflare.

If buying outside Cloudflare, use Cloudflare DNS nameservers after purchase so Pages and redirects are easier to manage.
