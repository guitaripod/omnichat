# Schema Migration Guide

## Overview

OmniChat uses a dual-storage system:

- **Cloudflare D1**: Server-side database (source of truth)
- **LocalStorage/IndexedDB**: Client-side cache for offline support

When schema changes occur, both need to be handled properly to prevent crashes.

## How the Migration System Works

### 1. Client-Side Migration (Automatic)

The app automatically handles schema mismatches when syncing from D1:

```typescript
// In src/lib/migrations/client-migrations.ts
- Strips unknown fields from D1 data
- Adds default values for missing fields
- Transforms data to match client TypeScript types
```

### 2. Error Boundary (Automatic)

If a schema mismatch causes a crash:

- The `MigrationErrorBoundary` catches the error
- Shows a user-friendly message
- Offers to clear local storage and resync from D1

### 3. D1 Data Migration (Manual)

For existing data in D1 that needs default values:

```bash
# Run this to add default values to existing messages
wrangler d1 execute omnichat-db --command "UPDATE messages SET is_complete = COALESCE(is_complete, 1), tokens_generated = COALESCE(tokens_generated, 0) WHERE is_complete IS NULL OR tokens_generated IS NULL;"
```

## Schema Version Tracking

Check current version:

```bash
npm run db:version
```

List all migrations:

```bash
npm run db:version:list
```

## Adding New Schema Changes

### 1. Create D1 Migration

```sql
-- migrations/0005_your_feature.sql
ALTER TABLE messages ADD COLUMN new_field TEXT;
```

### 2. Update TypeScript Types

```typescript
// src/types/index.ts
export interface Message {
  // ... existing fields
  newField?: string; // Make it optional for backward compatibility
}
```

### 3. Update Client Migration

```typescript
// src/lib/migrations/client-migrations.ts
{
  version: 3,
  migrate: (data: any) => {
    // Handle the new field
    if (data.messages) {
      data.messages = data.messages.map((msg: any) => ({
        ...msg,
        newField: undefined, // Remove if not in client types
      }));
    }
    return data;
  },
}
```

### 4. Deploy

1. Apply D1 migration: `wrangler d1 migrations apply omnichat-db`
2. Deploy code: `wrangler deploy`
3. Optionally migrate existing data in D1

## Best Practices

1. **Always make new fields optional** in TypeScript types
2. **Add default values** in SQL migrations when possible
3. **Test with old data** before deploying
4. **D1 is the source of truth** - client adapts to D1 schema
5. **Version your migrations** for easier rollbacks

## Troubleshooting

### User Reports Crash After Update

1. Check browser console for schema-related errors
2. Have them clear browser data for the site
3. If persistent, check D1 data integrity

### Testing Schema Changes Locally

```bash
# 1. Apply migration locally
wrangler d1 migrations apply omnichat-db --local

# 2. Test with old data
npm run dev

# 3. Verify migration works
# Check that old conversations load without errors
```

## Future Improvements

- Automatic D1 data migration on deployment
- Schema version tracking in D1
- Progressive migration for large datasets
- Backward compatibility for multiple app versions
