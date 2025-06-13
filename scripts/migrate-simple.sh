#!/bin/bash
# Simple, robust migration runner

set -e

# Configuration
DB_NAME="omnichat-db"
MIGRATIONS_DIR="migrations"

# Parse arguments
REMOTE_FLAG="--remote"
if [ "$1" = "--local" ]; then
    REMOTE_FLAG=""
    echo "🏠 Running migrations on LOCAL database"
else
    echo "☁️  Running migrations on REMOTE database"
fi

echo "🔨 Database Migration"
echo "===================="
echo ""

# Ensure schema_version table exists
echo "📋 Ensuring schema_version table exists..."
wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --command "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL DEFAULT (unixepoch()), checksum TEXT);" > /dev/null 2>&1

# Get list of migration files
MIGRATIONS=$(ls $MIGRATIONS_DIR/*.sql 2>/dev/null | sort)
if [ -z "$MIGRATIONS" ]; then
    echo "❌ No migration files found in $MIGRATIONS_DIR/"
    exit 1
fi

# Count migrations
TOTAL=$(echo "$MIGRATIONS" | wc -l)
echo "📁 Found $TOTAL migration files"
echo ""

# Process each migration
SUCCESS=0
SKIPPED=0
FAILED=0

for migration_file in $MIGRATIONS; do
    FILENAME=$(basename "$migration_file")
    VERSION=$(echo "$FILENAME" | grep -o '^[0-9]*' | sed 's/^0*//')
    
    # Skip if no version number
    if [ -z "$VERSION" ]; then
        echo "⚠️  Skipping $FILENAME (no version number)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Check if already applied
    CHECK=$(wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --command "SELECT 1 FROM schema_version WHERE version = $VERSION;" 2>&1 || true)
    
    if echo "$CHECK" | grep -q '"1":1'; then
        echo "✓ $FILENAME (already applied)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Apply migration
    echo -n "→ Applying $FILENAME... "
    
    # Run migration (capture output but don't exit on error)
    set +e
    OUTPUT=$(wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --file "$migration_file" 2>&1)
    EXIT_CODE=$?
    set -e
    
    if [ $EXIT_CODE -eq 0 ]; then
        # Record success
        wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --command "INSERT OR IGNORE INTO schema_version (version, name) VALUES ($VERSION, '$FILENAME');" > /dev/null 2>&1
        echo "✅"
        SUCCESS=$((SUCCESS + 1))
    else
        # Don't mark as successful if it failed
        echo "❌"
        echo "  Exit code: $EXIT_CODE"
        echo "  Error output:"
        echo "$OUTPUT" | head -20
        FAILED=$((FAILED + 1))
        
        # Stop on first failure for debugging
        break
    fi
done

echo ""
echo "📊 Summary:"
echo "  ✅ Applied: $SUCCESS"
echo "  ⏭️  Skipped: $SKIPPED"
echo "  ❌ Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "⚠️  Some migrations failed. Check the errors above."
    exit 1
else
    echo "✨ All migrations completed successfully!"
fi