# RentalReady Appliances

Static website for RentalReady Appliances.

## Local Build

```bash
node scripts/build_site.mjs
```

The build writes the deployable website into `dist/`.

## Cloudflare Pages

Use these settings when connecting the GitHub repository to Cloudflare Pages:

- Framework preset: `None`
- Build command: `node scripts/build_site.mjs`
- Build output directory: `dist`
- Production branch: `main`
- Primary domain: `rentalreadyappliances.com`

The quote form currently posts to:

```text
https://formsubmit.co/sibbslani@rentreadyappliances.org
```

After the first live test submission, check `sibbslani@rentreadyappliances.org` for the FormSubmit activation email.
