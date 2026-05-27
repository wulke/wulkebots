import { asc, eq } from 'drizzle-orm';

import { getDatabaseClient, type DatabaseClient } from '@/db/client';
import { bots, quotes } from '@/db/schema';

export type ViewerBot = {
  id: number;
  name: string;
  imagePath: string;
  quotes: string[];
};

// @spec VIEW-DATA-001, VIEW-ROUTE-002
export async function getViewerBot(
  shareToken: string,
  databaseClient: DatabaseClient = getDatabaseClient(),
): Promise<ViewerBot | null> {
  const rows = await databaseClient
    .select({
      id: bots.id,
      name: bots.name,
      imagePath: bots.imagePath,
      quoteText: quotes.text,
    })
    .from(bots)
    .leftJoin(quotes, eq(quotes.botId, bots.id))
    .where(eq(bots.shareToken, shareToken))
    .orderBy(asc(quotes.displayOrder));

  const [firstRow] = rows;

  if (!firstRow) {
    return null;
  }

  return {
    id: firstRow.id,
    name: firstRow.name,
    imagePath: firstRow.imagePath,
    quotes: rows.flatMap((row) => (row.quoteText === null ? [] : [row.quoteText])),
  };
}
