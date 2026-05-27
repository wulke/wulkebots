const MINIMUM_JWT_SECRET_LENGTH = 32;

function requireValue(name, value) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error(`${name} is required`);
  }

  return trimmedValue;
}

// @spec INFRA-ENV-001, INFRA-ENV-002, INFRA-ENV-003
export function validateEnv(env) {
  const JWT_SECRET = requireValue('JWT_SECRET', env.JWT_SECRET);

  if (JWT_SECRET.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MINIMUM_JWT_SECRET_LENGTH} characters long`,
    );
  }

  const DATABASE_URL = requireValue('DATABASE_URL', env.DATABASE_URL);
  const UPLOADS_DIR = requireValue('UPLOADS_DIR', env.UPLOADS_DIR);
  const PORT = env.PORT?.trim() || undefined;

  return {
    JWT_SECRET,
    DATABASE_URL,
    UPLOADS_DIR,
    PORT,
  };
}
