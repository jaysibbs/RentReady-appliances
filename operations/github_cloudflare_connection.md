# GitHub And Cloudflare Connection

## Goal

Move deployment from manual zip uploads to a GitHub-backed Cloudflare Pages flow.

## Recommended Repository

Create a private GitHub repository named:

```text
rentalready-appliances-site
```

Use `main` as the production branch.

## Local Setup

From the project folder:

```bash
git init
git add .
git commit -m "Initial RentalReady website"
git branch -M main
git remote add origin git@github.com:YOUR-GITHUB-USERNAME/rentalready-appliances-site.git
git push -u origin main
```

Replace `YOUR-GITHUB-USERNAME` with the GitHub account or organisation that owns the repository.

## Cloudflare Pages Setup

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages**.
3. Open the existing `rentalreadyappliances` Pages project, or create a new Pages project.
4. Choose **Connect to Git**.
5. Select the GitHub repository.
6. Use these build settings:

```text
Framework preset: None
Build command: node scripts/build_site.mjs
Build output directory: dist
Production branch: main
```

7. Deploy.

## Domains

Primary:

```text
rentalreadyappliances.com
```

Secondary domains to add or redirect:

```text
www.rentalreadyappliances.com
rentalreadyappliances.uk
www.rentalreadyappliances.uk
```

## Future Edit Flow

1. Edit the source files in the project root.
2. Run:

```bash
node scripts/build_site.mjs
```

3. Commit and push:

```bash
git add .
git commit -m "Update website"
git push
```

Cloudflare Pages will deploy automatically after the push.

## Test After Deployment

Check:

```text
https://rentalreadyappliances.com
https://rentalreadyappliances.com/fridge-freezers
https://rentalreadyappliances.com/washing-machines
https://rentalreadyappliances.com/sourcing-dashboard
```

Confirm the quote form action is:

```text
https://formsubmit.co/sibbslani@rentreadyappliances.org
```
