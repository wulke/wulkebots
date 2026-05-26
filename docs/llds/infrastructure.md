# Infrastructure

## Context and Design Philosophy

This LLD covers the foundation every other component depends on: the Next.js application scaffold, database connection and schema tooling, image storage on the local filesystem, Docker packaging, and environment configuration. No business logic lives here — only the substrate that makes business logic possible.

The guiding constraint is **zero external service dependencies**. The app must run on any Linux VPS with Docker installed and nothing else. Any infrastructure choice that requires an external account, API key, or managed service violates this constraint and is rejected at this level.

## Next.js Configuration

The app uses **Next.js with the App Router** and **standalone output mode**.

Standalone output (`output: 'standalone'` in `next.config.js`) produces a self-contained Node.js server at `.next/standalone/server.js` that includes only the dependencies needed at runtime. This is the only output mode compatible with a plain `node server.js` deployment inside Docker — the default Next.js build requires `node_modules` to be present at runtime, which bloats the image.

The App Router is chosen over the Pages Router because it is the current Next.js default, supports React Server Components (useful for reducing client bundle size on the viewer page), and is what new Next.js documentation targets.

### Key configuration

```js
// next.config.js
module.exports = {
  output: 'standalone',
  // Images are served from the local filesystem via a route handler,
  // not next/image's built-in optimization pipeline.
  images: {
    unoptimized: true,
  },
}
```

`images.unoptimized: true` is set because `next/image`'s optimization pipeline requires a writable cache directory and introduces complexity around serving locally-stored user uploads. Images are served directly via a route handler instead (see Image Storage section).

## Database

**SQLite via Drizzle ORM**, using the `better-sqlite3` driver.

### Connection

A single SQLite connection is opened once at process startup and reused for all queries. SQLite supports multiple concurrent reads but serializes writes — this is acceptable for wulkebots' write volume. The database file lives at `/data/wulkebots.db` inside the container, on a Docker-mounted volume.

```
/data/               ← mounted Docker volume
  wulkebots.db       ← SQLite database file
```

### Schema

Drizzle schema is defined in `src/db/schema.ts`. Three tables match the HLD data model:

```
users       id, email, password_hash, created_at
bots        id, user_id, name, image_path, share_token, created_at
quotes      id, bot_id, text, display_order
```

`share_token` on `bots` is a UUID generated at insert time, stored as TEXT. It is unique and indexed.

`image_path` on `bots` stores the relative path from the uploads root (e.g., `{botId}/drawing.jpg`), not an absolute path. The route handler that serves images prepends the uploads directory.

### Migrations

Drizzle Kit manages migrations. Migration files live in `src/db/migrations/`. The app runs `drizzle-kit migrate` as part of Docker startup (via an entrypoint script) before the Next.js server starts. This ensures the schema is always current on deploy without a separate migration step.

### Query location

All database queries are colocated with the route handlers or server actions that use them. No repository pattern or separate data-access layer — the codebase is small enough that the abstraction adds friction without clarity.

## Image Storage

User-uploaded images are written to a directory on the container's filesystem. This directory is mounted as a Docker volume so images survive container replacement.

```
/uploads/            ← mounted Docker volume
  {botId}/
    drawing.jpg      ← the uploaded drawing photo
```

### Upload handling

Image upload is handled by a Next.js API route (`POST /api/bots/upload` or via a server action). The route:
1. Receives the multipart form data
2. Validates file type (JPEG, PNG, WEBP accepted; all others return HTTP 400)
3. Validates file size before reading the full body (max 10 MB; oversized requests return HTTP 413 before the body is consumed)
4. Writes the file to `/uploads/{botId}/drawing.{ext}` using Node's `fs` module — filename is always `drawing.{ext}`, not the original filename, preventing collisions and making the path deterministic
5. Returns the relative path stored in `bots.image_path`

Each bot has exactly one image. Re-uploading to the same bot overwrites the existing file at the same deterministic path.

### Image serving

Images are served via a Next.js route handler at `/api/images/[botId]/[filename]`. The handler:
1. Reads the file from `/uploads/{botId}/{filename}`
2. Sets appropriate `Content-Type` and `Cache-Control` headers
3. Streams the file to the response

This route is public (no auth required) — the share token on the viewer page is the access control mechanism for the bot, not per-image auth.

If the image file does not exist at the expected path (e.g., the volume was manually modified), the handler returns HTTP 404 with no fallback image. This is treated as an operator error outside the app's responsibility.

Cache-Control is set to `public, max-age=31536000, immutable` — images are write-once (or replaced in-place on re-upload) and the path is deterministic, so immutable caching holds as long as the bot exists.

## Docker & Deployment

### Dockerfile

Multi-stage build:

1. **deps** — installs production and dev dependencies
2. **builder** — runs `next build` to produce the standalone output
3. **runner** — copies `.next/standalone` into a minimal Node 20 Alpine image

The final image contains only the standalone server, public assets, and static files. `node_modules` is not copied — standalone output bundles only what is needed.

### docker-compose.yml

```yaml
services:
  app:
    image: wulkebots
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=/data/wulkebots.db
      - UPLOADS_DIR=/uploads
    volumes:
      - wulkebots_data:/data
      - wulkebots_uploads:/uploads

volumes:
  wulkebots_data:
  wulkebots_uploads:
```

Two named volumes: one for the SQLite database file, one for uploaded images. Keeping them separate makes backup and restore straightforward — the database and the images can be backed up independently.

### Entrypoint

A shell entrypoint script runs before the Next.js server:

```sh
#!/bin/sh
npx drizzle-kit migrate   # apply pending migrations
node server.js            # start Next.js
```

This guarantees the database schema is current before any request is served.

## Environment Configuration

All environment-specific values are passed via environment variables. No `.env` files are committed to the repo.

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens. Min 32 chars. |
| `DATABASE_URL` | Yes | Absolute path to the SQLite file. Default: `/data/wulkebots.db` |
| `UPLOADS_DIR` | Yes | Absolute path to the uploads directory. Default: `/uploads` |
| `PORT` | No | Port the Next.js server listens on. Default: `3000` |

A `.env.example` file is committed to the repo documenting all variables without values.

## Decisions & Alternatives

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Next.js output mode | `standalone` | Default build, `export` (static) | Static export cannot support API routes or server-side auth. Default build requires `node_modules` at runtime, bloating the Docker image. Standalone is the correct choice for a self-hosted Node server. |
| App Router vs Pages Router | App Router | Pages Router | App Router is the current Next.js default and supports React Server Components. Pages Router still works but is not where Next.js development is focused. |
| ORM | Drizzle | Prisma, raw `better-sqlite3` | Prisma requires a binary engine and adds cold-start overhead. Raw `better-sqlite3` works but loses type safety on queries. Drizzle is lightweight, type-safe, and has no binary dependency. |
| Database driver | `better-sqlite3` | `@libsql/client` (libSQL/Turso) | `better-sqlite3` is synchronous and well-tested. `@libsql/client` adds async complexity and is oriented toward cloud-hosted SQLite (Turso), violating the no-external-services constraint. |
| Image storage | Local filesystem | S3-compatible object storage, Cloudinary | External storage services violate the no-external-services constraint. Local filesystem is sufficient at MVP scale and trivially migratable later. |
| Image serving | Custom route handler | `next/image`, nginx | `next/image` optimization requires a writable cache and is designed for remote images, not local uploads. nginx would require a second process in the container, violating the one-process tenet. |
| Migration runner | Drizzle Kit at startup | Manual migration, separate CI step | Running migrations at container startup ensures they are never skipped. The startup penalty is negligible (milliseconds on an empty or small schema). |

## Open Questions & Future Decisions

### Resolved
1. ✅ Single container vs. separate services — single container chosen per HLD tenet "one process over many."
2. ✅ External database vs. SQLite — SQLite chosen; no external services.
3. ✅ App Router vs Pages Router — App Router chosen as current default.

### Deferred
1. **JWT secret rotation.** Changing `JWT_SECRET` invalidates all active sessions immediately — every logged-in parent is logged out. No grace period or dual-key rotation in v1. Acceptable at MVP scale; revisit if user complaints arise.
2. **Image resizing on upload.** Large photos from modern phones can be 5–10 MB. Should the upload handler resize to a max dimension (e.g., 1200px) before writing? Deferred — accept large files for now, revisit if storage or load time becomes a problem.
2. **HTTPS termination.** The Docker container serves plain HTTP on port 3000. A reverse proxy (nginx, Caddy) in front handles TLS. The setup of that proxy is outside this LLD's scope and left to the deployment runbook.
3. **Backup strategy.** Two Docker volumes need to be backed up. No automated backup is specified for MVP; operator responsibility.

## References

- Next.js standalone output: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Drizzle ORM: https://orm.drizzle.team
- `better-sqlite3`: https://github.com/WiseLibs/better-sqlite3
- HLD: `docs/high-level-design.md`
