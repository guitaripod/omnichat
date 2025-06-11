#!/usr/bin/env node

// Pre-deployment migration checker
// Ensures migrations are applied before deploying new code

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking migration status...\n');

// Read all migration files
const migrationsDir = path.join(__dirname, '..', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(f => console.log(`  - ${f}`));

// Check which migrations have been applied
try {
  const databaseId = process.env.D1_DATABASE_ID;
  if (!databaseId) {
    console.error('\n❌ D1_DATABASE_ID environment variable not set');
    console.log('\nPlease set it with:');
    console.log('  export D1_DATABASE_ID=your-database-id\n');
    process.exit(1);
  }
  
  const result = execSync(`wrangler d1 migrations list ${databaseId}`, { encoding: 'utf8' });
  console.log('\n📋 Applied migrations:');
  console.log(result);

  // Parse applied migrations
  const appliedMigrations = result
    .split('\n')
    .filter(line => line.includes('.sql'))
    .map(line => line.trim().split(/\s+/)[0]);

  // Find unapplied migrations
  const unappliedMigrations = migrationFiles.filter(
    file => !appliedMigrations.some(applied => applied.includes(file))
  );

  if (unappliedMigrations.length > 0) {
    console.log('\n⚠️  Unapplied migrations found:');
    unappliedMigrations.forEach(f => console.log(`  - ${f}`));
    
    console.log('\n❌ Please apply migrations before deploying:');
    console.log('   wrangler d1 migrations apply omnichat-db\n');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations are applied!');
  }

} catch (error) {
  console.error('\n❌ Error checking migrations:', error.message);
  console.log('\nMake sure you have:');
  console.log('  1. Configured wrangler with your Cloudflare credentials');
  console.log('  2. Created the omnichat-db database');
  process.exit(1);
}