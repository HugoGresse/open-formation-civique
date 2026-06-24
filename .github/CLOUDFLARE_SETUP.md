# Deployment — Cloudflare Pages

The site is deployed entirely on **Cloudflare Pages** (production + PR previews).
A single GitHub Actions workflow ([`deploy.yml`](workflows/deploy.yml)) builds the
Astro site and deploys it on every push to `main` (production) and every pull
request (preview).

## Prerequisites

- A Cloudflare account (free tier is enough)
- Repository admin access to configure secrets

## 1. Create the Cloudflare Pages project

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create** → **Pages** → **Direct Upload**
3. Name the project exactly: `open-formation-civique`
4. Create the project (an initial empty deployment is fine)
5. In **Settings → Builds & deployments**, set the **production branch** to `main`
   (so `--branch=main` deploys are treated as production)

## 2. Attach the custom domain

1. In the project, go to **Custom domains** → **Set up a domain**
2. Add `open-formation-civique.fr` (and `www` if desired) and follow the DNS steps
3. Remove the domain from the old **GitHub Pages** settings first to avoid a
   conflict, then point DNS at Cloudflare

> GitHub Pages is no longer used. You can disable it in
> **Repo → Settings → Pages** once the Cloudflare domain is live.

## 3. Create the API token + account ID secrets

1. [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. Custom token with **Account → Cloudflare Pages → Edit**, scoped to your account
3. Copy the token
4. **Workers & Pages → Overview** → copy the **Account ID**
5. In GitHub: **Settings → Secrets and variables → Actions** → add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

## How it works

| Event | Build | Deploy |
| --- | --- | --- |
| Push to `main` | `npm run build` (incl. PDF) | Cloudflare production (`--branch=main`) |
| Pull request | `npm run build:no-pdf` (faster) | Cloudflare preview (`--branch=<pr-branch>`), URL commented on the PR |

### The PDF

`formation-civique.pdf` is ~42 MB, above Cloudflare Pages' 25 MiB per-file
limit. On production builds the workflow:

1. generates the PDF,
2. publishes it as a **GitHub Release** asset under the `pdf-latest` tag,
3. removes it from the Cloudflare upload.

The on-site link `/formation-civique.pdf` keeps working via
[`website/public/_redirects`](../website/public/_redirects), which 302-redirects
to the Release asset.

## Troubleshooting

- **Deploy fails:** confirm both secrets are set and the API token has
  `Cloudflare Pages → Edit`. Confirm the project name is `open-formation-civique`.
- **Production not on the custom domain:** ensure the project's production branch
  is `main` and the domain is attached in Cloudflare (not GitHub Pages).
- **PDF link 404s:** the `pdf-latest` release is only created/updated by a
  push to `main`; trigger a production deploy at least once.
