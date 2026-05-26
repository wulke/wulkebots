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

- **Repo**: https://github.com/wulke/wulkebots
- **MVP Milestone**: All issues tagged `mvp` must be closed before first real-user test
- **Issue convention**: one issue = one discrete behavior; link to the relevant EARS spec ID when it exists

## LID Mode: Full

## Linked-Intent Development (MANDATORY)

**Consult the `linked-intent-dev` skill for ALL code changes.** All changes flow through the arrow of intent in one direction:

```
HLD → LLDs → EARS → Tests → Code
```

- **New features and refactors**: full six-phase workflow (HLD check → LLD check/draft → EARS → intent-narrowing edge audit → tests-first → code).
- **Bug fixes**: walk the arrow like any other change — find where behavior diverged from intent and cascade from there. No short-circuit.
- **If unsure**: use the full workflow.

Stop after each phase for user review. **Docs carry current intent, written to be read cold** — write each doc as if authored fresh today, from current intent alone: no narration of how it changed, no meaning that needs the conversation that produced it, no rebuttals to questions only a past discussion raised. Rationale, considered alternatives, and constraints a fresh author would independently write stay; record rejected alternatives and why in the LLD's Decisions & Alternatives table, not as asides in body prose.

### Navigation

| What you need | Where to look |
|---|---|
| High-level design | `docs/high-level-design.md` |
| Low-level designs | `docs/llds/` |
| EARS specs | `docs/specs/` |

### Terminology

- **HLD**: High-Level Design — single project-level doc at `docs/high-level-design.md`.
- **LLD**: Low-Level Design — detailed component design doc in `docs/llds/`. One per intent component.
- **EARS**: Easy Approach to Requirements Syntax — structured one-line requirements with globally unique IDs in `docs/specs/`. Markers: `[x]` implemented, `[ ]` active gap, `[D]` deferred.
- **Arrow**: the unidirectional chain from vision to code (HLD → LLDs → EARS → Tests → Code). Strictly a DAG of intent.
- **Arrow segment**: the territory owned by one LLD — the LLD itself plus the specs, tests, and code that cite its EARS IDs. Within-segment cascade is free; across-segment cascade pauses.
- **Cascade**: propagating a change downstream through the arrow so adjacent levels stay coherent.

### Code annotations

Annotate code and tests with `@spec` comments citing EARS IDs:

```
// @spec AUTH-UI-001, AUTH-UI-002
```

Place the annotation at the *entry point of the behavior's implementation graph* — the topmost function or module owning the specified behavior, not every helper.
