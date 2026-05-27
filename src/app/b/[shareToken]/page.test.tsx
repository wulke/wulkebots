// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notFound } from 'next/navigation';

import NotFoundPage from './not-found';
import ViewerPage from './page';

const getViewerBotMock = vi.fn();

vi.mock('@/features/viewer/get-viewer-bot', () => ({
  getViewerBot: (...args: unknown[]) => getViewerBotMock(...args),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');

  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
  };
});

describe('ViewerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @spec VIEW-ROUTE-001, VIEW-LAYOUT-001, VIEW-DATA-001
  it('renders the public full-screen viewer page with the bot data fetched for the share token', async () => {
    getViewerBotMock.mockResolvedValue({
      id: 17,
      name: 'Robo Rex',
      imagePath: '17/drawing.png',
      quotes: ['Hello there'],
    });

    const markup = renderToStaticMarkup(
      await ViewerPage({
        params: Promise.resolve({ shareToken: 'viewer-token' }),
      }),
    );

    expect(getViewerBotMock).toHaveBeenCalledWith('viewer-token');
    expect(markup).toContain('Robo Rex');
    expect(markup).toContain('/api/images/17/drawing.png');
    expect(markup).toContain('min-height:100vh');
    expect(markup).not.toContain('<nav');
    expect(markup).not.toContain('<header');
    expect(markup).not.toContain('<footer');
  });

  // @spec VIEW-ROUTE-002
  it('delegates missing share tokens to the Next.js not-found flow', async () => {
    getViewerBotMock.mockResolvedValue(null);

    await expect(
      ViewerPage({
        params: Promise.resolve({ shareToken: 'missing-token' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

describe('ViewerPage not-found UI', () => {
  // @spec VIEW-ROUTE-002
  it('renders a bot not found message', () => {
    const markup = renderToStaticMarkup(<NotFoundPage />);

    expect(markup).toContain('Bot not found');
  });
});
