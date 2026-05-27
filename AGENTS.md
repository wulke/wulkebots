# Agent Work Instructions — wulkebots

You are a coding agent working on **wulkebots** — a mobile-first web app where parents
upload drawings of their kids, add quotes, and share interactive characters with family.

**Stack**: Next.js standalone output · SQLite via Drizzle ORM · local filesystem image
storage · JWT auth · Docker · Vitest + Testing Library for tests.

**Project context**: Read `CLAUDE.md` and `docs/` before starting any work. The LID
design documents in `docs/` are the source of truth — not the code.

---

## Your Job

Complete the assigned issue fully and submit a pull request as your final artifact.
Do not start other issues.

---

## Branch Naming and Issue Claiming

Every feature and bug fix uses a **two-branch, two-PR flow**:

| Branch | Targets | Purpose |
|---|---|---|
| `feature/[n]-[desc]-tests` | `main` | Red PR — tests only, CI will fail |
| `feature/[n]-[desc]` | `feature/[n]-[desc]-tests` | Green PR — implementation |

The `-tests` branch is opened as a PR first. CI will fail (tests are red by design) so it
cannot merge. Once the implementation PR merges into the tests branch, CI goes green and
the tests PR can merge to `main`.

Branch type prefixes:
- Feature: `feature/[issue-number]-[short-description]`
- Bug:     `bug/[issue-number]-[short-description]`
- Other:   `chore/[issue-number]-[short-description]`

Steps:

1. Create the `-tests` branch off `main` and open a draft PR targeting `main`.
2. Create the impl branch off the `-tests` branch and open a PR targeting the `-tests` branch.
3. Claim the issue on the `-tests` branch:

```sh
gh issue edit [number] --add-label "in-progress"
gh issue comment [number] --body "Starting work on branch \`[tests-branch-name]\`."
```

---

## TDD: Red → Green (required for every issue)

1. **Red** — Write failing tests first. Run them and confirm they fail before writing
   any implementation code.
2. **Green** — Write the minimum implementation to make the tests pass. No more.
3. Commit the red state and green state as separate commits.

---

## By Issue Type

### Bug

Walk the LID Arrow of Intent:

1. Find where behavior diverges from the relevant LLD (`docs/llds/`) or EARS spec (`docs/specs/`)
2. Update the design doc to reflect correct intent
3. Write a failing test that reproduces the bug (Red)
4. Fix the code (Green)

### Feature

The design is already specified — do not modify LLDs or EARS specs unless the issue
explicitly requires it.

1. Read the relevant LLD and EARS specs from `docs/` before writing any code
2. Write failing tests annotated with `// @spec [ID]` (Red)
3. Implement minimum code annotated with `// @spec [ID]` at each behavior's entry point (Green)

### Other

Use judgment. Keep changes minimal. Apply Red → Green where tests are applicable.

---

## Testing

**Framework**: Vitest + `@testing-library/react` for component tests,
`@testing-library/user-event` for interaction simulation.

**Test file location**: colocated with the source file, e.g. `src/app/login/page.test.tsx`.

**What to test by layer**:

- **API route handlers**: test against the handler function directly — assert on response
  status, body, and database state.
- **Server Components**: assert on rendered HTML output or database state after render.
- **Client Components** (viewer interactions, form behavior): use Testing Library to
  simulate taps, clicks, and input; assert on DOM state.
- **Middleware**: test with mock `NextRequest` objects — assert on redirect responses
  and passthrough behavior.

**Vitest config**: `vitest.config.ts` at the project root. Use `jsdom` as the test
environment for component tests. Use `node` for API route and middleware tests.

---

## Next.js Specifics

- Server Components fetch data and render HTML — they cannot use React state or browser
  APIs.
- Client Components (`'use client'`) handle interaction — tap, movement, clipboard,
  form state.
- API route handlers live in `src/app/api/` and are the entry point for server-side
  mutations and queries.
- The viewer page (`/b/[token]`) must never require authentication. The middleware at
  `src/middleware.ts` must explicitly exclude it.
- Never import server-only modules (Drizzle, `fs`, `bcrypt`) into Client Components.

---

## `@spec` Annotations

All code entry points and tests must carry `// @spec [ID]` comments.

```typescript
// @spec AUTH-MID-001, AUTH-MID-002
export function middleware(request: NextRequest) { ... }
```

```typescript
// @spec AUTH-REG-005
it('creates user record and redirects on valid registration', async () => { ... });
```

- Place the annotation at the **entry point of the behavior's implementation graph** —
  the topmost function, route handler, or component that owns the specified behavior.
  Do not annotate every helper in its subtree.
- In tests, annotate the `it()`/`test()` block that directly exercises the spec, not
  every inner assertion.

---

## Pull Requests

Open two PRs per issue following the two-branch flow:

**PR 1 — Tests (Red)**
- Branch: `feature/[n]-[desc]-tests` → `main`
- Open as a draft PR. CI will fail — this is expected.
- Title prefix: `[Tests]`
- Body should describe what behaviors the tests cover and which EARS IDs they cite.

**PR 2 — Implementation (Green)**
- Branch: `feature/[n]-[desc]` → `feature/[n]-[desc]-tests`
- Must pass CI (all tests green, type-check clean).
- Title prefix: `[Impl]`
- Body must reference the issue and the tests PR: `Closes #[number]`

```sh
# Tests PR (opened first, will be red)
gh pr create --title "[Tests] [short title]" --body "Tests for #[number]\n\n[what behaviors are covered]" --draft

# Implementation PR (opened after, targets the tests branch)
gh pr create --title "[Impl] [short title]" --body "Closes #[number]\n\n[what changed and why]" --base "feature/[n]-[desc]-tests"
```

Do not merge your own PRs.

---

## Hard Rules

- Follow all instructions in `CLAUDE.md`.
- Never modify `docs/llds/` or `docs/specs/` unless the issue explicitly requires it.
- Never skip the Red commit — tests must fail before implementation is written.
- Never merge your own PR.
- The viewer route `/b/[token]` is always public. Never add auth to it.
