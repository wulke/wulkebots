# Infrastructure Specs

## Next.js Configuration

- [ ] **INFRA-CFG-001**: The system shall build with Next.js standalone output mode, producing a self-contained server at `.next/standalone/server.js` that requires no `node_modules` at runtime.
- [ ] **INFRA-CFG-002**: The system shall disable Next.js built-in image optimization (`images.unoptimized: true`) so that user-uploaded images are served via the custom image route handler rather than the Next.js pipeline.

## Database

- [ ] **INFRA-DB-001**: The system shall use a single SQLite database file located at the path specified by the `DATABASE_URL` environment variable.
- [ ] **INFRA-DB-002**: When the application container starts, the system shall run all pending Drizzle migrations synchronously before the Next.js server accepts any requests.
- [ ] **INFRA-DB-003**: If a database migration fails on startup, the system shall exit with a non-zero exit code and log the failure reason.
- [ ] **INFRA-DB-004**: The system shall store bot share tokens as UUIDs in the `bots.share_token` column, with a unique index enforced at the database level.
- [ ] **INFRA-DB-005**: The system shall store bot image paths as relative paths from the uploads root (e.g., `{botId}/drawing.jpg`), not as absolute filesystem paths.

## Image Upload

- [ ] **INFRA-IMG-001**: When a bot image is uploaded, the system shall accept only JPEG, PNG, and WEBP file types; all other types shall be rejected with HTTP 400.
- [ ] **INFRA-IMG-002**: When a bot image is uploaded, the system shall enforce a maximum file size of 10 MB, rejecting oversized requests with HTTP 413 before consuming the full request body.
- [ ] **INFRA-IMG-003**: When a bot image is uploaded, the system shall write the file to `{UPLOADS_DIR}/{botId}/drawing.{ext}`, where `ext` is derived from the accepted file type — not from the original filename.
- [ ] **INFRA-IMG-004**: When a bot image is re-uploaded to an existing bot, the system shall overwrite the file at the deterministic path `{UPLOADS_DIR}/{botId}/drawing.{ext}`.

## Image Serving

- [ ] **INFRA-IMG-005**: The system shall serve uploaded images via a public route handler at `/api/images/[botId]/[filename]` that reads files from the uploads directory; no authentication is required to access this route.
- [ ] **INFRA-IMG-006**: When serving an image, the system shall set `Cache-Control: public, max-age=31536000, immutable` on the response.
- [ ] **INFRA-IMG-007**: If the requested image file does not exist at the expected filesystem path, the system shall return HTTP 404 with no fallback image.

## Docker & Deployment

- [ ] **INFRA-DKR-001**: The system shall be packaged as a multi-stage Docker image; the final stage shall contain only the Next.js standalone output and shall not include `node_modules`.
- [ ] **INFRA-DKR-002**: The system shall mount the SQLite database directory and the uploads directory as separate named Docker volumes so that both survive container replacement.
- [ ] **INFRA-DKR-003**: The Docker image entrypoint shall run database migrations before starting the Next.js server.

## Environment Configuration

- [ ] **INFRA-ENV-001**: The system shall require the `JWT_SECRET` environment variable (minimum 32 characters) and shall refuse to start if it is absent or shorter than 32 characters.
- [ ] **INFRA-ENV-002**: The system shall require the `DATABASE_URL` environment variable and shall refuse to start if it is absent.
- [ ] **INFRA-ENV-003**: The system shall require the `UPLOADS_DIR` environment variable and shall refuse to start if it is absent.
- [ ] **INFRA-ENV-004**: The repository shall include a committed `.env.example` file documenting all required and optional environment variables without values.
