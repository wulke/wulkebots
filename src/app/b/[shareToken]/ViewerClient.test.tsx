import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ViewerClient } from './ViewerClient';

describe('ViewerClient', () => {
  // @spec VIEW-LAYOUT-002, VIEW-LAYOUT-003, VIEW-QUOTE-001, VIEW-QUOTE-002, VIEW-QUOTE-003, VIEW-QUOTE-004, VIEW-QUOTE-005, VIEW-MOVE-001, VIEW-MOVE-002, VIEW-MOVE-003, VIEW-MOVE-004, VIEW-MOVE-005, VIEW-DATA-002
  it('cycles quotes, moves the drawing, and resets state on remount without client-side fetching', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { rerender, unmount } = render(
      <ViewerClient
        botName="Robo Rex"
        imageUrl="/api/images/17/drawing.png"
        quotes={['First quote', 'Second quote']}
      />,
    );

    const figure = screen.getByTestId('viewer-figure');
    const image = screen.getByAltText('Robo Rex');

    expect(screen.getByRole('button', { name: 'Move up' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Move down' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Move left' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Move right' })).toBeVisible();
    expect(figure).toHaveStyle({ transform: 'translate(0px, 0px)' });
    expect(image).toHaveStyle({
      maxWidth: '100%',
      maxHeight: '70vh',
      objectFit: 'contain',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Move left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move up' }));

    expect(figure).toHaveStyle({ transform: 'translate(-64px, -32px)' });

    fireEvent.click(screen.getByRole('button', { name: 'Robo Rex' }));
    expect(screen.getByText('First quote')).toBeVisible();
    expect(figure).toHaveAttribute('data-bouncing', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Robo Rex' }));
    expect(screen.getByText('Second quote')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Robo Rex' }));
    expect(screen.getByText('First quote')).toBeVisible();

    fireEvent.error(image);
    expect(screen.getByTestId('viewer-placeholder')).toBeVisible();

    expect(fetchSpy).not.toHaveBeenCalled();

    rerender(
      <ViewerClient
        botName="Robo Rex"
        imageUrl="/api/images/17/drawing.png"
        quotes={['First quote', 'Second quote']}
      />,
    );
    expect(screen.getByText('First quote')).toBeVisible();

    unmount();

    render(
      <ViewerClient
        botName="Robo Rex"
        imageUrl="/api/images/17/drawing.png"
        quotes={['First quote', 'Second quote']}
      />,
    );

    expect(screen.queryByText('First quote')).not.toBeInTheDocument();
    expect(screen.getByTestId('viewer-figure')).toHaveStyle({ transform: 'translate(0px, 0px)' });

    fetchSpy.mockRestore();
  });

  // @spec VIEW-QUOTE-006
  it('does not show a speech bubble or bounce when there are zero quotes', () => {
    render(<ViewerClient botName="Quiet Bot" imageUrl="/api/images/99/drawing.png" quotes={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Quiet Bot' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('viewer-figure')).toHaveAttribute('data-bouncing', 'false');
  });
});
