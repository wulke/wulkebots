import { describe, expect, it } from 'vitest';

describe('next.config.js', () => {
  // @spec INFRA-CFG-001, INFRA-CFG-002
  it('enables standalone output and disables image optimization', async () => {
    const nextConfig = await import('../next.config.js');

    expect(nextConfig.default.output).toBe('standalone');
    expect(nextConfig.default.images?.unoptimized).toBe(true);
  });
});
