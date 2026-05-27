// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { handleMigrationFailure, runMigrations } from '../scripts/migrate.mjs';

describe('runMigrations', () => {
  // @spec INFRA-DKR-003
  it('creates required directories and applies migrations before returning', async () => {
    const mkdirImpl = vi.fn().mockResolvedValue(undefined);
    const migrateImpl = vi.fn();
    const close = vi.fn();
    const createDatabaseClient = vi.fn().mockReturnValue({ db: { tag: 'db' }, close });

    await runMigrations({
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: '/data/wulkebots.db',
        UPLOADS_DIR: '/uploads',
      } as NodeJS.ProcessEnv,
      mkdirImpl,
      createDatabaseClient,
      migrateImpl,
    });

    expect(mkdirImpl).toHaveBeenNthCalledWith(1, '/data', { recursive: true });
    expect(mkdirImpl).toHaveBeenNthCalledWith(2, '/uploads', { recursive: true });
    expect(createDatabaseClient).toHaveBeenCalledWith('/data/wulkebots.db');
    expect(migrateImpl).toHaveBeenCalledWith(
      { tag: 'db' },
      expect.objectContaining({
        migrationsFolder: expect.stringContaining('src/db/migrations'),
      }),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  // @spec INFRA-DKR-003
  it('throws when DATABASE_URL is missing', async () => {
    await expect(
      runMigrations({
        env: {
          NODE_ENV: 'test',
          UPLOADS_DIR: '/uploads',
        } as NodeJS.ProcessEnv,
      }),
    ).rejects.toThrowError('DATABASE_URL is required');
  });

  // @spec INFRA-DKR-003
  it('throws when UPLOADS_DIR is missing', async () => {
    await expect(
      runMigrations({
        env: {
          NODE_ENV: 'test',
          DATABASE_URL: '/data/wulkebots.db',
        } as NodeJS.ProcessEnv,
      }),
    ).rejects.toThrowError('UPLOADS_DIR is required');
  });

  // @spec INFRA-DB-003
  it('rethrows migration failures after closing the database client', async () => {
    const migrateImpl = vi.fn().mockImplementation(() => {
      throw new Error('boom');
    });
    const close = vi.fn();
    const createDatabaseClient = vi.fn().mockReturnValue({ db: { tag: 'db' }, close });

    await expect(
      runMigrations({
        env: {
          NODE_ENV: 'test',
          DATABASE_URL: '/data/wulkebots.db',
          UPLOADS_DIR: '/uploads',
        } as NodeJS.ProcessEnv,
        mkdirImpl: vi.fn().mockResolvedValue(undefined),
        createDatabaseClient,
        migrateImpl,
      }),
    ).rejects.toThrowError('boom');

    expect(close).toHaveBeenCalledTimes(1);
  });

  // @spec INFRA-DB-003
  it('logs the failure reason and exits with code 1 during direct execution failure handling', () => {
    const exit = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    handleMigrationFailure(
      new Error('boom'),
      { exit } as unknown as typeof process,
      console,
    );

    expect(error).toHaveBeenCalledWith('Migration step failed: boom');
    expect(exit).toHaveBeenCalledWith(1);

    error.mockRestore();
  });
});
