import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

export type DatabaseClient = BetterSQLite3Database<typeof schema>;

let databaseClient: DatabaseClient | null = null;

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return databaseUrl;
}

export function createDatabaseClient(databaseUrl = requireDatabaseUrl()) {
  const sqlite = new Database(databaseUrl);

  return drizzle(sqlite, { schema });
}

export function getDatabaseClient() {
  if (!databaseClient) {
    databaseClient = createDatabaseClient();
  }

  return databaseClient;
}
