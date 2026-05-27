// @vitest-environment node

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('database migration artifacts', () => {
  // @spec INFRA-DB-002
  it('commits generated Drizzle migration files for the schema', async () => {
    const migrationsDir = new URL('./migrations', import.meta.url);
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith('.sql'));
    const journalPath = join(migrationsDir.pathname, 'meta', '_journal.json');
    const journal = JSON.parse(await readFile(journalPath, 'utf8')) as {
      entries: Array<{ tag: string }>;
    };

    expect(sqlFiles.length).toBeGreaterThan(0);
    expect(journal.entries.length).toBeGreaterThan(0);
  });
});
