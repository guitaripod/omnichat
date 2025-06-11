# Cloudflare CI/CD Setup Guide

This guide helps you configure GitHub Actions to automatically deploy OmniChat to Cloudflare Pages and apply D1 database migrations.

## Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### 1. `CLOUDFLARE_API_TOKEN`

Create an API token with the following permissions:

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Configure permissions:
   - **Account** → **D1** → **Edit** (for database migrations)
   - **Account** → **Cloudflare Pages** → **Edit** (for deployment)
5. Set **Account Resources** to your specific account
6. Set **Client IP Address Filtering** (optional but recommended for security)
7. Set **TTL** (optional, e.g., 1 year)
8. Create token and copy it to GitHub secrets

### 2. `CLOUDFLARE_ACCOUNT_ID`

1. Go to your [Cloudflare dashboard](https://dash.cloudflare.com)
2. Select your account
3. Find your Account ID in the right sidebar
4. Copy it to GitHub secrets

### 3. `D1_DATABASE_ID` (Optional)

Only needed if you reference the database by ID instead of name. Since we use dashboard configuration with database name "omnichat-db", this is typically not required.

### 4. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Your Clerk publishable key for authentication (if using Clerk).

## What Happens Without These Secrets?

The CI/CD pipeline is designed to be graceful:

- **Without Cloudflare secrets**:

  - Build and tests will still run
  - Migrations will be skipped with instructions
  - Deployment will be skipped
  - You'll need to apply migrations and deploy manually

- **With incorrect permissions**:
  - The workflow will detect this and provide guidance
  - It will list which migrations need manual application
  - The build will continue but skip automatic deployment

## Manual Migration Application

If automatic migrations fail, apply them manually:

```bash
# Apply all migrations
npm run db:migrate:prod

# Or apply a specific migration
wrangler d1 execute omnichat-db --remote --file migrations/0005_add_cascade_delete.sql
```

## Troubleshooting

### Authentication Error [code: 10000]

Your API token lacks the required permissions. Create a new token with:

- Account → D1 → Edit
- Account → Cloudflare Pages → Edit

### Database Not Found

Ensure you've created the database in your Cloudflare dashboard:

1. Go to Workers & Pages → D1
2. Create database named "omnichat-db"
3. The database will be automatically initialized on first migration

### Migrations Already Applied

The CI treats this as non-critical and continues. To check current schema version:

```bash
npm run db:version
```

## Best Practices

1. **Test locally first**: Run `npm run db:migrate` locally before pushing
2. **Review migration files**: Check the SQL before it runs in production
3. **Monitor the Actions tab**: Watch the CI output for any issues
4. **Keep tokens secure**: Rotate tokens periodically
5. **Use IP filtering**: Restrict API tokens to GitHub's IP ranges for added security
