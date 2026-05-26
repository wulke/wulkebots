import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  // @spec INFRA-DKR-003
  it('renders the root route content', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'wulkebots' }),
    ).toBeInTheDocument();
  });
});
