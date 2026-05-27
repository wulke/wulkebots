import { validateEnv } from '../src/env.mjs';

// @spec INFRA-ENV-001, INFRA-ENV-002, INFRA-ENV-003
try {
  validateEnv(process.env);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Startup validation failed: ${message}`);
  process.exit(1);
}
