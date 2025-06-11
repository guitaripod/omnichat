# D1 Migration Instructions (Dashboard Configuration)

Since you're using Cloudflare Dashboard configuration instead of wrangler.toml, here's how to run migrations:

## One-Time Setup

1. **Get your D1 Database ID** from Cloudflare Dashboard:

   - Go to Workers & Pages > D1
   - Click on your `omnichat-db` database
   - Copy the Database ID

2. **Set environment variable** (optional):
   ```bash
   export D1_DATABASE_ID="your-database-id-here"
   ```

## Running Migrations

### Method 1: Using Database ID directly

```bash
# Apply schema migrations
wrangler d1 migrations apply YOUR_DATABASE_ID

# Run data migration
D1_DATABASE_ID=YOUR_DATABASE_ID ./scripts/migrate-d1-data.sh
```

### Method 2: Interactive mode

```bash
# The script will prompt for your database ID
./scripts/migrate-d1-data.sh
```

## CI/CD Configuration

For GitHub Actions, add these secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `D1_DATABASE_ID`

Then update the workflow to use the database ID:

```yaml
- name: Apply D1 Migrations
  env:
    D1_DATABASE_ID: ${{ secrets.D1_DATABASE_ID }}
  run: |
    wrangler d1 migrations apply $D1_DATABASE_ID
```

## Why Dashboard Configuration?

Using dashboard configuration has advantages:

- Centralized configuration management
- No sensitive IDs in code repository
- Easier to manage multiple environments
- Better security (no accidental commits)

## Troubleshooting

If you get "database not found" errors:

1. Ensure you're logged in: `wrangler login`
2. Check the database ID is correct
3. Verify you have the right permissions
