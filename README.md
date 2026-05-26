# wulkebots

A mobile-first web app where kids take pictures of their drawings and turn them into interactive shareable characters. Parents create an account, upload a drawing, add quotes, and share a unique link. Viewers tap the character to cycle through quotes and nudge it around the screen with directional arrows. No login required to view.

## Project Context

See [`CLAUDE.md`](CLAUDE.md) for the full working process, stack decisions, and LID design methodology.

See [`docs/high-level-design.md`](docs/high-level-design.md) for the system architecture and key design decisions.

## Stack

- **Next.js** (standalone output — self-hosted, no Vercel)
- **SQLite** via Drizzle ORM
- **Local filesystem** for image storage (Docker volume)
- **JWT sessions** (no third-party auth provider)
- **Docker** for deployment
- **Vitest** + Testing Library for tests

## Development

```sh
cp .env.example .env.local   # fill in required values
docker compose up             # starts the app at http://localhost:3000
```

## Running Tests

```sh
npx vitest
```

## Repo

[github.com/wulke/wulkebots](https://github.com/wulke/wulkebots)
