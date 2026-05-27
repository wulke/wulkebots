// @vitest-environment node

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { runMigrations } from '../scripts/migrate.mjs';

type SqliteColumnInfo = {
  name: string;
  type: string;
};

type SqliteIndexInfo = {
  name: string;
  unique: 0 | 1;
};

type SqliteIndexColumn = {
  name: string;
};

type SqliteForeignKey = {
  table: string;
  from: string;
};

describe('runMigrations integration', () => {
  // @spec INFRA-DB-001, INFRA-DB-002, INFRA-DB-004, INFRA-DB-005
  it('creates the users, bots, and quotes schema in the configured SQLite database', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'wulkebots-db-'));
    const databaseUrl = join(rootDir, 'data', 'wulkebots.db');
    const uploadsDir = join(rootDir, 'uploads');

    await runMigrations({
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
        UPLOADS_DIR: uploadsDir,
      } as NodeJS.ProcessEnv,
    });

    const sqlite = new Database(databaseUrl);

    try {
      const tableNames = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all() as Array<{ name: string }>;
      const botsColumns = sqlite.prepare("PRAGMA table_info('bots')").all() as SqliteColumnInfo[];
      const usersColumns = sqlite.prepare("PRAGMA table_info('users')").all() as SqliteColumnInfo[];
      const quotesColumns = sqlite
        .prepare("PRAGMA table_info('quotes')")
        .all() as SqliteColumnInfo[];
      const botsIndexes = sqlite.prepare("PRAGMA index_list('bots')").all() as SqliteIndexInfo[];
      const usersIndexes = sqlite.prepare("PRAGMA index_list('users')").all() as SqliteIndexInfo[];
      const quotesForeignKeys = sqlite
        .prepare("PRAGMA foreign_key_list('quotes')")
        .all() as SqliteForeignKey[];
      const insertUser = sqlite.prepare(
        "INSERT INTO users (email, password_hash) VALUES ('parent@example.com', 'hash')",
      );
      const insertBot = sqlite.prepare(
        'INSERT INTO bots (user_id, name, image_path, share_token) VALUES (?, ?, ?, ?)',
      );

      expect(tableNames.map(({ name }) => name)).toEqual(
        expect.arrayContaining(['users', 'bots', 'quotes']),
      );
      expect(usersColumns.map(({ name }) => name)).toEqual(
        expect.arrayContaining(['id', 'email', 'password_hash', 'created_at']),
      );
      expect(botsColumns.map(({ name }) => name)).toEqual(
        expect.arrayContaining([
          'id',
          'user_id',
          'name',
          'image_path',
          'share_token',
          'created_at',
        ]),
      );
      expect(quotesColumns.map(({ name }) => name)).toEqual(
        expect.arrayContaining(['id', 'bot_id', 'text', 'display_order']),
      );

      const shareTokenColumn = botsColumns.find(({ name }) => name === 'share_token');
      expect(shareTokenColumn?.type.toUpperCase()).toBe('TEXT');

      const hasUniqueShareTokenIndex = botsIndexes.some((index) => {
        if (index.unique !== 1) {
          return false;
        }

        const indexColumns = sqlite
          .prepare(`PRAGMA index_info('${index.name}')`)
          .all() as SqliteIndexColumn[];

        return indexColumns.length === 1 && indexColumns[0]?.name === 'share_token';
      });

      const hasUniqueEmailIndex = usersIndexes.some((index) => {
        if (index.unique !== 1) {
          return false;
        }

        const indexColumns = sqlite
          .prepare(`PRAGMA index_info('${index.name}')`)
          .all() as SqliteIndexColumn[];

        return indexColumns.length === 1 && indexColumns[0]?.name === 'email';
      });

      expect(hasUniqueShareTokenIndex).toBe(true);
      expect(hasUniqueEmailIndex).toBe(true);
      expect(quotesForeignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            table: 'bots',
            from: 'bot_id',
          }),
        ]),
      );

      const { lastInsertRowid: userId } = insertUser.run();
      insertBot.run(userId, 'Robo Rex', '1/drawing.jpg', 'duplicate-token');

      expect(() =>
        insertBot.run(userId, 'Space Cat', '2/drawing.jpg', 'duplicate-token'),
      ).toThrow(/UNIQUE constraint failed: bots\.share_token/);
      expect(() =>
        insertBot.run(userId, 'Bad Path Bot', '/absolute/path', 'unique-token'),
      ).toThrow(/CHECK constraint failed: bots_image_path_relative/);
    } finally {
      sqlite.close();
    }
  });
});
