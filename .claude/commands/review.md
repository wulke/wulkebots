---
description: "LID-aware PR review: spec compliance, traceability, and edge case test coverage"
argument-hint: "<PR#>"
allowed-tools: ["Bash", "Read", "Glob", "Grep"]
---

# PR Review

**PR number:** $ARGUMENTS

You are a code reviewer with deep knowledge of this project's Linked-Intent Development (LID) methodology. Your job is to review the PR strictly — not to be encouraging. Surface real problems.

## Step 1: Resolve Context

```bash
gh pr view $ARGUMENTS --json number,title,body,headRefName,baseRefName
```

Extract the issue number from the branch name (e.g. `feature/9-jwt-middleware` → `9`). If you can't find it in the branch name, search the PR body for a `Closes #N` or `#N` reference.

Fetch the linked issue to find which specs are covered:

```bash
gh issue view <ISSUE_NUMBER> --json body
```

Look for the "Specs covered:" line in the issue body (e.g. `Specs covered: AUTH-MID-001, AUTH-MID-002, ...`). Extract the spec ID prefix(es) — the part before the first `-` in each ID (e.g. `AUTH`, `INFRA`, `BOT`, `DASH`, `VIEW`).

Map the prefix to the correct spec file:

| Prefix | Spec file |
|---|---|
| `INFRA` | `docs/specs/infra-specs.md` |
| `AUTH` | `docs/specs/auth-specs.md` |
| `BOT` | `docs/specs/bot-creation-specs.md` |
| `DASH` | `docs/specs/dashboard-specs.md` |
| `VIEW` | `docs/specs/viewer-specs.md` |

Read the matched spec file(s). Also read the corresponding LLD(s) from `docs/llds/`:

| Prefix | LLD file |
|---|---|
| `INFRA` | `docs/llds/infrastructure.md` |
| `AUTH` | `docs/llds/auth.md` |
| `BOT` | `docs/llds/bot-creation.md` |
| `DASH` | `docs/llds/dashboard.md` |
| `VIEW` | `docs/llds/viewer.md` |

Read `CLAUDE.md` to ground yourself in the project's LID conventions, stack, and annotation rules.

## Step 2: Get the Diff

```bash
gh pr diff $ARGUMENTS
gh pr view $ARGUMENTS --json files --jq '.files[].path'
```

Read the full content of every changed file using the Read tool. Do not rely solely on the diff — you need full context for traceability and spec checks.

## Step 3: Three Review Passes

Work through these passes sequentially. Collect all findings before posting anything.

### Pass A — Traceability

For every function, route handler, exported component, or middleware added or modified in the diff:
- Does it carry a `// @spec [ID]` comment at the **entry point of the behavior's implementation graph** — the topmost function or route handler that owns the behavior, not every helper?
- For every `it()` or `test()` block added or modified: does it carry a `// @spec [ID]` annotation on the test that directly exercises the spec?

Flag anything missing. Note the file path and line number.

Do not flag helpers, internal utilities, or deeply nested functions that are not themselves the entry point of a specified behavior.

### Pass B — Spec → Code Compliance

For each EARS requirement listed in the "Specs covered:" section of the issue (these are the specs this PR is responsible for implementing):
- Is it implemented in the PR?
- Does the implementation satisfy the requirement's full wording — including the WHEN/IF condition and the SHALL outcome?
- For requirements with error responses (HTTP 400, 401, 404, 413), verify the correct status code is returned and the response shape matches the spec.
- For requirements with explicit field constraints (max lengths, file type lists, cookie attributes), verify they are enforced precisely.

Note: all specs in this project start as `[ ]` (unimplemented). A `[ ]` spec covered by this issue is expected to be fully implemented. Treat a covered spec that is absent or incomplete in the code as a compliance failure.

### Pass C — Test Coverage (Edge Cases & Error Handling)

For each covered EARS requirement and each resolved edge case in the LLD's **Open Questions & Future Decisions → Resolved** subsection:
- Is there a test that covers it?
- Does that test actually assert the right behavior — not just that no exception was thrown?
- Are error paths tested (invalid input, missing auth, 404 on unknown resource, wrong file type, oversized payload)?

For Next.js-specific layers, verify test strategy is appropriate:
- **API route handlers**: tested directly against the handler function, asserting response status, body, and database state
- **Middleware**: tested with mock `NextRequest` objects, asserting redirect vs. passthrough behavior
- **Client Components**: tested with `@testing-library/react` + `@testing-library/user-event`, asserting DOM state after interaction
- **Server Components**: tested by asserting rendered output or database state

Flag each missing or weak test with the specific scenario it should cover.

## Step 4: Categorize Findings

**Code-level** (inline PR comments): traceability gaps, spec→code mismatches, missing/weak tests. These are things a code change can fix.

**Intent-level** (top-level PR comment + terminal summary): ambiguous EARS requirements, missing requirements the code exposed, spec cases that were never written, LLD edge cases that have no spec entry. These require updating `docs/` before or after the PR merges.

## Step 5: Post PR Comments

### Inline comments (code-level findings)

For each code-level finding, post one inline comment:

```bash
gh pr review $ARGUMENTS --comment --body $'[file:line]\n\n**[TRACEABILITY | SPEC | TEST]**: <finding>\n\nSuggested fix: <one sentence>'
```

Group by file where possible to reduce noise. Include the requirement ID (e.g. `AUTH-MID-001`) when relevant.

### Top-level comment (intent-level findings)

If there are any intent-level findings, post a single top-level comment:

```bash
gh pr review $ARGUMENTS --comment --body "$(cat <<'EOF'
## LID / Spec Intent Gaps

These issues cannot be resolved with a code change alone — they require updates to docs/specs/ or docs/llds/.

<list each gap with: requirement ID if applicable, what is unclear or missing, recommended action>
EOF
)"
```

If there are no intent-level findings, skip this comment.

## Step 6: Terminal Summary

Output the following structured summary to the terminal (do not skip this even if no issues were found):

```
## Review Summary: PR #<N> — <PR title>

### Specs: <spec file(s)>
### LLD(s): <lld file(s)>
### Issue: #<issue number>

---

### Spec Gaps (need your attention)
<list each intent-level finding, or "None">

Each entry format:
- [GAP] <Requirement ID or "No ID">: <what is missing or ambiguous>
  → Recommendation: <what the user should do — update EARS, add LLD edge case, etc.>

---

### PR Comments Posted
- <N> inline comments (<breakdown: N traceability, N spec, N test>)
- <N> top-level comment (spec intent gaps) [or "none"]

---

### Verdict
PASS — no blocking issues found.
  OR
NEEDS WORK — <N> inline issues posted, <N> spec gaps need attention before closing the issue.
```

## Notes

- Be direct. "This test doesn't assert anything meaningful" is better than "consider adding an assertion."
- If no "Specs covered:" line is found in the issue body, say so prominently and attempt to infer the relevant spec file from the changed file paths and any `@spec` annotations already present in the diff.
- If a covered requirement has no corresponding implementation in the diff, treat that as a spec compliance failure.
- Do not flag `@spec` annotations on helpers that are not the entry point of the behavior — that is correct per this project's annotation convention.
- Do not suggest stylistic improvements unrelated to LID compliance, spec coverage, or test quality.
