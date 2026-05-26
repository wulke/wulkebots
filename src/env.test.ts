// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { validateEnv } from './env';

describe('validateEnv', () => {
  // @spec INFRA-ENV-001
  it('throws when JWT_SECRET is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: '/data/wulkebots.db',
        UPLOADS_DIR: '/uploads',
      }),
    ).toThrowError('JWT_SECRET is required');
  });

  // @spec INFRA-ENV-001
  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: 'too-short',
        DATABASE_URL: '/data/wulkebots.db',
        UPLOADS_DIR: '/uploads',
      }),
    ).toThrowError('JWT_SECRET must be at least 32 characters long');
  });

  // @spec INFRA-ENV-002
  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: '12345678901234567890123456789012',
        UPLOADS_DIR: '/uploads',
      }),
    ).toThrowError('DATABASE_URL is required');
  });

  // @spec INFRA-ENV-003
  it('throws when UPLOADS_DIR is missing', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: '12345678901234567890123456789012',
        DATABASE_URL: '/data/wulkebots.db',
      }),
    ).toThrowError('UPLOADS_DIR is required');
  });

  // @spec INFRA-ENV-001, INFRA-ENV-002, INFRA-ENV-003
  it('returns trimmed runtime values when all required variables are present', () => {
    expect(
      validateEnv({
        JWT_SECRET: '12345678901234567890123456789012',
        DATABASE_URL: ' /data/wulkebots.db ',
        UPLOADS_DIR: ' /uploads ',
        PORT: '3001',
      }),
    ).toEqual({
      JWT_SECRET: '12345678901234567890123456789012',
      DATABASE_URL: '/data/wulkebots.db',
      UPLOADS_DIR: '/uploads',
      PORT: '3001',
    });
  });
});
