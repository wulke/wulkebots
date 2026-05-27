import React from 'react';
import { notFound } from 'next/navigation';

import { getViewerBot } from '@/features/viewer/get-viewer-bot';

import { ViewerClient } from './ViewerClient';

type ViewerPageProps = {
  params: Promise<{
    shareToken: string;
  }>;
};

// @spec VIEW-ROUTE-001, VIEW-LAYOUT-001, VIEW-DATA-001
export default async function ViewerPage({ params }: ViewerPageProps) {
  const { shareToken } = await params;
  const bot = await getViewerBot(shareToken);

  if (!bot) {
    notFound();
  }

  return (
    <main
      style={{
        background:
          'radial-gradient(circle at top, rgba(253, 224, 71, 0.4), transparent 35%), linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)',
        minHeight: '100vh',
      }}
    >
      <ViewerClient
        botName={bot.name}
        imageUrl={`/api/images/${bot.imagePath}`}
        quotes={bot.quotes}
      />
    </main>
  );
}
