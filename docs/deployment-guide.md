# Deployment Guide

## Quick Deploy

```bash
# One command deployment (includes all checks and migrations)
npm run deploy
```

## Manual Deployment Steps

### 1. Pre-deployment Checks

```bash
# Run all pre-deployment checks
./scripts/pre-deploy.sh

# Or run individually:
npm run typecheck
npm run lint
npm test
npm run db:check
```

### 2. Apply Migrations

```bash
# Apply schema migrations to production D1
npm run db:migrate:prod

# Apply data migrations if needed
npm run db:migrate:data
```

### 3. Deploy

```bash
# Deploy to Cloudflare
wrangler deploy
```

## CI/CD with GitHub Actions

The repository includes an automated deployment workflow that:

1. **Checks for new migrations** in the `migrations/` directory
2. **Runs tests and type checking**
3. **Applies D1 migrations automatically**
4. **Deploys to Cloudflare**
5. **Notifies about migration changes**

### Setting up GitHub Actions

Add these secrets to your GitHub repository:

```yaml
CLOUDFLARE_API_TOKEN: your-api-token
CLOUDFLARE_ACCOUNT_ID: your-account-id
```

## Migration Strategy

### Why Automated Migrations?

1. **Prevents deployment failures** - Code expecting new schema won't crash
2. **Zero downtime** - Migrations run before new code deploys
3. **Audit trail** - All schema changes tracked in git
4. **Rollback capability** - Can revert both code and schema

### Best Practices

1. **Always test migrations locally first**

   ```bash
   npm run db:migrate  # Local D1
   npm run dev         # Test with local data
   ```

2. **Make migrations backward compatible**

   - Add columns with defaults or nullable
   - Don't drop columns immediately
   - Use feature flags for breaking changes

3. **Monitor after deployment**
   ```bash
   # Check latest deployment logs
   wrangler tail
   ```

## Troubleshooting Deployments

### Migration Failed

```bash
# Check migration status
npm run db:check

# Manually apply if needed
wrangler d1 migrations apply omnichat-db

# Run data migrations
./scripts/migrate-d1-data.sh
```

### Users Report Crashes

1. Check if it's a schema mismatch issue
2. Have users clear browser data
3. The error boundary will catch most issues

### Rollback Procedure

```bash
# Revert to previous deployment
wrangler rollback

# If schema changes need reverting
# Create a new migration to undo changes
```

## Monitoring

Add monitoring for:

- Failed migrations in CI/CD
- Client-side migration errors
- D1 query performance after schema changes

## Future Improvements

- [ ] Blue-green deployments
- [ ] Automatic rollback on errors
- [ ] Schema version in health checks
- [ ] Migration dry-run in CI
