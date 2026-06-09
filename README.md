# RentalReady Appliances

Static website for RentalReady Appliances.

## Local Build

```bash
node scripts/build_site.mjs
```

The build writes the deployable website into `dist/`.

## Split Deployment Files

The combined Cloudflare package in `dist/` still supports the current single-project setup. When the public website and sourcing agent need to be handled as distinct files, run:

```bash
node scripts/build_site.mjs
node scripts/build_split_deploys.mjs 20260609b
```

This creates two separate upload files in `outputs/`:

- `rentalready_public_website_20260609b_cloudflare.zip` for the public website.
- `rentalready_ai_agent_20260609b_cloudflare.zip` for the sourcing agent dashboard and API routes.

Use the public website zip for `rentalreadyappliances.com`. Use the agent zip only for an agent-specific Cloudflare Pages project/domain such as `agent.rentalreadyappliances.com`.

## Cloudflare Pages

Use these settings when connecting the GitHub repository to Cloudflare Pages:

- Framework preset: `None`
- Build command: `node scripts/build_site.mjs`
- Build output directory: `dist`
- Production branch: `main`
- Primary domain: `rentalreadyappliances.com`

## Standalone Agent Project

Use a separate Cloudflare Pages project for the sourcing agent so agent releases do not change the public RentalReady website.

Recommended Cloudflare settings:

- Project name: `rentalready-ai-agent`
- GitHub repository: `jaysibbs/RentReady-appliances`
- Framework preset: `None`
- Build command: `node scripts/build_agent_site.mjs`
- Build output directory: `dist-agent`
- Production branch: `main`
- Suggested custom domain: `agent.rentalreadyappliances.com`

The standalone agent build writes only the sourcing dashboard, API functions, worker route, shared styles, and brand files into `dist-agent/`. The public website continues to use `node scripts/build_site.mjs` and `dist/`.

If Git deployment is not available, use the latest `outputs/rentalready_ai_agent_*_cloudflare.zip` file as a manual direct-upload fallback for the agent project only.

The quote form currently posts to:

```text
https://formsubmit.co/sibbslani@rentreadyappliances.org
```

After the first live test submission, check `sibbslani@rentreadyappliances.org` for the FormSubmit activation email.

## Commercial Copy Notes

- Do not claim that RentalReady Appliances is VAT registered until registration is complete.
- Use the current website wording: VAT registration status will be confirmed on invoices where applicable.
- Starter prices are sourcing guide prices. Final quotes can change by brand, condition, size, finish, availability, access, warranty route, logistics, quality tier, and VAT status where applicable.
