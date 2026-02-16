# Cloudflare Pages Setup for PR Previews

This repository uses Cloudflare Pages to provide public preview URLs for pull requests.

## Prerequisites

- A Cloudflare account (free tier works perfectly)
- Repository admin access to configure secrets

## Setup Instructions

### 1. Create a Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** > **Pages**
3. Click **Create a project**
4. Choose **Direct Upload** (we'll use GitHub Actions to deploy)
5. Name your project: `open-formation-civique`
6. Click **Create project**

### 2. Get Your Cloudflare API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template or create a custom token with:
   - **Permissions:**
     - Account > Cloudflare Pages > Edit
   - **Account Resources:**
     - Include > Your Account
4. Click **Continue to summary** then **Create Token**
5. **Copy the token** (you won't be able to see it again!)

### 3. Get Your Cloudflare Account ID

1. Go to **Workers & Pages** > **Overview**
2. On the right sidebar, you'll see **Account ID**
3. Click to copy it

### 4. Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** and add:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Value:** The API token from step 2
4. Click **Add secret**
5. Click **New repository secret** again and add:
   - **Name:** `CLOUDFLARE_ACCOUNT_ID`
   - **Value:** The Account ID from step 3
6. Click **Add secret**

## How It Works

When you open or update a pull request:

1. GitHub Actions builds the Astro site
2. The built site is deployed to Cloudflare Pages
3. A comment is automatically added to the PR with the preview URL
4. Each new commit updates the preview automatically

## Benefits

- ✅ **Free** - Cloudflare Pages free tier is generous
- ✅ **Fast** - European CDN with global edge network
- ✅ **Automatic** - No manual steps needed
- ✅ **Secure** - Each PR gets its own isolated preview
- ✅ **Public** - Preview URLs can be shared with anyone

## Troubleshooting

### Preview deployment fails

- Check that both secrets are correctly set in GitHub
- Verify the Cloudflare API token has the right permissions
- Check the project name matches: `open-formation-civique`

### Preview URL doesn't work

- Wait a few moments after deployment (usually < 1 minute)
- Check the Cloudflare Pages dashboard for deployment status
- Verify the build completed successfully in GitHub Actions

## Alternative: Vercel

If you prefer to use Vercel instead of Cloudflare Pages, you can:

1. Replace the `cloudflare/pages-action@v1` with `amondnet/vercel-action@v25`
2. Update the secrets to use `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
3. Follow [Vercel's documentation](https://vercel.com/docs/rest-api) for setup

Vercel is US-based but has excellent Astro support and a generous free tier.
