# Production Deployment Guide

This guide covers deploying the Knowledge Agent Template to production on Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: For OAuth authentication
3. **GitHub App**: Create a GitHub App for OAuth authentication
4. **Custom API Keys**: API keys for your OpenAI-compatible models

## Step 1: GitHub App Setup

1. Go to [GitHub Settings → Developer settings → GitHub Apps → New GitHub App](https://github.com/settings/apps/new)
2. Configure the app:
   - **App name**: Your agent name (e.g., `my-knowledge-agent`)
   - **Homepage URL**: Your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - **Callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
   - **Webhook URL**: `https://your-app.vercel.app/api/webhooks/github`
3. Set permissions:
   - **Account permissions** → **Email addresses** → Read-only
   - **Issues** → Read & Write
   - **Metadata** → Read-only
   - **Contents** → Read & Write
4. Create the app and note:
   - **Client ID**
   - **Generate a new client secret**
   - **App ID**
   - **Generate a private key** (PEM format)

## Step 2: Vercel Project Setup

### Option A: Deploy from GitHub (Recommended)

1. Fork or clone this repository
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure project settings:
   - **Framework Preset**: Next.js (or Nuxt.js if available)
   - **Build Command**: `bun run build`
   - **Output Directory**: `.output/public`
   - **Install Command**: `bun install`
6. Click "Deploy"

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Deploy
vercel --prod
```

## Step 3: Environment Variables

After deployment, set these environment variables in your Vercel project:

### Required Variables

| Variable | Description | How to get it |
|----------|-------------|---------------|
| `BETTER_AUTH_SECRET` | Random secret for session signing | `openssl rand -hex 32` |
| `GITHUB_CLIENT_ID` | GitHub App Client ID | From GitHub App settings |
| `GITHUB_CLIENT_SECRET` | GitHub App Client Secret | From GitHub App settings |
| `NUXT_PUBLIC_GITHUB_APP_NAME` | GitHub App name | Your GitHub App name |

### Custom API Variables

For each custom OpenAI-compatible API:

```
CUSTOM_API_BASE_URL_<PROVIDER>=https://api.provider.com/v1
CUSTOM_API_KEY_<PROVIDER>=your-api-key
CUSTOM_API_MODEL_<PROVIDER>=model-name
```

Example:
```
CUSTOM_API_BASE_URL_GROK2API=https://grok2api-pn1d.onrender.com/v1
CUSTOM_API_KEY_GROK2API=your-api-key
CUSTOM_API_MODEL_GROK2API=grok-4.20-beta
```

### Optional Variables

| Variable | Description |
|----------|-------------|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API key |
| `REDIS_URL` | Redis URL for bot state |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `NUXT_GITHUB_SNAPSHOT_REPO` | Snapshot repository |
| `NUXT_GITHUB_TOKEN` | GitHub token for snapshots |

## Step 4: Configure GitHub App

### Required Permissions

| Permission | Access | Why |
|------------|--------|-----|
| Issues | Read & Write | Read issues and post replies |
| Metadata | Read-only | Required by GitHub for all apps |
| Contents | Read & Write | Push synced content |
| Administration | Read & Write | Auto-create snapshot repos |

### Webhook Events

Subscribe to:
- Issues
- Issue comments

## Step 5: Deploy

1. Push your changes to GitHub
2. Vercel will automatically deploy
3. Visit your app URL

## Step 6: Post-Deployment

### Configure GitHub OAuth

1. Go to your GitHub App settings
2. Update the callback URL to your production URL:
   ```
   https://your-app.vercel.app/api/auth/callback/github
   ```
3. Update the homepage URL to your production URL

### Test Authentication

1. Visit your app URL
2. Click "Sign in with GitHub"
3. Complete the OAuth flow

### Configure Custom Models

1. Go to your app settings
2. Select your custom models from the model dropdown
3. Test with a simple query

## Troubleshooting

### OAuth Redirect URI Mismatch

**Error**: "The redirect_uri is not associated with this application"

**Solution**: Ensure the callback URL in your GitHub App matches your Vercel URL exactly:
- Development: `http://localhost:3000/api/auth/callback/github`
- Production: `https://your-app.vercel.app/api/auth/callback/github`

### Database Migration Errors

**Error**: "Failed to create migrations table"

**Solution**: This is typically a development-only issue. In production, Vercel's PostgreSQL integration handles migrations automatically.

### Custom Models Not Showing

**Solution**: 
1. Verify environment variables are set correctly in Vercel
2. Check the custom models API endpoint: `https://your-app.vercel.app/api/custom-models`
3. Restart your Vercel deployment

## Next Steps

- [Customize the UI](./CUSTOMIZATION.md)
- [Add knowledge sources](./SOURCES.md)
- [Add bot adapters](./CUSTOMIZATION.md#4-add-a-bot-adapter)
- [Monitor usage](./ARCHITECTURE.md#monitoring)

## Security Notes

- Never commit secrets to your repository
- Use Vercel's environment variable encryption
- Rotate secrets periodically
- Enable Vercel's deployment protection
- Monitor API usage and costs