// D1 Migration Helper - Future-proof migration system
// This can be extended with new migrations as schema evolves

export interface D1Migration {
  version: number;
  name: string;
  up: string; // SQL to run for migration
  down?: string; // SQL to rollback (optional)
}

// Keep track of all migrations here
export const d1Migrations: D1Migration[] = [
  {
    version: 1,
    name: 'add_default_streaming_fields',
    up: `
      -- Add default values for streaming fields in existing messages
      UPDATE messages 
      SET 
        is_complete = COALESCE(is_complete, 1),
        tokens_generated = COALESCE(tokens_generated, 0)
      WHERE is_complete IS NULL OR tokens_generated IS NULL;
    `,
  },
  // Add future migrations here as needed
  // {
  //   version: 2,
  //   name: 'add_new_feature',
  //   up: `ALTER TABLE messages ADD COLUMN new_field TEXT;`,
  //   down: `ALTER TABLE messages DROP COLUMN new_field;`
  // }
];

// Helper to generate migration commands for wrangler
export function generateMigrationCommand(migration: D1Migration): string {
  return `wrangler d1 execute omnichat-db --command "${migration.up.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}"`;
}

// Generate all migration commands
export function getAllMigrationCommands(): string[] {
  return d1Migrations.map(generateMigrationCommand);
}
