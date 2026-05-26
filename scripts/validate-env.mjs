const MINIMUM_JWT_SECRET_LENGTH = 32;

function requireValue(name, value) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error(`${name} is required`);
  }

  return trimmedValue;
}

try {
  const jwtSecret = requireValue('JWT_SECRET', process.env.JWT_SECRET);

  if (jwtSecret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MINIMUM_JWT_SECRET_LENGTH} characters long`,
    );
  }

  requireValue('DATABASE_URL', process.env.DATABASE_URL);
  requireValue('UPLOADS_DIR', process.env.UPLOADS_DIR);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Startup validation failed: ${message}`);
  process.exit(1);
}
