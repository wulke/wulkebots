import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

function requireValue(name, value) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error(`${name} is required`);
  }

  return trimmedValue;
}

function createDatabaseClient(databaseUrl) {
  const sqlite = new Database(databaseUrl);
  const db = drizzle(sqlite);

  return {
    db,
    close: () => sqlite.close(),
  };
}

// @spec INFRA-DKR-003
export async function runMigrations({
  env = process.env,
  mkdirImpl = mkdir,
  createDatabaseClient: createDatabaseClientImpl = createDatabaseClient,
  migrateImpl = migrate,
} = {}) {
  const databaseUrl = requireValue('DATABASE_URL', env.DATABASE_URL);
  const uploadsDir = requireValue('UPLOADS_DIR', env.UPLOADS_DIR);

  await mkdirImpl(dirname(databaseUrl), { recursive: true });
  await mkdirImpl(uploadsDir, { recursive: true });

  const client = createDatabaseClientImpl(databaseUrl);

  try {
    migrateImpl(client.db, {
      migrationsFolder: new URL('../src/db/migrations', import.meta.url).pathname,
    });
  } finally {
    client.close();
  }

  console.log('Migration step completed.');
}

// @spec INFRA-DB-003
export function handleMigrationFailure(error, processImpl = process, consoleImpl = console) {
  const message = error instanceof Error ? error.message : String(error);
  consoleImpl.error(`Migration step failed: ${message}`);
  processImpl.exit(1);
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runMigrations().catch((error) => handleMigrationFailure(error));
}
