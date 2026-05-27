// @vitest-environment node

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';

import { bots, quotes, users } from '@/db/schema';

import { getViewerBot } from './get-viewer-bot';

describe('getViewerBot', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE UNIQUE INDEX users_email_unique ON users (email);

      CREATE TABLE bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        share_token TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade,
        CONSTRAINT bots_image_path_relative CHECK(substr(image_path, 1, 1) <> '/')
      );

      CREATE INDEX bots_user_id_idx ON bots (user_id);
      CREATE UNIQUE INDEX bots_share_token_unique ON bots (share_token);

      CREATE TABLE quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        bot_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE cascade
      );

      CREATE INDEX quotes_bot_id_idx ON quotes (bot_id);
    `);
    db = drizzle(sqlite);
  });

  // @spec VIEW-DATA-001
  it('returns bot data with quotes ordered by display_order for the requested share token', async () => {
    const [user] = db
      .insert(users)
      .values({
        email: 'parent@example.com',
        passwordHash: 'hash',
      })
      .returning();

    const [bot] = db
      .insert(bots)
      .values({
        userId: user.id,
        name: 'Robo Rex',
        imagePath: '17/drawing.png',
        shareToken: 'viewer-token',
      })
      .returning();

    db.insert(quotes).values([
      {
        botId: bot.id,
        text: 'Third quote',
        displayOrder: 2,
      },
      {
        botId: bot.id,
        text: 'First quote',
        displayOrder: 0,
      },
      {
        botId: bot.id,
        text: 'Second quote',
        displayOrder: 1,
      },
    ]);

    await expect(getViewerBot('viewer-token', db)).resolves.toEqual({
      id: bot.id,
      name: 'Robo Rex',
      imagePath: '17/drawing.png',
      quotes: ['First quote', 'Second quote', 'Third quote'],
    });
  });

  // @spec VIEW-ROUTE-002
  it('returns null when the share token does not match any bot', async () => {
    await expect(getViewerBot('missing-token', db)).resolves.toBeNull();
  });
});
