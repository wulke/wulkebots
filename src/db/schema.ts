import { relations, sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

// @spec INFRA-DB-004, INFRA-DB-005
export const bots = sqliteTable(
  'bots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    imagePath: text('image_path').notNull(),
    shareToken: text('share_token').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('bots_user_id_idx').on(table.userId),
    uniqueIndex('bots_share_token_unique').on(table.shareToken),
    check('bots_image_path_relative', sql`substr(${table.imagePath}, 1, 1) <> '/'`),
  ],
);

export const quotes = sqliteTable(
  'quotes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    botId: integer('bot_id')
      .notNull()
      .references(() => bots.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    displayOrder: integer('display_order').notNull(),
  },
  (table) => [index('quotes_bot_id_idx').on(table.botId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  bots: many(bots),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  user: one(users, {
    fields: [bots.userId],
    references: [users.id],
  }),
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  bot: one(bots, {
    fields: [quotes.botId],
    references: [bots.id],
  }),
}));
