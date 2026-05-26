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

Create a branch before making any changes:

- Bug:     `bug/[issue-number]-[short-description]`
- Feature: `feature/[issue-number]-[short-description]`
- Other:   `chore/[issue-number]-[short-description]`

Immediately after creating the branch, claim the issue:

```sh
gh issue edit [number] --add-label "in-progress"
gh issue comment [number] --body "Starting work on branch \`[branch-name]\`."
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

## Pull Request

When done: push your branch and open a PR referencing the issue
(e.g. `Closes #[number]`). Describe what changed and why. Do not merge.

```sh
gh pr create --title "[short title]" --body "Closes #[number]\n\n[description]"
```

---

## Hard Rules

- Follow all instructions in `CLAUDE.md`.
- Never modify `docs/llds/` or `docs/specs/` unless the issue explicitly requires it.
- Never skip the Red commit — tests must fail before implementation is written.
- Never merge your own PR.
- The viewer route `/b/[token]` is always public. Never add auth to it.
