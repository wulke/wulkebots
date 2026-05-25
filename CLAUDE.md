# wulkebots

A mobile-first web app where kids take pictures of their drawings and turn them into interactive shareable characters (wulkebots). Parents create an account, upload drawings, add quotes, and share a unique link. Viewers tap the bot to cycle quotes and move it with directional arrows. No login required to view.

## Stack

- **Frontend/Backend**: Next.js (standalone output — self-hosted, no Vercel)
- **Database**: SQLite via Drizzle ORM
- **Image storage**: Local filesystem (mounted volume in Docker)
- **Auth**: JWT sessions (no third-party auth provider)
- **Deployment**: Docker

## Working Process

This project follows **Linked Intent Development (LID)**. Design documents are the source of truth — not the code. The chain is:

```
HLD → LLDs → EARS specs → Tests → Code
```

Never modify code without walking the arrow from the relevant LLD first.

### Starting a session

1. Read this file
2. Read the latest handoff doc (path below)
3. Check open GitHub Issues — the top milestone issue is what to work on next
4. Run `/linked-intent-dev` or describe what you want to build

### Ending a session

Run `/handoff` to generate a handoff document and update the pointer below.

## Latest Handoff

_No handoff yet — first session._

## GitHub

- **Repo**: https://github.com/trevorwulke/wulkebots (create after auth)
- **MVP Milestone**: All issues tagged `mvp` must be closed before first real-user test
- **Issue convention**: one issue = one discrete behavior; link to the relevant EARS spec ID when it exists

## LID Directives

<!-- LID configuration appended by /linked-intent-dev -->
