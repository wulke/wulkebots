import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// @spec INFRA-DKR-003
async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const uploadsDir = process.env.UPLOADS_DIR?.trim();

  if (!databaseUrl || !uploadsDir) {
    throw new Error('DATABASE_URL and UPLOADS_DIR must be set before migrations');
  }

  await mkdir(dirname(databaseUrl), { recursive: true });
  await mkdir(uploadsDir, { recursive: true });

  console.log('Migration step completed.');
}

runMigrations().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration step failed: ${message}`);
  process.exit(1);
});
